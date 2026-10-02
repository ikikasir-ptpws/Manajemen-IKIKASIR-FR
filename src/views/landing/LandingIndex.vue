<script setup lang="ts">
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import {
  ArrowRight,
  Award,
  BarChart3,
  Box,
  Boxes,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  Grid,
  Headset,
  HelpCircle,
  Instagram,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  Play,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import HeroImage from "../../components/HeroImage.vue";
import IkiKasirLogo from "../../components/IkiKasirLogo.vue";
import RegistrationModal from "../../components/RegistrationModal.vue";
import { useAppData } from "../../composables/useAppData";
import bannerImg from "../../images/hero-banner-1.svg";
import phoneMockup from "../../images/phone-mockup.png";

const isMobileMenuOpen = ref(false);
const activeTab = ref("Beranda");

const openFaqIndex = ref<number | null>(0);

const toggleFaq = (index: number) => {
  openFaqIndex.value = openFaqIndex.value === index ? null : index;
};

const faqs = [
  {
    question: "Apakah IKI KASIR bisa digunakan secara gratis?",
    answer:
      "Ya, Anda dapat mengunduh dan mencoba IKI KASIR dengan masa uji coba gratis. Kami juga menyediakan berbagai pilihan paket berlangganan terjangkau yang dapat disesuaikan dengan kebutuhan bisnis Anda.",
  },
  {
    question: "Perangkat apa saja yang didukung oleh IKI KASIR?",
    answer:
      "Saat ini IKI KASIR dioptimalkan untuk smartphone dan tablet Android. Selain itu, Anda juga dapat mengakses dashboard manajemen bisnis & rekap laporan melalui web browser di laptop/PC.",
  },
  {
    question:
      "Apakah IKI KASIR tetap bisa digunakan tanpa koneksi internet (offline)?",
    answer:
      "Tentu saja! IKI KASIR dilengkapi dengan fitur mode offline. Transaksi kasir tetap berjalan lancar tanpa jaringan internet, dan data transaksi akan otomatis tersinkronisasi saat perangkat terhubung kembali.",
  },
  {
    question:
      "Apakah IKI KASIR bisa terhubung dengan printer thermal Bluetooth?",
    answer:
      "Sangat bisa! Aplikasi kami mendukung koneksi cepat ke berbagai merk printer thermal Bluetooth (ukuran 58mm & 80mm) untuk langsung mencetak struk belanja transaksi.",
  },
  {
    question: "Seberapa aman data penjualan dan stok barang toko saya?",
    answer:
      "Keamanan data Anda adalah prioritas utama kami. Seluruh data disimpankan di cloud server terenkripsi dengan sistem backup otomatis berkala untuk menjamin kerahasiaan dan keamanan data usaha Anda.",
  },
  {
    question:
      "Bagaimana cara menghubungi tim bantuan pelanggan (Customer Support)?",
    answer:
      "Tim Customer Support IKI KASIR siap melayani Anda 24/7. Anda dapat menghubungi kami melalui Live Chat WhatsApp, Email cs@ikikasir.id, maupun nomor telepon yang tersedia.",
  },
];

// Lenis Smooth Scroll Logic
let lenis: Lenis | null = null;
let lenisRafId: number | null = null;

let observer: IntersectionObserver | null = null;
let secObserver: IntersectionObserver | null = null;

function initScrollObserver() {
  const options = {
    root: null,
    rootMargin: "0px 0px 50px 0px",
    threshold: 0.05,
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.setAttribute("data-revealed", "true");
        entry.target.classList.add("is-revealed");
        if (observer) observer.unobserve(entry.target);
      }
    });
  }, options);

  const elements = document.querySelectorAll(
    ".reveal-up, .reveal-left, .reveal-right, .reveal-scale",
  );
  elements.forEach((el) => observer?.observe(el));
}

function initActiveSectionObserver() {
  const sections = document.querySelectorAll("section[id]");
  secObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          const foundNav = navLinks.find((l) => l.href === `#${id}`);
          if (foundNav) {
            activeTab.value = foundNav.name;
          }
        }
      });
    },
    { threshold: 0.3 },
  );

  sections.forEach((sec) => secObserver?.observe(sec));
}

const liveTrxNotifications = [
  { text: "🎉 Transaksi Baru: Rp 45.000 (Tunai)", time: "Baru saja" },
  { text: "✨ Stok Terupdate: Kopi Latte (Restok)", time: "1 mnt lalu" },
  { text: "⚡ Transaksi Baru: Rp 125.000 (QRIS)", time: "Baru saja" },
  { text: "🖨️ Struk Thermal Berhasil Dicetak", time: "2 mnt lalu" },
];
const activeNotificationIndex = ref(0);
const activeNotification = computed<{ text: string; time: string }>(() => {
  return (
    liveTrxNotifications[activeNotificationIndex.value] ??
    liveTrxNotifications[0] ?? { text: "🎉 Transaksi Baru", time: "Baru saja" }
  );
});
let notifTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  // Initialize Lenis
  lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  function raf(time: number) {
    if (lenis) {
      lenis.raf(time);
    }
    lenisRafId = requestAnimationFrame(raf);
  }
  lenisRafId = requestAnimationFrame(raf);

  setTimeout(() => {
    initScrollObserver();
    initActiveSectionObserver();
  }, 100);

  notifTimer = setInterval(() => {
    activeNotificationIndex.value =
      (activeNotificationIndex.value + 1) % liveTrxNotifications.length;
  }, 3500);
});

onUnmounted(() => {
  if (observer) observer.disconnect();
  if (secObserver) secObserver.disconnect();
  if (notifTimer) clearInterval(notifTimer);

  if (lenisRafId) cancelAnimationFrame(lenisRafId);
  if (lenis) lenis.destroy();
});

const navLinks = [
  { name: "Beranda", href: "#" },
  { name: "Tentang", href: "#tentang" },
  { name: "Fitur", href: "#fitur" },
  { name: "Paket", href: "#paket" },
  { name: "FAQ", href: "#faq" },
];

