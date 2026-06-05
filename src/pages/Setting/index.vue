<template>
  <div class="setting-page-layout">
    <Sidebar />

    <main class="main-content">
      <div class="setting-container">
        
        <div class="page-header">
          <div>
            <h2>システム・アカウント設定</h2>
            <p class="description">個人プロファイルの変更、セキュリティ設定、および管理画面のシステム環境設定を行います。</p>
          </div>
        </div>

        <div class="setting-grid">
          
          <div class="setting-card">
            <div class="card-header">
              <h3>👤 アカウントプロファイル</h3>
              <!-- 作業者権限：プロファイル編集機能の無効化 -->
              <button class="btn-secondary-sm" :disabled="authState.user?.role === '作業者'" @click="openProfileModal">✏️ プロファイルを編集</button>
            </div>
            <div class="card-body-view">
              <div class="view-group">
                <span class="label">氏名</span>
                <span class="value">{{ authState.user?.name }}</span>
              </div>
              <div class="view-group">
                <span class="label">メールアドレス</span>
                <span class="value">{{ authState.user?.email }}</span>
              </div>
              <div class="view-group">
                <span class="label">権限ロール</span>
                <span class="value">{{ authState.user?.role }}</span>
              </div>
            </div>
          </div>

          <div class="setting-card">
            <div class="card-header">
              <h3>🔒 セキュリティ設定</h3>
              <!-- 作業者権限：パスワード変更機能の無効化 -->
              <button class="btn-secondary-sm" :disabled="authState.user?.role === '作業者'" @click="openPasswordModal">🔑 パスワードを変更</button>
            </div>
            <div class="card-body-view">
              <div class="view-group">
                <span class="label">2要素認証 (2FA)</span>
                <span class="value status" :class="{ 'is-enabled': currentSettings.security.twoFactor }">
                  {{ currentSettings.security.twoFactor ? '🔒 有効 (推奨設定)' : '⚠️ 無効' }}
                </span>
              </div>
              <div class="view-group">
                <span class="label">最終パスワード変更日</span>
                <span class="value">{{ currentSettings.security.lastPasswordChange }}</span>
              </div>
            </div>
          </div>

          <div class="setting-card full-width">
            <div class="card-header">
              <h3>⚙️ システム環境設定（即時保存）</h3>
            </div>
            <div class="card-body form-row">
              <div class="form-group">
                <label>セッション有効タイムアウト時間 (分)</label>
                <div class="input-with-hint">
                <!-- 作業者権限：セッション有効タイムアウト時間機能の無効化 -->
                  <input 
                    type="number" 
                    v-model.number="currentSettings.system.sessionTimeout" 
                    @change="validateAndSaveTimeout"
                    placeholder="30"
                    :disabled="authState.user?.role === '作業者'" 
                  />
                  <span class="unit">分</span>
                </div>
                <p class="input-error" v-if="timeoutError">{{ timeoutError }}</p>
                <p class="input-hint">※ セキュリティ保持のため、最低30分以上の時間設定が必要です。</p>
              </div>

              <div class="form-group">
                <label>APIデータキャッシュ保持時間 (分)</label>
                <div class="input-with-hint">
                  <!-- 作業者権限：APIデータキャッシュ保持時間機能の無効化 -->
                  <input type="number" v-model.number="currentSettings.system.apiCacheDuration" @change="saveSystemSettings" :disabled="authState.user?.role === '作業者'" />
                  <span class="unit">分</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>

    <div class="modal-overlay" v-if="isProfileModalOpen" @click.self="closeProfileModal">
      <div class="modal-content">
        <header class="modal-header">
          <h3>👤 プロファイル情報の変更</h3>
          <button class="btn-close" @click="closeProfileModal">✕</button>
        </header>
        <div class="modal-body">
          <div class="form-group-vertical">
            <label>氏名</label>
            <input type="text" v-model="profileForm.name" :disabled="isSaving" />
          </div>
          <div class="form-group-vertical">
            <label>メールアドレス</label>
            <input type="email" v-model="profileForm.email" :disabled="isSaving" />
          </div>
          <div class="form-group-vertical">
            <label>権限ロール</label>
            <input type="text" v-model="profileForm.role" disabled class="disabled-input" />
            <p class="hint-text">※権限ロールはユーザー画面からのみ変更可能です。</p>
          </div>
        </div>
        <footer class="modal-footer">
          <button class="btn-secondary" @click="closeProfileModal" :disabled="isSaving">キャンセル</button>
          <button class="btn-primary" @click="submitProfile" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '変更を保存' }}
          </button>
        </footer>
      </div>
    </div>

    <div class="modal-overlay" v-if="isPasswordModalOpen" @click.self="closePasswordModal">
      <div class="modal-content">
        <header class="modal-header">
          <h3>🔑 パスワードの安全な変更</h3>
          <button class="btn-close" @click="closePasswordModal">✕</button>
        </header>
        <div class="modal-body">
          <div class="form-group-vertical">
            <label>現在のパスワード</label>
            <input type="password" v-model="passwordForm.current" placeholder="••••••••" :disabled="isSaving" />
          </div>
          <div class="form-group-vertical">
            <label>新しいパスワード</label>
            <input type="password" v-model="passwordForm.new" placeholder="8文字以上の英数字" :disabled="isSaving" />
          </div>
          <div class="form-group-vertical">
            <label>新しいパスワード（確認用）</label>
            <input type="password" v-model="passwordForm.confirm" placeholder="もう一度入力してください" :disabled="isSaving" />
          </div>
        </div>
        <footer class="modal-footer">
          <button class="btn-secondary" @click="closePasswordModal" :disabled="isSaving">キャンセル</button>
          <button class="btn-primary btn-danger" @click="submitPassword" :disabled="isSaving">
            {{ isSaving ? '更新中...' : 'パスワードを更新' }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Sidebar from '../../components/Sidebar.vue';
import { useModal } from '../../composables/useModal';
import { validators } from '../../utils/validator';
import { useAuth } from '../../store/auth';

// 💡 共通APIクライアント
import { api } from '../../api';

const { authState } = useAuth();
const { isOpen: isProfileModalOpen, openModal: openModalProfile, closeModal: closeProfileModal } = useModal();
const { isOpen: isPasswordModalOpen, openModal: openModalPassword, closeModal: closePasswordModal } = useModal();

// 💡 画面固有の初期ステート
const currentSettings = ref({
  security: { twoFactor: true, lastPasswordChange: '2026/04/01' },
  system: { sessionTimeout: 60, apiCacheDuration: 15 }
});

const timeoutError = ref('');
const isSaving = ref(false);

const profileForm = ref({ name: '', email: '', role: '' });
const passwordForm = ref({ current: '', new: '', confirm: '' });

const openProfileModal = () => {
  profileForm.value = { name: '', email: '', role: '' }; 
  openModalProfile();
};

const submitProfile = async () => {
  const nameError = validators.required(profileForm.value.name, '氏名');
  const emailReqError = validators.required(profileForm.value.email, 'メールアドレス');
  const emailFormatError = validators.email(profileForm.value.email);

  if (nameError || emailReqError || emailFormatError) {
    alert([nameError, emailReqError, emailFormatError].filter(Boolean).join('\n'));
    return;
  }
  
  isSaving.value = true;
  try {
    // APIへプロファイル更新を送信
    await api.saveProfile(profileForm.value);
    
    // Store側のログインユーザー情報も同期させる（簡易的）
    authState.user.name = profileForm.value.name;
    authState.user.email = profileForm.value.email;
    
    alert('プロファイル情報を更新しました');
    closeProfileModal();
  } catch (error) {
    alert('プロファイルの更新に失敗しました。');
  } finally {
    isSaving.value = false;
  }
};

const openPasswordModal = () => {
  passwordForm.value = { current: '', new: '', confirm: '' };
  openModalPassword();
};

const submitPassword = async () => {
  const reqError1 = validators.required(passwordForm.value.current, '現在のパスワード');
  const reqError2 = validators.required(passwordForm.value.new, '新しいパスワード');
  const matchError = validators.match(passwordForm.value.new, passwordForm.value.confirm);

  const errors = [reqError1, reqError2, matchError].filter(Boolean);
  if (errors.length > 0) {
    alert(errors.join('\n'));
    return;
  }

  isSaving.value = true;
  try {
    // APIへパスワード更新を送信
    const res = await api.saveSecurityPassword(passwordForm.value);
    currentSettings.value.security.lastPasswordChange = res.lastPasswordChange;
    alert('安全にパスワードが変更されました');
    closePasswordModal();
  } catch (error) {
    alert('パスワードの更新に失敗しました。');
  } finally {
    isSaving.value = false;
  }
};

/**
 * 環境設定変更時の即時保存処理（タイムアウト検証込み）
 */
const validateAndSaveTimeout = async () => {
  const val = currentSettings.value.system.sessionTimeout;
  const error = validators.minNumber(val, 30, 'セッション時間');
  
  if (error) {
    timeoutError.value = `❌ ${error}`;
    currentSettings.value.system.sessionTimeout = 30; // 30に戻す
  } else {
    timeoutError.value = '';
    await saveSystemSettings(); // エラーがなければAPIへ保存
  }
};

const saveSystemSettings = async () => {
  try {
    await api.saveSystemConfig(currentSettings.value.system);
    // 即時保存のためアラートは出さず、裏側で完了させる（実務的なサイレントセーブ）
  } catch (error) {
    console.error('システム設定の保存に失敗しました', error);
  }
};
</script>

<style lang="scss" scoped>
.setting-page-layout { display: flex; min-height: 100vh; background-color: #f1f5f9; }
.main-content { flex: 1; padding: 40px; }
.setting-container { background: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
.page-header { margin-bottom: 32px; border-left: 4px solid #475569; padding-left: 16px; }
.page-header h2 { margin: 0 0 6px 0; color: #0f172a; font-size: 24px; font-weight: 700; }
.description { margin: 0; color: #64748b; font-size: 14px; }
.setting-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.setting-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.setting-card.full-width { grid-column: span 2; background-color: #fff; border-color: #cbd5e1; }
.card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
.card-header h3 { margin: 0; color: #1e293b; font-size: 16px; font-weight: 700; }
.card-body-view { display: flex; flex-direction: column; gap: 14px; }
.card-body-view .view-group { display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; }
.card-body-view .view-group:last-child { border-bottom: none; }
.card-body-view .view-group .label { font-size: 13px; font-weight: 600; color: #64748b; }
.card-body-view .view-group .value { font-size: 14px; font-weight: 700; color: #0f172a; }
.card-body-view .view-group .value.status.is-enabled { color: #16a34a; }
.card-body.form-row { display: flex; gap: 40px; }
.card-body.form-row .form-group { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.card-body.form-row .form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.card-body.form-row .form-group .input-with-hint { display: flex; align-items: center; gap: 8px; }
.card-body.form-row .form-group .input-with-hint input[type="number"] { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; width: 100px; outline: none; }
.card-body.form-row .form-group .input-with-hint input[type="number"]:focus { border-color: #6366f1; }
/* 入力テキストdisabled 時のスタイルを追加 */
.card-body.form-row .form-group .input-with-hint input[type="number"]:disabled { background-color: #f8fafc; color: #94a3b8; cursor: not-allowed; border-color: #e2e8f0; }
.card-body.form-row .form-group .input-with-hint .unit { font-size: 14px; font-weight: 600; color: #475569; }
.card-body.form-row .form-group .input-hint { font-size: 12px; color: #64748b; margin: 0; }
.card-body.form-row .form-group .input-error { font-size: 12px; color: #dc2626; font-weight: bold; margin: 0; }
.btn-secondary-sm { padding: 6px 12px; background-color: #fff; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; }
.btn-secondary-sm:not(:disabled):hover { background-color: #f1f5f9; color: #0f172a; border-color: #94a3b8; }
/* ボタンdisabled 時のスタイルを追加 */
.btn-secondary-sm:disabled {　cursor: not-allowed; opacity: 0.6; background-color: #fff; color: #475569;　border-color: #cbd5e1;}
.btn-primary { padding: 10px 18px; background-color: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background-color: #3730a3; }
.btn-primary.btn-danger { background-color: #dc2626; } .btn-primary.btn-danger:hover:not(:disabled) { background-color: #991b1b; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-secondary { padding: 10px 18px; background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-secondary:hover:not(:disabled) { background-color: #e2e8f0; }
.btn-secondary:disabled { opacity: 0.7; cursor: not-allowed; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 440px; border-radius: 16px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modalUp 0.2s ease-out; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h3 { margin: 0; color: #0f172a; font-size: 18px; }
.btn-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; }
.modal-body { display: flex; flex-direction: column; gap: 16px; }
.modal-body .form-group-vertical { display: flex; flex-direction: column; gap: 6px; }
.modal-body .form-group-vertical label { font-size: 13px; font-weight: 600; color: #475569; }
.modal-body .form-group-vertical input { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
.modal-body .form-group-vertical input:focus { border-color: #4f46e5; }
.modal-body .form-group-vertical input.disabled-input { background-color: #f1f5f9; cursor: not-allowed; color: #94a3b8; border-color: #e2e8f0; }
.modal-body .form-group-vertical .hint-text { font-size: 12px; color: #ef4444; margin: 0; }
.modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; }
@keyframes modalUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>