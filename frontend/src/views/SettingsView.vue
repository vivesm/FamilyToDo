<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold dark:text-gray-200">Settings</h1>
      <router-link to="/" class="text-blue-500 hover:text-blue-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </router-link>
    </div>

    <!-- Settings Sections -->
    <div class="space-y-6">
      <!-- Appearance Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4 dark:text-gray-200">Appearance</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium dark:text-gray-200">Dark Mode</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
            </div>
            <button
              @click="toggleDarkMode"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="isDark ? 'bg-blue-600' : 'bg-gray-200'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="isDark ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium dark:text-gray-200">Show Deleted Tasks</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Display tasks that have been deleted</p>
            </div>
            <button
              @click="taskStore.toggleShowDeleted()"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="taskStore.showDeleted ? 'bg-blue-600' : 'bg-gray-200'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="taskStore.showDeleted ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Family Members Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold dark:text-gray-200">Family Members</h2>
          <button
            @click="showAddPerson = true"
            class="text-blue-500 hover:text-blue-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <!-- People list -->
        <div class="space-y-3">
          <div
            v-for="person in peopleStore.people"
            :key="person.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <div class="flex items-center space-x-3">
              <img
                v-if="person.photo_url"
                :src="person.photo_url"
                :alt="person.name"
                class="w-12 h-12 rounded-full object-cover border-2"
                :style="{ borderColor: person.color || '#6B7280' }"
              >
              <div
                v-else
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2"
                :style="{ backgroundColor: person.color || '#6B7280', borderColor: person.color || '#6B7280' }"
              >
                {{ person.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="font-medium dark:text-gray-200">{{ person.name }}</p>
                <p v-if="person.email" class="text-xs text-gray-500 dark:text-gray-400">{{ person.email }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Member since {{ formatDate(person.created_at) }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="editPerson(person)"
                class="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="deletePerson(person.id)"
                class="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold dark:text-gray-200">Categories</h2>
          <button
            @click="showAddCategory = true"
            class="text-blue-500 hover:text-blue-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <!-- Categories list -->
        <div class="space-y-3">
          <div
            v-for="category in categoryStore.categories"
            :key="category.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <div class="flex items-center space-x-3">
              <span class="text-2xl">{{ category.icon }}</span>
              <div>
                <p class="font-medium dark:text-gray-200">{{ category.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ category.color || 'No color' }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="editCategory(category)"
                class="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="deleteCategory(category.id)"
                class="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Priority Settings Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold dark:text-gray-200">Priority Levels</h2>
        </div>

        <!-- Priority list -->
        <div class="space-y-3">
          <div
            v-for="level in [1, 2, 3]"
            :key="level"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <div class="flex items-center space-x-3">
              <span class="text-2xl">{{ priorityStore.getPriority(level).emoji }}</span>
              <div>
                <p class="font-medium dark:text-gray-200">{{ priorityStore.getPriority(level).name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Priority {{ level }}</p>
              </div>
            </div>
            <button
              @click="editPriority(level)"
              class="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- About Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4 dark:text-gray-200">About</h2>
        <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>FamilyToDo v1.0.0</p>
          <p>A visual task management app for families</p>
          <p class="text-xs">© 2025 FamilyToDo</p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Person Modal -->
    <div v-if="showAddPerson" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closePersonModal">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-semibold mb-4 dark:text-gray-200">{{ editingPerson ? 'Edit Family Member' : 'Add Family Member' }}</h3>
        <form @submit.prevent="handleSavePerson" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              v-model="personForm.name"
              type="text"
              required
              placeholder="Enter name"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              v-model="personForm.email"
              type="email"
              placeholder="Enter email address"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <!-- Photo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo
            </label>
            <div class="flex items-center space-x-4">
              <div class="relative">
                <img
                  v-if="personForm.photo_url"
                  :src="personForm.photo_url"
                  alt="Preview"
                  class="w-20 h-20 rounded-full object-cover"
                >
                <div
                  v-else
                  class="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                >
                  <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                @change="handlePhotoSelect"
                class="text-sm"
              >
            </div>
          </div>

          <!-- Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div class="flex space-x-2">
              <button
                v-for="color in colors"
                :key="color"
                type="button"
                @click="personForm.color = color"
                class="w-10 h-10 rounded-full border-2 transition-all"
                :style="{ backgroundColor: color }"
                :class="personForm.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="closePersonModal"
              class="flex-1 px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              {{ editingPerson ? 'Update' : 'Add' }} Member
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add/Edit Category Modal -->
    <div v-if="showAddCategory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeCategoryModal">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-semibold mb-4 dark:text-gray-200">{{ editingCategory ? 'Edit Category' : 'Add Category' }}</h3>
        <form @submit.prevent="handleSaveCategory" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              v-model="categoryForm.name"
              type="text"
              required
              placeholder="Enter category name"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <!-- Icon -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon (Emoji)
            </label>
            <input
              v-model="categoryForm.icon"
              type="text"
              placeholder="Enter an emoji (e.g., 🏠 🛒 💼)"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
              maxlength="2"
            >
          </div>

          <!-- Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div class="flex space-x-2">
              <button
                v-for="color in colors"
                :key="color"
                type="button"
                @click="categoryForm.color = color"
                class="w-10 h-10 rounded-full border-2 transition-all"
                :style="{ backgroundColor: color }"
                :class="categoryForm.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="closeCategoryModal"
              class="flex-1 px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              {{ editingCategory ? 'Update' : 'Add' }} Category
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Priority Modal -->
    <div v-if="showEditPriority" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closePriorityModal">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-semibold mb-4 dark:text-gray-200">Edit Priority Level {{ editingPriorityLevel }}</h3>
        <form @submit.prevent="handleSavePriority" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <input
              v-model="priorityForm.name"
              type="text"
              required
              placeholder="Enter priority name"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <!-- Emoji -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emoji
            </label>
            <input
              v-model="priorityForm.emoji"
              type="text"
              placeholder="Enter an emoji (e.g., 🔴 🟡 🟢)"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
              maxlength="2"
            >
          </div>

          <!-- Actions -->
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="closePriorityModal"
              class="flex-1 px-4 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Update Priority
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { usePeopleStore } from '@/stores/peopleStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useTaskStore } from '@/stores/taskStore';
import { usePriorityStore } from '@/stores/priorityStore';
import { useDarkMode } from '@/composables/useDarkMode';
import { useToast } from 'vue-toastification';

const peopleStore = usePeopleStore();
const categoryStore = useCategoryStore();
const taskStore = useTaskStore();
const priorityStore = usePriorityStore();
const { isDark, toggleDarkMode } = useDarkMode();
const toast = useToast();

const showAddPerson = ref(false);
const editingPerson = ref(null);
const personForm = ref({
  name: '',
  email: '',
  photo_url: '',
  color: '#3B82F6'
});

const showAddCategory = ref(false);
const editingCategory = ref(null);
const categoryForm = reactive({
  name: '',
  icon: '',
  color: '#3B82F6'
});

const showEditPriority = ref(false);
const editingPriorityLevel = ref(null);
const priorityForm = reactive({
  name: '',
  emoji: ''
});

const colors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#F97316'  // Orange
];

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

async function handlePhotoSelect(event) {
  const file = event.target.files[0];
  if (file) {
    try {
      const photoUrl = await peopleStore.uploadPersonPhoto(file);
      personForm.value.photo_url = photoUrl;
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  }
}

async function handleSavePerson() {
  try {
    if (editingPerson.value) {
      // Update existing person
      await peopleStore.updatePerson(editingPerson.value.id, personForm.value);
      toast.success('Member updated');
    } else {
      // Create new person
      await peopleStore.createPerson(personForm.value);
    }
    closePersonModal();
  } catch (error) {
    // Error handled in store
  }
}

// Person management functions
function editPerson(person) {
  editingPerson.value = person;
  personForm.value = {
    name: person.name,
    email: person.email || '',
    photo_url: person.photo_url || '',
    color: person.color || '#3B82F6'
  };
  showAddPerson.value = true;
}

function closePersonModal() {
  showAddPerson.value = false;
  editingPerson.value = null;
  personForm.value = {
    name: '',
    email: '',
    photo_url: '',
    color: '#3B82F6'
  };
}

async function deletePerson(id) {
  if (confirm('Are you sure you want to remove this person?')) {
    try {
      await peopleStore.deletePerson(id);
    } catch (error) {
      // Error handled in store
    }
  }
}

// Category management functions
function editCategory(category) {
  editingCategory.value = category;
  categoryForm.name = category.name;
  categoryForm.icon = category.icon || '';
  categoryForm.color = category.color || '#3B82F6';
  showAddCategory.value = true;
}

async function deleteCategory(id) {
  if (confirm('Are you sure you want to delete this category? Tasks using this category will be updated.')) {
    try {
      await categoryStore.deleteCategory(id);
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  }
}

async function handleSaveCategory() {
  try {
    if (editingCategory.value) {
      // Update existing category
      await categoryStore.updateCategory(editingCategory.value.id, {
        name: categoryForm.name,
        icon: categoryForm.icon,
        color: categoryForm.color
      });
      toast.success('Category updated');
    } else {
      // Create new category
      await categoryStore.createCategory({
        name: categoryForm.name,
        icon: categoryForm.icon,
        color: categoryForm.color
      });
      toast.success('Category created');
    }
    closeCategoryModal();
  } catch (error) {
    toast.error(editingCategory.value ? 'Failed to update category' : 'Failed to create category');
  }
}

function closeCategoryModal() {
  showAddCategory.value = false;
  editingCategory.value = null;
  categoryForm.name = '';
  categoryForm.icon = '';
  categoryForm.color = '#3B82F6';
}

// Priority management functions
function editPriority(level) {
  const priority = priorityStore.getPriority(level);
  editingPriorityLevel.value = level;
  priorityForm.name = priority.name;
  priorityForm.emoji = priority.emoji;
  showEditPriority.value = true;
}

function handleSavePriority() {
  if (!priorityForm.name) return;
  
  priorityStore.updatePriority(editingPriorityLevel.value, {
    name: priorityForm.name,
    emoji: priorityForm.emoji || '📌'
  });
  
  toast.success('Priority updated');
  closePriorityModal();
}

function closePriorityModal() {
  showEditPriority.value = false;
  editingPriorityLevel.value = null;
  priorityForm.name = '';
  priorityForm.emoji = '';
}
</script>