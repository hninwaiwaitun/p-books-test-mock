import { createRouter, createWebHistory } from 'vue-router'
// 各画面コンポーネントをインポート
import Login from '../pages/Login/index.vue'
import TopMenu from '../pages/TopMenu/index.vue'
import UserList from '../pages/UserList/index.vue'
import Sales from '../pages/Sales/index.vue'
import Stock from '../pages/Stock/index.vue'
import Setting from '../pages/Setting/index.vue'

const routes = [
  {
    path: '/',
    redirect: '/login' // 最初にアクセスしたときはログイン画面に強制移動
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/top-menu',
    name: 'TopMenu',
    component: TopMenu
  },
  {
    path: '/user-list',
    name: 'UserList',
    component: UserList
  },
  {
    path: '/sales',
    name: 'Sales',
    component: Sales
  },
  {
    path: '/stock',
    name: 'Stock',
    component: Stock
  },
  {
    path: '/setting',
    name: 'Setting',
    component: Setting
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router