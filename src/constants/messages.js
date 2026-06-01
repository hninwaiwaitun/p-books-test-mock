/**
 * システム共通メッセージ・定数定義
 */
export const SYSTEM_MESSAGES = {
  AUTH: {
    LOGIN_FAILED: '❌ メールアドレスまたはパスワードが正しくありません。',
    LOGOUT_CONFIRM: '管理画面からログアウトしますか？'
  },
  VALIDATION: {
    REQUIRED: (field) => `${field}は必須入力です。`,
    EMAIL_FORMAT: '正しいメールアドレスの形式で入力してください。',
    MIN_NUMBER: (field, min) => `${field}は${min}以上に設定してください。`,
    MATCH: (field) => `${field}が一致しません。`
  },
  SALES: {
    CSV_SUCCESS: (filename) => `CSVファイル「${filename}」からデータをインポートしました。`,
    VALIDATION_ERROR: '書籍名とカテゴリは必須入力です。'
  },
  STOCK: {
    DELETE_CONFIRM: (id) => `商品ID: ${id} を削除しますか？`,
    SAVE_SUCCESS: (count) => `${count} 件の新商品を一括登録しました。`
  }
};

export const SYSTEM_CONFIG = {
  VERSION: 'v1.2.0',
  COPYRIGHT: '© 2026 P-Books Management System.'
};