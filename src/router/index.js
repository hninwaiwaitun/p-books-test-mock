import { createRouter, createWebHistory } from 'vue-router'
// 認証用のストアをインポート
import { useAuth } from '../store/auth'
// 各画面コンポーネントをインポート
import Login from '../pages/Login/index.vue'
import TopMenu from '../pages/TopMenu/index.vue'
import UserList from '../pages/UserList/index.vue'
import Sales from '../pages/Sales/index.vue'
import Stock from '../pages/Stock/index.vue'
import Setting from '../pages/Setting/index.vue'
// 404画面をインポート
import NotFound from '../pages/NotFound/index.vue'

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
    component: UserList,
    //  管理者のみアクセス可能に設定
    meta: { requiresAdmin: true }
  },
  {
    path: '/sales',
    name: 'Sales',
    component: Sales,
    //  管理者のみアクセス可能に設定
    meta: { requiresAdmin: true }
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
  },
  // 404 画面のルート定義
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound
  },
  // 定義外のURLにアクセスがあった場合も404に飛ばす設定（任意）
  {
    path: '/:catchAll(.*)',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 画面遷移前の制御（グローバルガード）
router.beforeEach((to, from, next) => {
  // ログインユーザーの権限を取得する
  const { authState } = useAuth()
  const userRole = authState.user?.role

  // アクセスしようとしているルートが管理者限定、かつユーザーが作業者の場合
  if (to.meta.requiresAdmin && userRole == '作業者') {
    // 404画面に遷移
    next({ name: 'NotFound'})
  } else {
    // 問題なければそのまま遷移
    next()
  }
})

export default router