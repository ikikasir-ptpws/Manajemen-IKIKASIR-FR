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
      path: '/laporan-harian',
      name: 'laporan-harian',
      component: () => import('../views/laporan/LaporanHarianIndex.vue')
    },
    {
      path: '/semua-pelanggan',
      name: 'semua-pelanggan',
      component: () => import('../views/crm-client/SemuaPelangganIndex.vue')
    },
    {
      path: '/langganan',
      name: 'langganan',
      component: () => import('../views/crm-client/LanggananIndex.vue')
    },
    {
      path: '/expired',
      name: 'expired',
      component: () => import('../views/crm-client/ExpiredIndex.vue')
    },
    {
      path: '/arus-kas',
      name: 'arus-kas',
      component: () => import('../views/laporan/ArusKasIndex.vue')
    },
    {
      path: '/laba-rugi',
      name: 'laba-rugi',
      component: () => import('../views/laporan/LabaRugiIndex.vue')
    },
    {
      path: '/neraca',
      name: 'neraca',
      component: () => import('../views/laporan/NeracaIndex.vue')
    },
    {
      path: '/landing',
      name: 'landing',
      component: () => import('../views/landing/LandingIndex.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginIndex.vue')
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
})

export default router