const leftFeatures = [
  {
    name: "Manajemen Produk",
    desc: "Katalog & varian barang",
    icon: Package,
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
  },
  {
    name: "Kategori Produk",
    desc: "Pengelompokan otomatis",
    icon: Grid,
    iconBg: "#f3e8ff",
    iconColor: "#9333ea",
  },
  {
    name: "Manajemen Stok",
    desc: "Pantau persediaan real-time",
    icon: Boxes,
    iconBg: "#ffedd5",
    iconColor: "#ea580c",
  },
  {
    name: "Kelola Promo",
    desc: "Diskon & penawaran khusus",
    icon: Tag,
    iconBg: "#fef9c3",
    iconColor: "#ca8a04",
  },
];

const rightFeatures = [
  {
    name: "Kasir Digital",
    desc: "POS & checkout cepat",
    icon: Calculator,
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
  },
  {
    name: "Transaksi Sales",
    desc: "Riwayat & bukti bayar",
    icon: Clock,
    iconBg: "#cff4fc",
    iconColor: "#0891b2",
  },
  {
    name: "Antrean Pesanan",
    desc: "Kelola pesanan pelanggan",
    icon: Users,
    iconBg: "#e0e7ff",
    iconColor: "#4f46e5",
  },
  {
    name: "Riwayat Antrean",
    desc: "Tracking & histori order",
    icon: ShoppingBag,
    iconBg: "#fae8ff",
    iconColor: "#c026d3",
  },
];

// Dynamic Pricing Plans Data Array
const { packages } = useAppData();

const pricingPlans = computed(() => {
  return packages.value
    .filter((p) => p.isActive)
    .map((p) => ({
      ...p,
      icon: p.icon === "Crown" ? Crown : Box,
    }));
});

// Registration Modal state
const isRegistrationModalOpen = ref(false);
const selectedPackageForReg = ref<string>("");

