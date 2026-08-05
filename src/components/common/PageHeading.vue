<template>
  <div class="ct-heading">
    <h1 class="ct-heading__title">{{ title }}</h1>
    <div class="ct-heading__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
/** Shared page heading: keeps the three screens on the same rhythm. */
defineProps<{ title: string }>()
</script>

<style scoped>
.ct-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.ct-heading__title {
  font-family: var(--ct-font-display);
  font-size: 21px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.015em;
  color: var(--ct-ink);
  margin: 0;
}

.ct-heading__action {
  flex: none;
}
</style>
