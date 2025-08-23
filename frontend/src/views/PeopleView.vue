<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Family Members</h1>
      <router-link to="/" class="text-blue-500 hover:text-blue-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </router-link>
    </div>

    <!-- People list -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div
        v-for="person in peopleStore.people"
        :key="person.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center justify-between"
      >
        <div class="flex items-center space-x-4">
          <img
            v-if="person.photo_url"
            :src="person.photo_url"
            :alt="person.name"
            class="w-20 h-20 rounded-full object-cover"
          >
          <div
            v-else
            class="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
            :style="{ backgroundColor: person.color || '#6B7280' }"
          >
            {{ person.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="text-xl font-semibold">{{ person.name }}</h3>
            <p class="text-sm text-gray-500">Member since {{ formatDate(person.created_at) }}</p>
          </div>
        </div>
        <button
          @click="deletePerson(person.id)"
          class="text-red-500 hover:text-red-600 p-2"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Add person form -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Add Family Member</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name *
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Enter name"
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
                v-if="form.photo_url"
                :src="form.photo_url"
                alt="Preview"
                class="w-24 h-24 rounded-full object-cover"
              >
              <div
                v-else
                class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
              >
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <button
                v-if="form.photo_url"
                type="button"
                @click="form.photo_url = ''"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              @change="handlePhotoUpload"
              class="hidden"
              ref="photoInput"
            >
            <button
              type="button"
              @click="$refs.photoInput.click()"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Choose Photo
            </button>
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
              @click="form.color = color"
              class="w-12 h-12 rounded-full border-4"
              :style="{ backgroundColor: color }"
              :class="form.color === color ? 'border-gray-900 dark:border-white' : 'border-transparent'"
            ></button>
          </div>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="!form.name || loading"
          class="btn-primary w-full"
          :class="{ 'opacity-50 cursor-not-allowed': !form.name || loading }"
        >
          <span v-if="loading" class="spinner mr-2"></span>
          {{ loading ? 'Adding...' : 'Add Member' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { usePeopleStore } from '@/stores/peopleStore';
import { format, parseISO } from 'date-fns';
import { useToast } from 'vue-toastification';

const toast = useToast();
const peopleStore = usePeopleStore();

const loading = ref(false);
const photoInput = ref(null);

const form = reactive({
  name: '',
  photo_url: '',
  color: '#3B82F6'
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

async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Photo must be less than 5MB');
    return;
  }

  try {
    loading.value = true;
    const photoUrl = await peopleStore.uploadPersonPhoto(file);
    form.photo_url = photoUrl;
    toast.success('Photo uploaded!');
  } catch (error) {
    console.error('Error uploading photo:', error);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!form.name || loading.value) return;

  loading.value = true;
  try {
    await peopleStore.createPerson(form);
    // Reset form
    form.name = '';
    form.photo_url = '';
    form.color = '#3B82F6';
  } catch (error) {
    console.error('Error creating person:', error);
  } finally {
    loading.value = false;
  }
}

async function deletePerson(id) {
  if (confirm('Are you sure you want to remove this person?')) {
    await peopleStore.deletePerson(id);
  }
}

function formatDate(dateString) {
  return format(parseISO(dateString), 'MMM d, yyyy');
}
</script>