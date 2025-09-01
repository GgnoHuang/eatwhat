// 環境變數配置
// 在生產環境中，這些值應該通過構建工具注入
window.ENV = {
    // 從 .env.local 讀取的值（開發時手動設置）
    SUPABASE_URL: 'https://dnavwekoeilhdsateevn.supabase.co',
    SUPABASE_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuYXZ3ZWtvZWlsaGRzYXRlZXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDU5MDIsImV4cCI6MjA3MjI4MTkwMn0.oyNB_oTWj0JimFJ6YySNxnpOri3IJvOjeiiDrpCBSrk'
};

console.log('環境變數載入完成');