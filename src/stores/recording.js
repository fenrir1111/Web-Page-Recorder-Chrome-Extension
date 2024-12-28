import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRecordingStore = defineStore('recording', () => {
  const isRecording = ref(false)
  const recordingSettings = ref({
    shortcut: 'Alt+Shift+X',
    showStatusBar: true,
    saveDirectory: '',
    audioEnabled: true,
    videoQuality: 'high'
  })

  const startRecording = async (options = {}) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'startRecording',
        options: {
          audioEnabled: options.audioEnabled ?? recordingSettings.value.audioEnabled
        }
      })
      if (response && response.success) {
        isRecording.value = true
      }
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  const stopRecording = () => {
    isRecording.value = false
  }

  const updateSettings = async (settings) => {
    recordingSettings.value = { ...recordingSettings.value, ...settings }
    // 保存到 chrome.storage
    await chrome.storage.sync.set({ recordingSettings: recordingSettings.value })
  }

  return {
    isRecording,
    recordingSettings,
    startRecording,
    stopRecording,
    updateSettings
  }
}) 