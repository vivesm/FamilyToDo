<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
    <div class="flex items-center space-x-3 overflow-x-auto pb-2">
      <!-- All categories -->
      <button
        @click="selectCategory(null)"
        class="category-chip bg-gray-100 dark:bg-gray-700"
        :class="{ 'category-chip-active': taskStore.selectedCategoryId === null }"
      >
        <span class="mr-2">📋</span>
        <span class="text-sm font-medium">All</span>
      </button>

      <!-- Individual categories -->
      <button
        v-for="category in categoryStore.categories"
        :key="category.id"
        @click="selectCategory(category.id)"
        class="category-chip"
        :style="{ 
          backgroundColor: taskStore.selectedCategoryId === category.id ? category.color : '#E5E7EB',
          color: taskStore.selectedCategoryId === category.id ? 'white' : '#374151'
        }"
        :class="{ 'ring-4 ring-opacity-30 scale-110': taskStore.selectedCategoryId === category.id }"
      >
        <span class="text-2xl">{{ category.icon }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useTaskStore } from '@/stores/taskStore';
import { useCategoryStore } from '@/stores/categoryStore';

const taskStore = useTaskStore();
const categoryStore = useCategoryStore();

function selectCategory(categoryId) {
  taskStore.setSelectedCategory(categoryId === taskStore.selectedCategoryId ? null : categoryId);
}
</script>