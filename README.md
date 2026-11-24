# SMD News 261124B
1. 建立私人 Google 試算表 SMD News Database，時區設定 Asia/Taipei。擴充功能 → Apps Script，貼入 apps-script/Code.gs，儲存。
2. 執行 setupDatabase 並授權；建立 Official_News、X_News、Settings。
3. X Developer Console 建立具讀取權限的應用程式，確認費用。Apps Script 專案設定 → 指令碼屬性新增 X_BEARER_TOKEN（不要寫在原始碼）。
4. 手動執行 syncTwitter，確認 X_News 有資料；確認費用後執行 setupTrigger（每 30 分鐘），stopTrigger 可停止。
5. 部署 → 新增部署 → 網頁應用程式；執行身分：我；存取權：任何人。複製 /exec URL，無痕視窗開啟應看到 JSON。若帳戶政策禁止匿名存取，此方案無法直接使用。
6. 在 js/news.js 將 PASTE_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE 換成 /exec URL。將 news.html、js/news.js 放到 GitHub Pages 原有位置。不要上傳 token；不需要公開試算表。
7. Official_News 欄位依序 id、date、title、text、image、url、published、pinned；勾選 published 才公開，pinned 置頂。X_News 可取消勾選來隱藏；請勿刪除列作為隱藏手段。
8. 若已部署舊版 sync_x.yml，停用舊同步排程；保留網站原本的 Pages 部署方式。Apps Script 修改後需更新部署版本。
限制：首次最多 20 則；後續 since_id 增量同步。未自動追蹤舊貼文編輯/刪除，須手動隱藏或更新，並遵循 X API 條款。每篇取第一個媒體預覽。JSONP 僅提供公開新聞資料。未使用真實金鑰或 Google 帳號實際部署測試。