const openRegistrationModal = (pkgName?: string) => {
  if (pkgName) {
    selectedPackageForReg.value = pkgName;
  } else {
    selectedPackageForReg.value = pricingPlans.value[0]?.name || "";
  }
  isRegistrationModalOpen.value = true;
};
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
        <div class="nav-cta-desktop flex items-center gap-3">
          <RouterLink
            to="/login"
            class="btn-secondary-sm flex items-center gap-1.5 font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white transition-all"
          >
            <LogIn class="w-4 h-4 text-indigo-600" />
            <span>Masuk</span>
          </RouterLink>
          <button
            @click="openRegistrationModal()"
            class="btn-primary-sm cursor-pointer"
          >
            Mulai Langganan
            <ArrowRight class="icon-sm" />
          </button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="nav-mobile-btn"
        >
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
          @click="
            activeTab = link.name;
            isMobileMenuOpen = false;
          "
          :class="['mobile-nav-item', { active: activeTab === link.name }]"
        >
          {{ link.name }}
        </a>
        <RouterLink
          to="/login"
          @click="isMobileMenuOpen = false"
          class="btn-secondary-mobile flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 font-semibold text-slate-700 bg-slate-50"
        >
          <LogIn class="w-4 h-4 text-indigo-600" />
          <span>Masuk ke Akun</span>
        </RouterLink>
        <button
          @click="
            openRegistrationModal();
            isMobileMenuOpen = false;
          "
          class="btn-primary-mobile cursor-pointer"
        >
          Mulai Langganan
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <!-- Ambient Pulsing Soft Blue Glow -->
      <div class="ambient-glow-pulse"></div>

      <!-- Full Background Banner Image with Parallax Fade + Mask -->
      <HeroImage
        :src="bannerImg"
        alt="IKI KASIR Hero Banner"
        :fade-distance="400"
        :parallax-factor="0.1"
        :mask-start="90"
        object-position="right center"
      />
      <div class="hero-left-overlay"></div>

      <div class="hero-inner">
        <!-- Hero Right Column: Text & CTAs -->
        <div class="hero-text-col reveal-up">
          <div class="hero-badge">
            <span class="star-icon">✦</span>
            <span>Aplikasi Kasir Modern untuk Bisnis Anda</span>
          </div>

          <h1 class="hero-title">
            Kelola Transaksi<br />
            Lebih Mudah dengan<br />
            <span class="text-blue">IKI KASIR</span>
          </h1>

          <p class="hero-subtitle">
            Aplikasi kasir berbasis Android yang simpel, cepat, dan terpercaya
            untuk membantu bisnis Anda berjalan lebih efisien dan profesional.
          </p>

          <div class="hero-cta-group">
            <button
              @click="openRegistrationModal()"
              class="btn-primary-lg cursor-pointer"
            >
              Mulai Langganan
              <ArrowRight class="icon-md" />
            </button>
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

    <!-- About Section (Tentang Kami) -->
    <section id="tentang" class="about-section">
      <div class="about-inner">
        <div class="about-header text-center reveal-up">
          <div class="section-badge">Tentang Kami</div>
          <h2 class="section-title">
            Memberdayakan UMKM dengan<br />
            <span class="text-blue-gradient"
              >Teknologi Kasir Modern & Andal</span
            >
          </h2>
          <p class="about-subtitle">
            <strong>IKI KASIR</strong> hadir sebagai solusi pencatatan transaksi
            dan manajemen toko serba praktis yang dirancang khusus untuk
            mempermudah operasional para pelaku usaha di Indonesia.
          </p>
        </div>

        <!-- About Stats Grid -->
        <div class="about-stats-grid">
          <div class="stat-card reveal-up delay-100">
            <div class="stat-card-icon blue">
              <Users class="icon-md" />
            </div>
            <div class="stat-card-number">10.000+</div>
            <div class="stat-card-label">Pengguna Aktif</div>
            <p class="stat-card-sub">
              Pemilik bisnis memercayakan kasirnya pada IKI KASIR
            </p>
          </div>

          <div class="stat-card reveal-up delay-200">
            <div class="stat-card-icon indigo">
              <TrendingUp class="icon-md" />
            </div>
            <div class="stat-card-number">5 Juta+</div>
            <div class="stat-card-label">Transaksi Diproses</div>
            <p class="stat-card-sub">
              Transaksi cepat dan lancar tanpa kendala setiap hari
            </p>
          </div>

          <div class="stat-card reveal-up delay-300">
            <div class="stat-card-icon amber">
              <Award class="icon-md" />
            </div>
            <div class="stat-card-number">99.9%</div>
            <div class="stat-card-label">Uptime Sistem</div>
            <p class="stat-card-sub">
              Layanan stabil dan dapat diandalkan setiap saat
            </p>
          </div>

          <div class="stat-card reveal-up delay-400">
            <div class="stat-card-icon emerald">
              <ShieldCheck class="icon-md" />
            </div>
            <div class="stat-card-number">24/7</div>
            <div class="stat-card-label">Support Siap Bantuan</div>
            <p class="stat-card-sub">
              Tim bantuan teknis selalu siap merespon pertanyaan Anda
            </p>
          </div>
        </div>

        <!-- About Values Row -->
        <div class="about-values-wrapper">
          <div class="about-value-box reveal-left">
            <div class="value-badge">
              <Sparkles class="icon-xs" /> Visi Kami
            </div>
            <h3 class="value-title">Mendorong Digitalisasi UMKM Indonesia</h3>
            <p class="value-desc">
              Kami percaya setiap usaha, kecil maupun besar, berhak mendapatkan
              akses ke teknologi pengelolaan bisnis yang canggih, cepat, dan
              terjangkau tanpa kerumitan teknis.
            </p>
          </div>
          <div class="about-value-box highlight reveal-right">
            <div class="value-badge cyan">
              <CheckCircle2 class="icon-xs" /> Komitmen Kami
            </div>
            <h3 class="value-title">Simpel, Cepat & Selalu Bisa Diandalkan</h3>
            <p class="value-desc">
              Dengan antarmuka ramah pengguna dan fitur yang terus diinovasi,
              IKI KASIR memastikan operasional toko Anda berjalan tanpa hambatan
              dan laporan keuangan tersaji akurat.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section (Fitur Unggulan) -->
    <section id="fitur" class="features-section">
      <div class="features-inner">
        <!-- Left Column: Heading & Description -->
        <div class="features-text-col reveal-left">
          <div class="section-badge">Fitur Unggulan</div>

          <h2 class="section-title">
            Solusi Kasir Modern<br />
            untuk <span class="text-blue-gradient">Semua Jenis Bisnis</span>
          </h2>

          <p class="features-desc">
            <strong>IKI KASIR</strong> adalah aplikasi kasir yang dirancang
            untuk membantu Anda mengelola transaksi, produk, stok, serta laporan
            penjualan dengan lebih mudah dan efisien. Dengan tampilan yang
            simpel dan fitur lengkap, IKI KASIR cocok untuk berbagai jenis
            usaha, mulai dari kafe, toko retail, hingga bisnis kuliner.
          </p>

          <button class="btn-secondary-md">
            Pelajari Lebih Lanjut
            <ArrowRight class="icon-sm" />
          </button>
        </div>

        <!-- Right Column: Interactive Phone Mockup & Feature Cards -->
        <div class="features-visual-col reveal-right">
          <div class="features-grid-wrapper">
            <!-- Left Cards -->
            <div class="cards-column left-cards">
              <div
                v-for="(feat, idx) in leftFeatures"
                :key="idx"
                class="feature-mini-card"
              >
                <div
                  class="mini-card-icon"
                  :style="{
                    backgroundColor: feat.iconBg,
                    color: feat.iconColor,
                  }"
                >
                  <component :is="feat.icon" class="icon-sm" />
                </div>
                <div class="mini-card-text">
                  <span class="mini-card-label">{{ feat.name }}</span>
                  <span class="mini-card-desc">{{ feat.desc }}</span>
                </div>
              </div>
            </div>

            <!-- Center Smartphone Mockup -->
            <div class="phone-mockup-container">
              <div class="phone-glow-effect"></div>
              
              <!-- Floating Live Stats Badge Top-Left -->
              <div class="floating-badge badge-top-left">
                <div class="badge-icon-blue">
                  <TrendingUp class="icon-xs" />
                </div>
                <div class="badge-content">
                  <span class="badge-title">Penjualan Hari Ini</span>
                  <span class="badge-value">Rp 10.000.000 <small class="badge-tag">+5%</small></span>
                </div>
              </div>

              <!-- Floating Live Stats Badge Bottom-Right -->
              <div class="floating-badge badge-bottom-right">
                <div class="badge-pulse-dot"></div>
                <div class="badge-content">
                  <span class="badge-title">Ringkasan Hari Ini</span>
                  <span class="badge-value">1.320 <small class="badge-sub">Terjual</small></span>
                </div>
              </div>

              <img
                :src="phoneMockup"
                alt="IKI KASIR Tampilan HP"
                class="phone-mockup-img"
              />
            </div>

            <!-- Right Cards -->
            <div class="cards-column right-cards">
              <div
                v-for="(feat, idx) in rightFeatures"
                :key="idx"
                class="feature-mini-card"
              >
                <div
                  class="mini-card-icon"
                  :style="{
                    backgroundColor: feat.iconBg,
                    color: feat.iconColor,
                  }"
                >
                  <component :is="feat.icon" class="icon-sm" />
                </div>
                <div class="mini-card-text">
                  <span class="mini-card-label">{{ feat.name }}</span>
                  <span class="mini-card-desc">{{ feat.desc }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section (Paket Harga) -->
    <section id="paket" class="pricing-section">
      <div class="pricing-inner">
        <div class="pricing-header reveal-up">
          <div class="section-badge">Paket Harga</div>
          <h2 class="section-title text-center">
            Pilih Paket Sesuai Kebutuhan Bisnis Anda
          </h2>
          <p class="pricing-subtitle">
            Pilih paket Basic yang praktis atau paket Custom / IT One untuk
            kebutuhan fitur khusus bisnis Anda.
          </p>
        </div>

        <div class="pricing-grid">
          <div
            v-for="(plan, idx) in pricingPlans"
            :key="plan.id"
            :class="[plan.cardClass, 'reveal-up']"
            :style="{ '--reveal-delay': `${(idx + 1) * 0.1}s` }"
          >
            <div v-if="plan.badge" class="badge-populer">{{ plan.badge }}</div>
            <div>
              <div class="card-header">
                <div
                  :class="[
                    'card-icon',
                    plan.isConsultation ? 'white-trans' : 'blue',
                  ]"
                >
                  <component :is="plan.icon" class="icon-md" />
                </div>
                <div class="card-title-box">
                  <h3
                    :class="[
                      'card-name',
                      plan.isConsultation ? 'text-white' : '',
                    ]"
                  >
                    {{ plan.name }}
                  </h3>
                  <p
                    :class="[
                      'card-sub',
                      plan.isConsultation ? 'text-blue-light' : '',
                    ]"
                  >
                    {{ plan.cardSub }}
                  </p>
                </div>
              </div>

              <!-- Price Display (Nominal vs Consultation) -->
              <div v-if="!plan.isConsultation" class="card-price">
                <span class="currency">Rp</span>
                <span class="amount">{{
                  plan.price?.toLocaleString("id-ID")
                }}</span>
                <span class="period">{{ plan.period }}</span>
              </div>
              <div
                v-else
                class="card-price text-white flex flex-col items-start gap-1 py-2"
              >
                <span class="text-xl font-extrabold text-white">{{
                  plan.priceTitle
                }}</span>
                <span class="text-xs text-blue-light">{{
                  plan.priceSubtext
                }}</span>
              </div>

              <!-- Features List -->
              <ul
                :class="['features-list', plan.isConsultation ? 'white' : '']"
              >
                <li v-for="(feat, fIdx) in plan.features" :key="fIdx">
                  <Check
                    :class="[
                      'icon-check',
                      plan.isConsultation ? 'text-white' : 'blue',
                    ]"
                  />
                  <span>{{ feat }}</span>
                </li>
              </ul>
            </div>

            <!-- Action Button opening Registration Modal -->
            <button
              @click="openRegistrationModal(plan.name)"
              :class="[
                plan.btnClass,
                'cursor-pointer w-full text-center flex items-center justify-center gap-2',
              ]"
            >
              {{ plan.btnText }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="faq-section">
      <div class="faq-inner">
        <div class="faq-header text-center reveal-up">
          <div class="section-badge">FAQ & PERTANYAAN</div>
          <h2 class="section-title">Pertanyaan yang Sering Diajukan</h2>
          <p class="faq-subtitle">
            Punya pertanyaan seputar IKI KASIR? Temukan jawaban selengkapnya di
            bawah ini.
          </p>
        </div>

        <div class="faq-accordion-container">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="faq-item reveal-up"
            :style="{ '--reveal-delay': `${index * 0.08}s` }"
            :class="{ active: openFaqIndex === index }"
          >
            <button
              type="button"
              class="faq-question-btn"
              @click="toggleFaq(index)"
              :aria-expanded="openFaqIndex === index"
            >
              <div class="faq-q-left">
                <HelpCircle class="faq-q-icon" />
                <span class="faq-q-text">{{ faq.question }}</span>
              </div>
              <ChevronDown
                class="faq-arrow-icon"
                :class="{ rotate: openFaqIndex === index }"
              />
            </button>
            <div class="faq-answer-wrapper">
              <div class="faq-answer-inner">
                <div class="faq-answer-content">
                  <p>{{ faq.answer }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="faq-bottom-cta reveal-scale">
          <div class="faq-cta-box">
            <Headset class="cta-icon" />
            <div>
              <h4 class="cta-title">Masih punya pertanyaan lain?</h4>
              <p class="cta-desc">
                Tim Customer Support kami siap membantu Anda kapan saja.
              </p>
            </div>
            <a
              href="https://wa.me/6289571051221?text=Halo%20tim%20IKI%20KASIR,%20saya%20ingin%20konsultasi%20mengenai%20aplikasi%20kasir"
              target="_blank"
              class="btn-primary-sm cursor-pointer"
            >
              Hubungi Support
              <ArrowRight class="icon-xs" />
            </a>
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
              <IkiKasirLogo size="lg" :is-dark-bg="true" :show-tagline="true" />
            </div>
            <p class="brand-tagline">
              Solusi Kasir Digital Terpercaya<br />untuk Memajukan Bisnis Anda.
            </p>
            <div class="copyright-text">
              © 2025IKI KASIR. All rights reserved.
            </div>
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
              <li>
                <a
                  href="https://wa.me/6289571051221"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone class="icon-contact" />
                  <span>0895710512221</span>
                </a>
              </li>
              <li>
                <a href="mailto:ikikasir.id@gmail.com">
                  <Mail class="icon-contact" />
                  <span>ikikasir.id@gmail.com</span>
                </a>
              </li>
              <li>
                <MapPin class="icon-contact" />
                <span
                  >Jalan Raya Wonosari<br />RT.003 RW.002<br />Gondang Wetan<br />Kab.
                  Pasuruan 67174</span
                >
              </li>
            </ul>
          </div>

          <div class="footer-col">
            <h4 class="col-title">Ikuti Kami</h4>
            <div class="social-icons">
              <a
                href="https://www.instagram.com/iki_kasir?stkn=d242OG96YnRrdmN1"
                target="_blank"
                rel="noopener noreferrer"
                class="social-btn"
                title="Instagram"
              >
                <Instagram class="icon-sm" />
              </a>
              <a
                href="https://www.tiktok.com/@ptpws.id?_r=1&_t=ZS-9A6IAEMGN0O"
                target="_blank"
                rel="noopener noreferrer"
                class="social-btn"
                title="TikTok"
              >
                <svg viewBox="0 0 24 24" class="icon-sm fill-current">
                  <path
                    d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
                  />
                </svg>
              </a>
              <a
                href="https://wa.me/6289571051221"
                target="_blank"
                rel="noopener noreferrer"
                class="social-btn"
                title="WhatsApp"
              >
                <svg viewBox="0 0 24 24" class="icon-sm fill-current">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 IKI KASIR. All rights reserved.</p>
          <div class="bottom-links">
            <a href="#">Syarat & Ketentuan</a>
            <span>|</span>
            <a href="#">Kebijakan Privasi</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Website Self-Registration Modal -->
    <RegistrationModal
      :is-open="isRegistrationModalOpen"
      :default-package="selectedPackageForReg"
      @close="isRegistrationModalOpen = false"
    />
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap");

/* Reset & Root Scoped Styles */
.landing-page-root {
  font-family:
    "Plus Jakarta Sans",
    system-ui,
    -apple-system,
    sans-serif;
  background-color: #ffffff;
  color: #0f172a;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Icons Sizes */
.icon-xs {
  width: 14px;
  height: 14px;
}
.icon-sm {
  width: 18px;
  height: 18px;
}
.icon-md {
  width: 22px;
  height: 22px;
}

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
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 4px 24px rgba(37, 99, 235, 0.07),
    0 1px 6px rgba(139, 92, 246, 0.05);
  z-index: 100;
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 52px; /* compact — 48–52px like premium SaaS */
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
  font-size: 0.6875rem; /* ~11px */
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
  background: rgba(56, 189, 248, 0.9);
  border-radius: 9999px;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.6);
}

/* CTA button — tiny pill, stays fully inside canvas */
.btn-primary-sm {
  background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%);
  color: #ffffff !important;
  padding: 0.3rem 0.9rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.65rem; /* ~10.5px */
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 2px 12px rgba(37, 99, 235, 0.4),
    0 0 16px rgba(56, 189, 248, 0.12);
  transition: all 0.18s ease;
  flex-shrink: 0;
}
.btn-primary-sm:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(37, 99, 235, 0.5);
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
  background: rgba(8, 20, 50, 0.9);
  backdrop-filter: blur(18px);
  padding: 0.75rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.mobile-nav-item {
  display: block;
  padding: 0.6rem 0;
  font-weight: 600;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
}
.mobile-nav-item.active {
  color: #38bdf8;
  font-weight: 700;
}
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

