<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import IkiKasirLogo from '../../components/IkiKasirLogo.vue'
import bannerImg from '../../images/benner.png'
import { 
  ArrowRight, 
  PlayCircle, 
  Play,
  Check, 
  Zap, 
  ShieldCheck, 
  Headset, 
  Package, 
  Grid, 
  BarChart3, 
  Smartphone, 
  Store,
  Crown,
  Facebook,
  Instagram,
  Youtube,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Box,
  ShoppingCart
} from 'lucide-vue-next'

const isMobileMenuOpen = ref(false)
const activeTab = ref('Beranda')

// Particle Canvas Animation Logic
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId: number | null = null

interface Particle {
  x: number
  y: number
  radius: number
  color: string
  alpha: number
  vy: number
  vx: number
  pulseSpeed: number
}

const particles: Particle[] = []

function initParticles(w: number, h: number) {
  particles.length = 0
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 3 + 1,
      color: Math.random() > 0.4 ? '#38bdf8' : '#60a5fa',
      alpha: Math.random() * 0.7 + 0.2,
      vy: -(Math.random() * 0.45 + 0.15),
      vx: (Math.random() - 0.5) * 0.25,
      pulseSpeed: Math.random() * 0.03 + 0.01
    })
  }
}

function loopParticles() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const time = Date.now() * 0.002
  particles.forEach(p => {
    p.y += p.vy
    p.x += p.vx + Math.sin(time + p.radius) * 0.15

    if (p.y < -10) {
      p.y = canvas.height + 10
      p.x = Math.random() * canvas.width
    }
    if (p.x < 0) p.x = canvas.width
    if (p.x > canvas.width) p.x = 0

    const currentAlpha = Math.max(0.1, Math.min(0.85, p.alpha + Math.sin(time * p.pulseSpeed * 10) * 0.2))

    ctx.save()
    ctx.globalAlpha = currentAlpha
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color
    ctx.shadowBlur = p.radius * 4
    ctx.fill()
    ctx.restore()
  })

  animId = requestAnimationFrame(loopParticles)
}

function handleResize() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
  canvas.height = canvas.parentElement?.clientHeight || 650
  initParticles(canvas.width, canvas.height)
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  loopParticles()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (animId) cancelAnimationFrame(animId)
})

const navLinks = [
  { name: 'Beranda', href: '#' },
  { name: 'Tentang', href: '#tentang' },
  { name: 'Fitur', href: '#fitur' },
  { name: 'Paket', href: '#paket' },
  { name: 'FAQ', href: '#faq' },
]

const leftFeatures = [
  { name: 'Manajemen Produk', icon: Package, iconBg: '#eff6ff', iconColor: '#2563eb' },
  { name: 'Kategori Produk', icon: Grid, iconBg: '#f3e8ff', iconColor: '#9333ea' },
  { name: 'Laporan Penjualan', icon: BarChart3, iconBg: '#e0e7ff', iconColor: '#4f46e5' },
]

const rightFeatures = [
  { name: 'Transaksi Cepat', icon: Zap, iconBg: '#eff6ff', iconColor: '#2563eb' },
  { name: 'Stok Real-time', icon: Box, iconBg: '#fef3c7', iconColor: '#d97706' },
  { name: 'Multi Device', icon: Smartphone, iconBg: '#e0f2fe', iconColor: '#0284c7' },
]
</script>

