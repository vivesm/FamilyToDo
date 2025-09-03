import { io } from 'socket.io-client';
import { useTaskStore } from '@/stores/taskStore';
import { usePeopleStore } from '@/stores/peopleStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useToast } from 'vue-toastification';

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 1000; // Start with 1 second

const toast = useToast();

export function initSocket() {
  if (socket) return socket;

  // Determine the socket URL based on the current environment
  let socketUrl = '/';
  
  // If we're on the production domain, use the explicit backend URL
  if (window.location.hostname === 'todo.vives.io') {
    socketUrl = 'https://todo.vives.io';
  } else if (window.location.hostname.includes('100.') || window.location.hostname.includes('tailscale')) {
    // For Tailscale access, use the current origin
    socketUrl = window.location.origin;
  }

  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: reconnectDelay,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: maxReconnectAttempts
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    if (reconnectAttempts > 0) {
      toast.success('Reconnected to server');
      reconnectAttempts = 0;
    }
    socket.emit('join-family');
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected from server:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected, attempt to reconnect
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    console.error('Connection error:', error.message);
    
    if (reconnectAttempts === 1) {
      toast.warning('Connection lost, attempting to reconnect...');
    } else if (reconnectAttempts >= maxReconnectAttempts) {
      toast.error('Unable to reconnect. Please refresh the page.');
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('Reconnected after', attemptNumber, 'attempts');
    toast.success('Connection restored');
    reconnectAttempts = 0;
  });

  socket.on('reconnect_failed', () => {
    toast.error('Failed to reconnect. Please refresh the page.');
  });

  // Task events
  const taskStore = useTaskStore();
  socket.on('task-created', (task) => {
    taskStore.handleTaskCreated(task);
  });
  
  socket.on('task-updated', (task) => {
    taskStore.handleTaskUpdated(task);
  });
  
  socket.on('task-completed', (task) => {
    taskStore.handleTaskUpdated(task);
  });
  
  socket.on('task-uncompleted', (task) => {
    taskStore.handleTaskUpdated(task);
  });
  
  socket.on('task-deleted', (data) => {
    taskStore.handleTaskDeleted(data);
  });

  // People events
  const peopleStore = usePeopleStore();
  socket.on('person-created', (person) => {
    peopleStore.handlePersonCreated(person);
  });
  
  socket.on('person-updated', (person) => {
    peopleStore.handlePersonUpdated(person);
  });
  
  socket.on('person-deleted', (data) => {
    peopleStore.handlePersonDeleted(data);
  });

  // Category events
  const categoryStore = useCategoryStore();
  socket.on('category-created', (category) => {
    categoryStore.handleCategoryCreated(category);
  });
  
  socket.on('category-updated', (category) => {
    categoryStore.handleCategoryUpdated(category);
  });
  
  socket.on('category-deleted', (data) => {
    categoryStore.handleCategoryDeleted(data);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    // Remove all listeners to prevent memory leaks
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
}

export function cleanupSocketListeners() {
  if (socket) {
    // Keep connection but remove specific listeners
    // This is useful when switching between views
    socket.off('task-created');
    socket.off('task-updated');
    socket.off('task-completed');
    socket.off('task-uncompleted');
    socket.off('task-deleted');
    socket.off('person-created');
    socket.off('person-updated');
    socket.off('person-deleted');
    socket.off('category-created');
    socket.off('category-updated');
    socket.off('category-deleted');
  }
}

export function reattachSocketListeners() {
  if (!socket) return;
  
  // Reattach task listeners
  const taskStore = useTaskStore();
  socket.on('task-created', (task) => {
    taskStore.handleTaskCreated(task);
  });
  
  socket.on('task-updated', (task) => {
    taskStore.handleTaskUpdated(task);
  });
  
  socket.on('task-completed', (task) => {
    taskStore.handleTaskUpdated(task);
  });
  
  socket.on('task-uncompleted', (task) => {
    taskStore.handleTaskUpdated(task);
  });
  
  socket.on('task-deleted', (data) => {
    taskStore.handleTaskDeleted(data);
  });

  // Reattach people listeners
  const peopleStore = usePeopleStore();
  socket.on('person-created', (person) => {
    peopleStore.handlePersonCreated(person);
  });
  
  socket.on('person-updated', (person) => {
    peopleStore.handlePersonUpdated(person);
  });
  
  socket.on('person-deleted', (data) => {
    peopleStore.handlePersonDeleted(data);
  });

  // Reattach category listeners
  const categoryStore = useCategoryStore();
  socket.on('category-created', (category) => {
    categoryStore.handleCategoryCreated(category);
  });
  
  socket.on('category-updated', (category) => {
    categoryStore.handleCategoryUpdated(category);
  });
  
  socket.on('category-deleted', (data) => {
    categoryStore.handleCategoryDeleted(data);
  });
}