/* Hero Section */
.hero-section {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-color: #eaf3fd;
  padding-top: 100px;
  padding-bottom: 40px;
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
  background: radial-gradient(
    circle,
    rgba(56, 189, 248, 0.25) 0%,
    rgba(37, 99, 235, 0.08) 50%,
    transparent 70%
  );
  filter: blur(50px);
  z-index: 1;
  animation: ambient-pulse 7s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes ambient-pulse {
  0% {
    opacity: 0.45;
    transform: scale(1);
  }
  100% {
    opacity: 0.85;
    transform: scale(1.15);
  }
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

/* Left side gradient overlay for high text contrast */
.hero-left-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    to right,
    rgba(244, 249, 255, 0.98) 0%,
    rgba(244, 249, 255, 0.75) 55%,
    rgba(244, 249, 255, 0) 100%
  );
  pointer-events: none;
  z-index: 2;
}

@media (max-width: 991px) {
  .hero-left-overlay {
    width: 100%;
    background: linear-gradient(
      to bottom,
      rgba(244, 249, 255, 0.85) 0%,
      rgba(244, 249, 255, 0.98) 100%
    );
  }
  .hero-inner {
    justify-content: center !important;
  }
  .hero-text-col {
    text-align: center;
    margin: 0 auto;
  }
  .hero-cta-group {
    justify-content: center;
  }
  .hero-bullets {
    justify-content: center;
    flex-wrap: wrap;
  }
}

