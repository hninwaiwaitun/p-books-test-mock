<template>
  <div class="login-page-container">
    <div class="login-card">
      
      <div class="login-header">
        <div class="logo-icon">📚</div>
        <h2>P社 管理画面システム</h2>
        <p class="subtitle">アカウント情報を入力してログインしてください。</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>メールアドレス</label>
          <input type="email" v-model="loginForm.email" placeholder="example@p-books.co.jp" required />
        </div>
        
        <div class="form-group">
          <label>パスワード</label>
          <input type="password" v-model="loginForm.password" placeholder="••••••••" required />
        </div>

        <div class="form-options">
          <a href="#" class="link-forgot" @click.prevent="openForgotModal">パスワードを忘れた場合</a>
        </div>

        <p class="error-message" v-if="errorMessage">{{ errorMessage }}</p>

        <button type="submit" class="btn-login-submit" :disabled="isLoading">
          {{ isLoading ? '認証中...' : 'ログイン' }}
        </button>
      </form>

      <div class="divider">
        <span>または</span>
      </div>

      <div class="social-login-zone">
        <button class="btn-google-login" @click="handleGoogleLogin" :disabled="isLoading">
          <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google アカウントでログイン
        </button>
      </div>

      <footer class="login-footer">
        <span class="version-tag">System Version: {{ SYSTEM_CONFIG.VERSION }}</span>
        <p class="copyright">{{ SYSTEM_CONFIG.COPYRIGHT }}</p>
      </footer>
    </div>

    <div class="modal-overlay" v-if="isForgotModalOpen" @click.self="closeForgotModal">
      <div class="modal-content">
        <header class="modal-header">
          <h3>🔑 パスワードの再設定</h3>
          <button class="btn-close" @click="closeForgotModal">✕</button>
        </header>
        
        <div class="modal-body">
          <p class="notice-text">ご登録されているメールアドレスを入力してください。再設定用のURLをお送りします。</p>
          <div class="form-group-vertical">
            <label>メールアドレス</label>
            <input type="email" v-model="forgotEmail" placeholder="example@p-books.co.jp" required />
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" @click="closeForgotModal" :disabled="isLoading">キャンセル</button>
          <button class="btn-primary" @click="submitForgotEmail" :disabled="isLoading">再設定メールを送信</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../../store/auth';
import { useModal } from '../../composables/useModal';
import { SYSTEM_MESSAGES, SYSTEM_CONFIG } from '../../constants/messages';
import { validators } from '../../utils/validator';

import { api } from '../../api';

const router = useRouter();
const { login } = useAuth();
const { isOpen: isForgotModalOpen, openModal: openForgotModal, closeModal: closeForgotModal } = useModal();

const loginForm = ref({ email: '', password: '' });
const errorMessage = ref('');
const forgotEmail = ref('');
const isLoading = ref(false); // 通信中の状態管理

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    // 💡 APIクライアントを経由して非同期でログイン処理
    const response = await api.login({ 
      email: loginForm.value.email, 
      password: loginForm.value.password 
    });
    
    // 成功時、レスポンス内の user オブジェクトをStoreにセット
    login(response.user);
    router.push('/top-menu');
  } catch (error) {
    // エラー時のハンドリング
    errorMessage.value = SYSTEM_MESSAGES.AUTH.LOGIN_FAILED;
  } finally {
    isLoading.value = false;
  }
};

const handleGoogleLogin = async () => {
  isLoading.value = true;
  try {
    // 💡 Googleログイン用API呼び出し
    const response = await api.loginWithGoogle();
    login(response.user);
    // グーグルログインを押下するとトップページ画面に遷移。
    router.push('/top-menu');
  } catch (error) {
    errorMessage.value = 'Google認証に失敗しました。';
  } finally {
    isLoading.value = false;
  }
};

const submitForgotEmail = async () => {
  const emailError = validators.required(forgotEmail.value, 'メールアドレス');
  if (emailError) {
    alert(emailError);
    return;
  }

  isLoading.value = true;
  try {
    // 💡 パスワードリセットAPI呼び出し
    await api.sendPasswordResetEmail({ email: forgotEmail.value });
    alert(`再設定用メールを「${forgotEmail.value}」宛に送信しました。`);
    closeForgotModal();
  } catch (error) {
    alert('メールの送信に失敗しました。');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 20px; box-sizing: border-box; font-family: sans-serif; }
.login-card { background: #ffffff; width: 100%; max-width: 420px; padding: 40px 32px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); display: flex; flex-direction: column; }
.login-header { text-align: center; margin-bottom: 32px; }
.logo-icon { font-size: 40px; margin-bottom: 12px; }
.login-header h2 { margin: 0 0 8px 0; color: #0f172a; font-size: 22px; font-weight: 700; }
.subtitle { margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; }
.login-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12px; font-weight: 600; color: #475569; }
.form-group input { padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }
.form-group input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.form-options { display: flex; justify-content: flex-end; }
.link-forgot { font-size: 12px; color: #4f46e5; text-decoration: none; font-weight: 500; }
.link-forgot:hover { text-decoration: underline; }
.error-message { font-size: 12px; color: #dc2626; font-weight: 600; margin: 0; text-align: center; }
.btn-login-submit { margin-top: 8px; padding: 12px; background-color: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-login-submit:hover:not(:disabled) { background-color: #3730a3; }
.btn-login-submit:disabled { opacity: 0.7; cursor: not-allowed; }
.divider { display: flex; align-items: center; text-align: center; color: #94a3b8; font-size: 12px; margin: 24px 0; }
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #e2e8f0; }
.divider span { padding: 0 10px; }
.social-login-zone .btn-google-login { width: 100%; padding: 11px; background-color: #fff; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; }
.social-login-zone .btn-google-login:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.social-login-zone .btn-google-login:disabled { opacity: 0.7; cursor: not-allowed; }
.login-footer { margin-top: 36px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }
.version-tag { font-family: monospace; font-size: 11px; color: #94a3b8; background-color: #f8fafc; padding: 2px 6px; border-radius: 4px; }
.copyright { margin: 8px 0 0 0; font-size: 11px; color: #94a3b8; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 400px; border-radius: 16px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modalUp 0.2s ease-out; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-header h3 { margin: 0; color: #0f172a; font-size: 16px; font-weight: 700; }
.btn-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; }
.modal-body .notice-text { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 16px 0; }
.modal-body .form-group-vertical { display: flex; flex-direction: column; gap: 6px; }
.form-group-vertical label { font-size: 12px; font-weight: 600; color: #475569; }
.form-group-vertical input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }
.form-group-vertical input:focus { border-color: #4f46e5; }
.modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; }
.btn-secondary { padding: 10px 16px; background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-secondary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-primary { padding: 10px 16px; background-color: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
@keyframes modalUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>