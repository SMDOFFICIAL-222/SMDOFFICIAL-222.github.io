const grid = document.querySelector('#news-grid');
const status = document.querySelector('#news-status');
let items = [], filter = 'all', failures = 0;
const make = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; if (text != null) e.textContent = text; return e; };
function safeURL(value) { try { const u = new URL(value, location.href); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; } }
function render() {
  grid.replaceChildren();
  document.querySelector("#x-timeline").hidden = filter === "official";
  grid.hidden = filter === "x";
  status.hidden = filter === "x";
  const visible = items.filter(i => filter === 'all' || i.source === filter);
  status.textContent = (visible.length ? `共 ${visible.length} 則消息` : '目前尚無情報') + (failures ? '（部分資料載入失敗）' : '');
  for (const i of visible) {
    const url = i.url && safeURL(i.url);
    const card = make(url ? 'a' : 'article', 'news-card');
    if (url) { card.href = url; if (i.source === 'x') { card.target = '_blank'; card.rel = 'noopener noreferrer'; } }
    if (i.image && safeURL(i.image)) { const box = make('div','news-img-box'); const img = make('img',''); img.src = safeURL(i.image); img.alt = ''; img.loading = 'lazy'; img.onerror = () => box.remove(); box.append(img); card.append(box); }
    const info = make('div','news-info');
    const date = new Date(i.date);
    info.append(make('div','news-date', (Number.isNaN(+date) ? '' : date.toLocaleDateString('zh-TW',{timeZone:'Asia/Taipei'})) + ' · ' + (i.source === 'x' ? '𝕏 官方動態' : '官方公告')));
    info.append(make('h3','news-title', (i.pinned ? '📌 ' : '') + (i.title || '星樂之夢官方動態')));
    info.append(make('p','news-desc',i.text || ''));
    if (url) info.append(make('span','news-source',i.source === 'x' ? '前往 𝕏 查看原文 ↗' : '閱讀完整公告 →'));
    card.append(info); grid.append(card);
  }
}
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { filter = b.dataset.filter; document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); render(); }));
const API_URL = 'PASTE_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE';
function accept(data) {
  if (!Array.isArray(data)) throw Error('Invalid data');
  items = data.filter(i=>i.source === "official").sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||new Date(b.date)-new Date(a.date));
  failures=0; render();
}
function load() {
  if (!API_URL.startsWith('https://script.google.com/')) { status.textContent='尚未設定 Google Apps Script API 網址'; return; }
  // JSONP is intentionally restricted to public news; no credentials or private data.
  const script=document.createElement('script');
  let done=false;
  const finish=()=>{done=true; clearTimeout(timer); script.remove();};
  window.SMDNewsReceive=data=>{if(done)return; try{accept(data);finish();}catch{fail();}};
  function fail(){if(done)return;finish();status.textContent='情報暫時無法載入，請稍後重新整理。';}
  const timer=setTimeout(fail,15000);
  script.onerror=fail;
  script.src=API_URL+'?format=jsonp';
  document.head.append(script);
}
load();
