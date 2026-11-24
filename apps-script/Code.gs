const USERNAME = 'SMDOFFICIAL_222';
const HEADERS = ['id','date','title','text','image','url','published','pinned'];
const P = () => PropertiesService.getScriptProperties();
function db() { return SpreadsheetApp.openById(P().getProperty('SHEET_ID')); }
function setupDatabase() {
  const s = SpreadsheetApp.getActiveSpreadsheet();
  if (!s) throw Error('請從 Google 試算表的擴充功能開啟 Apps Script');
  P().setProperty('SHEET_ID',s.getId());
  for (const name of ['Official_News','X_News']) {
    const t = s.getSheetByName(name) || s.insertSheet(name);
    if (!t.getLastRow()) {
      t.getRange(1,1,1,8).setValues([HEADERS]).setFontWeight('bold').setBackground('#dbeafe');
      t.setFrozenRows(1); t.getRange('A:A').setNumberFormat('@');
      t.getRange(2,7,t.getMaxRows()-1,2).insertCheckboxes();
      t.setColumnWidth(3,240); t.setColumnWidth(4,360);
    }
  }
  const t = s.getSheetByName('Settings') || s.insertSheet('Settings');
  if (!t.getLastRow()) t.getRange(1,1,3,2).setValues([['項目','值'],['最近成功同步','尚未同步'],['同步狀態','尚未同步']]);
}
function setupTrigger() {
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='syncTwitter').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncTwitter').timeBased().everyMinutes(30).create();
}
function stopTrigger() { ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='syncTwitter').forEach(t=>ScriptApp.deleteTrigger(t)); }
function xget(path,params={}) {
  const token = P().getProperty('X_BEARER_TOKEN');
  if (!token) throw Error('缺少 X_BEARER_TOKEN');
  const query = Object.entries(params).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');
  const r = UrlFetchApp.fetch('https://api.x.com/2/'+path+(query?'?'+query:''),{headers:{Authorization:'Bearer '+token},muteHttpExceptions:true});
  if (r.getResponseCode()!==200) throw Error('X API HTTP '+r.getResponseCode());
  return JSON.parse(r.getContentText());
}
function literal(v) { const s=String(v||''); return /^[=+\-@\t\r]/.test(s)?"'"+s:s; }
function syncTwitter() {
  const lock=LockService.getScriptLock(); if (!lock.tryLock(1000)) return;
  const settings=db().getSheetByName('Settings');
  try {
    let uid=P().getProperty('X_USER_ID');
    if (!uid) { uid=xget('users/by/username/'+USERNAME).data.id; P().setProperty('X_USER_ID',uid); }
    const t=db().getSheetByName('X_News');
    const existing=t.getLastRow()>1?t.getRange(2,1,t.getLastRow()-1,8).getValues():[];
    const ids=new Set(existing.map(r=>String(r[0])));
    const since=P().getProperty('X_SINCE_ID');
    const params={max_results:since?100:20,exclude:'replies,retweets','tweet.fields':'created_at,attachments,note_tweet',expansions:'attachments.media_keys','media.fields':'url,preview_image_url,type'};
    if(since) params.since_id=since;
    let next, rows=[], newest=since||'';
    do {
      const res=xget('users/'+uid+'/tweets',{...params,...(next?{pagination_token:next}:{})});
      const media=new Map((res.includes?.media||[]).map(m=>[m.media_key,m]));
      for(const post of res.data||[]) {
        const id=String(post.id);
        if(id.length>newest.length||(id.length===newest.length&&id>newest)) newest=id;
        if(ids.has(id)) continue; ids.add(id);
        const m=media.get(post.attachments?.media_keys?.[0]);
        rows.push([id,new Date(post.created_at),'',literal(post.note_tweet?.text||post.text),m?.url||m?.preview_image_url||'','https://x.com/'+USERNAME+'/status/'+id,true,false]);
      }
      next=since?res.meta?.next_token:null;
    } while(next);
    if(rows.length) {
      const start=t.getLastRow()+1, end=start+rows.length-1;
      if(end>t.getMaxRows()) t.insertRowsAfter(t.getMaxRows(),end-t.getMaxRows());
      t.getRange(start,1,rows.length,1).setNumberFormat('@');
      t.getRange(start,7,rows.length,2).insertCheckboxes();
      t.getRange(start,1,rows.length,8).setValues(rows);
    }
    if(newest) P().setProperty('X_SINCE_ID',newest);
    settings.getRange('B2').setValue(new Date()); settings.getRange('B3').setValue('成功：新增 '+rows.length+' 則');
  } catch(e) { settings.getRange('B3').setValue('失敗：'+e.message); throw e; } finally {lock.releaseLock();}
}
function doGet(e) {
  const items=[];
  for(const [name,source] of [['Official_News','official'],['X_News','x']]) {
    const t=db().getSheetByName(name); if(t.getLastRow()<2) continue;
    for(const r of t.getRange(2,1,t.getLastRow()-1,8).getValues()) {
      if(r[6]!==true) continue;
      const d=new Date(r[1]); if(isNaN(+d)) continue;
      items.push({id:String(r[0]),date:d.toISOString(),title:String(r[2]),text:String(r[3]),image:String(r[4]),url:String(r[5]),pinned:r[7]===true,source});
    }
  }
  const json=JSON.stringify(items);
  // Public data only; fixed callback, no arbitrary executable input.
  if(e?.parameter?.format==='jsonp') return ContentService.createTextOutput('SMDNewsReceive('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
