import { ref } from 'vue';

/**
 * モーダル（ダイアログ）の開閉状態制御
 */
export function useModal(initialState = false) {
  const isOpen = ref(initialState);
  
  const openModal = () => { isOpen.value = true; };
  const closeModal = () => { isOpen.value = false; };
  
  return { isOpen, openModal, closeModal };
}