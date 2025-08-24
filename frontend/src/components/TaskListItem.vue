<template>
  <div
    :data-task-id="task.id"
    class="relative flex items-center space-x-3 p-4 bg-white/50 dark:bg-surface-dark/50 border-b border-neutral-200/30 dark:border-neutral-700/30 hover:bg-white/80 dark:hover:bg-surface-dark/80 transition-all duration-200 overflow-hidden"
    :class="{ 
      'opacity-50': task.completed,
      'task-overdue': isOverdue && !task.completed 
    }"
  >
    <!-- Progress bar background -->
    <div 
      v-if="task.due_date && !task.completed"
      class="absolute inset-0 pointer-events-none"
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
      class="absolute bottom-0 left-0 h-0.5 transition-all duration-500 pointer-events-none"
      :style="{
        width: `${progressPercentage}%`,
        backgroundColor: progressColor
      }"
    ></div>

    <!-- Complete checkbox -->
    <button
      @click="task.completed ? uncompleteTask() : completeTask()"
      class="relative z-10 flex-shrink-0"
    >
      <div 
        class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
        :class="task.completed 
          ? 'bg-green-500 border-green-500' 
          : priorityBorderColor"
      >
        <svg v-if="task.completed" class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
    </button>

    <!-- Priority indicator -->
    <div class="relative z-10 flex-shrink-0">
      <span class="text-lg">
        {{ priorityStore.getPriority(task.priority).emoji }}
      </span>
    </div>

    <!-- Category icon -->
    <span v-if="task.category_icon" class="relative z-10 flex-shrink-0 text-xl">
      {{ task.category_icon }}
    </span>

    <!-- Task title -->
    <div class="relative z-10 flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" 
         :class="{ 'line-through': task.completed }">
        {{ task.title }}
      </p>
    </div>

    <!-- Assigned people avatars -->
    <div v-if="task.assigned_people?.length > 0" class="relative z-10 flex -space-x-2 flex-shrink-0">
      <div
        v-for="(person, index) in task.assigned_people.slice(0, 3)"
        :key="person.id"
        class="relative"
        :style="{ zIndex: task.assigned_people.length - index }"
      >
        <img
          v-if="person.photo_url"
          :src="person.photo_url"
          :alt="person.name"
          class="w-6 h-6 rounded-full border"
          :style="{ borderColor: person.color || '#6B7280' }"
        >
        <div
          v-else
          class="w-6 h-6 rounded-full border flex items-center justify-center text-white text-xs font-bold"
          :style="{ backgroundColor: person.color || '#6B7280', borderColor: person.color || '#6B7280' }"
        >
          {{ person.name.charAt(0) }}
        </div>
        
        <!-- Notification bell for overdue tasks -->
        <div 
          v-if="taskStore.overdueTasksByPerson.get(person.id) > 0" 
          class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center animate-urgent-pulse"
          :style="{ zIndex: 100 }"
        >
          <svg class="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
          </svg>
        </div>
      </div>
      <div 
        v-if="task.assigned_people.length > 3"
        class="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium"
      >
        +{{ task.assigned_people.length - 3 }}
      </div>
    </div>

    <!-- Due date with progress indicator -->
    <div v-if="task.due_date" class="relative z-10 flex-shrink-0 flex items-center space-x-2">
      <div class="relative">
        <!-- Progress ring -->
        <svg class="w-6 h-6 transform -rotate-90">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            class="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            :stroke="progressColor"
            stroke-width="2"
            fill="none"
            :stroke-dasharray="`${progressPercentage * 0.628} 62.8`"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <span class="text-xs text-gray-600 dark:text-gray-400">
        {{ formatDueDate(task.due_date) }}
      </span>
    </div>

    <!-- Actions -->
    <div class="relative z-10 flex items-center space-x-1 flex-shrink-0">
      <button
        v-if="!task.completed"
        @click="$emit('edit', task)"
        class="p-1 text-gray-400 hover:text-blue-500 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        @click="deleteTask"
        class="p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { usePriorityStore } from '@/stores/priorityStore';
import { format, isToday, isTomorrow, differenceInDays, parseISO } from 'date-fns';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['edit']);

const taskStore = useTaskStore();
const priorityStore = usePriorityStore();

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

// Priority border color
const priorityBorderColor = computed(() => {
  if (props.task.priority === 1) return 'border-red-500';
  if (props.task.priority === 2) return 'border-yellow-500';
  return 'border-green-500';
});

function formatDueDate(date) {
  if (!date) return '';
  const parsed = parseISO(date);
  
  if (isToday(parsed)) return 'Today';
  if (isTomorrow(parsed)) return 'Tomorrow';
  
  const days = differenceInDays(parsed, new Date());
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days < 7) return `${days}d`;
  
  return format(parsed, 'MMM d');
}

async function completeTask() {
  await taskStore.completeTask(props.task.id);
}

async function uncompleteTask() {
  await taskStore.uncompleteTask(props.task.id);
}

async function deleteTask() {
  if (confirm('Are you sure you want to delete this task?')) {
    await taskStore.deleteTask(props.task.id);
  }
}
</script>