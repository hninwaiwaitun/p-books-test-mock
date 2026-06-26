<template>
  <div class="user-page-layout">
    <Sidebar />

    <main class="main-content">
      <div class="user-list-container">
        <div class="page-header">
          <div class="page-title">
            <h2>出版社管理</h2>
            <p>出版社情報および担当者情報を管理し、検索・登録・編集・削除・CSV入出力ができ</p>
          </div>
          <div class="header-actions">
            <!-- openCsvModal を呼ぶように修正 -->
            <button class="btn-import" @click="openCsvModal">📥 CSVデータインポート</button>
            <input type="file" ref="fileInput" accept=".csv" style="display: none" @change="handleCsvUpload" />
            <button class="btn-import" @click="handleCsvExport">📥 CSVデータエスクポート</button>
            <button class="btn-primary" @click="openModalForAdd">➕ 新規ユーザー登録</button>
          </div>
        </div>

        <div class="search-bar">
          <input type="text" v-model="searchQuery" @input="fetchCmpInfo" placeholder="社名で検索..." class="input-search" />
        </div>

        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>社名</th>
              <th>住所</th>
              <th>登録日時</th>
              <th>更新日時</th>
              <th class="text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="publisher in cmpInfo" :key="publisher.id">
              <td><code>{{ publisher.id }}</code></td>
              <td><strong>{{ publisher.companyName }}</strong></td>
              <td><strong>{{ publisher.companyAddress }}</strong></td>
              <td>{{ publisher.register }}</td>
              <td>{{ publisher.update }}</td>
              <td class="text-center">
                <div class="actions">
                  <button class="btn-action btn-edit" @click="openModalForEdit(publisher)">✏️ 確認／編集</button>
                  <button class="btn-action btn-delete" @click="deleteCmpInfo(publisher.id)">🗑️ 削除</button>
                </div>
              </td>
            </tr>
            <tr v-if="cmpInfo.length === 0">
              <td colspan="6" class="text-center no-data">🔍 条件に一致するデータが見つかりませんでした。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- 表示条件を v-if="isCsvModalOpen" に、閉じる関数を closeCsvModal に修正 -->
    <div class="modal-overlay" v-if="isCsvModalOpen" @click.self="closeCsvModal">
      <div class="modal-content">
        <header class="modal-header">
          <h3>📥 CSVデータインポート</h3>
          <button class="btn-close" @click="closeCsvModal">✕</button>
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
          <button class="btn-secondary" @click="closeCsvModal">キャンセル</button>
          <button class="btn-primary-emerald" @click="triggerFileInput">ファイルを選択して取り込む</button>
        </footer>
      </div>
    </div>

    <!-- ユーザー登録用モーダル（isModalOpen で制御、担当者追加ボタンが正しく動きます） -->
    <div class="modal-overlay" v-if="isModalOpen" @click.self="closeModal">
      <div class="modal-content">
        <header class="modal-header">
          <h3>{{ modalMode === 'add' ? '👤 新規ユーザー登録' : '✏️ ユーザー情報の確認・編集' }}</h3>
          <button class="btn-close" @click="closeModal">✕</button>
        </header>

        <div class="modal-body">
          <div class="form-group">
            <label>社名</label>
            <input type="text" v-model="dialogForm.companyName" placeholder="例: 〇〇会社" />
          </div>
          <div class="form-group">
            <label>住所</label>
            <input type="text" v-model="dialogForm.companyAddress" placeholder="例: 東京都〇〇区〇〇丁目" />
          </div>

          <div class="contacts-section">
            <h4>担当者情報</h4>
            <div v-for="(contact, index) in dialogForm.contacts" :key="index" class="contact-item-group">
              <div class="contact-header">
                <span>担当者 {{ index + 1 }}</span>
                <button v-if="dialogForm.contacts.length > 1" type="button" class="btn-remove-contact"
                  @click="removeContInfo(index)">削除</button>
              </div>
              <div class="form-group">
                <label>担当者名</label>
                <input type="text" v-model="contact.name" placeholder="例: 山田 太郎" />
                <br></br>
              </div>
              <div class="form-group">
                <label>メールアドレス</label>
                <!-- コピーボタンを綺麗に横並びにするためのラッパー -->
                <div class="email-input-wrapper">
                  <input type="email" v-model="contact.email" placeholder="example@p-books.co.jp" />
                  <button type="button" class="btn-copy-email" @click="copyToClipboard(contact.email, index)"
                    title="メールアドレスをコピー">
                    📋
                  </button>
                </div>
              </div>
            </div>

            <button type="button" class="btn-add-contact" @click="addContInfo">＋ 担当者を追加</button>
          </div>

          <div class="form-group">
            <label>備考</label>
            <input type="text" v-model="dialogForm.note" />
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
import { useModal } from '../../composables/useModal.js';
import { validators } from '../../utils/validator.js';
import { useAuth } from '../../store/auth.js';
import { SYSTEM_MESSAGES } from '../../constants/messages.js';

