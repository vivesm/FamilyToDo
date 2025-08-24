<template>
  <div id="app" class="min-h-screen bg-neutral-50 dark:bg-neutral-950 safe-top safe-bottom">
    <!-- Dark mode toggle button -->
    <button
      @click="toggleDarkMode"
      class="fixed bottom-4 left-4 z-50 p-3 rounded-2xl bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-110 border border-neutral-200/50 dark:border-neutral-700/50"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <!-- Sun icon for light mode -->
      <svg v-if="isDark" class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <!-- Moon icon for dark mode -->
      <svg v-else class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { usePeopleStore } from '@/stores/peopleStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { initSocket, disconnectSocket } from '@/services/socket';
import { useDarkMode } from '@/composables/useDarkMode';

const taskStore = useTaskStore();
const peopleStore = usePeopleStore();
const categoryStore = useCategoryStore();

// Initialize dark mode
const { isDark, toggleDarkMode } = useDarkMode();

onMounted(async () => {
  // Initialize socket connection
  initSocket();
  
  // Load initial data
  await Promise.all([
    peopleStore.fetchPeople(),
    categoryStore.fetchCategories(),
    taskStore.fetchTasks()
  ]);
});

onUnmounted(() => {
  // Clean up socket connection on app unmount
  disconnectSocket();
});
</script>

<style>
/* Additional global styles if needed */
</style>