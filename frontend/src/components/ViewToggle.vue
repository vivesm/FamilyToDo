<template>
  <div class="flex items-center bg-white/50 dark:bg-surface-dark/50 backdrop-blur-md rounded-full p-1 border border-neutral-200/30 dark:border-neutral-700/30">
    <button
      @click="taskStore.setViewMode('card')"
      class="view-toggle-btn"
      :class="{ 'view-toggle-active': taskStore.viewMode === 'card' }"
      title="Card View"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    </button>
    <button
      @click="taskStore.setViewMode('list')"
      class="view-toggle-btn"
      :class="{ 'view-toggle-active': taskStore.viewMode === 'list' }"
      title="List View"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { useTaskStore } from '@/stores/taskStore';

const taskStore = useTaskStore();
</script>

<style scoped>
.view-toggle-btn {
  @apply px-3 py-2 rounded-full text-gray-600 dark:text-gray-400 
         hover:bg-white/70 dark:hover:bg-surface-dark/70 transition-all duration-200 hover:scale-105;
}

.view-toggle-active {
  @apply bg-gradient-primary text-white shadow-soft;
}
</style>