.hero-inner {
  position: relative;
  z-index: 10;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: flex-start;
}

.hero-text-col {
  max-width: 580px;
  width: 100%;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.2);
  color: #1d4ed8;
  padding: 0.35rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}
.star-icon {
  color: #2563eb;
  font-size: 0.875rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.15;
  color: #0f172a;
  margin-bottom: 1.25rem;
  letter-spacing: -0.02em;
  text-shadow: none;
}
.text-blue {
  color: #2563eb;
  font-weight: 800;
}
.text-sky {
  color: #0284c7;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: #334155;
  font-weight: 500;
  line-height: 1.65;
  max-width: 520px;
  margin-bottom: 2.25rem;
  text-shadow: none;
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
  color: #1e40af;
  border: 1.5px solid #60a5fa;
  padding: 0.75rem 1.875rem 0.75rem 1rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
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
  font-weight: 700;
  color: #1e293b;
  text-shadow: none;
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
  font-family: "Caveat", cursive;
  font-size: 2.15rem;
  font-weight: 700;
  line-height: 1.1;
  position: relative;
  display: inline-block;
  text-align: left;

  /* Bright Electric Cyan & White Shimmering Gradient */
  background: linear-gradient(
    115deg,
    #ffffff 0%,
    #e0f2fe 25%,
    #38bdf8 55%,
    #7dd3fc 85%,
    #ffffff 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* Bright Cyan Glow & High Contrast Shadow */
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.65))
    drop-shadow(0 0 14px rgba(56, 189, 248, 0.9));

  animation:
    text-gentle-float 5s ease-in-out infinite alternate,
    text-blue-shimmer 3s linear infinite;
}

@keyframes text-blue-shimmer {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes text-gentle-float {
  0% {
    transform: rotate(-4deg) translateY(0);
  }
  100% {
    transform: rotate(-2.5deg) translateY(-6px);
  }
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
  0% {
    opacity: 0.2;
    transform: scale(0.6) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.3) rotate(90deg);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.7) rotate(180deg);
  }
}

