<template>
  <div class="user-page-layout">
    <Sidebar />

    <main class="main-content">
      <div class="user-list-container">
        
        <div class="page-header">
          <div>
            <h2>ユーザーアカウント一覧</h2>
            <p class="description">システムを利用する社内メンバーおよび外部スタッフの権限管理を行います。</p>
          </div>
          <button v-if="authState.user?.role === '管理者'" class="btn-primary" @click="openModalForAdd">➕ 新規ユーザー登録</button>
        </div>

        <div class="search-bar">
          <input type="text" v-model="searchQuery" @input="fetchUsers" placeholder="名前やメールアドレスで検索..." class="input-search" />
          
          <select v-model="selectedRole" @change="fetchUsers" class="select-role">
            <option value="">全ての権限</option>
            <option value="管理者">管理者</option>
            <option value="作業者">作業者</option>
          </select>
        </div>

        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>氏名</th>
              <th>メールアドレス</th>
              <th>権限ロール</th>
              <th>ステータス</th>
              <th class="text-center">アクション</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td><code>#{{ user.id }}</code></td>
              <td><strong>{{ user.name }}</strong></td>
              <td>{{ user.email }}</td>
              <td><span class="role-badge">{{ user.role }}</span></td>
              <td>
                <span class="status-badge" :class="{ 'is-active': user.active }">
                  {{ user.active ? '有効' : '無効' }}
                </span>
              </td>
              <td class="text-center">
                <div class="actions">
                  <button class="btn-action btn-edit" @click="openModalForEdit(user)">✏️ 編集</button>
                  <button v-if="authState.user?.role === '管理者'" class="btn-action btn-delete" @click="deleteUser(user.id)">🗑️ 削除</button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="6" class="text-center no-data">🔍 条件に一致するユーザーが見つかりませんでした。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <div class="modal-overlay" v-if="isModalOpen" @click.self="closeModal">
      <div class="modal-content">
        <header class="modal-header">
          <h3>{{ modalMode === 'add' ? '👤 新規ユーザー登録' : '✏️ ユーザー情報の編集' }}</h3>
          <button class="btn-close" @click="closeModal">✕</button>
        </header>
        
        <div class="modal-body">
          <div class="form-group">
            <label>氏名</label>
            <input type="text" v-model="dialogForm.name" placeholder="例: 山田 太郎" />
          </div>
          <div class="form-group">
            <label>メールアドレス</label>
            <input type="email" v-model="dialogForm.email" placeholder="example@p-books.co.jp" />
          </div>
          
          <div class="form-group">
            <label>権限ロール</label>
            <div class="dummy-role-display">
              {{ dialogForm.role }} <span class="hint-text">（※現在変更できません）</span>
            </div>
          </div>

          <div class="form-group row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="dialogForm.active" /> アカウントを有効化する
            </label>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" @click="closeModal">キャンセル</button>
          <button class="btn-primary" @click="submitForm">
            {{ modalMode === 'add' ? '登録する' : '更新を保存' }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Sidebar from '../../components/Sidebar.vue';
import { useModal } from '../../composables/useModal';
import { validators } from '../../utils/validator';
import { useAuth } from '../../store/auth';

// 💡 共通APIクライアントをインポート
import { api } from '../../api';

const { authState } = useAuth();
const { isOpen: isModalOpen, openModal, closeModal } = useModal();

const searchQuery = ref('');
const selectedRole = ref('');
const users = ref([]); // 初期値は空

const modalMode = ref('add');
const targetUserId = ref(null);
const dialogForm = ref({ name: '', email: '', role: '管理者', active: true });

/**
 * 💡 ユーザー一覧の非同期取得（引数として検索条件を渡す実務仕様）
 */
const fetchUsers = async () => {
  const response = await api.getUsers({
    query: searchQuery.value,
    // 選択された権限（管理者、作業者）の値をパラメータとして渡す。
    role: selectedRole.value
  });  
  users.value = response;
};

onMounted(() => {
  fetchUsers();
});

const openModalForAdd = () => {
  modalMode.value = 'add';
  targetUserId.value = null;
  dialogForm.value = { name: '', email: '', role: '管理者', active: true };
  openModal();
};

const openModalForEdit = (user) => {
  modalMode.value = 'edit';
  targetUserId.value = user.id;
  dialogForm.value = { ...user };
  openModal();
};

const submitForm = async () => {
  const nameError = validators.required(dialogForm.value.name, '氏名');
  const emailReqError = validators.required(dialogForm.value.email, 'メールアドレス');
  const emailFormatError = validators.email(dialogForm.value.email);

  if (nameError || emailReqError || emailFormatError) {
    alert([nameError, emailReqError, emailFormatError].filter(Boolean).join('\n'));
    return;
  }

  // 💡 APIクライアントへデータ（引数）を渡して登録・編集を非同期実行
  await api.saveUser({
    id: targetUserId.value,
    ...dialogForm.value
  });

  closeModal();
  fetchUsers(); 
};

const deleteUser = (id) => {
  users.value = users.value.filter(user => user.id !== id);
};
</script>

<style lang="scss" scoped>
.user-page-layout { display: flex; min-height: 100vh; background-color: #f1f5f9; }
.main-content { flex: 1; padding: 40px; }
.user-list-container { background: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.page-header h2 { margin: 0 0 6px 0; color: #0f172a; font-size: 24px; font-weight: 700; }
.description { margin: 0; color: #64748b; font-size: 14px; }
.search-bar { display: flex; gap: 16px; margin-bottom: 24px; }
.input-search, .select-role { padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
.input-search { flex: 1; } .input-search:focus { border-color: #4f46e5; }
.select-role { background-color: #fff; cursor: pointer; }
.user-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
.user-table th, .user-table td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid #e2e8f0; text-align: left; }
.user-table th { background-color: #f8fafc; color: #475569; font-weight: 600; }
.user-table tbody tr:nth-child(even) { background-color: #f8fafc; }
.user-table tbody tr:hover { background-color: #f1f5f9; }
.role-badge { background-color: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.status-badge { background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-badge.is-active { background-color: #dcfce7; color: #166534; }
.text-center { text-align: center; }
.actions { display: flex; gap: 8px; justify-content: center; }
.no-data { padding: 40px; color: #64748b; font-size: 15px; background: #f8fafc; }
.btn-primary, .btn-secondary, .btn-action { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
.btn-primary { background-color: #4f46e5; color: #fff; }
.btn-primary:hover { background-color: #4338ca; }
.btn-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.btn-secondary:hover { background-color: #e2e8f0; }
.btn-action { padding: 6px 12px; font-size: 12px; font-weight: 500; background-color: #fff; border: 1px solid #e2e8f0; }
.btn-action.btn-edit { color: #0284c7; border-color: #bae6fd; } .btn-action.btn-edit:hover { background-color: #0284c7; color: #fff; }
.btn-action.btn-delete { color: #dc2626; border-color: #fca5a5; } .btn-action.btn-delete:hover { background-color: #dc2626; color: #fff; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 480px; border-radius: 16px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modalUp 0.2s ease-out; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #0f172a; font-size: 18px; }
.btn-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; }
.modal-body { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.form-group input { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
.form-group input:focus { border-color: #4f46e5; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #334155; cursor: pointer; }
.modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; }
.dummy-role-display { padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #64748b; cursor: not-allowed; }
.dummy-role-display .hint-text { font-size: 12px; color: #ef4444; margin-left: 8px; }
@keyframes modalUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>