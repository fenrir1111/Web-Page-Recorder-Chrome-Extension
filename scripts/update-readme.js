const fs = require('fs');
const path = require('path');

// 获取 README.md 的最后修改时间
function getLastModifiedTime() {
  const stats = fs.statSync(path.resolve(__dirname, '../README.md'));
  const lastModified = stats.mtime;
  
  const year = lastModified.getFullYear();
  const month = String(lastModified.getMonth() + 1).padStart(2, '0');
  const day = String(lastModified.getDate()).padStart(2, '0');
  const hours = String(lastModified.getHours()).padStart(2, '0');
  const minutes = String(lastModified.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 更新 README.md 中的时间
function updateReadmeTime() {
  const readmePath = path.resolve(__dirname, '../README.md');
  let content = fs.readFileSync(readmePath, 'utf8');
  
  // 更新最后修改时间
  content = content.replace(
    /## 最后更新时间\n\n.*$/m,
    `## 最后更新时间\n\n${getLastModifiedTime()}`
  );
  
  fs.writeFileSync(readmePath, content);
}

updateReadmeTime(); 