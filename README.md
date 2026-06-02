# FinanceTracker 個人理財紀錄系統

Vue 3 + Vite + TypeScript 前端專案，依業主提供的 Figma style guide、RWD 規格與 API 說明文件製作。

## 技術棧

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- Axios
- Font Awesome Free
- CSS Variables + RWD Media Query

## 啟動方式

```bash
npm install
cp env.example .env
npm run dev

開發伺服器預設：

http://localhost:5173
測試帳號（Mock API）
測試帳號（email）：test@example.com
測試密碼（password）：Test1234
測試使用者名稱（name）：測試用戶
使用者 ID（user.id）：u_test001
環境變數
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=https://staging-api.example.com
VITE_USE_MOCK_API=true：使用內建 Mock API，適合正式 API 尚未提供前展示。
VITE_USE_MOCK_API=false：改接 VITE_API_BASE_URL 指定的正式後端 API。
API 串接位置
src/api/http.ts
src/api/auth.api.ts
src/api/records.api.ts
src/api/categories.api.ts
src/api/stats.api.ts
src/api/mock.ts
已實作路由
/login
/register
/app/overview
/app/records
/app/stats
/app/settings

未登入進入 /app/* 會導回 /login。

已實作功能
認證與帳號
登入
註冊
註冊成功後自動登入並導入主系統
忘記密碼
重設密碼
Token 儲存與路由保護
Bearer Token 模擬
Token 效期 8 小時模擬
401 / TOKEN_EXPIRED / TOKEN_INVALID / TOKEN_MISSING 統一清除登入狀態並導回登入頁
設定頁
個人資料修改：PUT /me
修改密碼：PUT /me/password
刪除帳號：DELETE /me
分類管理：新增 / 編輯 / 刪除
CSV / JSON 匯出提示
記帳功能
月份總覽
記帳紀錄列表
新增 / 編輯 / 刪除紀錄
收入 / 支出分類
分類統計
每月收支總覽
UI / RWD
Loading 狀態
Empty 狀態
Error 狀態
Toast 提示
Confirm Modal
Desktop / Tablet Top Navigation
Mobile Bottom Tab Bar
Mobile Floating Action Button
Mock API 說明

目前業主尚未提供正式 API 環境，因此本專案依 API 文件自行建立 Mock API。
Mock API 會模擬以下流程：

POST /auth/register
POST /auth/login
POST /auth/forgot-password
POST /auth/reset-password
GET /me
PUT /me
PUT /me/password
DELETE /me
GET /records
POST /records
PUT /records/:id
DELETE /records/:id
GET /categories
POST /categories
PUT /categories/:id
DELETE /categories/:id
GET /stats/category
GET /stats/monthly
常見問題排查
清除舊 Mock 資料

如果登入資料仍顯示舊帳號，可在瀏覽器 Console 執行：

localStorage.removeItem('finance_access_token')
localStorage.removeItem('finance_user')
localStorage.removeItem('finance_mock_users')
localStorage.removeItem('finance_mock_session')
localStorage.removeItem('finance_mock_reset_tokens')
localStorage.removeItem('finance_last_reset_token')
location.reload()
CORS

若瀏覽器 Console 出現 CORS 錯誤，請確認後端允許前端網域，例如：

Access-Control-Allow-Origin: https://your-frontend-domain.com
401 / 403
401：通常為 token 缺漏、過期或格式錯誤。
403：通常為嘗試修改不屬於自己的資料。

本專案收到 TOKEN_EXPIRED、TOKEN_INVALID、TOKEN_MISSING 時會清除本地 token 並導回 /login。

API 欄位缺漏

前端 TypeScript 型別位於：

src/types/

請依 API 文件確認欄位名稱是否一致，例如 categoryId、categoryName、createdAt。

month 參數格式錯誤

所有月份參數固定使用：

YYYY-MM

日期參數固定使用：

YYYY-MM-DD
Build 檢查

繳交前請執行：

npm run build

若 build 通過，再 push 到 GitHub。


---

# 最後跑這兩個

改完四個檔案後，在 terminal 跑：

```bash
npm run build

如果成功，再跑：

git status
git add .
git commit -m "feat: connect auth settings pages to mock api"
git push