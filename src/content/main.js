// Global state for recording / 录制状态的全局变量
const recorderState = {
  mediaRecorder: null,     // MediaRecorder instance / 媒体录制器实例
  recordedChunks: [],      // Recorded data chunks / 录制的数据块
  isRecording: false,      // Recording status / 录制状态
  currentStream: null      // Current media stream / 当前媒体流
};

// Listen for messages from background script / 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording' && request.streamId) {
    if (!recorderState.isRecording) {
      // Send immediate response / 立即发送响应
      sendResponse({ success: true });
      // Start recording asynchronously / 异步启动录制
      startRecording(request.streamId).catch(error => {
        console.error('Recording failed:', error);
      });
    } else {
      sendResponse({ success: false, error: 'Already recording' });
    }
  }
  return false;
});

// Recording function / 录制功能
async function startRecording(streamId) {
  try {
    // Get media stream with both video and audio / 获取包含视频和音频的媒体流
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId
        }
      },
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId
        }
      }
    });

    recorderState.currentStream = stream;

    // Reset recording data / 重置录制数据
    recorderState.recordedChunks = [];
    recorderState.isRecording = true;

    // Create MediaRecorder with specified settings / 创建带有特定设置的媒体录制器
    recorderState.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 2500000, // 2.5 Mbps video bitrate / 视频比特率
      audioBitsPerSecond: 128000   // 128 kbps audio bitrate / 音频比特率
    });

    // Handle recorded data / 处理录制的数据
    recorderState.mediaRecorder.ondataavailable = (event) => {
      console.log('Data available:', event.data.size);
      if (event.data && event.data.size > 0) {
        recorderState.recordedChunks.push(event.data);
      }
    };

    // Handle recording stop / 处理录制停止
    recorderState.mediaRecorder.onstop = async () => {
      recorderState.isRecording = false;
      console.log('Recording stopped, chunks:', recorderState.recordedChunks.length);
      
      if (recorderState.recordedChunks.length > 0) {
        try {
          // Create Blob from recorded chunks / 从录制的数据块创建 Blob
          const blob = new Blob(recorderState.recordedChunks, { 
            type: 'video/webm;codecs=vp8' 
          });
          console.log('Created blob size:', blob.size);

          if (blob.size > 0) {
            // Convert Blob to ArrayBuffer / 将 Blob 转换为 ArrayBuffer
            const reader = new FileReader();
            const arrayBuffer = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(reader.error);
              reader.readAsArrayBuffer(blob);
            });

            console.log('Converted to ArrayBuffer, size:', arrayBuffer.byteLength);

            // Send message to background script / 发送消息到后台脚本
            const response = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({
                action: 'downloadRecording',
                data: Array.from(new Uint8Array(arrayBuffer)) // Convert to regular array / 转换为普通数组
              }, (response) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(response);
                }
              });
            });

            if (!response || !response.success) {
              throw new Error(response?.error || 'Failed to save recording');
            }
          } else {
            throw new Error('Generated blob is empty');
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          alert('处理录制文件时出错：' + error.message);
        }
      } else {
        console.error('No chunks recorded');
        alert('录制失败：未捕获到任何数据');
      }
      
      // Cleanup resources / 清理资源
      recorderState.recordedChunks = [];
      if (recorderState.currentStream) {
        recorderState.currentStream.getTracks().forEach(track => track.stop());
        recorderState.currentStream = null;
      }
      recorderState.mediaRecorder = null;
    };

    // Add recording status indicator / 添加录制状态指示器
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
    indicator.innerHTML = `
      <span style="width: 8px; height: 8px; background: red; border-radius: 50%; animation: blink 1s infinite;"></span>
      <span>正在录制...</span>
      <button id="stopRecording" style="
        background: #ff4444;
        color: white;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 8px;
      ">停止录制</button>
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.4; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(indicator);

    // 添加停止按钮事件
    document.getElementById('stopRecording').onclick = () => {
      if (recorderState.mediaRecorder && recorderState.mediaRecorder.state !== 'inactive') {
        recorderState.mediaRecorder.stop();
        indicator.remove();
        style.remove();
      }
    };

    // Start recording / 开始录制
    recorderState.mediaRecorder.start(100); // Get data every 100ms / 每100毫秒获取一次数据
    console.log('Recording started');

  } catch (error) {
    console.error('Failed to start recording:', error);
    recorderState.isRecording = false;
    alert('录制失败。请确保已授予必要的权限，并且不是在 Chrome 内部页面上录制。');
  }
} 