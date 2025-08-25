<template>
  <div class="space-y-4">
    <!-- Repeat Type -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Repeat
      </label>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          @click="updateSettings({ type: 'none' })"
          class="px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium"
          :class="modelValue.type === 'none' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
        >
          None
        </button>
        <button
          type="button"
          @click="updateSettings({ type: 'daily' })"
          class="px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium"
          :class="modelValue.type === 'daily' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
        >
          Daily
        </button>
        <button
          type="button"
          @click="updateSettings({ type: 'weekly' })"
          class="px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium"
          :class="modelValue.type === 'weekly' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
        >
          Weekly
        </button>
        <button
          type="button"
          @click="updateSettings({ type: 'monthly' })"
          class="px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium"
          :class="modelValue.type === 'monthly' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
        >
          Monthly
        </button>
      </div>
    </div>

    <!-- Advanced Options (shown when a repeat type is selected) -->
    <div v-if="modelValue.type !== 'none'" class="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      
      <!-- Custom Interval -->
      <div v-if="modelValue.type !== 'none'">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Every
        </label>
        <div class="flex items-center space-x-2">
          <input
            type="number"
            :value="modelValue.interval || 1"
            @input="updateSettings({ interval: parseInt($event.target.value) || 1 })"
            min="1"
            max="365"
            class="w-20 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
          >
          <span class="text-gray-600 dark:text-gray-400">
            {{ intervalLabel }}
          </span>
        </div>
      </div>

      <!-- Weekday Selection (for weekly) -->
      <div v-if="modelValue.type === 'weekly' && (modelValue.interval || 1) === 1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          On these days (optional)
        </label>
        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="day in weekdays"
            :key="day.value"
            type="button"
            @click="toggleWeekday(day.value)"
            class="p-2 text-xs rounded-lg border transition-all"
            :class="(modelValue.days || []).includes(day.value) 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'"
          >
            {{ day.label }}
          </button>
        </div>
      </div>

      <!-- Recurrence From -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Start next task
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="updateSettings({ from: 'due_date' })"
            class="px-3 py-2 rounded-lg border-2 transition-all text-sm"
            :class="(modelValue.from || 'due_date') === 'due_date' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600'"
          >
            From due date
          </button>
          <button
            type="button"
            @click="updateSettings({ from: 'completion' })"
            class="px-3 py-2 rounded-lg border-2 transition-all text-sm"
            :class="modelValue.from === 'completion' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600'"
          >
            From completion
          </button>
        </div>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ modelValue.from === 'completion' 
            ? 'Next task starts after you complete this one' 
            : 'Next task follows the original schedule' }}
        </p>
      </div>

      <!-- End Condition -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          End repeat
        </label>
        <div class="space-y-2">
          <label class="flex items-center">
            <input
              type="radio"
              :checked="!modelValue.endDate && !modelValue.endCount"
              @change="updateSettings({ endDate: null, endCount: null })"
              class="mr-2"
            >
            <span class="text-sm">Never</span>
          </label>
          <label class="flex items-center">
            <input
              type="radio"
              :checked="!!modelValue.endDate"
              @change="updateSettings({ endDate: '', endCount: null })"
              class="mr-2"
            >
            <span class="text-sm mr-2">On date:</span>
            <input
              v-if="modelValue.endDate !== null && modelValue.endDate !== undefined"
              type="date"
              :value="modelValue.endDate"
              @input="updateSettings({ endDate: $event.target.value })"
              class="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
            >
          </label>
          <label class="flex items-center">
            <input
              type="radio"
              :checked="!!modelValue.endCount"
              @change="updateSettings({ endCount: 5, endDate: null })"
              class="mr-2"
            >
            <span class="text-sm mr-2">After</span>
            <input
              v-if="modelValue.endCount"
              type="number"
              :value="modelValue.endCount"
              @input="updateSettings({ endCount: parseInt($event.target.value) || 1 })"
              min="1"
              max="365"
              class="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
            >
            <span v-if="modelValue.endCount" class="ml-2 text-sm">occurrences</span>
          </label>
        </div>
      </div>

      <!-- Copy Attachments -->
      <div>
        <label class="flex items-center">
          <input
            type="checkbox"
            :checked="modelValue.copyAttachments"
            @change="updateSettings({ copyAttachments: $event.target.checked })"
            class="mr-2 rounded"
          >
          <span class="text-sm text-gray-700 dark:text-gray-300">
            Copy attachments to recurring tasks
          </span>
        </label>
      </div>

      <!-- Preview -->
      <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Preview</p>
        <p class="text-xs text-blue-700 dark:text-blue-300">{{ previewText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      type: 'none',
      interval: 1,
      days: [],
      from: 'due_date',
      endDate: null,
      endCount: null,
      copyAttachments: false
    })
  }
});

const emit = defineEmits(['update:modelValue']);

const weekdays = [
  { value: 'sunday', label: 'S' },
  { value: 'monday', label: 'M' },
  { value: 'tuesday', label: 'T' },
  { value: 'wednesday', label: 'W' },
  { value: 'thursday', label: 'T' },
  { value: 'friday', label: 'F' },
  { value: 'saturday', label: 'S' }
];

const intervalLabel = computed(() => {
  const interval = props.modelValue.interval || 1;
  const type = props.modelValue.type;
  
  if (type === 'daily') {
    return interval === 1 ? 'day' : 'days';
  } else if (type === 'weekly') {
    return interval === 1 ? 'week' : 'weeks';
  } else if (type === 'monthly') {
    return interval === 1 ? 'month' : 'months';
  }
  return '';
});

const previewText = computed(() => {
  const { type, interval, days, from, endDate, endCount } = props.modelValue;
  
  if (type === 'none') return 'This task will not repeat';
  
  let text = 'Repeats ';
  
  if (type === 'daily') {
    text += interval === 1 ? 'every day' : `every ${interval} days`;
  } else if (type === 'weekly') {
    if (days && days.length > 0 && interval === 1) {
      text += `on ${days.join(', ')}`;
    } else {
      text += interval === 1 ? 'every week' : `every ${interval} weeks`;
    }
  } else if (type === 'monthly') {
    text += interval === 1 ? 'every month' : `every ${interval} months`;
  }
  
  if (from === 'completion') {
    text += ' from completion date';
  }
  
  if (endDate) {
    text += ` until ${new Date(endDate).toLocaleDateString()}`;
  } else if (endCount) {
    text += ` for ${endCount} occurrences`;
  }
  
  return text;
});

function updateSettings(updates) {
  const newSettings = { ...props.modelValue, ...updates };
  
  // Reset certain fields when type changes
  if (updates.type && updates.type !== props.modelValue.type) {
    newSettings.interval = 1;
    newSettings.days = [];
    if (updates.type === 'none') {
      newSettings.from = 'due_date';
      newSettings.endDate = null;
      newSettings.endCount = null;
      newSettings.copyAttachments = false;
    }
  }
  
  emit('update:modelValue', newSettings);
}

function toggleWeekday(day) {
  const days = props.modelValue.days || [];
  const newDays = days.includes(day)
    ? days.filter(d => d !== day)
    : [...days, day];
  
  updateSettings({ days: newDays });
}
</script>