// 全局录制状态
let recordingState = {
  isRecording: false
};

// 下载状态
let downloadState = {
  chunks: [],
  totalChunks: 0,
  totalSize: 0,
  mimeType: '',
  receivedChunks: 0
};

// 监听快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === 'start-recording') {
    startRecording();
  }
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startRecording") {
    startRecording().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // 异步响应
  } else if (request.action === "startDownload") {
    // 初始化下载状态
    downloadState = {
      chunks: new Array(request.totalChunks),
      totalChunks: request.totalChunks,
      totalSize: request.totalSize,
      mimeType: request.mimeType,
      receivedChunks: 0
    };
    sendResponse({ success: true });
    return false;
  } else if (request.action === "downloadChunk") {
    // 保存分块数据
    downloadState.chunks[request.chunkIndex] = request.chunk;
    downloadState.receivedChunks++;
    sendResponse({ success: true });
    return false;
  } else if (request.action === "finalizeDownload") {
    // 合并所有分块并创建下载
    handleChunkedDownload().then(sendResponse).catch((error) => {
      console.error('Download error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // 异步响应
  } else if (request.action === "getRecordingState") {
    // 返回当前录制状态
    sendResponse({ isRecording: recordingState.isRecording });
    return false;
  }
});

// 更新录制状态并通知所有相关组件
function updateRecordingState(isRecording) {
  recordingState.isRecording = isRecording;
  console.log('Recording state updated:', isRecording);
  
  // 广播状态变化给所有监听者
  chrome.runtime.sendMessage({
    action: 'recordingStateChanged',
    isRecording: isRecording
  }).catch(() => {
    // 忽略错误，因为popup可能已关闭
  });
  
  // 通知当前活动标签页
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'recordingStateChanged',
        isRecording: isRecording
      }).catch(() => {
        // 忽略错误，因为标签页可能已关闭
      });
    }
  });
}

// 处理分块下载
async function handleChunkedDownload() {
  try {
    // 更新录制状态为已停止
    updateRecordingState(false);

    if (downloadState.receivedChunks !== downloadState.totalChunks) {
      throw new Error('Not all chunks received');
    }

    // 合并所有分块
    const allChunks = new Uint8Array(downloadState.totalSize);
    let offset = 0;
    for (const chunk of downloadState.chunks) {
      allChunks.set(chunk, offset);
      offset += chunk.length;
    }

    // 创建 data URL
    const base64Data = arrayBufferToBase64(allChunks.buffer);
    const dataUrl = `data:${downloadState.mimeType};base64,${base64Data}`;

    // 创建文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `webpage-recording-${timestamp}.webm`;

    // 创建下载
    return new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (!downloadId) {
          reject(new Error('Download failed'));
        } else {
          // 清理下载状态
          downloadState = {
            chunks: [],
            totalChunks: 0,
            totalSize: 0,
            mimeType: '',
            receivedChunks: 0
          };
          resolve({ success: true });
        }
      });
    });
  } catch (error) {
    console.error('Error processing download:', error);
    throw error;
  }
}

// ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 1024;
  
  // 分块处理大文件
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.byteLength));
    chunk.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
  }
  
  return btoa(binary);
}

// 录制功能
async function startRecording() {
  try {
    // 如果已经在录制，则不要重复开始
    if (recordingState.isRecording) {
      return;
    }

    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab found');
    }

    // 检查是否是 Chrome 内部页面
    if (tab.url.startsWith('chrome://')) {
      throw new Error('Cannot record Chrome internal pages');
    }

    // 确保内容脚本已注入
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
    } catch (error) {
      console.log('Content script already injected or injection failed:', error);
    }

    // 请求屏幕捕获权限
    const streamId = await new Promise((resolve, reject) => {
      chrome.desktopCapture.chooseDesktopMedia(['tab', 'audio'], tab, (streamId) => {
        if (streamId) {
          resolve(streamId);
        } else {
          reject(new Error('Failed to get stream ID'));
        }
      });
    });

    // 向内容脚本发送消息，开始录制
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'startRecording',
        streamId: streamId
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to start recording');
    }

    // 更新录制状态
    updateRecordingState(true);

  } catch (error) {
    console.error('Failed to start recording:', error);
    // 确保状态被重置
    updateRecordingState(false);
    // 显示错误通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/images/icon48.png',
      title: '录制失败',
      message: error.message || '请确保已授予必要的权限'
    });
  }
} 