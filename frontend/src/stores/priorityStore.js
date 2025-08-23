import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const usePriorityStore = defineStore('priorities', () => {
  // Default priority configurations
  const defaultPriorities = {
    1: { name: 'Urgent', emoji: '🔴', color: '#EF4444' },
    2: { name: 'Soon', emoji: '🟡', color: '#F59E0B' },
    3: { name: 'Whenever', emoji: '🟢', color: '#10B981' }
  };

  // Load from localStorage or use defaults
  const loadPriorities = () => {
    const stored = localStorage.getItem('prioritySettings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse priority settings:', e);
        return defaultPriorities;
      }
    }
    return defaultPriorities;
  };

  const priorities = ref(loadPriorities());

  // Watch for changes and save to localStorage
  watch(priorities, (newPriorities) => {
    localStorage.setItem('prioritySettings', JSON.stringify(newPriorities));
  }, { deep: true });

  // Get priority by level
  function getPriority(level) {
    return priorities.value[level] || defaultPriorities[level];
  }

  // Update priority
  function updatePriority(level, updates) {
    priorities.value[level] = {
      ...priorities.value[level],
      ...updates
    };
  }

  // Reset to defaults
  function resetToDefaults() {
    priorities.value = { ...defaultPriorities };
  }

  return {
    priorities,
    getPriority,
    updatePriority,
    resetToDefaults
  };
});