// 共通APIクライアントをインポート
import { api } from '../../api/index.js';

const { authState } = useAuth();

// useModal を別名で2つ定義してモーダルのバグを防ぐ
const { isOpen: isModalOpen, openModal, closeModal } = useModal();
const { isOpen: isCsvModalOpen, openModal: openCsvModal, closeModal: closeCsvModal } = useModal();

const searchQuery = ref('');
const selectedRole = ref('');
const users = ref([]); // 初期値は空
const cmpInfo = ref([]); // 初期値は空

const modalMode = ref('add');
const targetUserId = ref(null);

// フォーム初期値のファクトリ関数（contactsを配列化）
const createDefaultForm = () => ({
  companyName: '',
  companyAddress: '',
  contacts: [{ name: '', email: '' }], // 初期状態で1名分用意
  note: '',
  active: true
});

// 初期値をファクトリ関数から正しく生成
const dialogForm = ref(createDefaultForm());
const fileInput = ref(null);

/**
 *  ユーザー一覧の非同期取得
 */
const fetchCmpInfo = async () => {
  const response = await api.getCmpInfo({
    query: searchQuery.value
  });
  console.log(response);
  cmpInfo.value = response;
};

onMounted(() => {
  fetchCmpInfo();
});

//  担当者を追加する関数
const addContInfo = () => {
  dialogForm.value.contacts.push({ name: '', email: '' });
};

//  担当者を削除する関数
const removeContInfo = (index) => {
  dialogForm.value.contacts.splice(index, 1);
};

//  新規登録モーダルを開く関数
const openModalForAdd = () => {
  modalMode.value = 'add';
  targetUserId.value = null;
  dialogForm.value = createDefaultForm(); // フォームを初期化
  openModal();
};

//  編集モーダルを開く関数
const openModalForEdit = (user) => {
  modalMode.value = 'edit';
  targetUserId.value = user.id;

  // 既存データに contacts 配列がない場合の互換性ケア
  const contacts = [];
  if (user.contacts && user.contacts.length > 0) {
    contacts.push(...user.contacts.map(c => ({ ...c })));
  } else {
    // 古いデータ形式（contactなど）が残っていたら救い上げる
    if (user.contact || user.email) contacts.push({ name: user.contact || '', email: user.email || '' });
    // if (user.contact2 || user.email2) contacts.push({ name: user.contact2 || '', email: user.email2 || '' });
    if (contacts.length === 0) contacts.push({ name: '', email: '' });
  }

  dialogForm.value = {
    ...user,
    contacts: contacts
  };
  openModal();
};

//  CSV選択時にCSVモーダル側を閉じるように修正
const triggerFileInput = () => {
  closeCsvModal();
  fileInput.value.click();
};

/**
 *  一覧にCSVデータをインポート
 */
const handleCsvUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    const headers = lines.shift().split(',');

    const parsedRecords = lines.map((line, index) => {
      const columns = line.split(',');
      return {
        id: columns[0] || (cmpInfo.value.length + index + 1),
        companyName: columns[1] || '',
        companyAddress: columns[2] || '',
        register: columns[3] || new Date().toLocaleString(),
        update: columns[4] || new Date().toLocaleString()
      };
    });

    cmpInfo.value = [...parsedRecords, ...cmpInfo.value];
    alert(SYSTEM_MESSAGES.SALES.CSV_SUCCESS(file.name));
    event.target.value = '';
  };

  reader.readAsText(file, 'UTF-8');
};


/**
 *  表示中の一覧データをCSVとしてエクスポート
 */
