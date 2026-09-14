<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'horizontal' | 'icon' | 'full'
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}>(), {
  variant: 'horizontal',
  size: 'md',
  showTagline: true
})
</script>

<template>
  <div class="iki-logo" :class="[`iki-logo--${size}`]">
    <!-- Icon Mark -->
    <div class="iki-logo__icon" :class="`iki-logo__icon--${size}`">
      <img 
        src="/logo-icon.png" 
        alt="IKI KASIR" 
        class="iki-logo__img"
      />
    </div>

    <!-- Wordmark -->
    <div v-if="variant !== 'icon'" class="iki-logo__text">
      <div class="iki-logo__brand" :class="`iki-logo__brand--${size}`">
        <span class="iki-logo__iki">iki</span><span class="iki-logo__kasir">kasir</span>
      </div>
      
      <!-- Tagline -->
      <span 
        v-if="showTagline" 
        class="iki-logo__tagline"
        :class="`iki-logo__tagline--${size}`"
      >
        Muda Membangun, Bisnis Maju
      </span>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

.iki-logo {
  display: flex;
  align-items: center;
  user-select: none;
  transition: all 0.2s ease;
}

.iki-logo--sm { gap: 8px; }
.iki-logo--md { gap: 10px; }
.iki-logo--lg { gap: 12px; }

/* Icon */
.iki-logo__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.iki-logo:hover .iki-logo__icon {
  transform: scale(1.04);
}

.iki-logo__icon--sm { width: 30px; height: 30px; }
.iki-logo__icon--md { width: 38px; height: 38px; }
.iki-logo__icon--lg { width: 44px; height: 44px; }

.iki-logo__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(37, 99, 235, 0.12));
}

/* Text container */
.iki-logo__text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1;
}

/* Brand name */
.iki-logo__brand {
  font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif;
  display: flex;
  align-items: baseline;
  line-height: 1;
}

.iki-logo__brand--sm { font-size: 18px; }
.iki-logo__brand--md { font-size: 22px; }
.iki-logo__brand--lg { font-size: 26px; }

.iki-logo__iki {
  font-weight: 700;
  color: #2563EB;
  letter-spacing: -0.01em;
}

:root.dark .iki-logo__iki,
.dark .iki-logo__iki {
  color: #60A5FA;
}

.iki-logo__kasir {
  font-weight: 500;
  color: #334155;
  letter-spacing: 0.02em;
}

:root.dark .iki-logo__kasir,
.dark .iki-logo__kasir {
  color: #E2E8F0;
}

/* Tagline */
.iki-logo__tagline {
  font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif;
  font-weight: 400;
  color: #94A3B8;
  letter-spacing: 0.04em;
  line-height: 1;
  white-space: nowrap;
}

.iki-logo__tagline--sm { font-size: 8px; margin-top: 2px; }
.iki-logo__tagline--md { font-size: 9.5px; margin-top: 3px; }
.iki-logo__tagline--lg { font-size: 11px; margin-top: 4px; }

:root.dark .iki-logo__tagline,
.dark .iki-logo__tagline {
  color: #64748B;
}
</style>