@keyframes blue-twinkle-2 {
  0% {
    opacity: 0.3;
    transform: scale(0.7) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.35) rotate(-90deg);
  }
  100% {
    opacity: 0.3;
    transform: scale(0.7) rotate(-180deg);
  }
}

@media (max-width: 1024px) {
  .hero-title {
    font-size: 2.75rem;
  }
  .handwritten-overlay {
    right: 5%;
    top: 110px;
  }
  .handwritten-text {
    font-size: 1.85rem;
  }
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
  .btn-primary-lg,
  .btn-secondary-lg {
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
  grid-template-columns: 1.05fr 1.35fr 1.05fr;
  gap: 1.25rem;
  align-items: center;
}
.cards-column {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.feature-mini-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0.875rem 1.125rem;
  border-radius: 1.125rem;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 4px rgba(15, 23, 42, 0.02);
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  gap: 0.875rem;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.feature-mini-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #2563eb, #9333ea);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.feature-mini-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 14px 28px -4px rgba(37, 99, 235, 0.14), 0 4px 10px rgba(0, 0, 0, 0.03);
  border-color: rgba(147, 51, 234, 0.25);
  background: #ffffff;
}
.feature-mini-card:hover::before {
  opacity: 1;
}
.mini-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}
.feature-mini-card:hover .mini-card-icon {
  transform: scale(1.1) rotate(-4deg);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}
.mini-card-text {
  display: flex;
  flex-direction: column;
}
.mini-card-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.25;
}
.mini-card-desc {
  font-size: 0.735rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 0.125rem;
}

/* Smartphone Mockup & Animations */
.phone-mockup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 2.5rem 0.5rem;
}
.phone-glow-effect {
  position: absolute;
  width: 270px;
  height: 460px;
  background: radial-gradient(
    circle,
    rgba(37, 99, 235, 0.22) 0%,
    rgba(147, 51, 234, 0.14) 50%,
    transparent 75%
  );
  filter: blur(40px);
  border-radius: 50%;
  z-index: 1;
  animation: glowPulse 6s ease-in-out infinite;
}
.phone-mockup-img {
  width: 100%;
  max-width: 275px;
  height: auto;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 25px 35px rgba(15, 23, 42, 0.25));
  animation: phoneFloat 5s ease-in-out infinite;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
  border-radius: 36px;
}
.phone-mockup-img:hover {
  transform: scale(1.03) translateY(-8px);
  filter: drop-shadow(0 35px 45px rgba(37, 99, 235, 0.35));
}

/* Floating Live Badges */
.floating-badge {
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0.625rem 0.875rem;
  border-radius: 1rem;
  box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(226, 232, 240, 0.9);
  pointer-events: none;
  transition: all 0.3s ease;
}
.badge-top-left {
  top: -20px;
  left: -35px;
  animation: badgeFloatTop 4s ease-in-out infinite;
}
.badge-bottom-right {
  bottom: -20px;
  right: -35px;
  animation: badgeFloatBottom 4.5s ease-in-out infinite;
}
.badge-icon-blue {
  width: 32px;
  height: 32px;
  border-radius: 0.625rem;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.badge-pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25);
  animation: pulseDot 2s infinite;
  flex-shrink: 0;
}
.badge-content {
  display: flex;
  flex-direction: column;
}
.badge-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.badge-value {
  font-size: 0.8125rem;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.badge-tag {
  background: #dcfce7;
  color: #16a34a;
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
  font-weight: 700;
}
.badge-sub {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Keyframe Animations */
@keyframes phoneFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
@keyframes glowPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.08);
  }
}
@keyframes badgeFloatTop {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}
@keyframes badgeFloatBottom {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(6px);
  }
}
@keyframes pulseDot {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
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
  width: 18px;
  height: 18px;
  background: #2563eb;
  color: #fff;
  border-radius: 4px;
  font-weight: 800;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.app-logo-text {
  font-size: 10px;
  font-weight: 800;
}
.app-user-avatar {
  width: 14px;
  height: 14px;
  background: #cbd5e1;
  border-radius: 9999px;
}
.app-greeting {
  font-size: 9px;
  color: #64748b;
  margin-bottom: 0.5rem;
}
.app-balance-card {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  border-radius: 0.75rem;
  padding: 0.625rem;
  color: #ffffff;
  margin-bottom: 0.5rem;
}
.balance-label {
  font-size: 8px;
  opacity: 0.8;
}
.balance-amount {
  font-size: 13px;
  font-weight: 800;
}
.balance-growth {
  font-size: 7px;
  background: rgba(255, 255, 255, 0.2);
  display: inline-block;
  padding: 1px 4px;
  border-radius: 3px;
  margin-top: 3px;
}
.app-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}
.stat-box {
  background: #ffffff;
  padding: 0.375rem;
  border-radius: 0.5rem;
  border: 1px solid #f1f5f9;
}
.stat-lbl {
  font-size: 7px;
  color: #94a3b8;
}
.stat-val {
  font-size: 10px;
  font-weight: 700;
}
.quick-title {
  font-size: 8px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.25rem;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
  text-align: center;
}
.quick-item {
  padding: 0.25rem;
  border-radius: 0.375rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 6px;
  font-weight: 600;
}
.quick-item.blue {
  background: #eff6ff;
  color: #2563eb;
}
.quick-item.purple {
  background: #f3e8ff;
  color: #9333ea;
}
.quick-item.amber {
  background: #fef3c7;
  color: #d97706;
}
.quick-item.indigo {
  background: #e0e7ff;
  color: #4f46e5;
}
.app-bottom-nav {
  display: flex;
  justify-content: space-around;
  font-size: 6px;
  color: #94a3b8;
  padding-top: 0.375rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 0.5rem;
}
.nav-btn.active {
  color: #2563eb;
  font-weight: 700;
}

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
.text-center {
  text-align: center;
}
.pricing-subtitle {
  font-size: 1.125rem;
  color: #475569;
  margin-top: 0.5rem;
}
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 860px;
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
  position: relative;
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
  top: 1.25rem;
  right: 1.25rem;
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 5;
}
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-right: 2rem;
}
.card-icon {
  width: 46px;
  height: 46px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}
