<template>
  <div
    v-if="adsStore.shouldShowAds && adsStore.isBannerVisible"
    class="ad-banner-placeholder"
    data-test="ad-banner-placeholder"
  >
    <!-- Placeholder для баннера AdMob -->
    <!-- Реальная реклама отображается нативно поверх WebView -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAdsStore } from '@/stores/ads'

const adsStore = useAdsStore()

onMounted(async () => {
  if (adsStore.shouldShowAds && !adsStore.isBannerVisible) {
    try {
      await adsStore.showBanner()
    } catch (error) {
      console.error('Failed to show ad banner:', error)
    }
  }
})

onUnmounted(async () => {
  if (adsStore.isBannerVisible) {
    try {
      await adsStore.hideBanner()
    } catch (error) {
      console.error('Failed to hide ad banner:', error)
    }
  }
})
</script>

<style scoped>
.ad-banner-placeholder {
  height: 50px; /* Резерв места под баннер */
  background: transparent;
  flex-shrink: 0;
}
</style>
