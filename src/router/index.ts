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
    },
    {
      path: '/calon-client',
      name: 'calon-client',
      component: () => import('../views/crm-client/CalonClientIndex.vue')
    },
    {
      path: '/follow-up',
      name: 'follow-up',
      component: () => import('../views/crm-client/FollowUpIndex.vue')
    },
    { path: '/semua-pelanggan', redirect: '/' },
    { path: '/langganan', redirect: '/' },
    { path: '/expired', redirect: '/' },
    { path: '/arus-kas', redirect: '/' },
    { path: '/laba-rugi', redirect: '/' },
    { path: '/neraca', redirect: '/' },
    { path: '/laporan-harian', redirect: '/' },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
})

export default router
