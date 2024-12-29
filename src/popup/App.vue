<template>
  <div class="min-w-[300px] p-4 bg-white dark:bg-gray-800">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center">
        <img src="/images/icon48.png" alt="Logo" class="w-6 h-6 mr-2">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
          网页录制器
        </h1>
      </div>
      <button
        @click="openOptions"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        title="设置"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      </button>
    </div>

    <!-- 主要内容 -->
    <div class="space-y-4">
      <!-- 音频设置 -->
      <!-- <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex items-center">
          <div class="mr-3">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
            录制音频
          </span>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            v-model="audioEnabled"
            class="sr-only peer"
            :disabled="isRecording"
          >
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div> -->

      <!-- 录制按钮 -->
      <button
        @click="startRecording"
        :disabled="isRecording"
        class="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        <div class="flex items-center justify-center">
          <svg 
            class="w-5 h-5 mr-2" 
            :class="{ 'animate-pulse': isRecording }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
            <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
          </svg>
          {{ isRecording ? '正在录制...' : '开始录制' }}
        </div>
      </button>

      <!-- 快捷键提示 -->
      <div class="text-center text-xs text-gray-500 dark:text-gray-400">
        快捷键: {{ recordingSettings.shortcut }}
      </div>
    </div>

    <!-- 状态提示 -->
    <div
      v-if="showError"
      class="mt-4 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm rounded-lg"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRecordingStore } from '../stores/recording'
import { storeToRefs } from 'pinia'

const store = useRecordingStore()
const { isRecording, recordingSettings } = storeToRefs(store)
const audioEnabled = ref(true)
const showError = ref(false)
const errorMessage = ref('')

// 确保在组件挂载时获取最新状态
onMounted(async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getRecordingState' });
    if (response) {
      isRecording.value = response.isRecording;
      console.log('Popup mounted, recording state:', isRecording.value);
    }
  } catch (error) {
    console.error('Failed to get recording state:', error);
  }
});

const startRecording = async () => {
  try {
    await store.startRecording({
      audioEnabled: audioEnabled.value
    })
    window.close()
  } catch (error) {
    console.error('Failed to start recording:', error)
    showError.value = true
    errorMessage.value = error.message || '录制失败，请检查权限设置'
    setTimeout(() => {
      showError.value = false
    }, 3000)
  }
}

const openOptions = () => {
  chrome.runtime.openOptionsPage()
}
</script>

<style>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style> 