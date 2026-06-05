<template>
  <div class="top-menu-container">
    <Sidebar />

    <main class="main-content">
      <header class="content-header">
        <div class="header-left">
          <h1>ようこそ、{{ authState.user?.name || 'ゲストさん' }}</h1>
          <p class="date">本日の日付: {{ currentDate }}</p>
        </div>
        <div class="header-right">
          <button class="btn-logout" @click="handleLogout">🔑 ログアウト</button>
        </div>
      </header>

      <div class="dashboard-cards">
        <!-- 作業者権限：売上の非表示対応 -->
        <div class="card status-blue clickable" v-if="authState.user?.role === '管理者'" @click="goToPage('/sales')">
          <h3>本日の売上</h3>
          <p class="value">{{ formatCurrency(dashboardSummary.todaySales) }}</p>
          <span class="trend">{{ dashboardSummary.salesTrend }}</span>
          <span class="hover-hint">売上確認画面へ ➔</span>
        </div>
        <div class="card status-green clickable" @click="goToPage('/stock')">
          <h3>要確認の在庫切れ</h3>
          <p class="value">{{ dashboardSummary.lowStockCount }} 件</p>
          <span class="trend urgency" v-if="dashboardSummary.lowStockCount > 0">要対応 ⚠️</span>
          <span class="hover-hint">在庫確認画面へ ➔</span>
        </div>
      </div>
      
      <div class="news-section">
        <div class="news-header">
          <h3>社内連絡・お知らせ</h3>
          <div class="tabs">
            <button :class="{ active: currentTab === 'all' }" @click="changeTab('all')">すべて</button>
            <button :class="{ active: currentTab === 'important' }" @click="changeTab('important')">重要</button>
          </div>
        </div>
        
        <ul class="news-list">
          <li v-for="item in filteredNewsList" :key="item.id" :class="{ 'is-important': item.important }" @click="openNews(item)">
            <span class="news-date">{{ item.date }}</span>
            <span class="news-badge" v-if="item.important">重要</span>
            <p class="news-title">{{ item.title }}</p>
          </li>
          <li v-if="filteredNewsList.length === 0">
            <p class="no-data">お知らせはありません。</p>
          </li>
        </ul>
      </div>
    </main>

    <div class="modal-overlay" v-if="isNewsModalOpen" @click.self="closeNews">
      <div class="modal-content" :class="{ 'modal-important': selectedNews?.important }">
        <header class="modal-header">
          <span class="modal-badge" v-if="selectedNews?.important">🚨 重要連絡</span>
          <span class="modal-badge normal" v-else>📢 一般連絡</span>
          <button class="btn-close" @click="closeNews">✕</button>
        </header>
        <div class="modal-body">
          <h2 class="modal-title">{{ selectedNews?.title }}</h2>
          <div class="modal-meta">
            <span>📅 発信日: {{ selectedNews?.date }}</span>
            <span>🏢 担当部署: {{ selectedNews?.sender }}</span>
          </div>
          <hr class="modal-divider" />
          <p class="modal-text">{{ selectedNews?.body }}</p>
        </div>
        <footer class="modal-footer">
          <button class="btn-modal-close" @click="closeNews">確認しました</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '../../components/Sidebar.vue';
import { useAuth } from '../../store/auth';
import { useModal } from '../../composables/useModal';
import { formatCurrency } from '../../utils/formatter';
import { SYSTEM_MESSAGES } from '../../constants/messages';

import { api } from '../../api';

const router = useRouter();
const { authState, logout } = useAuth();
const { isOpen: isNewsModalOpen, openModal, closeModal } = useModal();

const currentTab = ref('all');
const selectedNews = ref(null);

// APIから取得するデータ用のステート
const newsList = ref([]);
const dashboardSummary = ref({
  todaySales: 0,
  salesTrend: '',
  lowStockCount: 0
});

// 本日の日付を自動生成
const currentDate = new Intl.DateTimeFormat('ja-JP', { 
  year: 'numeric', month: 'long', day: 'numeric' 
}).format(new Date());

/**
 * 💡 初期表示時にAPIからデータを並列で取得
 */
onMounted(async () => {
  try {
    // Promise.all でサマリーとお知らせ一覧を同時取得
    const [summaryRes, newsRes] = await Promise.all([
      api.getDashboardSummary(),
      api.getNews()
    ]);
    
    dashboardSummary.value = summaryRes;
    newsList.value = newsRes;
  } catch (error) {
    console.error('ダッシュボードデータの取得に失敗しました', error);
  }
});

