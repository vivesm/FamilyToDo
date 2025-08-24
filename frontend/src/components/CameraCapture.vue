<template>
  <div class="camera-capture">
    <!-- Camera View -->
    <div v-if="cameraActive" class="relative">
      <video 
        ref="videoElement" 
        autoplay 
        playsinline
        class="w-full h-auto rounded-xl shadow-lg"
      ></video>
      
      <!-- Camera Controls -->
      <div class="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4">
        <!-- Switch Camera (mobile only) -->
        <button
          v-if="hasMultipleCameras"
          @click="switchCamera"
          class="p-3 rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:bg-white transition-all"
        >
          <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <!-- Capture Button -->
        <button
          @click="capturePhoto"
          class="p-5 rounded-full bg-gradient-primary text-white shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        <!-- Close Camera -->
        <button
          @click="stopCamera"
          class="p-3 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Photo Preview -->
    <div v-else-if="capturedPhoto" class="relative">
      <img 
        :src="capturedPhoto" 
        alt="Captured photo" 
        class="w-full h-auto rounded-xl shadow-lg"
      >
      
      <!-- Preview Controls -->
      <div class="mt-4 flex justify-center space-x-3">
        <button
          @click="retakePhoto"
          class="btn-secondary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Retake
        </button>
        
        <button
          @click="acceptPhoto"
          class="btn-primary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Use Photo
        </button>
      </div>
    </div>
    
    <!-- Start Camera Button -->
    <div v-else class="text-center">
      <button
        @click="startCamera"
        class="inline-flex items-center px-6 py-4 bg-gradient-primary text-white rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
      >
        <svg class="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Open Camera
      </button>
      
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
        Take a photo to attach to this task
      </p>
    </div>
    
    <!-- Hidden canvas for photo capture -->
    <canvas ref="canvasElement" class="hidden"></canvas>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';

const props = defineProps({
  maxWidth: {
    type: Number,
    default: 1920
  },
  maxHeight: {
    type: Number,
    default: 1080
  },
  quality: {
    type: Number,
    default: 0.85
  }
});

const emit = defineEmits(['captured', 'error', 'cancel']);

const toast = useToast();
const videoElement = ref(null);
const canvasElement = ref(null);
const cameraActive = ref(false);
const capturedPhoto = ref(null);
const hasMultipleCameras = ref(false);
const currentFacingMode = ref('environment'); // 'environment' for back camera, 'user' for front
let stream = null;

// Start camera
async function startCamera() {
  try {
    // Check for camera permissions
    const constraints = {
      video: {
        facingMode: currentFacingMode.value,
        width: { ideal: props.maxWidth },
        height: { ideal: props.maxHeight }
      },
      audio: false
    };
    
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (videoElement.value) {
      videoElement.value.srcObject = stream;
    }
    
    cameraActive.value = true;
    
    // Check if multiple cameras are available (mobile)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      hasMultipleCameras.value = videoDevices.length > 1;
    } catch (err) {
      console.log('Could not enumerate devices');
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
    toast.error('Could not access camera. Please check permissions.');
    emit('error', error);
  }
}

// Stop camera
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  cameraActive.value = false;
  capturedPhoto.value = null;
  emit('cancel');
}

// Switch between front and back camera
async function switchCamera() {
  currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment';
  
  // Stop current stream
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  // Start with new camera
  await startCamera();
}

// Capture photo from video
function capturePhoto() {
  if (!videoElement.value || !canvasElement.value) return;
  
  const video = videoElement.value;
  const canvas = canvasElement.value;
  
  // Set canvas size to video dimensions
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw video frame to canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Convert to base64
  capturedPhoto.value = canvas.toDataURL('image/jpeg', props.quality);
  
  // Stop camera stream
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  cameraActive.value = false;
}

// Retake photo
function retakePhoto() {
  capturedPhoto.value = null;
  startCamera();
}

// Accept captured photo
function acceptPhoto() {
  if (capturedPhoto.value) {
    emit('captured', capturedPhoto.value);
    capturedPhoto.value = null;
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});
</script>

<style scoped>
.camera-capture {
  @apply w-full;
}

video {
  transform: scaleX(-1); /* Mirror video for selfie camera */
}

.camera-capture[data-facing="environment"] video {
  transform: scaleX(1); /* Don't mirror for back camera */
}
</style>