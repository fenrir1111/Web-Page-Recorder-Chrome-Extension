<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <!-- 标题 -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">录制器设置</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          自定义您的网页录制体验
        </p>
      </div>

      <!-- 设置卡片 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
        <!-- 快捷键设置 -->
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                快捷键设置
              </h3>
              <div class="mt-2">
                <input
                  type="text"
                  v-model="settings.shortcut"
                  @keydown="handleKeyDown"
                  readonly
                  class="block w-full px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="点击此处设置快捷键"
                >
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  当前快捷键: {{ settings.shortcut }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 音频设置 -->
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                音频设置
              </h3>
              <div class="mt-2 space-y-4">
                <label class="inline-flex items-center">
                  <input
                    type="checkbox"
                    v-model="settings.audioEnabled"
                    class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                  <span class="ml-2 text-gray-700 dark:text-gray-300">启用音频录制</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频质量设置 -->
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                视频质量
              </h3>
              <div class="mt-2">
                <select
                  v-model="settings.videoQuality"
                  class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option
                    v-for="option in qualityOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }} - {{ option.description }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 界面设置 -->
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                界面设置
              </h3>
              <div class="mt-2 space-y-4">
                <label class="inline-flex items-center">
                  <input
                    type="checkbox"
                    v-model="settings.showStatusBar"
                    class="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                  <span class="ml-2 text-gray-700 dark:text-gray-300">显示录制状态栏</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800">
          <div class="flex justify-end">
            <button
              @click="saveSettings"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知 -->
    <div
      v-if="notification.show"
      class="fixed bottom-4 right-4 px-4 py-2 rounded-md text-white"
      :class="notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
    >
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRecordingStore } from '../stores/recording'

const store = useRecordingStore()
const settings = ref({
  shortcut: 'Alt+Shift+X',
  showStatusBar: true,
  saveDirectory: '',
  audioEnabled: true,
  videoQuality: 'high'
})

const notification = ref({
  show: false,
  message: '',
  type: 'success'
})

const qualityOptions = [
  {
    value: 'high',
    label: '高质量',
    description: '2.5 Mbps, 适合高清录制'
  },
  {
    value: 'medium',
    label: '中等质量',
    description: '1.5 Mbps, 平衡质量与文件大小'
  },
  {
    value: 'low',
    label: '低质量',
    description: '800 Kbps, 适合长时间录制'
  }
]

onMounted(async () => {
  try {
    const result = await chrome.storage.sync.get(['recordingSettings'])
    if (result.recordingSettings) {
      settings.value = { ...settings.value, ...result.recordingSettings }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    showNotification('加载设置失败', 'error')
  }
})

const handleKeyDown = (e) => {
  e.preventDefault()
  const keys = []
  if (e.ctrlKey) keys.push('Ctrl')
  if (e.altKey) keys.push('Alt')
  if (e.shiftKey) keys.push('Shift')
  if (e.metaKey) keys.push('Command')
  
  if (![16, 17, 18, 91].includes(e.keyCode)) {
    keys.push(e.key.toUpperCase())
  }
  
  if (keys.length > 0) {
    settings.value.shortcut = keys.join('+')
  }
}

const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const saveSettings = async () => {
  try {
    await store.updateSettings(settings.value)
    showNotification('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    showNotification('保存设置失败: ' + error.message, 'error')
  }
}
</script> 