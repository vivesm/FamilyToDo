import { ref, onMounted, onUnmounted } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { usePeopleStore } from '@/stores/peopleStore';
import { useCategoryStore } from '@/stores/categoryStore';

export function useAutoRefresh(intervalMs = 30000) { // Default 30 seconds
  const isRefreshing = ref(false);
  const lastRefresh = ref(new Date());
  let refreshInterval = null;
  let visibilityHandler = null;
  
  const taskStore = useTaskStore();
  const peopleStore = usePeopleStore();
  const categoryStore = useCategoryStore();
  
  // Refresh data function
  async function refreshData(force = false) {
    // Don't refresh if already refreshing
    if (isRefreshing.value && !force) return;
    
    // Don't refresh if page is hidden (to save resources)
    if (document.hidden && !force) return;
    
    isRefreshing.value = true;
    
    try {
      // Store current task IDs to detect changes
      const currentTaskIds = new Set(taskStore.tasks.map(t => t.id));
      
      // Fetch all data in parallel
      await Promise.all([
        taskStore.fetchTasks(),
        peopleStore.fetchPeople(),
        categoryStore.fetchCategories()
      ]);
      
      // Check for new tasks
      const newTaskIds = new Set(taskStore.tasks.map(t => t.id));
      const hasChanges = currentTaskIds.size !== newTaskIds.size || 
                        ![...currentTaskIds].every(id => newTaskIds.has(id));
      
      if (hasChanges) {
        console.log('Auto-refresh: Data changes detected');
      }
      
      lastRefresh.value = new Date();
    } catch (error) {
      console.error('Auto-refresh error:', error);
    } finally {
      isRefreshing.value = false;
    }
  }
  
  // Start auto-refresh
  function startAutoRefresh() {
    // Clear any existing interval
    stopAutoRefresh();
    
    // Set up periodic refresh
    refreshInterval = setInterval(() => {
      refreshData();
    }, intervalMs);
    
    // Refresh when page becomes visible
    visibilityHandler = () => {
      if (!document.hidden) {
        // Check if it's been more than intervalMs since last refresh
        const timeSinceLastRefresh = Date.now() - lastRefresh.value.getTime();
        if (timeSinceLastRefresh > intervalMs) {
          refreshData();
        }
      }
    };
    
    document.addEventListener('visibilitychange', visibilityHandler);
  }
  
  // Stop auto-refresh
  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
  }
  
  // Lifecycle hooks
  onMounted(() => {
    startAutoRefresh();
  });
  
  onUnmounted(() => {
    stopAutoRefresh();
  });
  
  return {
    isRefreshing,
    lastRefresh,
    refreshData,
    startAutoRefresh,
    stopAutoRefresh
  };
}