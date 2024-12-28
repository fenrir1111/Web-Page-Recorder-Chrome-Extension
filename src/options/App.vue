<template>
  <div class="options">
    <h1>录制器设置</h1>
    
    <div class="setting-item">
      <label>录制快捷键:</label>
      <input 
        type="text"
        :value="settings.shortcut"
        @keydown="handleKeyDown"
        placeholder="点击此处设置快捷键"
        readonly
      >
      <div class="hint">当前快捷键: {{ settings.shortcut }}</div>
    </div>

    <div class="setting-item">
      <label>
        <input 
          type="checkbox" 
          v-model="settings.audioEnabled"
        >
        启用音频录制
      </label>
    </div>

    <div class="setting-item">
      <label>
        <input 
          type="checkbox" 
          v-model="settings.showStatusBar"
        >
        显示录制状态栏
      </label>
    </div>

    <div class="setting-item">
      <label>视频质量:</label>
      <select v-model="settings.videoQuality">
        <option value="high">高质量</option>
        <option value="medium">中等质量</option>
        <option value="low">低质量</option>
      </select>
    </div>

    <button class="save-btn" @click="saveSettings">保存设置</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRecordingStore } from '../stores/recording'

const store = useRecordingStore()
const settings = ref({ ...store.recordingSettings })

onMounted(async () => {
  const result = await chrome.storage.sync.get(['recordingSettings'])
  if (result.recordingSettings) {
    settings.value = { ...settings.value, ...result.recordingSettings }
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

const saveSettings = async () => {
  try {
    await store.updateSettings(settings.value)
    // 更新命令快捷键
    if (chrome.commands) {
      await chrome.commands.update({
        name: 'start-recording',
        shortcut: settings.value.shortcut
      })
    }
    showMessage('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    showMessage('保存设置失败', 'error')
  }
}

const showMessage = (message, type = 'success') => {
  // 使用 Chrome 通知 API
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/images/icon48.png',
    title: '录制器设置',
    message: message
  })
}
</script>

<style scoped>
.options {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 24px;
}

.setting-item {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 8px;
}

.hint {
  font-size: 12px;
  color: #666;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn:hover {
  background-color: #45a049;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 8px;
}

input[type="checkbox"] {
  margin-right: 8px;
}
</style> 