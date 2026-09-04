import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/dashboard/DashboardIndex.vue')
    },
    {
      path: '/manajemen-pengguna',
      name: 'manajemen-pengguna',
      component: () => import('../views/manajemen-pengguna/PenggunaIndex.vue')
    },
    {
      path: '/manajemen-promo',
      name: 'manajemen-promo',
      component: () => import('../views/manajemen-promo/PromoIndex.vue')
    }
  ],
})

export default router
