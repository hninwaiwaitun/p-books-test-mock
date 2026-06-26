<template>
  <aside class="sidebar-container">
    <div class="sidebar-header">
      <span class="sidebar-logo">📚</span>
      <h2>P社管理システム</h2>
    </div>

    <nav class="sidebar-menu">
      <router-link to="/top-menu" class="menu-item" active-class="active">
        <span>📊</span> トップメニュー
      </router-link>
      <!-- 作業者権限：ユーザー一覧画面の非表示対応 -->
      <router-link v-if="authState.user?.role === '管理者'" to="/user-list" class="menu-item" active-class="active">
        <span>👥</span> ユーザー一覧
      </router-link>
      <!-- 作業者権限：売上管理画面の非表示対応 -->
      <router-link v-if="authState.user?.role === '管理者'" to="/sales" class="menu-item" active-class="active">
        <span>💰</span> 売上管理
      </router-link>
      <router-link to="/stock" class="menu-item" active-class="active">
        <span>📦</span> 在庫管理
      </router-link>
      <router-link to="/setting" class="menu-item" active-class="active">
        <span>⚙️</span> 設定
      </router-link>
      <router-link to="/publisher" class="menu-item" active-class="active">
        <span>📖</span> 出版社
      </router-link>
    </nav>

    <div class="sidebar-footer">
      
      <div class="user-info-block" v-if="authState.user">
        <div class="user-avatar">{{ authState.user.name.charAt(0) }}</div>
        <div class="user-meta">
          <span class="user-name">{{ authState.user.name }}</span>
          <span class="user-role">{{ authState.user.role }}</span>
        </div>
      </div>
      <div class="user-info-block" v-else>
        <div class="user-avatar guest">ゲ</div>
        <div class="user-meta">
          <span class="user-name">ゲストさん</span>
          <span class="user-role">未ログイン</span>
        </div>
      </div>

      <button class="btn-sidebar-logout" @click="handleSidebarLogout">
        🚪 ログアウト
      </button>

      <div class="system-version">
        <span>{{ SYSTEM_CONFIG.VERSION }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuth } from '../store/auth';
import { SYSTEM_MESSAGES, SYSTEM_CONFIG } from '../constants/messages';

const router = useRouter();
const { authState, logout } = useAuth();

const handleSidebarLogout = () => {
  if (confirm(SYSTEM_MESSAGES.AUTH.LOGOUT_CONFIRM)) {
    logout();
    router.push('/login');
  }
};
</script>

<style lang="scss" scoped>
/* 基本レイアウト */
.sidebar-container { width: 260px; min-width: 260px; background-color: #0f172a; color: #94a3b8; display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0; box-shadow: 4px 0 10px rgba(0, 0, 0, 0.05); }
.sidebar-header { padding: 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #1e293b; }
.sidebar-header .sidebar-logo { font-size: 24px; }
.sidebar-header h2 { margin: 0; font-size: 16px; color: #f8fafc; font-weight: 700; }
.sidebar-menu { flex: 1; padding: 24px 16px; display: flex; flex-direction: column; gap: 8px; }
.sidebar-menu .menu-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px; transition: all 0.2s; }
.sidebar-menu .menu-item:hover { background-color: #1e293b; color: #f8fafc; }
.sidebar-menu .menu-item.active { background-color: #312e81; color: #e0e7ff; }

/* フッター（ユーザー情報） */
.sidebar-footer { padding: 20px 16px; border-top: 1px solid #1e293b; background-color: #0b0f19; display: flex; flex-direction: column; gap: 14px; }
.user-info-block { display: flex; align-items: center; gap: 12px; }
.user-avatar { width: 36px; height: 36px; background-color: #4f46e5; color: #fff; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 13px; font-weight: bold; }
.user-avatar.guest { background-color: #475569; }
.user-meta { display: flex; flex-direction: column; }
.user-meta .user-name { font-size: 13px; font-weight: 700; color: #f8fafc; }
.user-meta .user-role { font-size: 11px; color: #64748b; margin-top: 2px; }

/* ログアウトボタン・バージョン */
.btn-sidebar-logout { width: 100%; padding: 10px; background-color: #1e293b; color: #fca5a5; border: 1px solid #334155; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 6px; }
.btn-sidebar-logout:hover { background-color: #dc2626; color: #fff; border-color: #dc2626; }
.system-version { text-align: center; }
.system-version span { font-family: monospace; font-size: 11px; color: #475569; }
</style>