.card-icon.white-trans {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}
.card-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}
.card-name.text-white {
  color: #ffffff;
}
.card-sub {
  font-size: 0.75rem;
  color: #64748b;
}
.card-sub.text-blue-light {
  color: #bfdbfe;
}
.card-price {
  margin-bottom: 1.5rem;
}
.price-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 2px;
}
.currency {
  font-size: 0.875rem;
  font-weight: 700;
  margin-right: 2px;
}
.amount {
  font-size: 2.25rem;
  font-weight: 800;
}
.period {
  font-size: 0.875rem;
  color: #64748b;
}
.features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.features-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}
.features-list.white li {
  color: #ffffff;
}
.icon-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.icon-check.blue {
  color: #2563eb;
}
.btn-outline-blue {
  width: 100%;
  padding: 0.875rem;
  border-radius: 9999px;
  border: 1.5px solid #2563eb;
  color: #2563eb !important;
  background: transparent;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.btn-outline-blue:hover {
  background: #eff6ff;
  border-color: #1d4ed8;
  transform: translateY(-1px);
}
.btn-solid-white {
  width: 100%;
  padding: 0.875rem;
  border-radius: 9999px;
  border: none;
  color: #2563eb !important;
  background: #ffffff;
  font-weight: 800;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.btn-solid-white:hover {
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
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
.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}
.logo-box {
  width: 32px;
  height: 32px;
  background: #2563eb;
  color: white;
  border-radius: 8px;
  font-weight: 800;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-txt {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
}
.text-blue-light {
  color: #60a5fa;
}
.brand-tagline {
  font-size: 0.875rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 1rem;
}
.copyright-text {
  font-size: 0.75rem;
  color: #475569;
}
.col-title {
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}
.footer-links,
.footer-contact {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.875rem;
}
.footer-links a {
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-links a:hover {
  color: #ffffff;
}
.footer-contact li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.footer-contact a {
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.footer-contact a:hover {
  color: #ffffff;
}
.icon-contact {
  width: 18px;
  height: 18px;
  color: #60a5fa;
  flex-shrink: 0;
  margin-top: 2px;
}
.social-icons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.social-btn {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-decoration: none;
}
.social-btn:hover {
  background: #2563eb;
}
.google-play-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #0f172a;
  border: 1px solid #334155;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  color: white;
  cursor: pointer;
  text-align: left;
}
.gplay-icon {
  width: 22px;
  height: 22px;
  color: #34d399;
}
.gplay-sub {
  font-size: 8px;
  color: #94a3b8;
  font-weight: 600;
}
.gplay-main {
  font-size: 0.875rem;
  font-weight: 700;
}
.footer-bottom {
  border-top: 1px solid #1e293b;
  padding-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #64748b;
}
.bottom-links {
  display: flex;
  gap: 1rem;
}
.bottom-links a {
  color: #64748b;
  text-decoration: none;
}
.bottom-links a:hover {
  color: #94a3b8;
}

/* ─────────────────────────────────────────────
   ABOUT SECTION (Tentang Kami)
   ───────────────────────────────────────────── */
.about-section {
  padding: 6rem 0;
  background-color: #ffffff;
  position: relative;
  border-bottom: 1px solid #f1f5f9;
}
.about-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}
.about-header {
  max-width: 720px;
  margin: 0 auto 3.5rem;
}
.about-subtitle {
  font-size: 1.05rem;
  color: #475569;
  line-height: 1.7;
  margin-top: 1rem;
}
.about-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 3.5rem;
}
.stat-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  padding: 1.75rem 1.25rem;
  text-align: center;
  transition: all 0.25s ease;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(37, 99, 235, 0.1);
  border-color: #bfdbfe;
  background: #ffffff;
}
.stat-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 0.875rem;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-card-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}
.stat-card-icon.indigo {
  background: #e0e7ff;
  color: #4f46e5;
}
.stat-card-icon.amber {
  background: #fef3c7;
  color: #d97706;
}
.stat-card-icon.emerald {
  background: #d1fae5;
  color: #059669;
}

.stat-card-number {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}
.stat-card-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 0.5rem;
}
.stat-card-sub {
  font-size: 0.775rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0;
}

.about-values-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
}
.about-value-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  padding: 2.25rem;
}
.about-value-box.highlight {
  background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
  border-color: #bae6fd;
}
.value-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 1rem;
}
.value-badge.cyan {
  background: #e0f2fe;
  color: #0284c7;
}
.value-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.75rem;
}
.value-desc {
  font-size: 0.925rem;
  color: #475569;
  line-height: 1.65;
  margin: 0;
}

/* ─────────────────────────────────────────────
   FAQ SECTION
   ───────────────────────────────────────────── */
.faq-section {
  padding: 6rem 0;
  background-color: #f8fafc;
  position: relative;
}
.faq-inner {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
}
.faq-header {
  margin-bottom: 3.5rem;
}
.faq-subtitle {
  font-size: 1.05rem;
  color: #475569;
  margin-top: 0.5rem;
}
.faq-accordion-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3.5rem;
}
.faq-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  overflow: hidden;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}
.faq-item:hover {
  border-color: #bfdbfe;
}
.faq-item.active {
  border-color: #2563eb;
  box-shadow: 0 8px 24px -4px rgba(37, 99, 235, 0.15);
}
.faq-question-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  gap: 1rem;
  user-select: none;
}
.faq-q-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}
.faq-q-icon {
  width: 22px;
  height: 22px;
  color: #2563eb;
  flex-shrink: 0;
}
.faq-q-text {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}
.faq-arrow-icon {
  width: 20px;
  height: 20px;
  color: #64748b;
  transition:
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    color 0.25s ease;
  flex-shrink: 0;
}
.faq-arrow-icon.rotate {
  transform: rotate(180deg);
  color: #2563eb;
}

