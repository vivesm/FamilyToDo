<template>
  <div
    :data-task-id="task.id"
    class="glass-card p-5 cursor-pointer select-none relative overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:scale-[1.02] active:scale-[0.98]"
    :class="{
      'border-l-4 border-l-priority-urgent shadow-priority-urgent/20': task.priority === 1 && !task.completed,
      'border-l-4 border-l-priority-soon shadow-priority-soon/20': task.priority === 2 && !task.completed,
      'border-l-4 border-l-priority-whenever shadow-priority-whenever/20': task.priority === 3 && !task.completed,
      'opacity-60 grayscale': task.completed,
      'task-overdue': isOverdue && !task.completed
    }"
    @click="handleTaskClick"
  >
    <!-- Progress bar background -->
    <div 
      v-if="task.due_date && !task.completed"
      class="absolute inset-0"
      :class="isOverdue ? 'opacity-30 dark:opacity-40' : 'opacity-10 dark:opacity-20'"
      :style="{
        background: isOverdue 
          ? progressColor 
          : `linear-gradient(to right, ${progressColor} ${progressPercentage}%, transparent ${progressPercentage}%)`
      }"
    ></div>
    
    <!-- Progress indicator at bottom -->
    <div 
      v-if="task.due_date && !task.completed"
      class="absolute bottom-0 left-0 h-1 transition-all duration-500"
      :style="{
        width: `${progressPercentage}%`,
        backgroundColor: progressColor
      }"
    ></div>
    <!-- Category icon and title -->
    <div class="relative z-10 flex items-start justify-between mb-3">
      <div class="flex items-center space-x-3">
        <span v-if="task.category_icon" class="text-3xl">{{ task.category_icon }}</span>
        <h3 class="text-lg font-semibold dark:text-gray-200" :class="{ 'line-through': task.completed }">
          {{ task.title }}
        </h3>
      </div>
      <div class="flex items-center space-x-2">
        <!-- Edit button -->
        <button
          v-if="!task.completed"
          @click.stop="$emit('edit', task)"
          class="text-blue-500 hover:text-blue-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <!-- Complete/Uncomplete button -->
        <button
          v-if="!task.completed"
          @click.stop="completeTask"
          class="text-green-500 hover:text-green-600 transition-colors"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          v-else
          @click.stop="uncompleteTask"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Assigned people -->
    <div v-if="task.assigned_people && task.assigned_people.length > 0" class="relative z-10 flex -space-x-2 mb-3">
      <div
        v-for="person in task.assigned_people"
        :key="person.id"
        class="relative"
      >
        <img
          v-if="person.photo_url"
          :src="person.photo_url"
          :alt="person.name"
          class="w-10 h-10 rounded-full border-2"
          :style="{ borderColor: person.color || '#6B7280' }"
        >
        <div
          v-else
          class="w-10 h-10 rounded-full border-2 flex items-center justify-center text-white font-bold text-sm"
          :style="{ backgroundColor: person.color || '#6B7280', borderColor: person.color || '#6B7280' }"
        >
          {{ person.name.charAt(0).toUpperCase() }}
        </div>
        
        <!-- Notification bell for overdue tasks -->
        <div 
          v-if="taskStore.overdueTasksByPerson.get(person.id) > 0" 
          class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center animate-urgent-pulse"
          :style="{ zIndex: 100 }"
        >
          <svg v-if="taskStore.overdueTasksByPerson.get(person.id) === 1" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
            <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
          </svg>
          <span v-else class="text-[10px] font-bold">{{ taskStore.overdueTasksByPerson.get(person.id) }}</span>
        </div>
      </div>
    </div>

    <!-- Due date with days remaining -->
    <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 relative z-10">
      <div v-if="task.due_date" class="flex items-center space-x-2">
        <div class="flex items-center space-x-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDueDate(task.due_date) }}</span>
        </div>
        <span 
          v-if="!task.completed && daysRemaining !== null"
          class="px-2 py-0.5 rounded-full text-xs font-medium"
          :class="daysRemainingClass"
        >
          {{ daysRemainingText }}
        </span>
      </div>
      <div v-if="task.recurring_pattern" class="flex items-center space-x-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{{ task.recurring_pattern }}</span>
      </div>
    </div>

    <!-- Description preview (if exists and not empty) -->
    <div v-if="task.description && task.description.trim()" class="mt-2">
      <p 
        class="text-sm text-gray-500 dark:text-gray-400 cursor-pointer transition-all duration-200"
        :class="showDescription ? 'line-clamp-none' : 'line-clamp-2'"
        @click.stop="toggleDescription"
      >
        {{ task.description }}
      </p>
      <button 
        v-if="task.description.length > 100"
        @click.stop="toggleDescription"
        class="text-xs text-blue-500 hover:text-blue-600 mt-1"
      >
        {{ showDescription ? 'Show less' : 'Show more' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { format, isToday, isTomorrow, isThisWeek, parseISO, differenceInDays } from 'date-fns';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['edit', 'click']);

const taskStore = useTaskStore();
const showDescription = ref(false);

// Check if task is overdue
const isOverdue = computed(() => {
  if (!props.task.due_date || props.task.completed) return false;
  const due = parseISO(props.task.due_date);
  return new Date() > due;
});

// Calculate progress percentage (0-100) based on urgency/time remaining
const progressPercentage = computed(() => {
  if (!props.task.due_date || props.task.completed) return 0;
  
  const now = new Date();
  const due = parseISO(props.task.due_date);
  
  // Calculate hours remaining
  const hoursRemaining = (due - now) / (1000 * 60 * 60);
  
  // Define urgency levels based on time remaining
  if (hoursRemaining <= 0) return 100;  // Overdue
  if (hoursRemaining <= 6) return 95;   // Less than 6 hours
  if (hoursRemaining <= 24) return 85;  // Less than 1 day
  if (hoursRemaining <= 48) return 70;  // Less than 2 days
  if (hoursRemaining <= 72) return 55;  // Less than 3 days
  if (hoursRemaining <= 168) return 40; // Less than 1 week
  if (hoursRemaining <= 336) return 25; // Less than 2 weeks
  if (hoursRemaining <= 720) return 15; // Less than 1 month
  
  return 5; // More than a month away - minimal urgency
});

// Determine progress color based on urgency percentage
const progressColor = computed(() => {
  const pct = progressPercentage.value;
  if (pct < 25) return '#10b981'; // green - plenty of time
  if (pct < 50) return '#fbbf24'; // yellow - start thinking about it
  if (pct < 75) return '#fb923c'; // orange - should start soon
  return '#ef4444'; // red - urgent, do now!
});

// Days remaining calculation
const daysRemaining = computed(() => {
  if (!props.task.due_date || props.task.completed) return null;
  const due = parseISO(props.task.due_date);
  return differenceInDays(due, new Date());
});

const daysRemainingText = computed(() => {
  const days = daysRemaining.value;
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day';
  return `${days} days`;
});

const daysRemainingClass = computed(() => {
  const days = daysRemaining.value;
  if (days === null) return '';
  if (days < 0) return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
  if (days === 0) return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
  if (days <= 2) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
});

function handleTaskClick() {
  emit('click', props.task);
}

function toggleDescription() {
  showDescription.value = !showDescription.value;
}

async function completeTask() {
  await taskStore.completeTask(props.task.id);
}

async function uncompleteTask() {
  await taskStore.uncompleteTask(props.task.id);
}

function formatDueDate(dateString) {
  if (!dateString) return '';
  
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return `Today ${format(date, 'h:mm a')}`;
  } else if (isTomorrow(date)) {
    return `Tomorrow ${format(date, 'h:mm a')}`;
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE h:mm a');
  } else {
    return format(date, 'MMM d, h:mm a');
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-none {
  display: block;
  overflow: visible;
}
</style>