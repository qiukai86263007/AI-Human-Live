<script setup lang="ts">
  import { onBeforeMount, onMounted, ref } from 'vue';
  import Router from '../router';
  import { AppConfig } from '../config';

  const loading = ref(true);

  onMounted(async () => {
    loading.value = false;
  });

  onBeforeMount(() => {
    Router.push('/live');
  });
</script>

<template>
  <div class="app-container scale-110">
    <router-view></router-view>
  </div>
</template>

<style scoped>
  .app-container {
    height: 100vh;
    width: 100vw;
    transform-origin: top left;
  }
</style>