const changeTab = (tab) => {
  currentTab.value = tab;
};

const filteredNewsList = computed(() => {
  if (currentTab.value === 'important') {
    return newsList.value.filter(item => item.important);
  }
  return newsList.value;
});

const goToPage = (path) => router.push(path);

const openNews = (item) => {
  selectedNews.value = item;
  openModal();
};

const closeNews = () => {
  selectedNews.value = null;
  closeModal();
};

const handleLogout = async () => {
  if (confirm(SYSTEM_MESSAGES.AUTH.LOGOUT_CONFIRM)) {
    try {
      // 💡 ログアウト用API呼び出し
      await api.logout();
      logout(); // Store側のステートをリセット
      router.push('/login');
    } catch (error) {
      alert('ログアウト処理に失敗しました。');
    }
  }
};
</script>

<style lang="scss" scoped>
.top-menu-container { display: flex; min-height: 100vh; background-color: #f1f5f9; }
.main-content { flex: 1; padding: 40px; }
.content-header { margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; }
.header-left h1 { margin: 0 0 4px 0; color: #0f172a; }
.header-left .date { margin: 0; color: #64748b; font-size: 14px; }
.header-right .btn-logout { padding: 10px 18px; background-color: #fff; color: #dc2626; border: 1px solid #fca5a5; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.header-right .btn-logout:hover { background-color: #dc2626; color: #fff; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); }
.dashboard-cards { display: flex; gap: 24px; margin-bottom: 32px; }
.card { flex: 1; background: #fff; padding: 24px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
.card h3 { margin: 0 0 12px 0; font-size: 14px; color: #64748b; }
.card .value { margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #0f172a; }
.card .trend { font-size: 12px; font-weight: 500; color: #16a34a; }
.card .trend.urgency { color: #dc2626; font-weight: bold; }
.card.clickable { cursor: pointer; transition: all 0.2s ease; }
.card.clickable .hover-hint { position: absolute; right: 20px; bottom: 16px; font-size: 12px; color: #6366f1; font-weight: 600; opacity: 0; transform: translateX(-10px); transition: all 0.2s ease; }
.card.clickable:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #6366f1; }
.card.clickable:hover .hover-hint { opacity: 1; transform: translateX(0); }
.news-section { background: #fff; padding: 28px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
.news-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.news-header h3 { margin: 0; color: #0f172a; }
.news-header .tabs button { padding: 6px 16px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.news-header .tabs button:first-child { border-radius: 6px 0 0 6px; }
.news-header .tabs button:last-child { border-radius: 0 6px 6px 0; margin-left: -1px; }
.news-header .tabs button.active { background: #4f46e5; color: #fff; border-color: #4f46e5; font-weight: 600; }
.news-list { list-style: none; padding: 0; margin: 0; }
.news-list li { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
.news-list li:hover { background: #f8fafc; transform: translateX(4px); }
.news-list li .news-date { font-size: 13px; color: #94a3b8; }
.news-list li .news-badge { background: #fee2e2; color: #ef4444; font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 4px; }
.news-list li .news-title { margin: 0; font-size: 14px; color: #334155; }
.news-list li.is-important .news-title { font-weight: 600; color: #0f172a; }
.no-data { font-size: 13px; color: #94a3b8; text-align: center; padding: 20px; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 540px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); padding: 24px; animation: modalUp 0.3s ease-out; border-top: 6px solid #64748b; }
.modal-content.modal-important { border-top-color: #ef4444; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header .modal-badge { background: #fee2e2; color: #ef4444; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
.modal-header .modal-badge.normal { background: #e0f2fe; color: #0369a1; }
.modal-header .btn-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; }
.modal-body .modal-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; line-height: 1.4; }
.modal-body .modal-meta { display: flex; gap: 16px; font-size: 12px; color: #64748b; margin-bottom: 16px; }
.modal-body .modal-divider { border: none; border-top: 1px solid #e2e8f0; margin-bottom: 16px; }
.modal-body .modal-text { font-size: 14px; color: #334155; line-height: 1.6; margin: 0; white-space: pre-wrap; }
.modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; }
.modal-footer .btn-modal-close { padding: 10px 20px; background: #0f172a; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.modal-footer .btn-modal-close:hover { background: #1e293b; }
@keyframes modalUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>