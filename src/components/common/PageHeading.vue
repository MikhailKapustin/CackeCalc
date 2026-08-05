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
  gap: 10px 12px;
  flex-wrap: wrap;
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
  flex: 1 1 auto;
  min-width: 0;
}

.ct-heading__action {
  flex: 0 1 auto;
  min-width: 0;
}

/* На телефоне «Добавить ингредиент» и заголовок в одну строку не помещаются —
   и по-русски, и по-немецки. Кнопка уходит под заголовок во всю ширину: заодно
   получается крупная цель для пальца, а не обрезанная надпись. */
@media (max-width: 430px) {
  .ct-heading__action {
    flex: 1 0 100%;
  }

  .ct-heading__action :deep(.q-btn) {
    width: 100%;
  }
}
</style>
