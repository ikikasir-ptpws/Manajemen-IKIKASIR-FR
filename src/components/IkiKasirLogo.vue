<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'horizontal' | 'icon' | 'vertical' | 'full'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showTagline?: boolean
  isDarkBg?: boolean
}>(), {
  variant: 'horizontal',
  size: 'md',
  showTagline: false,
  isDarkBg: false
})
</script>

<template>
  <div class="iki-logo" :class="[`iki-logo--${size}`, { 'is-dark': isDarkBg }]">
    <!-- Full Image Mode -->
    <template v-if="variant === 'full'">
      <img 
        src="/logo-transparent.png" 
        alt="IKI KASIR Logo" 
        class="iki-logo__img-full"
      />
    </template>

    <!-- Standard Icon + Text Mode -->
    <template v-else>
      <!-- Icon Image -->
      <div class="iki-logo__icon-wrapper" :class="`iki-logo__icon--${size}`">
        <img 
          src="/logo-icon.png" 
          alt="IKI KASIR" 
          class="iki-logo__img"
        />
      </div>

      <!-- Wordmark / Brand Text -->
      <div v-if="variant !== 'icon'" class="iki-logo__text-group">
        <div class="iki-logo__brand">
          <span class="iki-logo__brand-iki">IKI</span>
          <span class="iki-logo__brand-kasir">KASIR</span>
        </div>
        
        <!-- Subtitle / Tagline -->
        <span 
          v-if="showTagline" 
          class="iki-logo__tagline"
        >
          MUDA MEMBANGUN, BISNIS MAJU BERSAMA TEKNOLOGI
        </span>
      </div>
    </template>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');

.iki-logo {
  display: inline-flex;
  align-items: center;
  user-select: none;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  transition: transform 0.2s ease;
}
.iki-logo:hover {
  transform: translateY(-1px);
}

/* Size Variants */
.iki-logo--sm { gap: 8px; }
.iki-logo--md { gap: 10px; }
.iki-logo--lg { gap: 14px; }
.iki-logo--xl { gap: 18px; }

/* Icon sizing */
.iki-logo__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.iki-logo--sm .iki-logo__icon-wrapper { width: 28px; height: 28px; }
.iki-logo--md .iki-logo__icon-wrapper { width: 36px; height: 36px; }
.iki-logo--lg .iki-logo__icon-wrapper { width: 44px; height: 44px; }
.iki-logo--xl .iki-logo__icon-wrapper { width: 56px; height: 56px; }

.iki-logo__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(37, 99, 235, 0.15));
}

.iki-logo__img-full {
  height: 48px;
  width: auto;
  object-fit: contain;
}
.iki-logo--sm .iki-logo__img-full { height: 32px; }
.iki-logo--md .iki-logo__img-full { height: 44px; }
.iki-logo--lg .iki-logo__img-full { height: 56px; }

/* Text Group */
.iki-logo__text-group {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1;
}

.iki-logo__brand {
  display: flex;
  align-items: center;
  gap: 0.22em;
  font-weight: 900;
  letter-spacing: 0.05em;
  line-height: 1;
}

.iki-logo--sm .iki-logo__brand { font-size: 15px; }
.iki-logo--md .iki-logo__brand { font-size: 19px; }
.iki-logo--lg .iki-logo__brand { font-size: 24px; }
.iki-logo--xl .iki-logo__brand { font-size: 32px; }

/* IKI (Vibrant Royal Blue) */
.iki-logo__brand-iki {
  color: #2563eb;
}

/* KASIR (Dark Navy in light mode, White on dark background) */
.iki-logo__brand-kasir {
  color: #0f172a;
}
.iki-logo.is-dark .iki-logo__brand-kasir,
:root.dark .iki-logo__brand-kasir,
.dark .iki-logo__brand-kasir {
  color: #ffffff;
}

/* Tagline */
.iki-logo__tagline {
  font-size: 0.36em;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
  margin-top: 0.3em;
  text-transform: uppercase;
  white-space: nowrap;
}
.iki-logo.is-dark .iki-logo__tagline,
:root.dark .iki-logo__tagline,
.dark .iki-logo__tagline {
  color: #94a3b8;
}
</style>
