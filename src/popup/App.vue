<template>
  <div class="popup">
    <h2>网页录制器</h2>
    <div class="controls">
      <div class="settings-group">
        <label>
          <input 
            type="checkbox" 
            v-model="audioEnabled"
            :disabled="isRecording"
          >
          录制网页音频
        </label>
      </div>
      <button 
        @click="startRecording" 
        :disabled="isRecording"
        class="record-btn"
      >
        {{ isRecording ? '正在录制...' : '开始录制' }}
      </button>
      <div class="shortcut-hint">
        快捷键: {{ recordingSettings.shortcut }}
      </div>
      <div class="settings">
        <a href="#" @click="openOptions" class="settings-link">设置</a>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRecordingStore } from '@/stores/recording'

export default {
  setup() {
    const recordingStore = useRecordingStore()
    const audioEnabled = ref(true)

    const startRecording = async () => {
      try {
        await recordingStore.startRecording({
          audioEnabled: audioEnabled.value
        })
      } catch (error) {
        console.error('Failed to start recording:', error)
      }
    }

    const openOptions = () => {
      chrome.runtime.openOptionsPage()
    }

    return {
      isRecording: recordingStore.isRecording,
      recordingSettings: recordingStore.recordingSettings,
      audioEnabled,
      startRecording,
      openOptions
    }
  }
}
</script>

<style scoped>
.popup {
  width: 300px;
  padding: 16px;
  font-family: Arial, sans-serif;
}

h2 {
  margin: 0 0 16px;
  color: #333;
  font-size: 18px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.record-btn {
  background-color: #ff4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.record-btn:hover {
  background-color: #ff2222;
}

.record-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.shortcut-hint {
  color: #666;
  font-size: 12px;
}

.settings {
  margin-top: 16px;
  text-align: center;
}

.settings-link {
  color: #2196f3;
  text-decoration: none;
  font-size: 14px;
}

.settings-link:hover {
  text-decoration: underline;
}

.settings-group {
  margin-bottom: 12px;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

input[type="checkbox"] {
  margin: 0;
}
</style> 