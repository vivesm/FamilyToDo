<template>
  <div>
    <!-- Compact Filter Bar -->
    <CompactFilterBar>
      <template #actions>
        <!-- Show completed toggle with long press for settings -->
        <button
          @click="taskStore.toggleShowCompleted()"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
          @mousemove="handleMouseMove"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchCancel"
          @touchmove="handleTouchMove"
          class="flex items-center justify-center p-2 rounded-lg transition-all duration-200 relative"
          :class="[
            taskStore.showCompleted 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
            isLongPressActive ? 'scale-95 ring-2 ring-blue-500' : ''
          ]"
          :title="taskStore.showCompleted ? 'Hide Completed Tasks (Hold for Settings)' : 'Show Completed Tasks (Hold for Settings)'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!taskStore.showCompleted" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </button>
        <ViewToggle />
      </template>
    </CompactFilterBar>
    
    <div class="container mx-auto px-4 py-6 max-w-7xl relative">

      <!-- Card View -->
      <div v-if="taskStore.viewMode === 'card'" class="space-y-6">
        <!-- Urgent tasks -->
        <div v-if="taskStore.urgentTasks.length > 0">
          <h2 class="text-2xl font-bold text-priority-urgent dark:text-red-400 mb-4 flex items-center">
            <span class="mr-2">{{ priorityStore.getPriority(1).emoji }}</span> {{ priorityStore.getPriority(1).name }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TaskCard 
              v-for="task in taskStore.urgentTasks" 
              :key="task.id"
              :task="task"
              @edit="handleEditTask"
              @click="handleViewTask(task)"
            />
          </div>
        </div>

        <!-- Soon tasks -->
        <div v-if="taskStore.soonTasks.length > 0">
          <h2 class="text-2xl font-bold text-priority-soon dark:text-yellow-400 mb-4 flex items-center">
            <span class="mr-2">{{ priorityStore.getPriority(2).emoji }}</span> {{ priorityStore.getPriority(2).name }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TaskCard 
              v-for="task in taskStore.soonTasks" 
              :key="task.id"
              :task="task"
              @edit="handleEditTask"
              @click="handleViewTask(task)"
            />
          </div>
        </div>

        <!-- Whenever tasks -->
        <div v-if="taskStore.wheneverTasks.length > 0">
          <h2 class="text-2xl font-bold text-priority-whenever dark:text-green-400 mb-4 flex items-center">
            <span class="mr-2">{{ priorityStore.getPriority(3).emoji }}</span> {{ priorityStore.getPriority(3).name }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TaskCard 
              v-for="task in taskStore.wheneverTasks" 
              :key="task.id"
              :task="task"
              @edit="handleEditTask"
              @click="handleViewTask(task)"
            />
          </div>
        </div>
      </div>
      
      <!-- List View -->
      <div v-else-if="taskStore.viewMode === 'list'" class="glass-card overflow-hidden">
        <div v-if="taskStore.filteredTasks.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
          <TaskListItem
            v-for="task in taskStore.filteredTasks"
            :key="task.id"
            :task="task"
            @edit="handleEditTask"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="taskStore.filteredTasks.length === 0 && !taskStore.loading" 
           class="text-center py-12">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-2xl font-semibold text-gray-600 mb-2">
          No tasks to show!
        </h3>
        <p class="text-gray-500">
          {{ taskStore.showCompleted ? 'No tasks found' : 'All tasks are completed!' }}
        </p>
      </div>

      <!-- Loading state -->
      <div v-if="taskStore.loading" class="text-center py-12">
        <div class="spinner mx-auto mb-4"></div>
        <p class="text-gray-500">Loading tasks...</p>
      </div>
    </div>

    <!-- Floating action button for adding new task -->
    <div class="fixed bottom-6 right-6 z-50">
      <button
        @click="showAddTask = true"
        class="bg-gradient-primary text-white p-4 rounded-full shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 transition-all duration-300 hover:scale-110"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <!-- Add/Edit task modal -->
    <AddTaskModal 
      v-if="showAddTask || editingTask" 
      :task="editingTask"
      @close="handleCloseModal" 
    />

    <!-- Task Detail Modal -->
    <TaskDetailModal 
      v-if="viewingTask"
      :task="viewingTask"
      @close="handleCloseDetailModal"
      @edit="handleEditFromDetail"
      @updated="taskStore.fetchTasks"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/taskStore';
import { usePriorityStore } from '@/stores/priorityStore';
import { useLongPressButton } from '@/composables/useLongPressButton';
import CompactFilterBar from '@/components/CompactFilterBar.vue';
import ViewToggle from '@/components/ViewToggle.vue';
import TaskCard from '@/components/TaskCard.vue';
import TaskListItem from '@/components/TaskListItem.vue';
import AddTaskModal from '@/components/AddTaskModal.vue';
import TaskDetailModal from '@/components/TaskDetailModal.vue';

const taskStore = useTaskStore();
const priorityStore = usePriorityStore();
const router = useRouter();
const showAddTask = ref(false);
const editingTask = ref(null);
const viewingTask = ref(null);

// Long press eye button to open settings
const openSettings = () => {
  console.log('Long press on eye button detected! Navigating to settings...');
  router.push('/settings');
};

const {
  onMouseDown: handleMouseDown,
  onMouseUp: handleMouseUp,
  onMouseLeave: handleMouseLeave,
  onMouseMove: handleMouseMove,
  onTouchStart: handleTouchStart,
  onTouchEnd: handleTouchEnd,
  onTouchCancel: handleTouchCancel,
  onTouchMove: handleTouchMove,
  isLongPress,
  isLongPressActive
} = useLongPressButton(openSettings, 1000); // 1 second hold

// Handle edit task
function handleEditTask(task) {
  editingTask.value = task;
  showAddTask.value = false;
  viewingTask.value = null;
}

// Handle view task details
function handleViewTask(task) {
  viewingTask.value = task;
  showAddTask.value = false;
  editingTask.value = null;
}

// Handle modal close
function handleCloseModal() {
  showAddTask.value = false;
  editingTask.value = null;
}

// Handle detail modal close
function handleCloseDetailModal() {
  viewingTask.value = null;
}

// Handle edit from detail modal
function handleEditFromDetail(task) {
  viewingTask.value = null;
  editingTask.value = task;
}
</script>