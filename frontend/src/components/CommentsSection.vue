<template>
  <div class="comments-section">
    <!-- Comments Header -->
    <div class="flex items-center justify-between mb-3">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Comments ({{ comments.length }})
      </label>
      <button
        @click="toggleCommentForm"
        class="text-primary-500 hover:text-primary-600 text-sm font-medium"
      >
        {{ showCommentForm ? 'Cancel' : 'Add Comment' }}
      </button>
    </div>

    <!-- New Comment Form -->
    <div v-if="showCommentForm" class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="space-y-3">
        <!-- Person Selector -->
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">As:</label>
          <select
            v-model="newComment.personId"
            class="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          >
            <option :value="null">Anonymous</option>
            <option v-for="person in peopleStore.people" :key="person.id" :value="person.id">
              {{ person.name }}
            </option>
          </select>
        </div>

        <!-- Comment Text -->
        <textarea
          v-model="newComment.text"
          placeholder="Add your comment..."
          rows="3"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        ></textarea>

        <!-- Attachments -->
        <div class="flex items-center space-x-3">
          <!-- File Upload -->
          <label class="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              @change="handleFileSelect"
              class="hidden"
              ref="fileInput"
            >
            <span class="inline-flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach Image
            </span>
          </label>

          <!-- Camera -->
          <button
            @click="showCamera = true"
            class="inline-flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Camera
          </button>
        </div>

        <!-- Preview Attachments -->
        <div v-if="newComment.attachments.length > 0" class="flex flex-wrap gap-2">
          <div v-for="(attachment, index) in newComment.attachments" :key="index" class="relative">
            <img
              :src="attachment.preview"
              class="w-16 h-16 object-cover rounded-lg"
              :alt="`Attachment ${index + 1}`"
            >
            <button
              @click="removeAttachment(index)"
              class="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-2">
          <button
            @click="cancelComment"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            @click="submitComment"
            :disabled="!newComment.text.trim() || submitting"
            class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Posting...' : 'Post Comment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Comments List -->
    <div v-if="loading" class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
    
    <div v-else-if="comments.length > 0" class="space-y-3">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <!-- Comment Header -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center space-x-2">
            <!-- Person Avatar -->
            <div v-if="comment.person_id">
              <img
                v-if="comment.person_photo"
                :src="comment.person_photo"
                :alt="comment.person_name"
                class="w-8 h-8 rounded-full"
              >
              <div
                v-else
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                :style="{ backgroundColor: comment.person_color || '#6B7280' }"
              >
                {{ comment.person_name?.charAt(0)?.toUpperCase() || '?' }}
              </div>
            </div>
            <div v-else class="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
            
            <!-- Person Name & Time -->
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ comment.person_name || 'Anonymous' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(comment.created_at) }}
              </p>
            </div>
          </div>

          <!-- Delete Button -->
          <button
            @click="deleteComment(comment.id)"
            class="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <!-- Comment Text -->
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{{ comment.comment }}</p>

        <!-- Comment Attachments -->
        <div v-if="comment.attachments && comment.attachments.length > 0" class="flex flex-wrap gap-2 mt-2">
          <img
            v-for="attachment in comment.attachments"
            :key="attachment.id"
            :src="attachment.url"
            :alt="attachment.original_name"
            class="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90"
            @click="$emit('preview-image', attachment)"
          >
        </div>
      </div>
    </div>

    <!-- No Comments -->
    <div v-else class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p class="text-gray-500 dark:text-gray-400">No comments yet</p>
      <button
        @click="showCommentForm = true"
        class="mt-3 text-primary-500 hover:text-primary-600 text-sm font-medium"
      >
        Be the first to comment
      </button>
    </div>

    <!-- Camera Modal -->
    <div v-if="showCamera" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-4">
        <CameraCapture
          @capture="handleCameraCapture"
          @close="showCamera = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from 'vue-toastification';
import { usePeopleStore } from '@/stores/peopleStore';
import CameraCapture from '@/components/CameraCapture.vue';
import api from '@/services/api';
import { getSocket } from '@/services/socket';

const props = defineProps({
  taskId: {
    type: [Number, String],
    required: true
  }
});

const emit = defineEmits(['updated', 'preview-image']);

const toast = useToast();
const peopleStore = usePeopleStore();

