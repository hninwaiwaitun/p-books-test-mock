<template>
  <div class="sales-page-layout">
    <Sidebar />

    <main class="main-content">
      <div class="sales-container">
        
        <div class="page-header">
          <div>
            <h2>売上実績管理</h2>
            <p class="description">当月の売上明細の確認および、日ごと・月ごとの売上データ検索が可能です。</p>
          </div>
          <div class="header-actions">
            <button class="btn-import" @click="openModal">📥 CSVデータインポート</button>
            <input type="file" ref="fileInput" accept=".csv" style="display: none" @change="handleCsvUpload" />
          </div>
        </div>

        <div class="search-bar">
          <div class="search-type-selector">
            <label class="radio-label">
              <input type="radio" v-model="searchType" value="day" @change="clearSearch" /> 📅 日ごと検索
            </label>
            <label class="radio-label">
              <input type="radio" v-model="searchType" value="month" @change="clearSearch" /> 🗓️ 月ごと検索
            </label>
          </div>

          <div class="search-form">
            <div class="form-group" v-if="searchType === 'day'">
              <label>日付を選択</label>
              <input type="date" v-model="searchDate" @change="fetchSales" />
            </div>
            <div class="form-group" v-if="searchType === 'month'">
              <label>対象月を選択</label>
              <input type="month" v-model="searchMonth" @change="fetchSales" />
            </div>
            <button class="btn-clear" v-if="searchDate || searchMonth" @click="clearSearch">検索クリア</button>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-item">
            <span class="summary-label">現在の該当件数</span>
            <span class="summary-value">{{ salesData.length }} <small>件</small></span>
          </div>
          <div class="summary-item">
            <span class="summary-label">総売上金額</span>
            <span class="summary-value">{{ formatCurrency(totalSalesAmount) }}</span>
          </div>
        </div>

        <table class="sales-table">
          <thead>
            <tr>
              <th>注文ID</th>
              <th>購入日時</th>
              <th>書籍名</th>
              <th>カテゴリ</th>
              <th>決済方法</th>
              <th class="text-right">金額</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in paginatedSales" :key="sale.id">
              <td><code>{{ sale.id }}</code></td>
              <td>{{ sale.date }}</td>
              <td><strong>{{ sale.title }}</strong></td>
              <td><span class="category-badge">{{ sale.category }}</span></td>
              <td>{{ sale.payment }}</td>
              <td class="text-right font-price">{{ formatCurrency(sale.price) }}</td>
            </tr>
            <tr v-if="salesData.length === 0">
              <td colspan="6" class="text-center no-data">📉 指定された期間の売上データはありません。</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination-container" v-if="totalPages > 1">
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

      </div>
    </main>

    <div class="modal-overlay" v-if="isOpen" @click.self="closeModal">
      <div class="modal-content">
        <header class="modal-header">
          <h3>📥 売上データCSVインポート</h3>
          <button class="btn-close" @click="closeModal">✕</button>
        </header>
        <div class="modal-body">
          <div class="import-notice">
            <p class="notice-title">⚠️ インポート前の注意事項</p>
            <ul>
              <li>指定のフォーマットのCSVファイルのみ対応しています。</li>
            </ul>
          </div>
          <p class="prompt-text">取り込むCSVファイルを選択してください。</p>
        </div>
        <footer class="modal-footer">
          <button class="btn-secondary" @click="closeModal">キャンセル</button>
          <button class="btn-primary-emerald" @click="triggerFileInput">ファイルを選択して取り込む</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Sidebar from '../../components/Sidebar.vue';
import { useModal } from '../../composables/useModal';
import { formatCurrency } from '../../utils/formatter';
import { SYSTEM_MESSAGES } from '../../constants/messages';

import { api } from '../../api';

const { isOpen, openModal, closeModal } = useModal();

const salesData = ref([]);
const searchType = ref('day');
const searchDate = ref('');
const searchMonth = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;
const fileInput = ref(null);

const fetchSales = async () => {
  const dateValue = searchType.value === 'day' ? searchDate.value : searchMonth.value;
  
  // APIに渡すリクエスト引数を組み立て
  const requestParams = {
    searchType: searchType.value,
    searchDate: dateValue
  };

  const data = await api.getSales(requestParams);
  salesData.value = data;
  currentPage.value = 1;
};