<template>
  <div class="landing-page-root">
    
    <!-- Top Navigation Bar -->
    <nav class="nav-container">
      <div class="nav-inner">
        <!-- Logo -->
        <div class="nav-logo">
          <IkiKasirLogo size="md" />
        </div>
        
        <!-- Desktop Nav Links -->
        <div class="nav-links-desktop">
          <a 
            v-for="link in navLinks" 
            :key="link.name" 
            :href="link.href" 
            @click="activeTab = link.name"
            :class="['nav-item', { active: activeTab === link.name }]"
          >
            {{ link.name }}
            <span v-if="activeTab === link.name" class="nav-active-bar"></span>
          </a>
        </div>
        
        <!-- Right CTA Button -->
        <div class="nav-cta-desktop">
          <RouterLink to="/" class="btn-primary-sm">
            Mulai Sekarang
            <ArrowRight class="icon-sm" />
          </RouterLink>
        </div>

        <!-- Mobile Menu Toggle -->
        <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="nav-mobile-btn">
          <Menu v-if="!isMobileMenuOpen" class="icon-md" />
          <X v-else class="icon-md" />
        </button>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div v-if="isMobileMenuOpen" class="nav-mobile-menu">
        <a 
          v-for="link in navLinks" 
          :key="link.name" 
          :href="link.href" 
          @click="activeTab = link.name; isMobileMenuOpen = false"
          :class="['mobile-nav-item', { active: activeTab === link.name }]"
        >
          {{ link.name }}
        </a>
        <RouterLink to="/" class="btn-primary-mobile">
          Mulai Sekarang
        </RouterLink>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <!-- Ambient Pulsing Soft Blue Glow -->
      <div class="ambient-glow-pulse"></div>

      <!-- Floating Particle Canvas Overlay -->
      <canvas ref="canvasRef" class="hero-particle-canvas"></canvas>

      <!-- Full Background Banner Image with Breathing & Cinematic Zoom -->
      <div class="hero-bg-container">
        <img 
          :src="bannerImg" 
          alt="IKI KASIR Hero Banner" 
          class="hero-bg-img"
        />
      </div>

      <!-- Floating Handwritten Text Overlay (Top Right) -->
      <div class="handwritten-overlay">
        <div class="handwritten-text">
          <span class="blue-sparkle star-1">✦</span>
          <span class="blue-sparkle star-2">✨</span>
          Solusi Kasir<br />
          untuk Bisnis<br />
          Anda!
          <span class="blue-sparkle star-3">✦</span>
          <svg class="handwritten-underline" viewBox="0 0 100 20" fill="none">
            <path d="M 5,14 Q 50,3 95,12" stroke="url(#blueGradient)" stroke-width="3.5" stroke-linecap="round" />
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="50%" stop-color="#60a5fa" />
                <stop offset="100%" stop-color="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div class="hero-inner">
        <!-- Hero Left Column: Text & CTAs -->
        <div class="hero-text-col">
          
          <div class="hero-badge">
            <span class="star-icon">✦</span>
            <span>Aplikasi Kasir Modern untuk Bisnis Anda</span>
          </div>
          
          <h1 class="hero-title">
            Kelola Transaksi<br />
            Lebih Mudah dengan<br />
            <span class="text-blue">IKI </span><span class="text-sky">KASIR</span>
          </h1>
          
          <p class="hero-subtitle">
            Aplikasi kasir berbasis Android yang simpel, cepat, dan terpercaya untuk membantu bisnis Anda berjalan lebih efisien dan profesional.
          </p>
          
          <div class="hero-cta-group">
            <RouterLink to="/" class="btn-primary-lg">
              Mulai Sekarang
              <ArrowRight class="icon-md" />
            </RouterLink>
            <button class="btn-secondary-lg">
              <div class="play-icon-circle">
                <Play class="icon-play" />
              </div>
              Lihat Demo
            </button>
          </div>
          
          <div class="hero-bullets">
            <div class="bullet-item">
              <div class="bullet-icon-box">
                <Zap class="bullet-icon" />
              </div>
              <span>Mudah Digunakan</span>
            </div>
            <div class="bullet-item">
              <div class="bullet-icon-box">
                <ShieldCheck class="bullet-icon" />
              </div>
              <span>Aman & Terpercaya</span>
            </div>
            <div class="bullet-item">
              <div class="bullet-icon-box">
                <Headset class="bullet-icon" />
              </div>
              <span>Support 24/7</span>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Features Section (Fitur Unggulan) -->
    <section id="fitur" class="features-section">
      <div class="features-inner">
        
        <!-- Left Column: Heading & Description -->
        <div class="features-text-col">
          <div class="section-badge">Fitur Unggulan</div>
          
          <h2 class="section-title">
            Solusi Kasir Modern<br />
            untuk <span class="text-blue-gradient">Semua Jenis Bisnis</span>
          </h2>
          
          <p class="features-desc">
            <strong>IKI KASIR</strong> adalah aplikasi kasir yang dirancang untuk membantu Anda mengelola transaksi, produk, stok, serta laporan penjualan dengan lebih mudah dan efisien. Dengan tampilan yang simpel dan fitur lengkap, IKI KASIR cocok untuk berbagai jenis usaha, mulai dari kafe, toko retail, hingga bisnis kuliner.
          </p>
          
          <button class="btn-secondary-md">
            Pelajari Lebih Lanjut
            <ArrowRight class="icon-sm" />
          </button>
        </div>

        <!-- Right Column: Interactive Phone Mockup & Feature Cards -->
        <div class="features-visual-col">
          <div class="features-grid-wrapper">
            
            <!-- Left Cards -->
            <div class="cards-column">
              <div 
                v-for="(feat, idx) in leftFeatures" 
                :key="idx" 
                class="feature-mini-card"
              >
                <div class="mini-card-icon" :style="{ backgroundColor: feat.iconBg, color: feat.iconColor }">
                  <component :is="feat.icon" class="icon-sm" />
                </div>
                <span class="mini-card-label">{{ feat.name }}</span>
              </div>
            </div>

            <!-- Center Smartphone Mockup -->
            <div class="phone-mockup-container">
              <div class="phone-frame">
                <div class="phone-notch"></div>
                <div class="phone-screen">
                  
                  <div class="app-header">
                    <div class="app-logo-badge">
                      <div class="app-logo-k">k</div>
                      <span class="app-logo-text">IKI KASIR</span>
                    </div>
                    <div class="app-user-avatar"></div>
                  </div>

                  <div class="app-greeting">Halo, Pemilik</div>

                  <div class="app-balance-card">
                    <div class="balance-label">Total Penjualan Hari Ini</div>
                    <div class="balance-amount">Rp 2.560.000</div>
                    <div class="balance-growth">+12% dari kemarin</div>
                  </div>

                  <div class="app-stats-grid">
                    <div class="stat-box">
                      <div class="stat-lbl">Produk</div>
                      <div class="stat-val">120</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-lbl">Transaksi</div>
                      <div class="stat-val">48</div>
                    </div>
                  </div>

                  <div class="app-quick-menu">
                    <div class="quick-title">Menu Cepat</div>
                    <div class="quick-grid">
                      <div class="quick-item blue">
                        <ShoppingCart class="icon-xs" />
                        <span>Penjualan</span>
                      </div>
                      <div class="quick-item purple">
                        <Package class="icon-xs" />
                        <span>Produk</span>
                      </div>
                      <div class="quick-item amber">
                        <Box class="icon-xs" />
                        <span>Stok</span>
                      </div>
                      <div class="quick-item indigo">
                        <BarChart3 class="icon-xs" />
                        <span>Laporan</span>
                      </div>
                    </div>
                  </div>

                  <div class="app-bottom-nav">
                    <div class="nav-btn active"><span>🏠</span>Beranda</div>
                    <div class="nav-btn"><span>💳</span>Transaksi</div>
                    <div class="nav-btn"><span>📦</span>Produk</div>
                    <div class="nav-btn"><span>📊</span>Laporan</div>
                    <div class="nav-btn"><span>👤</span>Akun</div>
                  </div>

                </div>
              </div>
            </div>

            <!-- Right Cards -->
            <div class="cards-column">
              <div 
                v-for="(feat, idx) in rightFeatures" 
                :key="idx" 
                class="feature-mini-card"
              >
                <div class="mini-card-icon" :style="{ backgroundColor: feat.iconBg, color: feat.iconColor }">
                  <component :is="feat.icon" class="icon-sm" />
                </div>
                <span class="mini-card-label">{{ feat.name }}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>

    <!-- Pricing Section (Paket Harga) -->
    <section id="paket" class="pricing-section">
      <div class="pricing-inner">
        
        <div class="pricing-header">
          <div class="section-badge">Paket Harga</div>
          <h2 class="section-title text-center">Pilih Paket Sesuai Kebutuhan Bisnis Anda</h2>
          <p class="pricing-subtitle">Mulai dari paket basic hingga pro, semua dirancang untuk mendukung pertumbuhan bisnis Anda.</p>
        </div>

        <div class="pricing-grid">
          
          <!-- Basic Card -->
          <div class="price-card basic">
            <div>
              <div class="card-header">
                <div class="card-icon blue"><Box class="icon-md" /></div>
                <div>
                  <h3 class="card-name">Basic</h3>
                  <p class="card-sub">Cocok untuk usaha kecil dan pemula.</p>
                </div>
              </div>
              <div class="card-price">
                <span class="currency">Rp</span>
                <span class="amount">99.000</span>
                <span class="period">/bulan</span>
              </div>
              <ul class="features-list">
                <li><Check class="icon-check blue" /><span>Manajemen produk (maks. 100)</span></li>
                <li><Check class="icon-check blue" /><span>Transaksi kasir</span></li>
                <li><Check class="icon-check blue" /><span>Laporan penjualan dasar</span></li>
                <li><Check class="icon-check blue" /><span>Support email</span></li>
              </ul>
            </div>
            <button class="btn-outline-blue">Pilih Paket</button>
          </div>

          <!-- Pro Card (Highlighted Solid Blue) -->
          <div class="price-card pro">
            <div class="badge-populer">Populer</div>
            <div>
              <div class="card-header">
                <div class="card-icon white-trans"><Crown class="icon-md" /></div>
                <div>
                  <h3 class="card-name text-white">Pro</h3>
                  <p class="card-sub text-blue-light">Untuk bisnis yang sedang berkembang.</p>
                </div>
              </div>
              <div class="card-price text-white">
                <span class="currency text-blue-light">Rp</span>
                <span class="amount">199.000</span>
                <span class="period text-blue-light">/bulan</span>
              </div>
              <ul class="features-list white">
                <li><Check class="icon-check text-white" /><span>Semua fitur Basic</span></li>
                <li><Check class="icon-check text-white" /><span>Manajemen stok real-time</span></li>
                <li><Check class="icon-check text-white" /><span>Multi user (hingga 5 user)</span></li>
                <li><Check class="icon-check text-white" /><span>Laporan lengkap</span></li>
                <li><Check class="icon-check text-white" /><span>Support prioritas 24/7</span></li>
              </ul>
            </div>
            <button class="btn-solid-white">Pilih Paket</button>
          </div>

          <!-- Custom Card -->
          <div class="price-card custom">
            <div>
              <div class="card-header">
                <div class="card-icon blue"><Store class="icon-md" /></div>
                <div>
                  <h3 class="card-name">Custom</h3>
                  <p class="card-sub">Untuk kebutuhan bisnis skala besar.</p>
                </div>
              </div>
              <div class="card-price">
                <div class="price-label">Mulai dari</div>
                <span class="currency">Rp</span>
                <span class="amount">399.000</span>
                <span class="period">/bulan</span>
              </div>
              <ul class="features-list">
                <li><Check class="icon-check blue" /><span>Semua fitur Pro</span></li>
                <li><Check class="icon-check blue" /><span>Fitur khusus sesuai kebutuhan</span></li>
                <li><Check class="icon-check blue" /><span>Integrasi sistem (jika diperlukan)</span></li>
                <li><Check class="icon-check blue" /><span>Dedicated support</span></li>
              </ul>
            </div>
            <button class="btn-outline-blue">Hubungi Kami</button>
          </div>

        </div>

      </div>
    </section>

    <!-- Footer -->
    <footer class="footer-section">
      <div class="footer-inner">
        
        <div class="footer-grid">
          
          <div class="footer-col brand">
            <div class="footer-logo">
              <div class="logo-box">k</div>
              <span class="logo-txt">IKI <span class="text-blue-light">KASIR</span></span>
            </div>
            <p class="brand-tagline">Mudah, Cepat, Profesional<br />untuk Bisnis Anda.</p>
            <div class="copyright-text">© 2025 IKI KASIR. All rights reserved.</div>
          </div>

          <div class="footer-col">
            <h4 class="col-title">Navigasi</h4>
            <ul class="footer-links">
              <li><a href="#">Beranda</a></li>
              <li><a href="#tentang">Tentang</a></li>
              <li><a href="#fitur">Fitur</a></li>
              <li><a href="#paket">Paket</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="col-title">Kontak</h4>
            <ul class="footer-contact">
              <li><Phone class="icon-contact" /><span>+62 812 3456 7890</span></li>
              <li><Mail class="icon-contact" /><span>cs@ikikasir.id</span></li>
              <li><MapPin class="icon-contact" /><span>Jl. Melati No. 123<br />Jakarta, Indonesia</span></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="col-title">Ikuti Kami</h4>
            <div class="social-icons">
              <a href="#" class="social-btn"><Instagram class="icon-sm" /></a>
              <a href="#" class="social-btn"><Youtube class="icon-sm" /></a>
              <a href="#" class="social-btn">
                <svg viewBox="0 0 24 24" class="icon-sm fill-current"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
              </a>
              <a href="#" class="social-btn"><Facebook class="icon-sm" /></a>
            </div>
            
            <button class="google-play-btn">
              <svg viewBox="0 0 512 512" class="gplay-icon" fill="currentColor"><path d="M99.617 8.057a50.191 50.191 0 00-38.815-6.713l230.932 230.933 74.846-74.846L99.617 8.057zM32.139 20.116c-6.441 8.563-10.148 19.077-10.148 30.199v411.358c0 11.123 3.708 21.636 10.148 30.199l235.877-235.877L32.139 20.116zM464.261 212.087l-67.266-37.637-81.544 81.545 81.548 81.548 67.273-37.64c16.117-9.03 25.738-25.442 25.738-43.908s-9.621-34.877-25.749-43.908zM291.733 279.711L60.815 510.629c3.123 1.083 6.445 1.544 10.004 1.544 9.175 0 18.223-3.146 25.989-7.442l277.927-155.482-82.998-83.006z"/></svg>
              <div>
                <div class="gplay-sub">GET IT ON</div>
                <div class="gplay-main">Google Play</div>
              </div>
            </button>
          </div>

        </div>

        <div class="footer-bottom">
          <p>© 2025 IKI KASIR. All rights reserved.</p>
          <div class="bottom-links">
            <a href="#">Syarat & Ketentuan</a>
            <span>|</span>
            <a href="#">Kebijakan Privasi</a>
          </div>
        </div>

      </div>
    </footer>

  </div>
