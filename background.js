// 记录后台脚本加载时间
console.log('Background script loaded - ' + new Date().toISOString());

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  if (command === "start-recording") {
    startRecordingProcess();
  }
});

// 监听扩展图标点击
chrome.action.onClicked.addListener(() => {
  console.log('Extension icon clicked');
  startRecordingProcess();
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

    // 检查是否是受限页面（Chrome内部页面等）
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') ||
        tab.url.startsWith('chrome-extension://')) {
      console.error('Cannot access this type of page');
      return;
    }

    // 注入内容脚本
    try {
      await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['content.js']
      });
      console.log('Content script injected');
    } catch (e) {
      console.log('Content script already exists or injection failed:', e);
    }

    // 请求屏幕捕获权限
    const pending = chrome.desktopCapture.chooseDesktopMedia(
      ["screen", "window", "tab"],
      tab,
      (streamId) => {
        if (!streamId) {
          console.error('No stream ID received');
          return;
        }
        // 将streamId发送给content script开始录制
        chrome.tabs.sendMessage(tab.id, {
          action: "startRecording",
          streamId: streamId
        }).catch(error => {
          console.error('Error sending message to content script:', error);
        });
      }
    );

    // 检查是否成功启动捕获选择
    if (!pending) {
      console.error('Failed to start desktop capture');
    }

  } catch (error) {
    console.error('Error in startRecordingProcess:', error, error.stack);
  }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  if (message.action === "downloadRecording") {
    // 生成不包含非法字符的文件名
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')     // 替换冒号为横杠
      .replace(/\./g, '-')    // 替换点号为横杠
      .replace(/[T]/g, '_');  // 替换T为下划线
    
    // 触发下载
    chrome.downloads.download({
      url: message.url,
      filename: `recording_${timestamp}.webm`,
      saveAs: true
    });
  }
}); 