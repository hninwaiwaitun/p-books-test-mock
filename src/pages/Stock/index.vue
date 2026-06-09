<template>
  <div class="stock-page-layout">
    <Sidebar />

    <main class="main-content">
      <div class="stock-container">
        
        <div class="page-header">
          <div>
            <h2>在庫状況管理</h2>
            <p class="description">書籍の在庫数、保管ロケーションの管理を行います。下部で新しい商品をその場で一括入力・登録できます。</p>
          </div>
          <div class="header-actions">
            <button class="btn-add-row" @click="addNewRow">➕ 新規商品行を追加</button>
            <button class="btn-save-all" v-if="newRows.length > 0" @click="saveNewStocks" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '💾 入力した行を保存する' }}
            </button>
          </div>
        </div>

        <!-- 検索バー: v-modelでsearchQueryをバインド。入力時にページを1に戻す -->
        <div class="search-bar">
          <input 
            type="text" 
            v-model="searchQuery" 
            @input="currentPage = 1" 
            placeholder="書籍名やIDで検索..." 
            class="input-search" 
          />
        </div>

        <table class="stock-table">
          <thead>
            <tr>
              <th width="10%">商品ID</th>
              <th width="35%">書籍名</th>
              <th width="15%">カテゴリ</th>
              <th width="12%">価格</th>
              <th width="10%">在庫数</th>
              <th width="10%">ロケーション</th>
              <th width="8%" class="text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            
            <tr v-for="stock in paginatedStocks" :key="stock.id">
              <td><code>{{ stock.id }}</code></td>
              <td><strong>{{ stock.title }}</strong></td>
              <td><span class="category-badge">{{ stock.category }}</span></td>
              <td>{{ formatCurrency(stock.price) }}</td>
              <td>
                <span class="stock-count" :class="{ 'alert-out': stock.stock === 0, 'alert-low': stock.stock > 0 && stock.stock <= 5 }">
                  {{ stock.stock }} 冊
                </span>
              </td>
              <td><code>{{ stock.location }}</code></td>
              <td class="text-center">
                <button class="btn-delete" @click="deleteStock(stock.id)">🗑️</button>
              </td>
            </tr>

            <tr v-for="(row, index) in newRows" :key="index" class="new-input-row">
              <td class="text-new-label">NEW</td>
              <td>
                <input type="text" v-model="row.title" placeholder="新しい書籍名を入力..." class="table-input"
                  :disabled="isSaving" />
              </td>
              <td>
                <select v-model="row.categoryInfo.name" class="table-select" @change="checkNewCategory(row)"
                  :disabled="isSaving">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                  <option value="__NEW__">➕ 新しいカテゴリを追加...</option>
                </select>
                <input type="text" v-if="row.categoryInfo.name === '__NEW__' || row.categoryInfo.isCustom"
                  v-model="row.categoryInfo.customName" placeholder="新カテゴリ名..." class="table-input custom-cat-input"
                  :disabled="isSaving" />
              </td>
              <td>
                <input type="number" v-model.number="row.price" placeholder="¥" class="table-input text-right"
                  :disabled="isSaving" />
              </td>
              <td>
                <input type="number" v-model.number="row.stock" placeholder="冊" class="table-input text-right"
                  :disabled="isSaving" />
              </td>
              <td>
                <input type="text" v-model="row.location" placeholder="A-1等" class="table-input text-center"
                  :disabled="isSaving" />
              </td>
              <td class="text-center">
                <button class="btn-remove-row" @click="removeNewRow(index)" :disabled="isSaving">✕ 削除</button>
              </td>
            </tr>
          </tbody>
        </table>        
        <div v-if="isLoading" class="loading-state">
          データを読み込んでいます...
        </div>
        <!-- 全件空、または検索結果が0件の時の判定を filteredStocks に変更 -->
        <div v-else-if="filteredStocks.length === 0" class="loading-state">
          表示できる在庫データがありません。
        </div>

        <div class="pagination-container" v-if="totalPages > 1 && newRows.length === 0">
          <button class="btn-page-nav" :disabled="currentPage === 1" @click="currentPage--">◀ 前へ</button>
          <div class="page-numbers">
            <button 
              v-for="page in totalPages" 
              :key="page" 
              class="btn-page-num" 
              :class="{ active: currentPage === page }"
              @click="currentPage = page"
            >{{ page }}</button>
          </div>
          <button class="btn-page-nav" :disabled="currentPage === totalPages" @click="currentPage++">次へ ▶</button>
        </div>
        <p class="pagination-hint" v-if="newRows.length > 0">※ 新規行の入力・編集中のため、ページ移動は一時的にロックされています。</p>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Sidebar from '../../components/Sidebar.vue';
