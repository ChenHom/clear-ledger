## 錢包 Package 專案開發說明

### 一、專案概述

1. **專案名稱**：WalletService
2. **專案目標**：提供一套可重複使用的錢包功能模組，支援加錢、扣錢、手續費、利息／獎勵發放、明細與報表產製，方便整合至多種業務系統。
3. **核心價值**：

   * **高一致性**：交易數據透過分散式補償機制保證最終一致性
   * **交易閉環**：端到端的資金流轉與回退機制，確保每筆交易都可追蹤與自動補償
   * **易用性**：提供清晰的 API 與豐富的開發文件
   * **可擴展性**：模組化設計，後續可快速新增風控、稽核等功能

### 二、技術選型

* **後端平台**：Node.js
* **語言**：TypeScript
* **框架**：NestJS（或 Express + TypeScript）
* **資料庫**：TiDB（相容 MySQL 協議，分布式架構）
* **非同步佇列**：BullMQ (基於 Redis)
* **文件管理**：Swagger/OpenAPI via NestJS Swagger
* **測試**：Jest + Supertest
* **用戶識別**：每個錢包以 `userId` 作為主鍵關聯，用於多租戶管理與權限控制
* **多租戶支援**：可於同一套服務中隔離不同客戶群的錢包數據

### 三、核心功能模組

1. **加錢 (Credit)**

   * 方法：`credit(amount, user_id, type, metadata)`
   * 類型：

     * 正數異動（含退款／沖正）
     * 存款
     * 解凍後加值 (Unfreeze)
     * 活動金
   * 核心驗證：更新前後餘額檢查、冪等性 Token

2. **扣錢 (Debit)**

   * 方法：`debit(amount, user_id, type, metadata)`
   * 類型：

     * 負數異動
     * 凍結扣減 (Freeze)
     * 出款（手動／自動）
   * 核心驗證：可用餘額檢查、鎖記錄並解鎖機制

3. **手續費 (Fee)**

   * 方法：`chargeFee(amount, user_id, fee_type, metadata)`
   * 支援自動與手動兩種模式

4. **利息／獎勵發放 (Interest/Reward)**

   * 方法：`applyReward(amount, user_id, campaign_id, metadata)`
   * 可依週期或活動結束後批次執行

5. **明細 (TransactionDetail)**

   * 資料模型：transaction\_details
   * 欄位：id、user\_id、amount、balance\_before、balance\_after、type、metadata、created\_at
   * 提供查詢與匯出功能

6. **報表 (Report)**

   * 方法：`generateReport(user_scope, period, filters)`
   * 類型：日／週／月／自訂區間；個人／全體
   * 匯出格式：CSV、PDF
   * 支援按交易類型、通路、幣別等維度彙總
   * **實作建議**：

     * 資料聚合、快取策略、動態查詢、匯出服務與異步處理

7. **餘額查詢 (Balance Inquiry)**

   * 方法：`getBalance(user_id)`
   * 返回可用餘額與凍結餘額
   * 保證結果即時正確，可結合快取或直接查詢資料庫

8. **交易狀態管理 (Transaction Status)**

   * 在 `transactions` 模型中加入 `status` 欄位：Pending／Success／Failed／Cancelled
   * 支援依狀態查詢、補償與錯誤追蹤

9. **冪等性與錯誤補償 (Idempotency & Retry)**

   * 所有改變餘額的 API 接受 `idempotency_key`
   * 重試請求不重複改變餘額
   * 失敗交易可由補償機制自動或手動觸發沖正

10. **並發控制 (Concurrency Control)**

* 針對同一使用者同時多筆交易，採用資料庫鎖或樂觀鎖
* 在 Service 層封裝鎖定邏輯，確保餘額一致性

11. **審計日誌 (Audit Log)**

* 記錄操作人、時間、請求參數與結果
* 可寫入獨立表或整合至交易明細，用於稽核與追蹤

12. **錯誤處理與回滾 (Error Handling & Rollback)**

* Service 層統一捕捉異常，並在必要時觸發補償或回滾機制，避免不一致狀態
* 支援自動補償與手動沖正流程

13. **配置管理 (Configuration Management)**

* 將限額、手續費率、凍結期限等參數化，放在配置檔或動態配置中心
* 可在不改程式碼情況下即時調整行為

14. **日誌與監控 (Logging & Monitoring)**

* 服務層記錄關鍵指標（TPS、錯誤率、延遲）
* 暴露 Prometheus 指標或接入 APM，方便運維監控

### 四、開發流程

1. **需求評審**：確認核心功能與邊界場景
2. **架構設計**：繪製模組互動與資料流程圖
3. **資料模型**：定義 Prisma / TypeORM Schema 與 Entity
4. **服務層實作**：CreditService、DebitService、ReportService in NestJS
5. **Controller/API**：依 OpenAPI 規範使用 NestJS Controller 或 Express Route
6. **測試**：單元測試、整合測試與端對端測試 (Jest + Supertest)
7. **文件**：生成 Swagger 文檔與開發者範例

### 五、後續規劃

* **通知與稽核**：事件驅動通知、操作日誌、稽核報表模組
* **安全與合規**：風控規則、OTP/2FA 驗證、KYC/AML 接口
* **技術優化**：分散式補償機制、非同步佇列優化、API 版本管理

### 六、專案設置與運行

1. **專案設置**

   ```bash
   # Clone the repository
   git clone https://github.com/githubnext/workspace-blank.git
   cd workspace-blank

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env
   # Update the .env file with your configuration

   # Run database migrations
   npm run migrate
   ```

2. **運行應用程式**

   ```bash
   # Start the application
   npm run start:dev
   ```

3. **運行測試**

   ```bash
   # Run unit tests
   npm run test

   # Run integration tests
   npm run test:integration

   # Run end-to-end tests
   npm run test:e2e
   ```
