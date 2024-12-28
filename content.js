// 防止重复加载
if (window.hasOwnProperty('mediaRecorder')) {
  console.log('Content script already loaded, skipping initialization');
} else {
  // 记录内容脚本加载时间
  console.log('Content script loaded - ' + new Date().toISOString());

  // 全局变量
  window.mediaRecorder = null;      // 媒体录制器
  window.recordedChunks = [];       // 录制的数据块
  window.recordingStatus = null;     // 录制状态UI元素

  // 通知后台脚本内容脚本已加载
  chrome.runtime.sendMessage({action: "contentScriptLoaded"});

  // 显示录制状态UI
  function showRecordingStatus() {
    if (!window.recordingStatus) {
      console.log('Creating recording status UI');
      
      // 创建录制状态UI
      window.recordingStatus = document.createElement('div');
      window.recordingStatus.className = 'recording-status';
      window.recordingStatus.innerHTML = `
        <span>正在录制</span>
        <button id="stopRecording">停止</button>
        <button class="toggle-visibility" title="显示/隐藏">👁</button>
      `;
      document.body.appendChild(window.recordingStatus);

      // 默认隐藏状态
      window.recordingStatus.classList.add('hidden');

      // 添加停止录制按钮事件监听
      document.getElementById('stopRecording').addEventListener('click', () => {
        console.log('Stop recording button clicked');
        if (window.mediaRecorder && window.mediaRecorder.state !== 'inactive') {
          window.mediaRecorder.stop();
          window.recordingStatus.remove();
          window.recordingStatus = null;
          // 关闭媒体流
          if (window.mediaStream) {
            window.mediaStream.getTracks().forEach(track => track.stop());
          }
        }
      });

      // 添加显示/隐藏切换按钮事件监听
      window.recordingStatus.querySelector('.toggle-visibility').addEventListener('click', (e) => {
        e.stopPropagation();
        window.recordingStatus.classList.toggle('hidden');
      });

      // 添加快捷键切换显示状态
      window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'h') { // Alt+H 切换显示/隐藏
          e.preventDefault();
          window.recordingStatus.classList.toggle('hidden');
        }
      });
    }
  }

  // 在 content.js 中添加错误提示函数
  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #ff4444;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 2147483647;
      font-family: Arial, sans-serif;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }

  // 监听来自后台脚本的消息
  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    // 处理开始录制的消息
    if (message.action === "startRecording" && message.streamId) {
      try {
        // 获取媒体流
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: message.streamId,
              maxWidth: window.screen.width,
              maxHeight: window.screen.height
            }
          },
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: message.streamId
            }
          }
        });

        // 保存媒体流引用
        window.mediaStream = stream;

        // 配置媒体录制器
        window.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8,opus',
          videoBitsPerSecond: 2500000, // 2.5 Mbps
          audioBitsPerSecond: 128000   // 128 kbps
        });
        window.recordedChunks = [];

        // 处理数据可用事件
        window.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            window.recordedChunks.push(event.data);
          }
        };

        // 处理录制停止事件
        window.mediaRecorder.onstop = () => {
          const blob = new Blob(window.recordedChunks, { 
            type: 'video/webm;codecs=vp8,opus' 
          });
          const url = URL.createObjectURL(blob);
          chrome.runtime.sendMessage({
            action: "downloadRecording",
            url: url
          });
          window.recordedChunks = [];
          
          // 清理媒体流
          if (window.mediaStream) {
            window.mediaStream.getTracks().forEach(track => track.stop());
            window.mediaStream = null;
          }
        };

        // 开始录制
        window.mediaRecorder.start(1000);
        showRecordingStatus();
      } catch (error) {
        console.error('Error starting recording:', error);
        showError('录制失败：' + (error.message || '未知错误'));
      }
    }
  });

  // 添加全局快捷键监听
  document.addEventListener('keydown', (e) => {
    // 检查默认快捷键 Alt+Shift+X
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      showNotification('开始录制...');
      chrome.runtime.sendMessage({ action: "startRecording" });
    }
  });

  // 启动时打印消息
  console.log('Content script initialization complete - ' + new Date().toISOString());
}

function showNotification(message) {
  const notificationDiv = document.createElement('div');
  notificationDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 2147483647;
    font-family: Arial, sans-serif;
  `;
  notificationDiv.textContent = message;
  document.body.appendChild(notificationDiv);
  setTimeout(() => notificationDiv.remove(), 2000);
} 