import { formatCurrency } from '../../utils/formatter';
import { validators } from '../../utils/validator';
import { SYSTEM_MESSAGES } from '../../constants/messages';

// 💡 共通APIクライアント
import { api } from '../../api';

const stocks = ref([]);
const categories = ref([]);
const newRows = ref([]);

// 検索クエリ用の状態を追加
const searchQuery = ref('');

const currentPage = ref(1);
const itemsPerPage = 10;

const isLoading = ref(true);
const isSaving = ref(false);

/**
 * 💡 初期表示時にAPIから在庫一覧とカテゴリ一覧を取得
 */
onMounted(async () => {
  try {
    const res = await api.getStocks();
    stocks.value = res.stocks;
    categories.value = res.categories;
  } catch (error) {
    alert('在庫データの取得に失敗しました。');
  } finally {
    isLoading.value = false;
  }
});

const defaultRowTemplate = {
  title: '',
  price: null,
  stock: null,
  location: '',
  categoryInfo: {
    name: '技術書',
    isCustom: false,
    customName: ''
  }
};

const addNewRow = () => {
  // JSONの変換を使って、ネストされたオブジェクトまで完全に別物としてコピー。
  const clonedTemplate = JSON.parse(JSON.stringify(defaultRowTemplate));
  newRows.value.push(clonedTemplate);
};

const removeNewRow = (index) => {
  newRows.value.splice(index, 1);
};

const checkNewCategory = (row) => {
  /**
   * row.categoryやrow.isCustomCategoryというプロパティが存在しないので、
   * row.categoryInfo.nameやrow.categoryInfo.isCustomに修正。
   */
  if (row.categoryInfo.name === '__NEW__') {
    row.categoryInfo.isCustom = true;
    row.category = '';
  } else {
    row.categoryInfo.isCustom = false;
    // 通常カテゴリに戻した時は入力欄をクリア。
    row.categoryInfo.customName = '';
  }
};

/**
 * 💡 入力された行を一括でAPI送信して保存する
 */
const saveNewStocks = async () => {
  // バリデーション
  for (const row of newRows.value) {
    const titleError = validators.required(row.title, '書籍名');
    
    const info = row.categoryInfo;
    const isCustom = info.name === '__NEW__' || info.isCustom;
    const categoryError = isCustom 
      ? validators.required(info.customName, '新規カテゴリ名')
      : validators.required(info.name, 'カテゴリ');

    if (titleError || categoryError) {
      alert(titleError || categoryError);
      return;
    }
  }

  isSaving.value = true;
  try {
    // API送信用の整形
    const formattedRows = newRows.value.map(row => {
      const info = row.categoryInfo;
      return {
        title: row.title,
        category: info.name === '__NEW__' ? info.customName : info.name,
        price: row.price,
        stock: row.stock,
        location: row.location
      };
    });

    const savedStocks = await api.saveStocksBulk(formattedRows);
    stocks.value.push(...savedStocks);
    
    alert(SYSTEM_MESSAGES.STOCK.SAVE_SUCCESS(newRows.value.length));
    newRows.value = [];
    currentPage.value = Math.ceil(stocks.value.length / itemsPerPage);
  } catch (error) {
    alert('保存処理に失敗しました。');
  } finally {
    isSaving.value = false;
  }
};

/**
 *  書籍名とIDでフィルタリングする算出プロパティ
 */
const filteredStocks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return stocks.value;

  return stocks.value.filter(stock => {
    const matchTitle = stock.title ? stock.title.toLowerCase().includes(query) : false;
    // IDは数値の場合を考慮して String() で型変換したのち検証
    const matchId = stock.id ? String(stock.id).toLowerCase().includes(query) : false;
    return matchTitle || matchId;
  });
});