</template>

<style scoped>
/* Reset & Root Scoped Styles */
.landing-page-root {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  background-color: #ffffff;
  color: #0f172a;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Icons Sizes */
.icon-xs { width: 14px; height: 14px; }
.icon-sm { width: 18px; height: 18px; }
.icon-md { width: 22px; height: 22px; }

/* ─────────────────────────────────────────────
   NAVBAR  ·  Ultra-thin Premium Glassmorphism
   ───────────────────────────────────────────── */
.nav-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  /* Strong glass transparency — background hero clearly visible through */
  background: rgba(240, 248, 255, 0.55);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border-bottom: 1px solid rgba(99, 149, 230, 0.25);
  /* Very subtle blue glow — not distracting */
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.60) inset,
    0 4px 24px rgba(37, 99, 235, 0.07),
    0 1px 6px rgba(139, 92, 246, 0.05);
  z-index: 100;
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 52px;  /* compact — 48–52px like premium SaaS */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo area — constrain size so it looks small & tight */
.nav-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.nav-logo :deep(svg),
.nav-logo :deep(img) {
  max-height: 30px !important;
  width: auto !important;
}

.nav-links-desktop {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

/* Menu items — small, crisp, dark navy on light glass */
.nav-item {
  position: relative;
  font-size: 0.6875rem;  /* ~11px */
  font-weight: 700;
  color: #0f2f5e;
  text-decoration: none;
  padding: 0.25rem 0;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  transition: color 0.15s ease;
}
.nav-item:hover {
  color: #2563eb;
}
.nav-item.active {
  color: #1d4ed8;
  font-weight: 700;
}

/* Active: ultra-thin cyan underline */
.nav-active-bar {
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 1.5px;
  background: rgba(56, 189, 248, 0.90);
  border-radius: 9999px;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.60);
}

