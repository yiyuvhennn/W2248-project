目前業主尚未提供正式 API 環境，因此本專案先依照 API 文件建立 Mock API，讓前端功能可以先完整測試與展示。

測試帳號

請使用以下帳號登入：

Email：test@example.com
Password：Test1234
使用者名稱：測試用戶
如何啟動專案

先安裝套件：

npm install

建立環境變數檔案：

cp env.example .env

啟動專案：

npm run dev

啟動後，請打開：

http://localhost:5173
繳交前檢查

繳交前建議先執行：

npm run build

如果沒有出現錯誤，就代表專案可以正常打包。

目前完成的功能
登入與註冊
使用者可以登入
使用者可以註冊
註冊成功後會自動登入，並進入系統首頁
密碼錯誤時無法登入
未登入時無法進入主系統頁面
忘記密碼與重設密碼
可以送出忘記密碼請求
Mock 模式下會產生重設密碼用的 token
可以使用 token 重設新密碼
重設後可以用新密碼登入
收支紀錄
可以查看收入與支出紀錄
可以新增紀錄
可以編輯紀錄
可以刪除紀錄
可以依月份、分類、收入或支出篩選紀錄
系統會自動計算收入總額、支出總額與結餘
分類管理
可以查看收入分類與支出分類
可以新增分類
可以編輯分類
可以刪除分類
如果分類底下還有紀錄，系統會阻止刪除
統計頁
可以查看每月收入、支出與結餘
可以查看不同分類的金額占比
可以查看分類統計資料
設定頁
可以修改使用者名稱
可以修改密碼
可以刪除帳號
刪除帳號後會自動登出
Email 目前依 API 規格不可修改，所以設定頁中會鎖定 Email 欄位
頁面列表

目前專案包含以下頁面：

/login              登入頁
/register           註冊頁
/app/overview       總覽頁
/app/records        記帳紀錄頁
/app/stats          統計頁
/app/settings       設定頁
Mock API 說明

因為正式 API 尚未提供，所以目前使用前端內建的 Mock API。
Mock API 的作用是模擬正式後端，讓登入、註冊、記帳、分類、統計與設定頁功能都可以先測試。

目前 Mock API 已模擬：

登入
註冊
忘記密碼
重設密碼
取得目前登入使用者
修改個人資料
修改密碼
刪除帳號
新增、編輯、刪除收支紀錄
新增、編輯、刪除分類
取得統計資料

之後如果業主提供正式 API，只要調整 .env 設定，即可切換成正式 API。

清除舊測試資料

如果畫面還顯示舊帳號，例如 王小明 或 user@example.com，請打開瀏覽器 Console，貼上以下內容：

localStorage.removeItem('finance_access_token')
localStorage.removeItem('finance_user')
localStorage.removeItem('finance_mock_users')
localStorage.removeItem('finance_mock_session')
localStorage.removeItem('finance_mock_reset_tokens')
localStorage.removeItem('finance_last_reset_token')
location.reload()

清除後請重新使用測試帳號登入：

Email：test@example.com
Password：Test1234
使用技術

本專案主要使用：

Vue 3
Vite
TypeScript
Vue Router
Pinia
Axios
Font Awesome
CSS RWD 響應式設計
備註

本專案目前為初步繳交版本，主要目標是完成前端畫面、操作流程與 Mock API 功能。
正式 API 環境提供後，可以再依照業主 API 網址切換串接正式資料。