/**
 *  フィルタリングされた結果を元に、総ページ数を算出
 */
const totalPages = computed(() => Math.ceil(filteredStocks.value.length / itemsPerPage));

/**
 *  フィルタリングされた結果から、現在のページのデータのみを切り出し
 */
const paginatedStocks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredStocks.value.slice(start, start + itemsPerPage);
});

const deleteStock = (id) => {
  if (confirm(SYSTEM_MESSAGES.STOCK.DELETE_CONFIRM(id))) {
    stocks.value = stocks.value.filter(s => s.id !== id);
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value);
    }
  }
};
</script>

<style lang="scss" scoped>
.search-bar { display: flex; gap: 16px; margin-bottom: 24px; }
.input-search { padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; flex: 1;}
.stock-page-layout { display: flex; min-height: 100vh; background-color: #f1f5f9; }
.main-content { flex: 1; padding: 40px; }
.stock-container { background: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-left: 4px solid #6366f1; padding-left: 16px; }
.page-header h2 { margin: 0 0 6px 0; color: #0f172a; font-size: 24px; font-weight: 700; }
.description { margin: 0; color: #64748b; font-size: 14px; }
.header-actions { display: flex; gap: 12px; }
.stock-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 24px; }
.stock-table th, .stock-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: middle; }
.stock-table th { background-color: #f8fafc; color: #475569; font-weight: 600; }
.stock-table tbody tr:hover { background-color: #f8fafc; }
.category-badge { background-color: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.stock-count { font-weight: 600; color: #0f172a; padding: 2px 6px; border-radius: 4px; }
.stock-count.alert-out { background-color: #fee2e2; color: #dc2626; font-weight: bold; }
.stock-count.alert-low { background-color: #fef3c7; color: #d97706; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.new-input-row { background-color: #f0fdf4 !important; }
.new-input-row:hover { background-color: #dcfce7 !important; }
.new-input-row .text-new-label { color: #16a34a; font-weight: 800; font-size: 11px; letter-spacing: 0.5px; }
.new-input-row .table-input, .new-input-row .table-select { width: 100%; padding: 8px 10px; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 13px; outline: none; background-color: #fff; box-sizing: border-box; }
.new-input-row .table-input:focus, .new-input-row .table-select:focus { border-color: #16a34a; box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1); }
.new-input-row .table-input:disabled, .new-input-row .table-select:disabled { background-color: #f1f5f9; cursor: not-allowed; }
.new-input-row .custom-cat-input { margin-top: 6px; border-color: #86efac; background-color: #f0fdf4; }
.loading-state { text-align: center; padding: 40px; color: #64748b; font-size: 14px; background: #f8fafc; margin-bottom: 24px; border-radius: 8px; }
.pagination-container { display: flex; justify-content: center; align-items: center; gap: 16px; }
.btn-page-nav { padding: 8px 16px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; font-weight: 600; }
.btn-page-nav:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-page-nav:not(:disabled):hover { background-color: #f1f5f9; }
.page-numbers { display: flex; gap: 6px; }
.btn-page-num { width: 36px; height: 36px; border: 1px solid #e2e8f0; background-color: #fff; border-radius: 6px; font-size: 13px; font-weight: 600; }
.btn-page-num.active { background-color: #6366f1; color: #fff; border-color: #6366f1; }
.pagination-hint { font-size: 12px; color: #d97706; text-align: center; font-weight: 600; margin: 16px 0 0 0; }
.btn-add-row { padding: 10px 18px; background-color: #6366f1; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-add-row:hover { background-color: #4f46e5; }
.btn-save-all { padding: 10px 18px; background-color: #16a34a; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; animation: pulse 2s infinite; }
.btn-save-all:hover:not(:disabled) { background-color: #15803d; }
.btn-save-all:disabled { opacity: 0.7; cursor: not-allowed; animation: none; }
.btn-delete { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.6; } .btn-delete:hover { opacity: 1; }
.btn-remove-row { padding: 6px 10px; background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; }
.btn-remove-row:hover:not(:disabled) { background-color: #fca5a5; }
.btn-remove-row:disabled { opacity: 0.5; cursor: not-allowed; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); } 100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); } }
</style>