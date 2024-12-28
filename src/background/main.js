// 监听快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === 'start-recording') {
    startRecording();
  }
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startRecording") {
    startRecording();
    return false; // 同步响应
  } else if (request.action === "downloadRecording") {
    handleDownload(request.data).then(sendResponse).catch((error) => {
      console.error('Download error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // 异步响应
  }
});

// 处理下载
async function handleDownload(data) {
  try {
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data received');
    }

    // 转换回 ArrayBuffer
    const arrayBuffer = new Uint8Array(data).buffer;
    console.log('Received recording data, size:', arrayBuffer.byteLength);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `webpage-recording-${timestamp}.webm`;

    // 创建 data URL
    const base64Data = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:video/webm;base64,${base64Data}`;

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

  } catch (error) {
    console.error('Failed to start recording:', error);
    // 显示错误通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/images/icon48.png',
      title: '录制失败',
      message: error.message || '请确保已授予必要的权限'
    });
  }
} 