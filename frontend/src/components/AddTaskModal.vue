<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 max-w-2xl w-full max-h-[650px] md:max-h-[85vh] overflow-y-auto animate-slide-up">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold dark:text-gray-200">{{ editMode ? 'Edit Task' : 'Add New Task' }}</h2>
          <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6 pb-20">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Task Title *
          </label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="What needs to be done?"
            class="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-neutral-800 transition-all duration-200 text-lg"
          >
        </div>

        <!-- Priority -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority
          </label>
          <div class="grid grid-cols-3 gap-3">
            <button
              type="button"
              @click="form.priority = 1"
              class="p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105"
              :class="form.priority === 1 ? 'border-priority-urgent bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 shadow-lg' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'"
            >
              <span class="text-2xl">{{ priorityStore.getPriority(1).emoji }}</span>
              <p class="text-sm mt-1 dark:text-gray-300">{{ priorityStore.getPriority(1).name }}</p>
            </button>
            <button
              type="button"
              @click="form.priority = 2"
              class="p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105"
              :class="form.priority === 2 ? 'border-priority-soon bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 shadow-lg' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'"
            >
              <span class="text-2xl">{{ priorityStore.getPriority(2).emoji }}</span>
              <p class="text-sm mt-1 dark:text-gray-300">{{ priorityStore.getPriority(2).name }}</p>
            </button>
            <button
              type="button"
              @click="form.priority = 3"
              class="p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105"
              :class="form.priority === 3 ? 'border-priority-whenever bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 shadow-lg' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'"
            >
              <span class="text-2xl">{{ priorityStore.getPriority(3).emoji }}</span>
              <p class="text-sm mt-1 dark:text-gray-300">{{ priorityStore.getPriority(3).name }}</p>
            </button>
          </div>
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="category in categoryStore.categories"
              :key="category.id"
              type="button"
              @click="form.category_id = form.category_id === category.id ? null : category.id"
              class="px-4 py-3 rounded-lg border-2 transition-all flex items-center space-x-2"
              :class="form.category_id === category.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
            >
              <span class="text-2xl">{{ category.icon }}</span>
              <span class="text-sm dark:text-gray-300">{{ category.name }}</span>
            </button>
          </div>
        </div>

        <!-- Assign to -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assign To
          </label>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="person in peopleStore.people"
              :key="person.id"
              type="button"
              @click="togglePersonAssignment(person.id)"
              class="flex flex-col items-center"
            >
              <div class="relative">
                <img
                  v-if="person.photo_url"
                  :src="person.photo_url"
                  :alt="person.name"
                  class="w-16 h-16 rounded-full object-cover border-2 transition-all"
                  :style="{ borderColor: form.assigned_people.includes(person.id) ? '#3B82F6' : person.color || '#6B7280' }"
                  :class="form.assigned_people.includes(person.id) ? 'ring-4 ring-blue-200' : ''"
                >
                <div
                  v-else
                  class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 transition-all"
                  :style="{ 
                    backgroundColor: person.color || '#6B7280',
                    borderColor: form.assigned_people.includes(person.id) ? '#3B82F6' : person.color || '#6B7280'
                  }"
                  :class="form.assigned_people.includes(person.id) ? 'ring-4 ring-blue-200' : ''"
                >
                  {{ person.name.charAt(0).toUpperCase() }}
                </div>
                <div v-if="form.assigned_people.includes(person.id)" class="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                
                <!-- Notification bell for overdue tasks -->
                <div 
                  v-if="!form.assigned_people.includes(person.id) && taskStore.overdueTasksByPerson.get(person.id) > 0" 
                  class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center animate-urgent-pulse"
                >
                  <svg v-if="taskStore.overdueTasksByPerson.get(person.id) === 1" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
                    <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                  </svg>
                  <span v-else class="text-xs font-bold">{{ taskStore.overdueTasksByPerson.get(person.id) }}</span>
                </div>
              </div>
              <span class="text-xs mt-1 dark:text-gray-300">{{ person.name }}</span>
            </button>
          </div>
        </div>

        <!-- Due date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Due Date
          </label>
          <input
            v-model="form.due_date"
            type="datetime-local"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
        </div>

        <!-- Recurring -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Repeat
          </label>
          <div class="grid grid-cols-4 gap-3">
            <button
              type="button"
              @click="form.recurring_pattern = null"
              class="px-4 py-3 rounded-lg border-2 transition-all"
              :class="!form.recurring_pattern ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
            >
              Never
            </button>
            <button
              type="button"
              @click="form.recurring_pattern = 'daily'"
              class="px-4 py-3 rounded-lg border-2 transition-all"
              :class="form.recurring_pattern === 'daily' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
            >
              Daily
            </button>
            <button
              type="button"
              @click="form.recurring_pattern = 'weekly'"
              class="px-4 py-3 rounded-lg border-2 transition-all"
              :class="form.recurring_pattern === 'weekly' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
            >
              Weekly
            </button>
            <button
              type="button"
              @click="form.recurring_pattern = 'monthly'"
              class="px-4 py-3 rounded-lg border-2 transition-all"
              :class="form.recurring_pattern === 'monthly' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'"
            >
              Monthly
            </button>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Add any additional details..."
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-between pt-4">
          <!-- Delete button on the left (only in edit mode) -->
          <div>
            <button
              v-if="editMode"
              type="button"
              @click="handleDelete"
              class="px-4 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-semibold"
              :disabled="loading"
            >
              <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Task
            </button>
          </div>
          
          <!-- Cancel and Save buttons on the right -->
          <div class="flex space-x-3">
            <button
              type="button"
              @click="$emit('close')"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!form.title || loading"
              class="btn-primary"
              :class="{ 'opacity-50 cursor-not-allowed': !form.title || loading }"
            >
              <span v-if="loading" class="spinner mr-2"></span>
              {{ loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Task' : 'Create Task') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { usePeopleStore } from '@/stores/peopleStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { usePriorityStore } from '@/stores/priorityStore';

const props = defineProps({
  task: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close']);

const taskStore = useTaskStore();
const peopleStore = usePeopleStore();
const categoryStore = useCategoryStore();
const priorityStore = usePriorityStore();

const loading = ref(false);
const editMode = ref(!!props.task);

const form = reactive({
  title: props.task?.title || '',
  description: props.task?.description || '',
  category_id: props.task?.category_id || null,
  priority: props.task?.priority || 3,
  due_date: props.task?.due_date ? props.task.due_date.split('T')[0] : '',
  recurring_pattern: props.task?.recurring_pattern || null,
  assigned_people: props.task?.assigned_people?.map(p => p.id) || []
});

function togglePersonAssignment(personId) {
  const index = form.assigned_people.indexOf(personId);
  if (index > -1) {
    form.assigned_people.splice(index, 1);
  } else {
    form.assigned_people.push(personId);
  }
}

async function handleDelete() {
  if (!editMode.value || loading.value) return;
  
  if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
    loading.value = true;
    try {
      await taskStore.deleteTask(props.task.id);
      emit('close');
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      loading.value = false;
    }
  }
}

async function handleSubmit() {
  if (!form.title || loading.value) return;
  
  loading.value = true;
  try {
    if (editMode.value) {
      await taskStore.updateTask(props.task.id, {
        ...form,
        due_date: form.due_date || null
      });
    } else {
      await taskStore.createTask({
        ...form,
        due_date: form.due_date || null
      });
    }
    emit('close');
  } catch (error) {
    console.error(`Error ${editMode.value ? 'updating' : 'creating'} task:`, error);
  } finally {
    loading.value = false;
  }
}
</script>