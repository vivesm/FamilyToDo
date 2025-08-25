<template>
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="$emit('close')">
    <div class="bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 max-w-3xl w-full max-h-[85vh] overflow-y-auto animate-slide-up">
      <!-- Header -->
      <div class="sticky top-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl p-6 border-b border-gray-200 dark:border-gray-700 z-10">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold dark:text-gray-200">Task Details</h2>
          <div class="flex items-center space-x-2">
            <button 
              @click="$emit('edit', task)"
              class="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-all"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button @click="$emit('close')" class="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Task Info -->
      <div class="p-6 space-y-6">
        <!-- Title and Priority -->
        <div>
          <div class="flex items-start justify-between">
            <h3 class="text-xl font-semibold dark:text-gray-200">{{ task.title }}</h3>
            <div class="flex items-center space-x-2">
              <span class="text-2xl">{{ priorityEmoji }}</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ priorityName }}</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="task.description">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <p class="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{{ task.description }}</p>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Category -->
          <div v-if="task.category_name">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <div class="flex items-center space-x-2">
              <span class="text-xl">{{ task.category_icon }}</span>
              <span class="text-gray-600 dark:text-gray-400">{{ task.category_name }}</span>
            </div>
          </div>

          <!-- Due Date -->
          <div v-if="task.due_date">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <p class="text-gray-600 dark:text-gray-400">{{ formatDate(task.due_date) }}</p>
          </div>

          <!-- Assigned To -->
          <div v-if="task.assigned_people?.length">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</label>
            <div class="flex -space-x-2">
              <div 
                v-for="person in task.assigned_people" 
                :key="person.id"
                class="relative"
                :title="person.name"
              >
                <img 
                  v-if="person.photo_url" 
                  :src="person.photo_url" 
                  :alt="person.name"
                  class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                >
                <div 
                  v-else
                  class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-semibold text-xs"
                  :style="{ backgroundColor: person.color || '#9CA3AF' }"
                >
                  {{ person.name.charAt(0) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <span 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="task.completed ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'"
            >
              {{ task.completed ? 'Completed' : 'In Progress' }}
            </span>
          </div>
        </div>

        <!-- Attachments Section -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments ({{ attachments.length }})
            </label>
            <label class="cursor-pointer">
              <input 
                type="file" 
                accept="image/*"
                multiple
                @change="handleFileSelect"
                class="hidden"
                ref="fileInput"
              >
              <span class="inline-flex items-center px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-all">
                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Image
              </span>
            </label>
          </div>

          <!-- Upload Progress -->
          <div v-if="uploadingFiles.length > 0" class="mb-3 space-y-2">
            <div v-for="file in uploadingFiles" :key="file.name" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ file.name }}</span>
                <span class="text-xs text-gray-500">{{ file.progress }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  class="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                  :style="{ width: `${file.progress}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Attachments Grid -->
          <div v-if="attachments.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div 
              v-for="attachment in attachments" 
              :key="attachment.id"
              class="relative group"
            >
              <img 
                :src="attachment.url" 
                :alt="attachment.original_name"
                class="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all"
                @click="previewImage(attachment)"
              >
              <button
                @click="deleteAttachment(attachment.id)"
                class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <div class="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/50 rounded px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-all">
                {{ attachment.original_name }}
              </div>
            </div>
          </div>

          <!-- No Attachments -->
          <div v-else class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-500 dark:text-gray-400">No attachments yet</p>
            <button 
              @click="$refs.fileInput.click()"
              class="mt-3 text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              Add your first image
            </button>
          </div>
        </div>

        <!-- Comments Section (placeholder) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Comments ({{ task.comment_count || 0 }})
          </label>
          <div class="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-gray-500 dark:text-gray-400 text-sm">Comments coming soon</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div 
      v-if="previewedImage"
      class="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-4"
      @click="previewedImage = null"
    >
      <img 
        :src="previewedImage.url" 
        :alt="previewedImage.original_name"
        class="max-w-full max-h-full rounded-lg"
      >
      <button
        @click="previewedImage = null"
        class="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { format } from 'date-fns';
import { useToast } from 'vue-toastification';
import { usePriorityStore } from '@/stores/priorityStore';
import api from '@/services/api';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'edit', 'updated']);

const toast = useToast();
const priorityStore = usePriorityStore();

const attachments = ref([]);
const uploadingFiles = ref([]);
const previewedImage = ref(null);
const fileInput = ref(null);

const priorityEmoji = computed(() => priorityStore.getPriority(props.task.priority).emoji);
const priorityName = computed(() => priorityStore.getPriority(props.task.priority).name);

onMounted(() => {
  fetchAttachments();
});

async function fetchAttachments() {
  try {
    const response = await api.get(`/tasks/${props.task.id}/attachments`);
    attachments.value = response.data;
  } catch (error) {
    console.error('Failed to fetch attachments:', error);
  }
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast.warning(`${file.name} is not an image file`);
      continue;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.warning(`${file.name} is too large (max 10MB)`);
      continue;
    }
    
    await uploadFile(file);
  }
  
  // Clear the input
  event.target.value = '';
}

async function uploadFile(file) {
  const uploadingFile = {
    name: file.name,
    progress: 0
  };
  
  uploadingFiles.value.push(uploadingFile);
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post(`/upload/task/${props.task.id}/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        uploadingFile.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      }
    });
    
    attachments.value.push(response.data.attachment);
    toast.success('Image uploaded successfully');
    emit('updated');
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error('Failed to upload image');
  } finally {
    uploadingFiles.value = uploadingFiles.value.filter(f => f !== uploadingFile);
  }
}

async function deleteAttachment(attachmentId) {
  if (!confirm('Are you sure you want to delete this attachment?')) return;
  
  try {
    await api.delete(`/upload/attachment/${attachmentId}`);
    attachments.value = attachments.value.filter(a => a.id !== attachmentId);
    toast.success('Attachment deleted');
    emit('updated');
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    toast.error('Failed to delete attachment');
  }
}

function previewImage(attachment) {
  previewedImage.value = attachment;
}

function formatDate(date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>