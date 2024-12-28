// 记录后台脚本加载时间
console.log('Background script loaded - ' + new Date().toISOString());

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  if (command === "start-recording" || command === "_execute_action") {
    startRecordingProcess();
  }
});

// 监听扩展图标点击
chrome.action.onClicked.addListener(() => {
  console.log('Extension icon clicked');
  startRecordingProcess();
});

// 监听键盘事件
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "keyPress") {
    // 检查是否匹配快捷键
    if (message.altKey && message.shiftKey && message.key.toLowerCase() === 'x') {
      startRecordingProcess();
    }
  }
  // ... 其他消息处理 ...
});

// 处理录制启动流程
async function startRecordingProcess() {
  console.log('Starting recording process');
  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    
    // 验证标签页是否有效
    if (!tab) {
      console.error('No active tab found');
      return;
    }

    // 检查标签页URL是否可访问
    if (!tab.url) {
      console.error('Tab URL is not accessible');
      return;
    }

    // 检查是否是受限页面
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') ||
        tab.url.startsWith('chrome-extension://')) {
      console.error('Cannot access this type of page');
      return;
    }

    try {
      // 请求标签页捕获
      const pending = chrome.desktopCapture.chooseDesktopMedia(
        ["tab", "audio"], // 添加音频捕获
        tab,
        (streamId) => {
          if (!streamId) {
            console.error('No stream ID received');
            return;
          }
          chrome.tabs.sendMessage(tab.id, {
            action: "startRecording",
            streamId: streamId
          }).catch(error => {
            if (error.message.includes('Could not establish connection')) {
              chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: ['content.js']
              }).then(() => {
                chrome.tabs.sendMessage(tab.id, {
                  action: "startRecording",
                  streamId: streamId
                });
              });
            } else {
              console.error('Error sending message to content script:', error);
            }
          });
        }
      );

      if (!pending) {
        console.error('Failed to start desktop capture');
      }
    } catch (error) {
      console.error('Error in capture process:', error);
    }

  } catch (error) {
    console.error('Error in startRecordingProcess:', error, error.stack);
  }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  
  // 处理录制请求
  if (message.action === "startRecording") {
    startRecordingProcess();
    return;
  }

  // 处理下载请求
  if (message.action === "downloadRecording") {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .replace(/[T]/g, '_');
    
    chrome.downloads.download({
      url: message.url,
      filename: `recording_${timestamp}.webm`,
      saveAs: true
    });
    return;
  }

  // 处理快捷键更新
  if (message.action === 'updateShortcut') {
    chrome.storage.sync.set({ recordingShortcut: message.shortcut }, () => {
      chrome.runtime.sendMessage({
        action: 'shortcutUpdated'
      });
    });
    return;
  }
});

// 添加快捷键冲突检测
chrome.runtime.onInstalled.addListener(() => {
  // 设置默认快捷键
  chrome.storage.sync.get(['recordingShortcut'], (result) => {
    if (!result.recordingShortcut) {
      chrome.storage.sync.set({
        recordingShortcut: 'Alt+Shift+X'
      });
    }
  });

  // 检查快捷键冲突
  chrome.commands.getAll((commands) => {
    commands.forEach(command => {
      if (command.shortcut) {
        console.log(`Registered command: ${command.name} with shortcut: ${command.shortcut}`);
      }
    });
  });
}); 