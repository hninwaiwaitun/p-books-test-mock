import { loginConfig } from '../pages/Login/mockData.js';
import { dummyNewsList } from '../pages/TopMenu/mockData.js';
import { dummyUsers } from '../pages/UserList/mockData.js';
import { dummySales } from '../pages/Sales/mockData.js';
import { dummyStocks, initialCategories } from '../pages/Stock/mockData.js';
import { dummySettings } from '../pages/Setting/mockData.js';
import { dummyCmpInfo } from '../pages/Publisher/mockData.js';
import { compile } from 'vue';

/**
 * P社管理システム 共通APIクライアントモジュール
 */
export const api = {

  // ==========================================
  // 1. 認証 (Auth)
  // ==========================================
  
  /**
   * 通常ログイン
   * @param {Object} credentials - { email, password }
   */
  login(credentials) {
    return new Promise((resolve, reject) => {
      const matched = loginConfig.validCredentials.find(
        u => u.email === credentials.email && u.password === credentials.password
      );
      if (matched) {
        resolve({ token: 'mock-jwt-token-xyz', user: matched });
      } else {
        reject(new Error('AUTH_FAILED'));
      }
    });
  },

  /**
   * Googleアカウントログイン
   * @param {Object} googleTokenInfo - Googleから返却された認証情報
   */
  loginWithGoogle(googleTokenInfo = {}) {
    return new Promise((resolve) => {
      resolve({
        token: 'mock-google-jwt-token-abc',
        user: { email: 'google.user@p-books.co.jp', name: 'Googleユーザー', role: '作業者' }
      });
    });
  },

  /**
   * パスワード再設定メール送信
   * @param {Object} data - { email }
   */
  sendPasswordResetEmail(data) {
    return new Promise((resolve) => {
      resolve({ success: true });
    });
  },

  /**
   * ログアウト
   */
  logout() {
    return new Promise((resolve) => {
      resolve({ success: true });
    });
  },


  // ==========================================
  // 2. トップメニュー (Top / Dashboard)
  // ==========================================
  
  /**
   * ダッシュボード用サマリーデータの取得
   */
  getDashboardSummary() {
    return new Promise((resolve) => {
      resolve({
        todaySales: 128400,
        salesTrend: '+12% 📈',
        lowStockCount: 12
      });
    });
  },

  /**
   * 社内連絡・お知らせ一覧の取得
   */
  getNews() {
    return new Promise((resolve) => {
      resolve([...dummyNewsList]);
    });
  },


  // ==========================================
  // 3. ユーザー一覧 (Users)
  // ==========================================
  
  /**
   * ユーザー一覧の取得（検索条件付き）
   * @param {Object} params - { query, role }
   */
  getUsers(params = {}) {
    return new Promise((resolve) => {
      const filtered = dummyUsers.filter(user => {
        const query = (params.query || '').toLowerCase().trim();
        const matchQuery = user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
        const matchRole = !params.role || user.role === params.role;
        return matchQuery && matchRole;
      });
      resolve(filtered);
    });
  },

  /**
   * 新規ユーザー登録・編集保存
   * @param {Object} userData - フォーム入力データ（idの有無で追加/更新を自動判定）
   */
  saveUser(userData) {
    return new Promise((resolve) => {
      if (userData.id) {
        resolve({ ...userData });
      } else {
        const newId = Math.floor(Math.random() * 1000);
        resolve({ id: newId, ...userData });
      }
    });
  },


  // ==========================================
  // 4. 売上管理 (Sales)
  // ==========================================
  
  /**
   * 売上実績一覧の取得（日付・月検索）
   * @param {Object} params - { searchType: 'day'|'month', searchDate: 'YYYY-MM-DD'|'YYYY-MM' }
   */
  getSales(params = {}) {
    return new Promise((resolve) => {
      const filtered = dummySales.filter(sale => {
        const saleDatePart = sale.date.split(' ')[0];
        const formattedSaleDate = saleDatePart.replace(/\//g, '-');

        if (params.searchType === 'day') {
          if (!params.searchDate) return true;
          return formattedSaleDate === params.searchDate;
        } else if (params.searchType === 'month') {
          if (!params.searchDate) return true;
          return formattedSaleDate.startsWith(params.searchDate);
        }
        return true;
      });
      resolve(filtered);
    });
  },

  /**
   * 売上CSVデータのインポート
   * @param {FormData} formData - CSVファイルデータ
   */
  importSalesCsv(formData) {
    return new Promise((resolve) => {
      resolve({
        success: true,
        importedRecord: {
          id: 'ORD-CSV-999',
          date: '2026/05/30 12:00',
          title: '【CSVインポート】実践ソフトウェアテスト',
          category: '技術書',
          payment: 'クレジットカード',
          price: 4500
        }
      });
    });
  },


// ==========================================
  // 5. 在庫管理 (Stocks)
  // ==========================================
  
  /**
   * 在庫一覧およびカテゴリマスターの取得（検索フィルタリング対応版）
   * @param {Object} params - { query: '書籍名/ID', category: 'カテゴリ名', stockStatus: 'all'|'out'|'low' }
   */
  getStocks(params = {}) {
    return new Promise((resolve) => {
      let filtered = [...dummyStocks];

      // ① キーワード検索：書籍名（title）または商品ID（id）の部分一致
      if (params.query) {
        const q = params.query.toLowerCase().trim();
        filtered = filtered.filter(stock => 
          stock.title.toLowerCase().includes(q) || stock.id.toLowerCase().includes(q)
        );
      }

      // 絞り込んだデータと、プルダウン生成用の全カテゴリを返却
      resolve({
        stocks: filtered,
        categories: [...initialCategories]
      });
    });
  },

  /**
   * 商品の登録および編集登録（インライン一括保存対応）
   * @param {Array} stockRows - 画面上で編集・追加された行データの配列
   */
  saveStocksBulk(stockRows) {
    return new Promise((resolve) => {
      const processed = stockRows.map((row, index) => {
        const id = row.id || `STK-NEW-${Math.floor(Math.random() * 1000)}`;
        return {
          id,
          title: row.title,
          category: row.isCustomCategory ? row.customCategoryName : row.category,
          price: row.price || 0,
          stock: row.stock || 0,
          location: row.location || '未定'
        };
      });
      resolve(processed);
    });
  },


  // ==========================================
  // 6. 設定 (Settings)
  // ==========================================
  
  /**
   * アカウントプロファイルの登録・更新
   * @param {Object} profileData - { name, email, department }
   */
  saveProfile(profileData) {
    return new Promise((resolve) => {
      resolve({ success: true, updatedProfile: { ...profileData } });
    });
  },

  /**
   * セキュリティ情報の登録・パスワード変更
   * @param {Object} passwordData - { currentPassword, newPassword }
   */
  saveSecurityPassword(passwordData) {
    return new Promise((resolve) => {
      resolve({ success: true, lastPasswordChange: new Intl.DateTimeFormat('ja-JP').format(new Date()) });
    });
  },

  /**
   * 環境設定の登録（タイムアウト等）
   * @param {Object} systemData - { sessionTimeout, apiCacheDuration }
   */
  saveSystemConfig(systemData) {
    return new Promise((resolve) => {
      resolve({ success: true, updatedSystem: { ...systemData } });
    });
  },

  // ==========================================
  // 7. 出版社 (Publisher)
  // ==========================================
  
  /**
   * 出版社一覧の取得（検索条件付き）
   * @param {Object} params - { query }
   */
  getCmpInfo(params = {}) {
    return new Promise((resolve) => {
      const filtered = dummyCmpInfo.filter(cmpInfo => {
        const query = (params.query || '').toLowerCase().trim();
        const matchQuery = cmpInfo.companyName.toLowerCase().includes(query) || cmpInfo.companyAddress.toLowerCase().includes(query) ||
        cmpInfo.contact.toLowerCase().includes(query) || cmpInfo.email.toLowerCase().includes(query) ||
         cmpInfo.register.toLowerCase().includes(query) || cmpInfo.update.toLowerCase().includes(query) || cmpInfo.note.toLowerCase().includes(query);
        //const matchRole = !params.role || user.role === params.role;
        //return matchQuery && matchRole;
        return matchQuery;
      });
      resolve(filtered);
    });
  }
};