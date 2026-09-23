<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  src: string
  alt: string
  fadeDistance?: number
  parallaxFactor?: number
  maskStart?: number
}

const props = withDefaults(defineProps<Props>(), {
  fadeDistance: 400,
  parallaxFactor: 0.2,
  maskStart: 65,
})

const wrapperRef = ref<HTMLElement | null>(null)

// Hanya mask yang reaktif (bergantung pada prop). Opacity/transform ditulis
// langsung ke DOM supaya scroll tidak memicu re-render komponen tiap frame.
const maskStyle = computed(() => {
  const gradient = `linear-gradient(to bottom, black ${props.maskStart}%, transparent 100%)`
  return {
    WebkitMaskImage: gradient,
    maskImage: gradient,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  }
})

let rafId = 0
let active = false
let observer: IntersectionObserver | null = null
let mobileMq: MediaQueryList | null = null
let isMobile = false

// Nilai terakhir yang ditulis ke DOM, untuk melewati penulisan yang sia-sia
let lastOpacity = NaN
let lastY = NaN
let lastVisible: boolean | null = null

function update(): void {
  rafId = 0
  const el = wrapperRef.value
  if (!el) return

  const scrollY = window.scrollY
  const distance = Math.max(props.fadeDistance, 1)
  const opacity = Math.round((1 - Math.min(scrollY / distance, 1)) * 100) / 100
  const parallax = isMobile ? 0 : props.parallaxFactor
  const y = Math.round(-scrollY * parallax * 2) / 2 // kelipatan 0.5px

  if (opacity === lastOpacity && y === lastY) return

  const isVisible = opacity > 0
  lastOpacity = opacity
  lastY = y

  el.style.opacity = String(opacity)
  el.style.transform = `translate3d(0, ${y}px, 0)`

  // Reversible: kembali interaktif dan terlihat saat scroll naik.
  // Hanya ditulis saat status berubah (atau pada penulisan pertama).
  if (isVisible !== lastVisible) {
    lastVisible = isVisible
    el.style.pointerEvents = isVisible ? 'auto' : 'none'
    el.style.visibility = isVisible ? 'visible' : 'hidden'
  }
}

function onScroll(): void {
  if (!rafId) rafId = requestAnimationFrame(update)
}

function activate(): void {
  if (active) return
  active = true
  if (wrapperRef.value) wrapperRef.value.style.willChange = 'opacity, transform'
  update() // sinkronkan state sebelum listener menyala
  window.addEventListener('scroll', onScroll, { passive: true })
}

function deactivate(): void {
  if (!active) return
  active = false
  window.removeEventListener('scroll', onScroll)
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  // Lepas layer compositor saat hero di luar layar
  if (wrapperRef.value) wrapperRef.value.style.willChange = ''
}

function onMobileChange(e: MediaQueryListEvent): void {
  isMobile = e.matches
  lastY = NaN // paksa tulis ulang dengan faktor parallax baru
  if (active) update()
}

onMounted(() => {
  // Aman untuk Vitest/jsdom (tidak punya matchMedia maupun IntersectionObserver)
  const hasMatchMedia = typeof window.matchMedia === 'function'

  // Reduced motion: biarkan statis, tanpa listener dan tanpa observer
  if (hasMatchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  if (hasMatchMedia) {
    mobileMq = window.matchMedia('(max-width: 768px)')
    isMobile = mobileMq.matches
    mobileMq.addEventListener('change', onMobileChange)
  }

  // State awal (jaga-jaga halaman dimuat pada posisi scroll tengah)
  update()

  if (typeof IntersectionObserver === 'undefined' || !wrapperRef.value) {
    activate()
    return
  }

  // Bounding rect yang dipantau sudah memperhitungkan translateY, jadi
  // rootMargin tidak perlu diubah.
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry?.isIntersecting) activate()
    else deactivate()
  })
  observer.observe(wrapperRef.value)
})

onUnmounted(() => {
  deactivate()
  observer?.disconnect()
  observer = null
  mobileMq?.removeEventListener('change', onMobileChange)
  mobileMq = null
})
</script>

<template>
  <div ref="wrapperRef" class="hero-image" :style="maskStyle">
    <img :src="src" :alt="alt" class="hero-image__img" fetchpriority="high" decoding="async" />
  </div>
</template>

<style scoped>
.hero-image {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.hero-image__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  animation: hero-cinematic-zoom 7.5s ease-in-out infinite alternate;
  transform-origin: 75% 30%;
}

@keyframes hero-cinematic-zoom {
  0% {
    transform: scale(1) translate(0, 0);
  }
  100% {
    transform: scale(1.028) translate(-0.4%, -0.2%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-image__img {
    animation: none;
  }
}
</style>
