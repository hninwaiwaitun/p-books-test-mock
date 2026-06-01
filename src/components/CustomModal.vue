// 定義のみ。置き換えは保留

<template>
  <div class="modal-overlay" @click.self="emitClose">
    <div class="modal-content" :class="customClass">
      
      <header class="modal-header">
        <slot name="header">
          <h3>デフォルトタイトル</h3>
        </slot>
        <button class="btn-close" @click="emitClose">✕</button>
      </header>
      
      <div class="modal-body">
        <slot name="body"></slot>
      </div>
      
      <footer class="modal-footer">
        <slot name="footer"></slot>
      </footer>
      
    </div>
  </div>
</template>

<script setup>
// 親コンポーネントから受け取るプロパティ（幅の調整用など）
defineProps({
  customClass: {
    type: String,
    default: ''
  }
});

// 親コンポーネントへ「閉じる」イベントを通知する
const emit = defineEmits(['close']);

const emitClose = () => {
  emit('close');
};
</script>

<style lang="scss" scoped>
/* 各画面に散らばっていたモーダル用のCSSをここに集約！ */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(4px); }
.modal-content { background: #fff; width: 100%; max-width: 480px; border-radius: 16px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modalUp 0.2s ease-out; }
/* 幅を広げたい時用の拡張クラス */
.modal-content.large { max-width: 600px; }
.modal-content.small { max-width: 400px; }

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; transition: color 0.2s; }
.btn-close:hover { color: #0f172a; }
.modal-body { display: flex; flex-direction: column; gap: 16px; }
.modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; }

@keyframes modalUp { 
  from { opacity: 0; transform: scale(0.95) translateY(10px); } 
  to { opacity: 1; transform: scale(1) translateY(0); } 
}
</style>