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
```

開發伺服器預設：`http://localhost:5173`

## 測試帳號（Mock API）

```txt
Email: user@example.com
Password: Abc12345
```

## 環境變數

```env
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=https://staging-api.example.com
```

- `VITE_USE_MOCK_API=true`：使用內建假資料與模擬 API，適合 API 未完成前展示。
- `VITE_USE_MOCK_API=false`：改接 `VITE_API_BASE_URL` 指定的後端 API。

## API 串接位置

```txt
src/api/http.ts
src/api/auth.api.ts
src/api/records.api.ts
src/api/categories.api.ts
src/api/stats.api.ts
```

## 已實作路由

```txt
/login
/register
/app/overview
/app/records
/app/stats
/app/settings
```

未登入進入 `/app/*` 會導回 `/login`。

## 已實作功能

- 登入 / 註冊
- Token 儲存與路由保護
- 401 / TOKEN_EXPIRED 統一登出並導回登入
- 月份總覽
- 記帳紀錄列表
- 新增 / 編輯 / 刪除紀錄
- 分類統計 / 每月總覽 Tab
- 分類管理：新增 / 編輯 / 刪除
- 個人資料 / 修改密碼 UI
- CSV / JSON 匯出
- Loading / Empty / Error / Toast / Confirm Modal
- Mobile Bottom Tab Bar
- Mobile Floating Action Button
- Desktop / Tablet Top Navigation

## 常見問題排查

### CORS
若瀏覽器 Console 出現 CORS 錯誤，請確認後端允許前端網域，例如：

```txt
Access-Control-Allow-Origin: https://your-frontend-domain.com
```

### 401 / 403
- 401：通常為 token 缺漏、過期或格式錯誤。
- 403：通常為嘗試修改不屬於自己的資料。

本專案收到 `TOKEN_EXPIRED`、`TOKEN_INVALID`、`TOKEN_MISSING` 時會清除本地 token 並導回 `/login`。

### API 欄位缺漏
前端 TypeScript 型別位於：

```txt
src/types/
```

請依 API 文件確認欄位名稱是否一致，例如 `categoryId`、`categoryName`、`createdAt`。

### month 參數格式錯誤
所有月份參數固定使用：

```txt
YYYY-MM
```

日期參數固定使用：

```txt
YYYY-MM-DD
```
