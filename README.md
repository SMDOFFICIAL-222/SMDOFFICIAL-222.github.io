# SMD News 261124C — 免費混合版
1. 將 apps-script/Code.gs 完整替換現有 Apps Script 程式碼，儲存。已填入原試算表 ID。
2. 執行 stopTrigger 停用舊同步排程。無需再次初始化。可刪除 X_BEARER_TOKEN 指令碼屬性。
3. 部署為網頁應用程式：執行身分為自己、存取權為任何人。若已有部署，編輯部署並選擇新版本。
4. 在 js/news.js 將 API_URL 佔位字串換成實際 /exec 網址。
5. 將 news.html 和 js/news.js 上傳至原 GitHub Pages 專案。停用舊版 GitHub Actions X 同步（若有）。
6. Official_News 工作表填入 id、date、title、text、image、url，勾選 published；pinned 為置頂。試算表保持私人。
X 時間軸由官方 widgets.js 顯示，不使用付費 API；若 X 不提供時間軸，仍可點擊官方帳號連結。不能將貼文自動匯入試算表。