/* Accordion Smooth Expand/Collapse */
.faq-answer-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition:
    grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.3s ease;
  opacity: 0;
}
.faq-item.active .faq-answer-wrapper {
  grid-template-rows: 1fr;
  opacity: 1;
}
.faq-answer-inner {
  overflow: hidden;
}
.faq-answer-content {
  padding: 0 1.5rem 1.35rem 3.35rem;
  color: #475569;
  font-size: 0.925rem;
  line-height: 1.65;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}
.faq-answer-content p {
  margin: 0;
}

/* FAQ Bottom CTA Box */
.faq-bottom-cta {
  display: flex;
  justify-content: center;
}
.faq-cta-box {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #ffffff;
  padding: 1.5rem 2rem;
  border-radius: 1.25rem;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
  width: 100%;
}
.cta-icon {
  width: 36px;
  height: 36px;
  color: #38bdf8;
  flex-shrink: 0;
}
.cta-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: #ffffff;
}
.cta-desc {
  font-size: 0.825rem;
  color: #94a3b8;
  margin: 0;
}

/* ─────────────────────────────────────────────
   SCROLL REVEAL ANIMATIONS
   ───────────────────────────────────────────── */
.reveal-up {
  opacity: 0;
  transform: translateY(45px);
  transition:
    opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) var(--reveal-delay, 0s),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) var(--reveal-delay, 0s);
  will-change: opacity, transform;
}

.reveal-left {
  opacity: 0;
  transform: translateX(-45px);
  transition:
    opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.reveal-right {
  opacity: 0;
  transform: translateX(45px);
  transition:
    opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.reveal-scale {
  opacity: 0;
  transform: scale(0.9);
  transition:
    opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.reveal-up[data-revealed="true"],
.reveal-left[data-revealed="true"],
.reveal-right[data-revealed="true"],
.reveal-scale[data-revealed="true"],
.is-revealed {
  opacity: 1 !important;
  transform: translateY(0) translateX(0) scale(1) !important;
}

/* Stagger Delay Helpers */
.delay-100 {
  transition-delay: 0.1s !important;
}
.delay-200 {
  transition-delay: 0.2s !important;
}
.delay-300 {
  transition-delay: 0.3s !important;
}
.delay-400 {
  transition-delay: 0.4s !important;
}
.delay-500 {
  transition-delay: 0.5s !important;
}

/* ─────────────────────────────────────────────
   FLOATING GLASS LEVITATION BADGES
   ───────────────────────────────────────────── */
.floating-badge {
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1.1rem;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 9999px;
  box-shadow:
    0 10px 28px -6px rgba(37, 99, 235, 0.18),
    0 2px 8px rgba(0, 0, 0, 0.04);
  pointer-events: none;
}
.badge-left {
  top: 90px;
  left: 52%;
}
.badge-right {
  bottom: 90px;
  right: 10%;
}
.badge-icon-bg {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.badge-icon-bg.blue {
  background: #dbeafe;
  color: #2563eb;
}
.badge-icon-bg.emerald {
  background: #d1fae5;
  color: #059669;
}

.badge-txt-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}
.badge-txt-sub {
  font-size: 0.6875rem;
  color: #64748b;
  font-weight: 600;
}

.floating-anim-1 {
  animation: float-levitate-1 4.5s ease-in-out infinite alternate;
}
.floating-anim-2 {
  animation: float-levitate-2 5.2s ease-in-out 0.8s infinite alternate;
}

@keyframes float-levitate-1 {
  0% {
    transform: translateY(0px) rotate(0deg);
  }
  100% {
    transform: translateY(-12px) rotate(-1.5deg);
  }
}
@keyframes float-levitate-2 {
  0% {
    transform: translateY(0px) rotate(0deg);
  }
  100% {
    transform: translateY(-15px) rotate(2deg);
  }
}

/* ─────────────────────────────────────────────
   INFINITE RUNNING MARQUEE TICKER BANNER
   ───────────────────────────────────────────── */
.marquee-section {
  width: 100%;
  background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #ffffff;
  padding: 0.9rem 0;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
  border-y: 1px solid rgba(255, 255, 255, 0.08);
}
.marquee-track {
  display: flex;
  width: max-content;
  gap: 2rem;
}
.marquee-content {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  animation: marquee-scroll 28s linear infinite;
  white-space: nowrap;
}
.marquee-item {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #e2e8f0;
  letter-spacing: 0.02em;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* ─────────────────────────────────────────────
   SMARTPHONE LIVE TOAST POPUP
   ───────────────────────────────────────────── */
.phone-live-toast {
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(8px);
  color: #ffffff;
  border-radius: 0.5rem;
  padding: 0.35rem 0.6rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.toast-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 6px #34d399;
  animation: pulse-dot 1.5s infinite;
  flex-shrink: 0;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}
.toast-live-txt {
  font-size: 7.5px;
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.35s ease;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.95);
}

/* Responsive Media Queries */
@media (max-width: 1024px) {
  .floating-badge {
    display: none;
  }
  .hero-inner,
  .features-inner {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
  }
  .hero-title {
    font-size: 2.75rem;
  }
  .hero-subtitle {
    margin: 0 auto 2rem;
  }
  .hero-cta-group {
    justify-content: center;
  }
  .hero-bullets {
    justify-content: center;
  }
  .features-grid-wrapper {
    grid-template-columns: 1fr;
  }
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
  .about-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .nav-links-desktop,
  .nav-cta-desktop {
    display: none;
  }
  .nav-mobile-btn,
  .nav-mobile-menu {
    display: block;
  }
  .hero-title {
    font-size: 2.25rem;
  }
  .pricing-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
  .footer-grid {
    grid-template-columns: 1fr;
  }
  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  .about-stats-grid {
    grid-template-columns: 1fr;
  }
  .about-values-wrapper {
    grid-template-columns: 1fr;
  }
  .faq-answer-content {
    padding-left: 1.5rem;
  }
  .faq-cta-box {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}
</style>
