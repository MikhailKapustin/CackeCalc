<template>
  <div id="q-app">
    <QLayout view="lHh Lpr lFf">
      <QHeader elevated>
        <QToolbar>
          <QToolbarTitle>
            CakeCost - Калькулятор себестоимости
          </QToolbarTitle>
        </QToolbar>
      </QHeader>

      <QPageContainer>
        <IngredientsPage />
      </QPageContainer>
    </QLayout>
  </div>
</template>

<script setup lang="ts">
import IngredientsPage from '@/pages/IngredientsPage.vue'
</script>