const handleCsvExport = () => {
  // 1. データが空の場合は処理を中断
  if (!cmpInfo.value || cmpInfo.value.length === 0) {
    alert('出力するデータがありません。');
    return;
  }

  // 2. CSVのヘッダー行（1行目）を定義
  const headers = ['ID', '社名', '住所', '担当者名', 'メールアドレス', '登録日時', '更新日時', '備考'];

  // 3. データ行（2行目以降）を作成（カンマ区切りの文字列に変換）
  const rows = cmpInfo.value.map(publisher => {
    return [
      publisher.id,
      // データ内にカンマや改行が含まれる場合を考慮してダブルクォーテーションで囲む
      `"${(publisher.companyName || '').replace(/"/g, '""')}"`,
      `"${(publisher.companyAddress || '').replace(/"/g, '""')}"`,
      `"${(publisher.contact || '').replace(/"/g, '""')}"`,
      `"${(publisher.email || '').replace(/"/g, '""')}"`,
      publisher.register || '',
      publisher.update || '',
      `"${(publisher.note || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  // 4. ヘッダーとデータ行を結合して、改行コード（CRLF）で繋ぐ
  const csvContent = [headers.join(','), ...rows].join('\r\n');

  // 5. Excelでの文字化けを防ぐために「BOM」を追加
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

  // 6. ブラウザでダウンロード処理を実行
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // ファイル名を指定（例: publisher_export_20260619.csv）
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  link.setAttribute('href', url);
  link.setAttribute('download', `publisher_export_${today}.csv`);

  // リンクを一時的にドキュメントに追加してクリックし、すぐに削除
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const submitForm = async () => {
  const nameError = validators.required(dialogForm.value.companyName, '社名');
  const addressError = validators.required(dialogForm.value.companyAddress, '住所');

  //  担当者名のエラー管理変数を定義
  let contactError = null;
  let emailError = null;

  //  ループ内で担当者名とメールアドレスの両方をチェック
  for (let i = 0; i < dialogForm.value.contacts.length; i++) {
    const contact = dialogForm.value.contacts[i];
    
    // 1. 担当者名の必須チェック
    const nameReqErr = validators.required(contact.name, `担当者${i + 1}の氏名`);
    if (nameReqErr) {
      contactError = nameReqErr;
      break; // エラーがあればその時点でループを抜ける
    }

    // 2. メールアドレスの必須チェック
    const reqErr = validators.required(contact.email, `担当者${i + 1}のメールアドレス`);
    if (reqErr) {
      emailError = reqErr;
      break;
    }
    
    // 3. メールアドレスの形式チェック
    const formatErr = validators.email(contact.email);
    if (formatErr) {
      emailError = `担当者${i + 1}の${formatErr}`;
      break;
    }
  }

  //  contactError も含めて判定
  if (nameError || emailError || addressError || contactError) {
    alert([nameError, addressError, contactError, emailError].filter(Boolean).join('\n'));
    return;
  }

  const getFormattedDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const payload = {
    companyName: dialogForm.value.companyName,
    companyAddress: dialogForm.value.companyAddress,
    contacts: dialogForm.value.contacts,
    note: dialogForm.value.note,
    active: dialogForm.value.active,
  };

  if (modalMode.value === 'add') {
    const newId = cmpInfo.value.length > 0 ? Math.max(...cmpInfo.value.map(info => info.id)) + 1 : 1;
    alert(newId);
    const newRecord = {
      id: newId,
      ...payload,
      register: getFormattedDate(),
      update: getFormattedDate(),
    };

    await api.saveUser({ ...newRecord });
    cmpInfo.value.unshift(newRecord);
  } else {
    await api.saveUser({
      id: targetUserId.value,
      ...payload
    });

    const index = cmpInfo.value.findIndex(publisher => publisher.id === targetUserId.value);
    if (index !== -1) {
      cmpInfo.value[index] = {
        ...cmpInfo.value[index],
        ...payload,
        update: getFormattedDate()
      };
    }
  }

  closeModal();
};


const deleteCmpInfo = (id) => {
  if (confirm(SYSTEM_MESSAGES.CMPINFO.DELETE_CONFIRM(id))) {
    cmpInfo.value = cmpInfo.value.filter(publisher => publisher.id !== id);
  }
};

/**
 *  メールアドレスをクリップボードにコピーする関数
 */
const copyToClipboard = async (email, index) => {
  if (!email || email.trim() === '') {
    alert(`担当者 ${index + 1} のメールアドレスが入力されていません。`);
    return;
  }

  try {
    await navigator.clipboard.writeText(email);
    alert(`担当者 ${index + 1} のメールアドレスをコピーしました：\n${email}`);
  } catch (err) {
    console.error('コピーに失敗しました: ', err);
    alert('コピーに失敗しました。お使いのブラウザのセキュリティ設定を確認してください。');
  }
};

</script>


<style lang="scss" scoped>
.user-page-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f1f5f9;
}

.main-content {
  flex: 1;
  padding: 40px;
}

.user-list-container {
  background: #ffffff;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  /* タイトルとボタン群を左右両端に配置 */
  align-items: center;
  /* 上下中央揃え（お好みで flex-start でも可） */
  margin-bottom: 32px;
}

.page-header h2 {
  margin: 0 0 6px 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
}

/* 説明文の margin も一応リセットしておくと崩れにくいです */
.page-header p {
  margin: 0;
}

/* ボタンを囲むコンテナに gap を指定する */
.header-actions {
  display: flex;
  gap: 12px;
  /* ボタン同士の適切な間隔 */
  flex-shrink: 0;
  /* 画面が狭くなってもボタンが潰れないようにする */
}

.description {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.input-search,
.select-role {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.input-search {
  flex: 1;
}

.input-search:focus {
  border-color: #4f46e5;
}

.user-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.user-table th,
.user-table td {
  padding: 16px 20px;
  font-size: 14px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.user-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
}

.user-table tbody tr:nth-child(even) {
  background-color: #f8fafc;
}

.user-table tbody tr:hover {
  background-color: #f1f5f9;
}

.role-badge {
  background-color: #e0f2fe;
  color: #0369a1;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.is-active {
  background-color: #dcfce7;
  color: #166534;
}

.text-center {
  text-align: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.no-data {
  padding: 40px;
  color: #64748b;
  font-size: 15px;
  background: #f8fafc;
}

.btn-primary,
.btn-secondary,
.btn-action {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4f46e5;
  color: #fff;
}

.btn-primary:hover {
  background-color: #4338ca;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

.btn-action {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: #fff;
  border: 1px solid #e2e8f0;
}

.btn-action.btn-edit {
  color: #0284c7;
  border-color: #bae6fd;
}

.btn-action.btn-edit:hover {
  background-color: #0284c7;
  color: #fff;
}

.btn-action.btn-delete {
  color: #dc2626;
  border-color: #fca5a5;
}

.btn-action.btn-delete:hover {
  background-color: #dc2626;
  color: #fff;
}

.btn-import {
  padding: 10px 18px;
  background-color: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-import:hover {
  background-color: #059669;
}

.btn-primary-emerald {
  padding: 10px 18px;
  background-color: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(15, 23, 42, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #fff;
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalUp 0.2s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-body .import-notice {
  background-color: #fff7ed;
  border: 1px solid #ffedd5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.modal-body .notice-title {
  font-weight: 700;
  color: #c2410c;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.modal-body .prompt-text {
  font-size: 14px;
  color: #334155;
  font-weight: 600;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.form-group input {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.form-group input:focus {
  border-color: #4f46e5;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
}

.modal-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dummy-role-display {
  padding: 10px 14px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #64748b;
  cursor: not-allowed;
}

.dummy-role-display .hint-text {
  font-size: 12px;
  color: #ef4444;
  margin-left: 8px;
}

.contacts-section {
  margin: 15px 0;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.contact-item-group {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #ddd;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  margin-bottom: 5px;
}

.btn-remove-contact {
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 2px 8px;
  cursor: pointer;
  border-radius: 3px;
}

.btn-add-contact {
  background-color: #52c41a;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 3px;
}

.email-input-wrapper {
  display: flex;
  gap: 8px; /* 入力枠とボタンの隙間 */
  align-items: center;
}

.email-input-wrapper input {
  flex: 1; /* 入力枠を横幅いっぱいに広げる */
}

.btn-copy-email {
  background-color: #f0f2f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-copy-email:hover {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.btn-copy-email:active {
  background-color: #bae7ff;
}

@keyframes modalUp {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>