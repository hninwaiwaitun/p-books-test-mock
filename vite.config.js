import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue() // 💡 ここでVueファイルの翻訳プラグインを有効化しています
  ],
  resolve: {
    alias: {
      // @ を src フォルダのショートカットとして使えるようにする実務で必須の設定
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})