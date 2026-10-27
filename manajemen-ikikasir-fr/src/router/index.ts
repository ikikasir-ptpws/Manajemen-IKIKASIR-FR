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
      path: '/manajemen-role',
      name: 'manajemen-role',
      component: () => import('../views/manajemen-role/RoleIndex.vue')
    },
    {
      path: '/manajemen-promo',
      name: 'manajemen-promo',
      component: () => import('../views/manajemen-promo/PromoIndex.vue')
    },
    {
      path: '/kelola-paket',
      name: 'kelola-paket',
      component: () => import('../views/kelola-paket/KelolaPaketIndex.vue')
    },
    {
      path: '/calon-client',
      name: 'calon-client',
      component: () => import('../views/crm-client/CalonClientIndex.vue')
    },
    {
      path: '/finance-workspace',
      redirect: '/calon-client'
    },
    {
      path: '/teknisi-workspace',
      redirect: '/semua-pelanggan'
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

router.beforeEach((to, _from, next) => {
  // Public routes
  if (to.path === '/login' || to.path === '/landing') {
    return next()
  }

  // Get active role from user session or storage
  let role = 'Super Admin'
  let userObj: any = null
  try {
    const rawUser = localStorage.getItem('ikikasir_user')
    if (rawUser) {
      userObj = JSON.parse(rawUser)
      if (userObj?.role) role = userObj.role
    } else {
      const storedRole = localStorage.getItem('ikikasir_current_role_v1')
      if (storedRole) role = storedRole
    }
  } catch {
    // fallback
  }

  const lowerRole = (role || '').trim().toLowerCase()

  // Super Admin has full bypass
  if (lowerRole.includes('super')) {
    return next()
  }

  // Helper checking if a menu is permitted
  const isMenuAllowed = (menuKey: string): boolean => {
    // 1. Check latest saved roles in localStorage (from Manajemen Role updates)
    try {
      const rawRoles = localStorage.getItem('ikikasir_roles_v2')
      if (rawRoles) {
        const parsed = JSON.parse(rawRoles)
        const matched = parsed.find((item: any) => (item.name || '').trim().toLowerCase() === lowerRole)
        if (matched) {
          if (matched.permissions?.[menuKey]?.read !== undefined) {
            return Boolean(matched.permissions[menuKey].read)
          }
          if (typeof matched.menuAccess?.[menuKey] === 'boolean') {
            return matched.menuAccess[menuKey]
          }
        }
      }
    } catch {}

    // 2. Check roleDetail from user session
    if (userObj?.roleDetail) {
      if (userObj.roleDetail.permissions?.[menuKey]?.read !== undefined) {
        return Boolean(userObj.roleDetail.permissions[menuKey].read)
      }
      if (userObj.roleDetail.menuAccess && typeof userObj.roleDetail.menuAccess[menuKey] === 'boolean') {
        return userObj.roleDetail.menuAccess[menuKey]
      }
    }

    // 3. Fallback defaults
    if (lowerRole === 'sales' || lowerRole === 'seles') {
      return menuKey === 'calonClient'
    }
    if (lowerRole === 'finance') {
      return ['calonClient', 'semuaPelanggan', 'arusKas', 'labaRugi', 'neraca'].includes(menuKey)
    }
    if (lowerRole === 'teknisi') {
      return ['semuaPelanggan'].includes(menuKey)
    }
    if (lowerRole === 'admin') {
      return menuKey !== 'manajemenRole'
    }
    return true
  }

  const routeToMenuKey: Record<string, string> = {
    '/': 'dashboard',
    '/manajemen-pengguna': 'manajemenPengguna',
    '/manajemen-role': 'manajemenRole',
    '/manajemen-promo': 'manajemenPromo',
    '/kelola-paket': 'kelolaPaket',
    '/calon-client': 'calonClient',
    '/semua-pelanggan': 'semuaPelanggan',
    '/langganan': 'langganan',
    '/expired': 'expired',
    '/arus-kas': 'arusKas',
    '/laba-rugi': 'labaRugi',
    '/neraca': 'neraca',
    '/laporan-harian': 'laporanPenjualan',
  }

  const targetMenuKey = routeToMenuKey[to.path]

  // If this route is mapped to a menu key, verify access
  if (targetMenuKey) {
    if (isMenuAllowed(targetMenuKey)) {
      // User is allowed to access this menu
      return next()
    }

    // Not allowed to access to.path: redirect to first accessible route
    if (isMenuAllowed('dashboard')) {
      return next('/')
    } else if (isMenuAllowed('calonClient')) {
      return next('/calon-client')
    } else if (isMenuAllowed('semuaPelanggan')) {
      return next('/semua-pelanggan')
    } else {
      return next('/calon-client')
    }
  }

  next()
})

export default router
