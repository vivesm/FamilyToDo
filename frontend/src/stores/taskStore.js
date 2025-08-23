import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([]);
  const loading = ref(false);
  const selectedPersonId = ref(null);
  const selectedCategoryId = ref(null);
  const showCompleted = ref(false);
  const showDeleted = ref(false);
  const viewMode = ref(localStorage.getItem('taskViewMode') || 'card'); // 'card' or 'list'

  // Computed properties
  const filteredTasks = computed(() => {
    let filtered = tasks.value;

    // Filter out deleted tasks unless showDeleted is true
    if (!showDeleted.value) {
      filtered = filtered.filter(task => !task.deleted);
    }

    // Filter by completion status
    if (!showCompleted.value) {
      filtered = filtered.filter(task => !task.completed);
    }

    // Filter by selected person
    if (selectedPersonId.value) {
      filtered = filtered.filter(task => 
        task.assigned_people?.some(p => p.id === selectedPersonId.value)
      );
    }

    // Filter by selected category
    if (selectedCategoryId.value) {
      filtered = filtered.filter(task => 
        task.category_id === selectedCategoryId.value
      );
    }

    // Sort by priority and due date
    return filtered.sort((a, b) => {
      // Priority sort (1=urgent, 2=soon, 3=whenever)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Then by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
  });

  const urgentTasks = computed(() => 
    filteredTasks.value.filter(task => task.priority === 1)
  );

  const soonTasks = computed(() => 
    filteredTasks.value.filter(task => task.priority === 2)
  );

  const wheneverTasks = computed(() => 
    filteredTasks.value.filter(task => task.priority === 3)
  );

  // Computed property for overdue tasks by person
  const overdueTasksByPerson = computed(() => {
    const overdueMap = new Map();
    
    // Get all non-deleted, non-completed tasks
    const activeTasks = tasks.value.filter(task => !task.deleted && !task.completed);
    
    // Check each task for overdue status
    activeTasks.forEach(task => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const now = new Date();
        
        if (now > dueDate) {
          // Task is overdue, count it for each assigned person
          if (task.assigned_people && task.assigned_people.length > 0) {
            task.assigned_people.forEach(person => {
              const currentCount = overdueMap.get(person.id) || 0;
              overdueMap.set(person.id, currentCount + 1);
            });
          }
        }
      }
    });
    
    return overdueMap;
  });

  // Actions
  async function fetchTasks(includeDeleted = false) {
    loading.value = true;
    try {
      const params = includeDeleted ? { include_deleted: 'true' } : {};
      const response = await api.get('/tasks', { params });
      tasks.value = response.data;
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      loading.value = false;
    }
  }

  async function createTask(taskData) {
    try {
      const response = await api.post('/tasks', taskData);
      // Don't push here - the socket event will handle adding to the array
      // This prevents duplicates when the creator receives their own socket event
      toast.success('Task created!');
      return response.data;
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async function updateTask(id, taskData) {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      // Don't update local store here - the socket event will handle it
      // This prevents duplicate updates for the person making the change
      toast.success('Task updated!');
      return response.data;
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async function completeTask(id) {
    try {
      const response = await api.post(`/tasks/${id}/complete`);
      // Add completion animation class
      const taskElement = document.querySelector(`[data-task-id="${id}"]`);
      if (taskElement) {
        taskElement.classList.add('task-completing');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      // Don't update local store here - the socket event will handle it
      toast.success('Task completed! 🎉');
      
      // Play completion sound if available
      playCompletionSound();
      
      return response.data;
    } catch (error) {
      toast.error('Failed to complete task');
      console.error('Error completing task:', error);
      throw error;
    }
  }

  async function uncompleteTask(id) {
    try {
      const response = await api.post(`/tasks/${id}/uncomplete`);
      // Don't update local store here - the socket event will handle it
      toast.info('Task marked as incomplete');
      return response.data;
    } catch (error) {
      toast.error('Failed to uncomplete task');
      console.error('Error uncompleting task:', error);
      throw error;
    }
  }

  async function deleteTask(id) {
    try {
      await api.delete(`/tasks/${id}`);
      // Don't update local store here - the socket event will handle it
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  function setSelectedPerson(personId) {
    selectedPersonId.value = personId;
  }

  function setSelectedCategory(categoryId) {
    selectedCategoryId.value = categoryId;
  }

  function toggleShowCompleted() {
    showCompleted.value = !showCompleted.value;
  }

  function toggleShowDeleted() {
    showDeleted.value = !showDeleted.value;
    // Refetch tasks if we're now showing deleted
    if (showDeleted.value) {
      fetchTasks(true);
    }
  }

  function setViewMode(mode) {
    viewMode.value = mode;
    localStorage.setItem('taskViewMode', mode);
  }

  // Socket event handlers
  function handleTaskCreated(task) {
    const exists = tasks.value.find(t => t.id === task.id);
    if (!exists) {
      tasks.value.push(task);
    }
  }

  function handleTaskUpdated(task) {
    const index = tasks.value.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasks.value[index] = task;
    }
  }

  function handleTaskDeleted({ id }) {
    tasks.value = tasks.value.filter(t => t.id !== id);
  }

  // Helper function to play completion sound
  function playCompletionSound() {
    try {
      const audio = new Audio('/sounds/complete.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore if sound fails to play
      });
    } catch (error) {
      // Ignore sound errors
    }
  }

  return {
    tasks,
    loading,
    selectedPersonId,
    selectedCategoryId,
    showCompleted,
    showDeleted,
    viewMode,
    filteredTasks,
    urgentTasks,
    soonTasks,
    wheneverTasks,
    overdueTasksByPerson,
    fetchTasks,
    createTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    setSelectedPerson,
    setSelectedCategory,
    toggleShowCompleted,
    toggleShowDeleted,
    setViewMode,
    handleTaskCreated,
    handleTaskUpdated,
    handleTaskDeleted
  };
});