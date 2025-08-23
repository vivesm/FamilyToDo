import { io } from 'socket.io-client';
import { useTaskStore } from '@/stores/taskStore';
import { usePeopleStore } from '@/stores/peopleStore';
import { useCategoryStore } from '@/stores/categoryStore';

let socket = null;

export function initSocket() {
  if (socket) return socket;

  socket = io('/', {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('join-family');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
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
    socket.disconnect();
    socket = null;
  }
}