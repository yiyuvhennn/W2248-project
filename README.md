FinanceTracker 個人理財紀錄系統

本專案為 W2248 個人理財紀錄系統前端專案，使用 Vue 3 + Vite + TypeScript 製作。
目前正式 API 環境尚未提供，因此依照業主提供的 API 說明文件，先以 Mock API 模擬完整前端操作流程。

專案目標

完成一套個人理財紀錄系統，讓使用者可以進行：

註冊與登入
忘記密碼與重設密碼
查看每月收支總覽
新增、編輯、刪除收支紀錄
管理收入與支出分類
查看分類統計與月份統計
修改個人資料
修改密碼
刪除帳號
技術棧
Vue 3
Vite
TypeScript
Vue Router
Pinia
Axios
Font Awesome Free
CSS Variables
RWD Media Query
啟動方式

請先安裝套件：

npm install

複製環境變數檔案：

cp env.example .env

啟動開發伺服器：

npm run dev

開發伺服器預設網址：

http://localhost:5173
Build 檢查

繳交前請執行：

npm run build

若 build 通過，代表 TypeScript 型別檢查與 Vite 打包皆通過。

測試帳號（Mock API）

業主提供的固定測試帳號如下：

測試帳號（email）：test@example.com
測試密碼（password）：Test1234
測試使用者名稱（name）：測試用戶
使用者 ID（user.id）：u_test001
環境變數

.env 內容範例：

VITE_USE_MOCK_API=true
VITE_API_BASE_URL=https://staging-api.example.com

說明：

VITE_USE_MOCK_API=true：使用前端內建 Mock API。
VITE_USE_MOCK_API=false：改接 VITE_API_BASE_URL 指定的正式 API。
目前正式 API 環境尚未提供，因此開發與初步驗收階段使用 Mock API。
專案結構
src/
├── api/
│   ├── auth.api.ts
│   ├── categories.api.ts
│   ├── http.ts
│   ├── mock.ts
│   ├── records.api.ts
│   └── stats.api.ts
├── assets/
├── components/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.vue
│   │   └── RegisterPage.vue
│   └── app/
│       ├── OverviewPage.vue
│       ├── RecordsPage.vue
│       ├── SettingsPage.vue
│       └── StatsPage.vue
├── router/
├── stores/
├── styles/
├── types/
└── utils/
已實作路由
/login
/register
/app/overview
/app/records
/app/stats
/app/settings

路由保護：

未登入使用者進入 /app/* 會自動導回 /login。
已登入使用者進入 /login 或 /register 會自動導向 /app/overview。
已實作功能
1. 認證功能

已依 API 規格實作：

POST /auth/register
POST /auth/login
POST /auth/forgot-password
POST /auth/reset-password
GET /me

功能包含：

使用者註冊
使用者登入
註冊成功後自動登入並導入主系統
忘記密碼
重設密碼
取得目前登入使用者資料
Bearer Token 模擬
Token 效期 8 小時模擬
Token 過期或無效時清除本地登入狀態
2. 設定頁功能

已依 API 規格實作：

PUT /me
PUT /me/password
DELETE /me

功能包含：

修改使用者名稱
修改密碼
刪除帳號
刪除帳號後清除 Token 並回到登入頁

目前 API 規格僅支援修改 name，不支援修改 email，因此設定頁中的 email 欄位為不可編輯狀態。

3. 收支紀錄功能

已依 API 規格實作：

GET /records
POST /records
PUT /records/:id
DELETE /records/:id

功能包含：

查看收支紀錄
依月份篩選
依分類篩選
依收入 / 支出篩選
新增紀錄
編輯紀錄
刪除紀錄
計算收入總額
計算支出總額
計算結餘
4. 分類管理功能

已依 API 規格實作：

GET /categories
POST /categories
PUT /categories/:id
DELETE /categories/:id

功能包含：

查看收入分類
查看支出分類
新增分類
編輯分類
刪除分類
若分類底下仍有收支紀錄，Mock API 會阻擋刪除
5. 統計功能

已依 API 規格實作：

GET /stats/category
GET /stats/monthly

功能包含：

分類收支統計
月份收支總覽
收入總額
支出總額
結餘
分類占比
分類筆數
6. UI 與 RWD

已實作：

Desktop 版面
Tablet 版面
Mobile 版面
Mobile Bottom Tab Bar
Mobile Floating Action Button
Toast 提示
Loading 狀態
Empty 狀態
Error 狀態
Confirm Modal
表單驗證提示
Mock API 說明

目前正式 API 尚未提供，因此本專案在 src/api/mock.ts 中建立 Mock API。
Mock API 會模擬以下功能：

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

Mock API 目前支援：

固定測試帳號
註冊新帳號
登入密碼驗證
Token 綁定使用者
Token 8 小時效期
忘記密碼產生 reset token
重設密碼
修改個人資料
修改密碼
刪除帳號
收支紀錄 CRUD
分類 CRUD
統計資料計算
API 錯誤處理

src/api/http.ts 已處理 API 錯誤訊息轉換。

當收到以下錯誤時，前端會清除登入狀態並導回登入頁：

TOKEN_MISSING
TOKEN_EXPIRED
TOKEN_INVALID

常見錯誤包含：

VALIDATION_ERROR
INVALID_CREDENTIALS
EMAIL_ALREADY_EXISTS
RESET_TOKEN_EXPIRED
RESET_TOKEN_INVALID
SAME_PASSWORD
CATEGORY_NAME_EXISTS
CATEGORY_IN_USE
RECORD_NOT_FOUND
CATEGORY_NOT_FOUND
清除舊 Mock 資料

如果瀏覽器仍顯示舊帳號，例如 王小明 或 user@example.com，可在瀏覽器 Console 執行：

localStorage.removeItem('finance_access_token')
localStorage.removeItem('finance_user')
localStorage.removeItem('finance_mock_users')
localStorage.removeItem('finance_mock_session')
localStorage.removeItem('finance_mock_reset_tokens')
localStorage.removeItem('finance_last_reset_token')
location.reload()

重新整理後，請使用業主提供的測試帳號登入：

test@example.com
Test1234
開發注意事項
1. 註冊流程

目前註冊成功後，前端會自動呼叫登入 API，取得 accessToken 後導入主系統。

流程：

POST /auth/register
成功後自動呼叫 POST /auth/login
取得 accessToken
導向 /app/overview
2. 忘記密碼流程

正式 API 情境下，使用者會收到重設密碼信。
Mock API 情境下，系統會產生 reset token 並暫存在 localStorage，方便前端測試重設密碼流程。

3. 刪除帳號流程

刪除帳號需要輸入目前密碼確認。
刪除成功後會：

移除該使用者
清除 reset token
清除登入 token
導回登入頁