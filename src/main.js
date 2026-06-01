import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 💡 作成したルーター設定を読み込む

const app = createApp(App)

app.use(router) // 💡 アプリ全体でルーターを有効化
app.mount('#app')