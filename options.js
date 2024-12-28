let currentShortcut = '';

// 页面加载时获取已保存的快捷键
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await chrome.storage.sync.get(['recordingShortcut']);
    if (result.recordingShortcut) {
      document.getElementById('recordingShortcut').value = result.recordingShortcut;
      currentShortcut = result.recordingShortcut;
    } else {
      // 设置默认快捷键
      document.getElementById('recordingShortcut').value = 'Alt+Shift+X';
      currentShortcut = 'Alt+Shift+X';
    }
  } catch (error) {
    console.error('Error loading saved shortcut:', error);
    showMessage('加载设置失败，使用默认快捷键', 'error');
  }
});

// 添加消息提示功能
function showMessage(message, type = 'success') {
  // 移除已有的消息
  const existingMsg = document.querySelector('.message');
  if (existingMsg) {
    existingMsg.remove();
  }

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;
  msgDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 4px;
    animation: slideIn 0.3s ease;
    z-index: 1000;
    font-weight: bold;
  `;
  
  if (type === 'success') {
    msgDiv.style.backgroundColor = '#4CAF50';
    msgDiv.style.color = 'white';
  } else {
    msgDiv.style.backgroundColor = '#f44336';
    msgDiv.style.color = 'white';
  }

  msgDiv.textContent = message;
  document.body.appendChild(msgDiv);

  // 3秒后自动消失
  setTimeout(() => {
    msgDiv.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => msgDiv.remove(), 300);
  }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// 监听快捷键输入
document.getElementById('recordingShortcut').addEventListener('keydown', (e) => {
  e.preventDefault();
  
  const keys = [];
  if (e.ctrlKey) keys.push('Ctrl');
  if (e.altKey) keys.push('Alt');
  if (e.shiftKey) keys.push('Shift');
  if (e.metaKey) keys.push('Command');
  
  // 添加主键（如果不是修饰键）
  if (![16, 17, 18, 91].includes(e.keyCode)) {
    keys.push(e.key.toUpperCase());
  }
  
  if (keys.length > 0) {
    currentShortcut = keys.join('+');
    e.target.value = currentShortcut;
    
    // 检查快捷键冲突
    chrome.commands.getAll((commands) => {
      const conflicts = commands.some(cmd => 
        cmd.shortcut && cmd.shortcut === currentShortcut && cmd.name !== 'start-recording'
      );
      document.getElementById('conflictWarning').style.display = conflicts ? 'block' : 'none';
    });
  }
});

// 保存设置
document.getElementById('save').addEventListener('click', async () => {
  if (!currentShortcut) {
    showMessage('请先设置快捷键', 'error');
    return;
  }

  try {
    await chrome.storage.sync.set({ recordingShortcut: currentShortcut });
    showMessage('设置已保存');
    
    // 通知后台脚本更新快捷键
    chrome.runtime.sendMessage({
      action: 'updateShortcut',
      shortcut: currentShortcut
    });
  } catch (error) {
    console.error('Error saving shortcut:', error);
    showMessage('保存设置失败，请重试', 'error');
  }
});

// 监听来自后台的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'shortcutUpdated') {
    showMessage('快捷键已更新');
  }
}); 