/* CTA button — tiny pill, stays fully inside canvas */
.btn-primary-sm {
  background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
  color: #ffffff !important;
  padding: 0.3rem 0.9rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.65rem;  /* ~10.5px */
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.30);
  box-shadow:
    0 2px 12px rgba(37, 99, 235, 0.40),
    0 0 16px rgba(56, 189, 248, 0.12);
  transition: all 0.18s ease;
  flex-shrink: 0;
}
.btn-primary-sm:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(37, 99, 235, 0.50);
}

/* Mobile */
.nav-mobile-btn {
  display: none;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
}
.nav-mobile-menu {
  display: none;
  background: rgba(8, 20, 50, 0.90);
  backdrop-filter: blur(18px);
  padding: 0.75rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
}
.mobile-nav-item {
  display: block;
  padding: 0.6rem 0;
  font-weight: 600;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
}
.mobile-nav-item.active { color: #38bdf8; font-weight: 700; }
.btn-primary-mobile {
  display: block;
  text-align: center;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  color: white;
  padding: 0.75rem;
  border-radius: 9999px;
  font-weight: 700;
  margin-top: 1rem;
  text-decoration: none;
}

@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  min-height: 650px;
  background-color: #eaf3fd;
  padding-top: 100px;  /* reduced from 135px — navbar is now only 52px */
  padding-bottom: 75px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

/* Ambient Slow Blue Glow Pulse */
.ambient-glow-pulse {
  position: absolute;
  top: -15%;
  right: 10%;
  width: 650px;
  height: 650px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.08) 50%, transparent 70%);
  filter: blur(50px);
  z-index: 1;
  animation: ambient-pulse 7s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes ambient-pulse {
  0% { opacity: 0.45; transform: scale(1); }
  100% { opacity: 0.85; transform: scale(1.15); }
}

