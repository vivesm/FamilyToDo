<template>
  <div class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
    <div class="px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Left side: Filters -->
        <div class="flex items-center space-x-2 overflow-x-auto overflow-y-visible py-2">
          <!-- All filter -->
          <button
            @click="selectPerson(null)"
            class="filter-chip"
            :class="{ 'filter-chip-active': !taskStore.selectedPersonId && !taskStore.selectedCategoryId }"
            title="All Tasks"
          >
            <span class="text-sm">All</span>
          </button>

          <!-- Divider -->
          <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          <!-- People filters -->
          <button
            v-for="person in peopleStore.people"
            :key="`person-${person.id}`"
            @click="selectPerson(person.id)"
            class="filter-chip p-0 relative"
            :class="{ 'filter-chip-active': taskStore.selectedPersonId === person.id }"
            :title="person.name"
          >
            <img
              v-if="person.photo_url"
              :src="person.photo_url"
              :alt="person.name"
              class="w-8 h-8 rounded-full object-cover border-2"
              :style="{ borderColor: person.color || '#6B7280' }"
            >
            <div
              v-else
              class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2"
              :style="{ backgroundColor: person.color || '#6B7280', borderColor: person.color || '#6B7280' }"
            >
              {{ person.name.charAt(0).toUpperCase() }}
            </div>
            
            <!-- Notification bell for overdue tasks -->
            <div 
              v-if="taskStore.overdueTasksByPerson.get(person.id) > 0" 
              class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center animate-urgent-pulse"
            >
              <svg v-if="taskStore.overdueTasksByPerson.get(person.id) === 1" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
                <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              <span v-else class="text-[10px] font-bold">{{ taskStore.overdueTasksByPerson.get(person.id) }}</span>
            </div>
          </button>

          <!-- Divider -->
          <div v-if="categoryStore.categories.length > 0" class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          <!-- Category filters -->
          <button
            v-for="category in categoryStore.categories"
            :key="`cat-${category.id}`"
            @click="selectCategory(category.id)"
            class="filter-chip"
            :class="{ 'filter-chip-active': taskStore.selectedCategoryId === category.id }"
            :title="category.name"
          >
            <span class="text-lg">{{ category.icon }}</span>
          </button>
        </div>

        <!-- Right side: View toggle (will be added by parent) -->
        <div class="flex items-center space-x-2">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTaskStore } from '@/stores/taskStore';
import { usePeopleStore } from '@/stores/peopleStore';
import { useCategoryStore } from '@/stores/categoryStore';

const taskStore = useTaskStore();
const peopleStore = usePeopleStore();
const categoryStore = useCategoryStore();

function selectPerson(personId) {
  // Clear category when selecting person
  taskStore.setSelectedCategory(null);
  taskStore.setSelectedPerson(personId === taskStore.selectedPersonId ? null : personId);
}

function selectCategory(categoryId) {
  // Clear person when selecting category
  taskStore.setSelectedPerson(null);
  taskStore.setSelectedCategory(categoryId === taskStore.selectedCategoryId ? null : categoryId);
}
</script>

<style scoped>
.filter-chip {
  @apply inline-flex items-center justify-center rounded-full 
         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
         transition-all duration-200 w-10 h-10;
}

/* Special case for people buttons with images */
button.filter-chip.p-0 {
  @apply p-1 w-10 h-10; /* Small padding to prevent image cutoff */
}

/* Category buttons need padding for text */
button.filter-chip:not(.p-0) {
  @apply px-2;
}

.filter-chip-active {
  @apply bg-blue-500 text-white border-2 border-blue-300 dark:border-blue-700;
}
</style>