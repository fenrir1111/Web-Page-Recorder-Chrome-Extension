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

  // 初始化时获取当前状态
  const initState = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getRecordingState' });
      if (response) {
        isRecording.value = response.isRecording;
        console.log('Initial recording state:', isRecording.value);
      }
    } catch (error) {
      console.error('Failed to get recording state:', error);
    }
  };

  // 在 popup 页面打开时立即初始化状态
  if (chrome.runtime?.id) {  // 确保在扩展环境中
    initState();
  }

  // 监听来自 background 的状态更新
  if (chrome.runtime?.id) {  // 确保在扩展环境中
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'recordingStateChanged') {
        console.log('Received state update:', request.isRecording);
        isRecording.value = request.isRecording;
        // 确保状态更新触发视图更新
        return false;
      }
    });
  }

  const startRecording = async (options = {}) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'startRecording',
        options: {
          audioEnabled: options.audioEnabled ?? recordingSettings.value.audioEnabled
        }
      });
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to start recording');
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  const stopRecording = () => {
    // 实际的停止录制操作会在 content script 中进行
    // background 会通过 recordingStateChanged 消息更新状态
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