/* Floating Particle Canvas Overlay */
.hero-particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

/* Hero Background Image Container with Breathing & 2-3% Push-in */
.hero-bg-container {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.hero-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: right center;
  animation: hero-cinematic-zoom 7.5s ease-in-out infinite alternate;
  transform-origin: 75% 50%;
}
@keyframes hero-cinematic-zoom {
  0% {
    transform: scale(1) translate(0, 0);
  }
  100% {
    transform: scale(1.028) translate(-0.4%, -0.2%);
  }
}

.hero-inner {
  position: relative;
  z-index: 4;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero-text-col {
  max-width: 580px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(224, 242, 254, 0.85);
  border: 1px solid #bae6fd;
  color: #0284c7;
  padding: 0.35rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(4px);
}
.star-icon {
  color: #0284c7;
  font-size: 0.875rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.15;
  color: #0f172a;
  margin-bottom: 1.25rem;
  letter-spacing: -0.02em;
}
.text-blue { color: #2563eb; }
.text-sky { color: #00a3ff; }

.hero-subtitle {
  font-size: 1.05rem;
  color: #475569;
  line-height: 1.65;
  max-width: 520px;
  margin-bottom: 2.25rem;
}

.hero-cta-group {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2.75rem;
}

.btn-primary-lg {
  background-color: #2563eb;
  color: #ffffff !important;
  padding: 0.875rem 2.25rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  box-shadow: 0 10px 20px -3px rgba(37, 99, 235, 0.35);
  transition: all 0.2s ease;
}
.btn-primary-lg:hover {
  background-color: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 14px 25px -3px rgba(37, 99, 235, 0.45);
}

.btn-secondary-lg {
  background-color: #ffffff;
  color: #2563eb;
  border: 1.5px solid #60a5fa;
  padding: 0.75rem 1.875rem 0.75rem 1rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  transition: all 0.2s ease;
}
.btn-secondary-lg:hover {
  background-color: #eff6ff;
  border-color: #2563eb;
}

.play-icon-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-play {
  width: 12px;
  height: 12px;
  fill: #2563eb;
  color: #2563eb;
  margin-left: 2px;
}

.hero-bullets {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}
.bullet-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}
.bullet-icon-box {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  flex-shrink: 0;
}
.bullet-icon {
  width: 16px;
  height: 16px;
  color: #2563eb;
}

/* Floating Handwritten Text (Top Right) */
.handwritten-overlay {
  position: absolute;
  top: 120px;
  right: 7%;
  z-index: 5;
  pointer-events: none;
}

.handwritten-text {
  font-family: 'Caveat', cursive;
  font-size: 2.15rem;
  font-weight: 700;
  line-height: 1.1;
  position: relative;
  display: inline-block;
  text-align: left;
  
  /* Bright Electric Cyan & White Shimmering Gradient */
  background: linear-gradient(115deg, #ffffff 0%, #e0f2fe 25%, #38bdf8 55%, #7dd3fc 85%, #ffffff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  /* Bright Cyan Glow & High Contrast Shadow */
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 14px rgba(56, 189, 248, 0.9));
  
  animation: 
    text-gentle-float 5s ease-in-out infinite alternate,
    text-blue-shimmer 3s linear infinite;
}

@keyframes text-blue-shimmer {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

@keyframes text-gentle-float {
  0% { transform: rotate(-4deg) translateY(0); }
  100% { transform: rotate(-2.5deg) translateY(-6px); }
}

.handwritten-underline {
  width: 100%;
  height: 16px;
  display: block;
  margin-top: -2px;
  filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.9));
}

/* Blue Sparkle Twinkle Stars */
.blue-sparkle {
  position: absolute;
  color: #38bdf8;
  -webkit-text-fill-color: #38bdf8;
  filter: drop-shadow(0 0 8px #38bdf8) drop-shadow(0 0 14px #2563eb);
  pointer-events: none;
}

.star-1 {
  top: -14px;
  left: -18px;
  font-size: 1rem;
  animation: blue-twinkle-1 2.2s ease-in-out infinite alternate;
}

.star-2 {
  top: -10px;
  right: -8px;
  font-size: 0.9rem;
  animation: blue-twinkle-2 2.8s ease-in-out 0.6s infinite alternate;
}

.star-3 {
  bottom: 16px;
  right: -20px;
  font-size: 1.1rem;
  animation: blue-twinkle-1 2.5s ease-in-out 1.2s infinite alternate;
}

@keyframes blue-twinkle-1 {
  0% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.3) rotate(90deg); }
  100% { opacity: 0.4; transform: scale(0.7) rotate(180deg); }
}