onMounted(() => {
  fetchSales();
});

const triggerFileInput = () => {
  closeModal();
  fileInput.value.click();
};

const handleCsvUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await api.importSalesCsv(formData);
    alert(SYSTEM_MESSAGES.SALES.CSV_SUCCESS(file.name));
    
    // インポート擬似成功レスポンスのオブジェクトを画面の配列の先頭に追加
    salesData.value.unshift(res.importedRecord);
    event.target.value = '';
  }
};

const totalSalesAmount = computed(() => {
  return salesData.value.reduce((sum, sale) => sum + sale.price, 0);
});

const totalPages = computed(() => Math.ceil(salesData.value.length / itemsPerPage));
const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return salesData.value.slice(start, start + itemsPerPage);
});

const clearSearch = () => {
  searchDate.value = '';
  searchMonth.value = '';
  fetchSales();
};
</script>

<style lang="scss" scoped>
.sales-page-layout { display: flex; min-height: 100vh; background-color: #f1f5f9; }
.main-content { flex: 1; padding: 40px; }
.sales-container { background: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-left: 4px solid #10b981; padding-left: 16px; }
.page-header h2 { margin: 0 0 6px 0; color: #0f172a; font-size: 24px; font-weight: 700; }
.description { margin: 0; color: #64748b; font-size: 14px; }
.search-bar { background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
.search-type-selector { display: flex; gap: 20px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
.radio-label { font-size: 14px; font-weight: 600; color: #334155; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.search-form { display: flex; align-items: flex-end; gap: 16px; }
.form-group { display: flex; flex-direction: column; }
.form-group label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px; }
.form-group input[type="date"], .form-group input[type="month"] { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #334155; background-color: #fff; outline: none; width: 180px; }
.form-group input[type="date"]:focus, .form-group input[type="month"]:focus { border-color: #10b981; }
.summary-card { display: flex; gap: 24px; margin-bottom: 24px; }
.summary-item { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
.summary-label { font-size: 14px; font-weight: 600; color: #64748b; }
.summary-value { font-size: 22px; font-weight: 700; color: #0f172a; }
.sales-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 24px; }
.sales-table th, .sales-table td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid #e2e8f0; text-align: left; }
.sales-table th { background-color: #f8fafc; color: #475569; font-weight: 600; }
.sales-table tbody tr:nth-child(even) { background-color: #f8fafc; }
.sales-table tbody tr:hover { background-color: #f1f5f9; }
.text-right { text-align: right; }
.font-price { font-weight: 600; color: #0f172a; }
.category-badge { background-color: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.no-data { padding: 30px; color: #64748b; text-align: center; background-color: #f8fafc; }
.pagination-container { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
.btn-page-nav { padding: 8px 16px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; }
.btn-page-nav:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-page-nav:not(:disabled):hover { background-color: #f1f5f9; }
.page-numbers { display: flex; gap: 6px; }
.btn-page-num { width: 36px; height: 36px; border: 1px solid #e2e8f0; background-color: #fff; border-radius: 6px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; }
.btn-page-num.active { background-color: #10b981; color: #fff; border-color: #10b981; }
.btn-import { padding: 10px 18px; background-color: #10b981; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-import:hover { background-color: #059669; }
.btn-clear { padding: 10px 16px; background-color: #fff; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-secondary { padding: 10px 18px; background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary-emerald { padding: 10px 18px; background-color: #10b981; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 500px; border-radius: 16px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modalUp 0.2s ease-out; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #0f172a; font-size: 18px; }
.btn-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; }
.modal-body .import-notice { background-color: #fff7ed; border: 1px solid #ffedd5; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.modal-body .notice-title { font-weight: 700; color: #c2410c; margin: 0 0 8px 0; font-size: 14px; }
.modal-body ul { margin: 0; padding-left: 20px; font-size: 13px; color: #7c2d12; line-height: 1.6; }
.modal-body .prompt-text { font-size: 14px; color: #334155; font-weight: 600; margin: 0; }
.modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; }
@keyframes modalUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>