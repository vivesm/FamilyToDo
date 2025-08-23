import { ref, watchEffect } from 'vue';

// Create a reactive dark mode state
const isDark = ref(false);

export function useDarkMode() {
  // Initialize from localStorage or system preference
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      isDark.value = stored === 'true';
    } else {
      // Use system preference if no stored preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  // Apply/remove dark class on document root
  watchEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDark.value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Persist preference to localStorage
      localStorage.setItem('darkMode', String(isDark.value));
    }
  });

  // Toggle function
  const toggleDarkMode = () => {
    isDark.value = !isDark.value;
  };

  return {
    isDark,
    toggleDarkMode
  };
}