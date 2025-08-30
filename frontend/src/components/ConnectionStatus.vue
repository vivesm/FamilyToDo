<template>
  <div 
    v-if="showStatus"
    class="fixed top-4 right-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-md transition-all duration-300"
    :class="statusClasses"
  >
    <!-- Status indicator dot -->
    <div 
      class="w-2 h-2 rounded-full"
      :class="dotClasses"
    ></div>
    
    <!-- Status text -->
    <span class="text-sm font-medium">
      {{ statusText }}
    </span>
    
    <!-- Last update time -->
    <span v-if="connectionState === 'connected' && lastUpdate" class="text-xs opacity-75">
      ({{ formatLastUpdate }})
    </span>
    
    <!-- Refresh button when disconnected -->
    <button
      v-if="connectionState === 'disconnected'"
      @click="handleRefresh"
      class="ml-2 text-xs underline hover:no-underline"
    >
      Refresh
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getSocket } from '@/services/socket';
import { useTaskStore } from '@/stores/taskStore';
import { usePeopleStore } from '@/stores/peopleStore';
import { useCategoryStore } from '@/stores/categoryStore';

const connectionState = ref('connecting'); // 'connected', 'connecting', 'disconnected'
const lastUpdate = ref(new Date());
const showStatus = ref(true);
let socket = null;
let updateInterval = null;

const taskStore = useTaskStore();
const peopleStore = usePeopleStore();
const categoryStore = useCategoryStore();

// Computed properties for styling
const statusClasses = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'bg-green-100/90 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800';
    case 'connecting':
      return 'bg-yellow-100/90 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800';
    case 'disconnected':
      return 'bg-red-100/90 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800';
    default:
      return '';
  }
});

const dotClasses = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'bg-green-500 dark:bg-green-400';
    case 'connecting':
      return 'bg-yellow-500 dark:bg-yellow-400 animate-pulse';
    case 'disconnected':
      return 'bg-red-500 dark:bg-red-400';
    default:
      return '';
  }
});

const statusText = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Reconnecting...';
    case 'disconnected':
      return 'Disconnected';
    default:
      return '';
  }
});

const formatLastUpdate = computed(() => {
  const now = new Date();
  const diff = Math.floor((now - lastUpdate.value) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
});

// Handle refresh
async function handleRefresh() {
  connectionState.value = 'connecting';
  
  try {
    await Promise.all([
      taskStore.fetchTasks(),
      peopleStore.fetchPeople(),
      categoryStore.fetchCategories()
    ]);
    
    lastUpdate.value = new Date();
    
    // Try to reconnect socket
    if (socket && !socket.connected) {
      socket.connect();
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
    connectionState.value = 'disconnected';
  }
}

// Setup socket listeners
function setupSocketListeners() {
  socket = getSocket();
  
  if (!socket) return;
  
  socket.on('connect', () => {
    connectionState.value = 'connected';
    lastUpdate.value = new Date();
    
    // Hide status after 5 seconds when connected
    setTimeout(() => {
      if (connectionState.value === 'connected') {
        showStatus.value = false;
      }
    }, 5000);
  });
  
  socket.on('disconnect', () => {
    connectionState.value = 'disconnected';
    showStatus.value = true;
  });
  
  socket.on('reconnecting', () => {
    connectionState.value = 'connecting';
    showStatus.value = true;
  });
  
  socket.on('reconnect', () => {
    connectionState.value = 'connected';
    lastUpdate.value = new Date();
    
    // Fetch latest data after reconnection
    handleRefresh();
  });
  
  // Update last update time when data changes
  ['task-created', 'task-updated', 'task-deleted', 'task-completed', 'task-uncompleted'].forEach(event => {
    socket.on(event, () => {
      lastUpdate.value = new Date();
    });
  });
}

// Periodic update check
function startUpdateTimer() {
  updateInterval = setInterval(() => {
    // Force re-render to update "last update" time
    lastUpdate.value = new Date(lastUpdate.value);
    
    // Show status if disconnected for more than 10 seconds
    if (connectionState.value === 'disconnected') {
      showStatus.value = true;
    }
  }, 10000); // Update every 10 seconds
}

onMounted(() => {
  setupSocketListeners();
  startUpdateTimer();
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  if (socket) {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('reconnecting');
    socket.off('reconnect');
  }
});
</script>