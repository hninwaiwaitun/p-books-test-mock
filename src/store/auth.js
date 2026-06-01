import { reactive } from 'vue';

// 💡 1. 初期化時：localStorage に保存されたデータがあれば復元する
// ブラウザをリロードしても、この処理が走るためデータが失われません。
const savedUser = localStorage.getItem('p_books_user');
const initialState = savedUser ? JSON.parse(savedUser) : null;

const authState = reactive({
  user: initialState
});

export function useAuth() {
  
  /**
   * ログイン処理（状態の更新とストレージへの保存）
   */
  const login = (userData) => {
    // Vueのメモリ上のステートを更新
    authState.user = userData;
    
    // 💡 2. ブラウザの localStorage にも保存
    // オブジェクトはそのまま保存できないため、JSON文字列に変換します。
    localStorage.setItem('p_books_user', JSON.stringify(userData));
  };

  /**
   * ログアウト処理（状態のクリアとストレージからの削除）
   */
  const logout = () => {
    // Vueのメモリ上から削除
    authState.user = null;
    
    // 💡 3. localStorage からも完全に削除
    localStorage.removeItem('p_books_user');
  };

  return { 
    authState, 
    login, 
    logout 
  };
}