import { ref } from 'vue';

export function useLongPressButton(callback, delay = 1000) {
  const isLongPress = ref(false);
  const isLongPressActive = ref(false);
  let pressTimer = null;
  let startX = 0;
  let startY = 0;
  const moveThreshold = 10; // pixels

  const start = (event) => {
    // Prevent default to avoid issues with touch events
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
      
      // Call the callback function (open settings)
      callback();
      
      // Cancel the timer
      cancel();
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