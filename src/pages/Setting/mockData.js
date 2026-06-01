// src/pages/Setting/mockData.js

/**
 * 設定画面用の初期ダミーデータ
 */
export const dummySettings = {
  // プロファイル初期値
  profile: {
    name: '管理者さん',
    email: 'admin@p-books.co.jp',
    department: 'システム管理部'
  },
  // セキュリティ（画面表示用、パスワード本体はダミー）
  security: {
    twoFactor: true,
    lastPasswordChange: '2026/04/01'
  },
  // 💡 ② セッションシステム設定の初期値（30分）
  system: {
    sessionTimeout: 30, // 単位: 分
    apiCacheDuration: 5  // 単位: 分
  }
};