<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 overflow-visible">
    <div class="flex items-center space-x-6 overflow-x-auto overflow-y-visible py-3 px-2 min-h-[88px]">
      <!-- All people filter -->
      <button
        @click="selectPerson(null)"
        class="flex-shrink-0 flex flex-col items-center p-2"
        :class="{ 'opacity-50': taskStore.selectedPersonId !== null }"
      >
        <div 
          class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-all duration-200 transform"
          :class="{ 'ring-4 ring-blue-500 scale-105': taskStore.selectedPersonId === null }"
        >
          <span class="text-2xl">👥</span>
        </div>
        <span class="text-xs mt-1 font-medium">All</span>
      </button>

      <!-- Individual people -->
      <button
        v-for="person in peopleStore.people"
        :key="person.id"
        @click="selectPerson(person.id)"
        class="flex-shrink-0 flex flex-col items-center p-2"
        :class="{ 'opacity-50': taskStore.selectedPersonId !== null && taskStore.selectedPersonId !== person.id }"
      >
        <div class="relative">
          <img
            v-if="person.photo_url"
            :src="person.photo_url"
            :alt="person.name"
            class="person-avatar"
            :class="{ 'person-avatar-active': taskStore.selectedPersonId === person.id }"
          >
          <div
            v-else
            class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-200"
            :style="{ backgroundColor: person.color || '#6B7280' }"
            :class="{ 'ring-4 ring-blue-500 scale-105': taskStore.selectedPersonId === person.id }"
          >
            {{ person.name.charAt(0).toUpperCase() }}
          </div>
        </div>
        <span class="text-xs mt-1 font-medium">{{ person.name }}</span>
      </button>

    </div>
  </div>
</template>

<script setup>
import { useTaskStore } from '@/stores/taskStore';
import { usePeopleStore } from '@/stores/peopleStore';

const taskStore = useTaskStore();
const peopleStore = usePeopleStore();

function selectPerson(personId) {
  taskStore.setSelectedPerson(personId === taskStore.selectedPersonId ? null : personId);
}
</script>