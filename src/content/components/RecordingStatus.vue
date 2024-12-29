<template>
  <div class="recording-status" :class="{ hidden: !isRecording || isHidden }">
    <span>正在录制</span>
    <button @click="stopRecording">停止</button>
    <button class="toggle-visibility" 
            @click="toggleVisibility" 
            title="显示/隐藏">👁</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRecorder } from '../composables/useRecorder'
import { useRecordingStore } from '../../stores/recording'
import { storeToRefs } from 'pinia'

const store = useRecordingStore()
const { isRecording } = storeToRefs(store)
const isHidden = ref(false)
const { stopRecording } = useRecorder()

const toggleVisibility = () => {
  isHidden.value = !isHidden.value
}
</script>

<style scoped>
.recording-status {
  position: fixed;
  top: 0;
  right: 0;
  background-color: rgba(255, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-bottom-left-radius: 5px;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: Arial, sans-serif;
  font-size: 12px;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.hidden {
  opacity: 0;
  transform: translateY(-100%);
  pointer-events: none;
}

button {
  background-color: white;
  color: #ff0000;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  min-width: 40px;
}

.toggle-visibility {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 2px;
  opacity: 0.8;
}

.toggle-visibility:hover {
  opacity: 1;
}
</style> 