@keyframes blue-twinkle-2 {
  0% { opacity: 0.3; transform: scale(0.7) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.35) rotate(-90deg); }
  100% { opacity: 0.3; transform: scale(0.7) rotate(-180deg); }
}

@media (max-width: 1024px) {
  .hero-title { font-size: 2.75rem; }
  .handwritten-overlay { right: 5%; top: 110px; }
  .handwritten-text { font-size: 1.85rem; }
}

@media (max-width: 768px) {
  .hero-section {
    min-height: auto;
    padding-top: 110px;
    padding-bottom: 50px;
  }
  .hero-bg-container {
    opacity: 0.25;
  }
  .hero-text-col {
    max-width: 100%;
  }
  .hero-title {
    font-size: 2.25rem;
  }
  .hero-cta-group {
    flex-direction: column;
    align-items: stretch;
  }
  .btn-primary-lg, .btn-secondary-lg {
    justify-content: center;
  }
  .hero-bullets {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.875rem;
  }
  .handwritten-overlay {
    display: none;
  }
}

/* Features Section */
.features-section {
  background-color: #f8fafc;
  padding: 5rem 0;
  position: relative;
}
.features-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 3.5rem;
  align-items: center;
}
.section-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}
.section-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
  margin-bottom: 1.25rem;
}
.text-blue-gradient {
  background: linear-gradient(90deg, #2563eb 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.features-desc {
  font-size: 1rem;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 2rem;
}
.btn-secondary-md {
  background: #ffffff;
  color: #2563eb;
  border: 1.5px solid #bfdbfe;
  padding: 0.75rem 1.75rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Features Right Column (Phone Mockup Grid) */
.features-grid-wrapper {
  display: grid;
  grid-template-columns: 1fr 1.25fr 1fr;
  gap: 1rem;
  align-items: center;
}
.cards-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.feature-mini-card {
  background: #ffffff;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.875rem;
}
.mini-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mini-card-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

/* Smartphone Mockup */
.phone-mockup-container {
  display: flex;
  justify-content: center;
}
.phone-frame {
  width: 230px;
  background: #0f172a;
  border-radius: 2.25rem;
  padding: 0.625rem;
  border: 4px solid #1e293b;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  position: relative;
}
.phone-notch {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 14px;
  background: #0f172a;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  z-index: 20;
}
.phone-screen {
  background: #f8fafc;
  border-radius: 1.75rem;
  padding: 1.5rem 0.75rem 0.75rem;
  color: #0f172a;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.app-logo-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.app-logo-k {
  width: 18px; height: 18px; background: #2563eb; color: #fff;
  border-radius: 4px; font-weight: 800; font-size: 10px;
  display: flex; align-items: center; justify-content: center;
}
.app-logo-text { font-size: 10px; font-weight: 800; }
.app-user-avatar { width: 14px; height: 14px; background: #cbd5e1; border-radius: 9999px; }
.app-greeting { font-size: 9px; color: #64748b; margin-bottom: 0.5rem; }
.app-balance-card {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  border-radius: 0.75rem;
  padding: 0.625rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
}
.balance-label { font-size: 8px; opacity: 0.8; }
.balance-amount { font-size: 13px; font-weight: 800; }
.balance-growth { font-size: 7px; background: rgba(255,255,255,0.2); display: inline-block; padding: 1px 4px; border-radius: 3px; margin-top: 3px; }
.app-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}
.stat-box { background: #ffffff; padding: 0.375rem; border-radius: 0.5rem; border: 1px solid #f1f5f9; }
.stat-lbl { font-size: 7px; color: #94a3b8; }
.stat-val { font-size: 10px; font-weight: 700; }
.quick-title { font-size: 8px; font-weight: 700; color: #475569; margin-bottom: 0.25rem; }
.quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.25rem; text-align: center; }
.quick-item { padding: 0.25rem; border-radius: 0.375rem; display: flex; flex-direction: column; align-items: center; font-size: 6px; font-weight: 600; }
.quick-item.blue { background: #eff6ff; color: #2563eb; }
.quick-item.purple { background: #f3e8ff; color: #9333ea; }
.quick-item.amber { background: #fef3c7; color: #d97706; }
.quick-item.indigo { background: #e0e7ff; color: #4f46e5; }
.app-bottom-nav {
  display: flex; justify-content: space-around; font-size: 6px; color: #94a3b8;
  padding-top: 0.375rem; border-top: 1px solid #e2e8f0; margin-top: 0.5rem;
}
.nav-btn.active { color: #2563eb; font-weight: 700; }

/* Pricing Section */
.pricing-section {
  padding: 6rem 0;
  background: #ffffff;
}
.pricing-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}
.pricing-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 4rem;
}
.text-center { text-align: center; }
.pricing-subtitle { font-size: 1.125rem; color: #475569; margin-top: 0.5rem; }
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  align-items: stretch;
}
.price-card {
  border-radius: 1.75rem;
  padding: 2.25rem;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.price-card.pro {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  position: relative;
  box-shadow: 0 20px 40px -10px rgba(37, 99, 235, 0.35);
  transform: translateY(-8px);
}
.badge-populer {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.6875rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}
.card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.card-icon {
  width: 46px; height: 46px; border-radius: 1rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.card-icon.blue { background: #eff6ff; color: #2563eb; }
.card-icon.white-trans { background: rgba(255, 255, 255, 0.2); color: #ffffff; }
.card-name { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
.card-name.text-white { color: #ffffff; }
.card-sub { font-size: 0.75rem; color: #64748b; }
.card-sub.text-blue-light { color: #bfdbfe; }
.card-price { margin-bottom: 1.5rem; }
.price-label { font-size: 0.75rem; color: #94a3b8; margin-bottom: 2px; }
.currency { font-size: 0.875rem; font-weight: 700; margin-right: 2px; }
.amount { font-size: 2.25rem; font-weight: 800; }
.period { font-size: 0.875rem; color: #64748b; }
.features-list { list-style: none; padding: 0; margin: 0 0 2rem; display: flex; flex-direction: column; gap: 0.875rem; }
.features-list li { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: #475569; font-weight: 500; }
.features-list.white li { color: #ffffff; }
.icon-check { width: 16px; height: 16px; flex-shrink: 0; }
.icon-check.blue { color: #2563eb; }
.btn-outline-blue {
  width: 100%;
  padding: 0.875rem;
  border-radius: 9999px;
  border: 1.5px solid #2563eb;
  color: #2563eb;
  background: transparent;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-solid-white {
  width: 100%;
  padding: 0.875rem;
  border-radius: 9999px;
  border: none;
  color: #2563eb;
  background: #ffffff;
  font-weight: 800;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Footer Section */
.footer-section {
  background-color: #0a1628;
  color: #94a3b8;
  padding: 5rem 0 2.5rem;
}
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr 1fr;
  gap: 3rem;
  margin-bottom: 4rem;
}
.footer-logo { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; }
.logo-box {
  width: 32px; height: 32px; background: #2563eb; color: white;
  border-radius: 8px; font-weight: 800; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
}
.logo-txt { font-size: 1.25rem; font-weight: 800; color: #ffffff; }
.text-blue-light { color: #60a5fa; }
.brand-tagline { font-size: 0.875rem; color: #94a3b8; line-height: 1.6; margin-bottom: 1rem; }
.copyright-text { font-size: 0.75rem; color: #475569; }
.col-title { color: #ffffff; font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; }
.footer-links, .footer-contact { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem; }
.footer-links a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
.footer-links a:hover { color: #ffffff; }
.footer-contact li { display: flex; align-items: flex-start; gap: 0.75rem; }
.icon-contact { width: 18px; height: 18px; color: #60a5fa; flex-shrink: 0; margin-top: 2px; }
.social-icons { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.social-btn {
  width: 36px; height: 36px; border-radius: 9999px; background: rgba(255, 255, 255, 0.08);
  display: flex; align-items: center; justify-content: center; color: white; text-decoration: none;
}
.social-btn:hover { background: #2563eb; }
.google-play-btn {
  display: flex; align-items: center; gap: 0.75rem;
  background: #0f172a; border: 1px solid #334155; padding: 0.5rem 1rem;
  border-radius: 0.75rem; color: white; cursor: pointer; text-align: left;
}
.gplay-icon { width: 22px; height: 22px; color: #34d399; }
.gplay-sub { font-size: 8px; color: #94a3b8; font-weight: 600; }
.gplay-main { font-size: 0.875rem; font-weight: 700; }
.footer-bottom {
  border-top: 1px solid #1e293b;
  padding-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #64748b;
}
.bottom-links { display: flex; gap: 1rem; }
.bottom-links a { color: #64748b; text-decoration: none; }
.bottom-links a:hover { color: #94a3b8; }

/* Responsive Media Queries */
@media (max-width: 1024px) {
  .hero-inner, .features-inner { grid-template-columns: 1fr; gap: 3rem; text-align: center; }
  .hero-title { font-size: 2.75rem; }
  .hero-subtitle { margin: 0 auto 2rem; }
  .hero-cta-group { justify-content: center; }
  .hero-bullets { justify-content: center; }
  .features-grid-wrapper { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .nav-links-desktop, .nav-cta-desktop { display: none; }
  .nav-mobile-btn, .nav-mobile-menu { display: block; }
  .hero-title { font-size: 2.25rem; }
  .pricing-grid { grid-template-columns: 1fr; max-width: 400px; }
  .footer-grid { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; gap: 1rem; text-align: center; }
}
</style>