const comments = ref([]);
const loading = ref(false);
const submitting = ref(false);
const showCommentForm = ref(false);
const showCamera = ref(false);
const fileInput = ref(null);

const newComment = ref({
  personId: null,
  text: '',
  attachments: []
});

onMounted(() => {
  fetchComments();
  
  // Listen for real-time updates
  const socket = getSocket();
  if (socket) {
    socket.on('task:comment:added', handleCommentAdded);
    socket.on('task:comment:updated', handleCommentUpdated);
    socket.on('task:comment:deleted', handleCommentDeleted);
  }
});

onUnmounted(() => {
  const socket = getSocket();
  if (socket) {
    socket.off('task:comment:added', handleCommentAdded);
    socket.off('task:comment:updated', handleCommentUpdated);
    socket.off('task:comment:deleted', handleCommentDeleted);
  }
});

async function fetchComments() {
  loading.value = true;
  try {
    const response = await api.get(`/comments/task/${props.taskId}`);
    comments.value = response.data;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    toast.error('Failed to load comments');
  } finally {
    loading.value = false;
  }
}

function toggleCommentForm() {
  showCommentForm.value = !showCommentForm.value;
  if (!showCommentForm.value) {
    resetCommentForm();
  }
}

function resetCommentForm() {
  newComment.value = {
    personId: null,
    text: '',
    attachments: []
  };
}

function cancelComment() {
  showCommentForm.value = false;
  resetCommentForm();
}

async function submitComment() {
  if (!newComment.value.text.trim()) return;
  
  submitting.value = true;
  try {
    // First, post the comment
    const response = await api.post(`/comments/task/${props.taskId}`, {
      personId: newComment.value.personId,
      comment: newComment.value.text
    });
    
    const commentId = response.data.id;
    
    // Then upload attachments if any
    for (const attachment of newComment.value.attachments) {
      const formData = new FormData();
      
      if (attachment.file) {
        formData.append('file', attachment.file);
      } else if (attachment.base64) {
        // Convert base64 to blob for camera photos
        const blob = await fetch(attachment.base64).then(r => r.blob());
        formData.append('file', blob, 'camera-photo.jpg');
      }
      
      await api.post(`/upload/comment/${commentId}/attachment`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    
    // Refresh comments
    await fetchComments();
    
    toast.success('Comment added successfully');
    showCommentForm.value = false;
    resetCommentForm();
    emit('updated');
  } catch (error) {
    console.error('Failed to add comment:', error);
    toast.error('Failed to add comment');
  } finally {
    submitting.value = false;
  }
}

async function deleteComment(commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) return;
  
  try {
    await api.delete(`/comments/${commentId}`);
    comments.value = comments.value.filter(c => c.id !== commentId);
    toast.success('Comment deleted');
    emit('updated');
  } catch (error) {
    console.error('Failed to delete comment:', error);
    toast.error('Failed to delete comment');
  }
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast.warning(`${file.name} is not an image file`);
      continue;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.warning(`${file.name} is too large (max 10MB)`);
      continue;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      newComment.value.attachments.push({
        file,
        preview: e.target.result
      });
    };
    reader.readAsDataURL(file);
  }
  
  event.target.value = '';
}

function handleCameraCapture(photoData) {
  newComment.value.attachments.push({
    base64: photoData,
    preview: photoData
  });
  showCamera.value = false;
}

function removeAttachment(index) {
  newComment.value.attachments.splice(index, 1);
}

// Real-time update handlers
function handleCommentAdded(data) {
  if (data.taskId === props.taskId) {
    // Check if comment already exists to avoid duplicates
    if (!comments.value.find(c => c.id === data.comment.id)) {
      comments.value.unshift(data.comment);
    }
  }
}

function handleCommentUpdated(data) {
  if (data.taskId === props.taskId) {
    const index = comments.value.findIndex(c => c.id === data.comment.id);
    if (index !== -1) {
      comments.value[index] = data.comment;
    }
  }
}

function handleCommentDeleted(data) {
  if (data.taskId === props.taskId) {
    comments.value = comments.value.filter(c => c.id !== data.commentId);
  }
}

function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diffInHours = (now - d) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return formatDistanceToNow(d, { addSuffix: true });
  }
  return format(d, 'MMM d, yyyy');
}
</script>