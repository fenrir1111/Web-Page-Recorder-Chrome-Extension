// 记录内容脚本加载时间
console.log('Content script loaded - ' + new Date().toISOString());

// 全局变量
let mediaRecorder = null;      // 媒体录制器
let recordedChunks = [];       // 录制的数据块
let recordingStatus = null;     // 录制状态UI元素

// 通知后台脚本内容脚本已加载
chrome.runtime.sendMessage({action: "contentScriptLoaded"});

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  // 处理开始录制的消息
  if (message.action === "startRecording" && message.streamId) {
    try {
      // 获取媒体流
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: message.streamId
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: message.streamId
          }
        }
      });

      // 配置媒体录制器
      console.log('Media stream obtained:', stream);
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      recordedChunks = [];

      // 处理数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event:', event.data.size);
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // 处理录制停止事件
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        console.log('Created blob:', blob.size, 'bytes');
        const url = URL.createObjectURL(blob);
        console.log('Created URL:', url);
        // 发送下载请求给后台脚本
        chrome.runtime.sendMessage({
          action: "downloadRecording",
          url: url
        });
        recordedChunks = [];
      };

      // 开始录制
      mediaRecorder.start(1000);  // 每秒触发一次数据可用事件
      showRecordingStatus();
      console.log('Recording started with options:', mediaRecorder.options);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }
});

// 显示录制状态UI
function showRecordingStatus() {
  if (!recordingStatus) {
    console.log('Creating recording status UI');
    recordingStatus = document.createElement('div');
    recordingStatus.className = 'recording-status';
    recordingStatus.innerHTML = `
      <span>正在录制</span>
      <button id="stopRecording">停止录制</button>
    `;
    document.body.appendChild(recordingStatus);

    // 添加停止录制按钮事件监听
    document.getElementById('stopRecording').addEventListener('click', () => {
      console.log('Stop recording button clicked');
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        recordingStatus.remove();
        recordingStatus = null;
      }
    });
  }
}

// 启动时打印消息
console.log('Content script initialization complete - ' + new Date().toISOString()); 