import { ref } from 'vue';

export function useLongPress(callback, delay = 800) {
  const isLongPress = ref(false);
  const isLongPressActive = ref(false);
  let pressTimer = null;
  let startX = 0;
  let startY = 0;
  const moveThreshold = 10; // pixels

  const start = (event) => {
    const target = event.target;
    
    // Check if we're in a long-press-area
    const longPressArea = target.closest('.long-press-area');
    if (!longPressArea) {
      return; // Not in a designated long-press area
    }
    
    // Don't trigger on any interactive elements
    const isInteractive = target.closest('button, a, input, textarea, select, [role="button"], img, .filter-chip, .view-toggle-btn, svg, path');
    
    if (isInteractive) {
      return; // Don't interfere with interactive elements
    }
    
    // Only trigger on the actual background/whitespace
    const isBackground = target.classList.contains('bg-white') || 
                        target.classList.contains('dark:bg-gray-800') ||
                        target.classList.contains('px-4') ||
                        target.classList.contains('py-2') ||
                        target.closest('.bg-white.dark\\:bg-gray-800') ||
                        target === longPressArea;
    
    if (!isBackground) {
      return; // Not clicking on background
    }
    
    // Prevent default to avoid text selection on long press
    event.preventDefault();
    
    // Store initial touch/mouse position
    if (event.touches) {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    } else {
      startX = event.clientX;
      startY = event.clientY;
    }
    
    isLongPress.value = false;
    isLongPressActive.value = true;
    pressTimer = setTimeout(() => {
      isLongPress.value = true;
      isLongPressActive.value = false;
      // Add haptic feedback for mobile devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      callback();
    }, delay);
  };

  const move = (event) => {
    if (!pressTimer) return;
    
    // Get current position
    let currentX, currentY;
    if (event.touches) {
      currentX = event.touches[0].clientX;
      currentY = event.touches[0].clientY;
    } else {
      currentX = event.clientX;
      currentY = event.clientY;
    }
    
    // Check if movement exceeds threshold
    const deltaX = Math.abs(currentX - startX);
    const deltaY = Math.abs(currentY - startY);
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      cancel();
    }
  };

  const cancel = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    isLongPress.value = false;
    isLongPressActive.value = false;
  };

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onMouseMove: move,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onTouchMove: move,
    isLongPress,
    isLongPressActive
  };
}