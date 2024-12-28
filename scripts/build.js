import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function build() {
  try {
    const distDir = path.join(rootDir, 'dist')

    // 创建必要的目录
    const directories = [
      'images',
      'css',
      'popup',
      'options',
      'background',
      'content'
    ]

    for (const dir of directories) {
      await fs.ensureDir(path.join(distDir, dir))
    }

    // 复制 manifest.json
    await fs.copy(
      path.join(rootDir, 'manifest.json'),
      path.join(distDir, 'manifest.json'),
      { overwrite: true }
    )

    // 复制图标文件
    const iconSizes = ['16', '48', '128']
    for (const size of iconSizes) {
      const iconPath = path.join(rootDir, 'public', 'images', `icon${size}.png`)
      if (await fs.pathExists(iconPath)) {
        await fs.copy(
          iconPath,
          path.join(distDir, 'images', `icon${size}.png`),
          { overwrite: true }
        )
      } else {
        console.warn(`Warning: Icon file missing: icon${size}.png`)
      }
    }

    // 复制 HTML 文件
    const htmlFiles = [
      ['src/popup/index.html', 'popup/index.html'],
      ['src/options/index.html', 'options/index.html']
    ]

    for (const [src, dest] of htmlFiles) {
      const srcPath = path.join(rootDir, src)
      const destPath = path.join(distDir, dest)
      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, destPath, { overwrite: true })
      }
    }

    // 复制 content styles
    const stylePath = path.join(rootDir, 'src/content/style.css')
    if (await fs.pathExists(stylePath)) {
      await fs.copy(
        stylePath,
        path.join(distDir, 'css/content.css'),
        { overwrite: true }
      )
    }

    // 复制和处理 CSS 文件
    const builtCssPath = path.join(distDir, 'css/styles.css')
    if (await fs.pathExists(builtCssPath)) {
      // 复制到 popup 和 options 目录
      const targets = ['popup', 'options']
      for (const target of targets) {
        await fs.copy(
          builtCssPath,
          path.join(distDir, target, 'styles.css'),
          { overwrite: true }
        )
      }
    }

    // 等待一秒确保文件写入完成
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 检查必要文件
    const requiredFiles = [
      'popup/index.html',
      'popup/index.js',
      'popup/styles.css',
      'options/index.html',
      'options/index.js',
      'options/styles.css',
      'background/background.js',
      'content/content.js',
      'css/styles.css'
    ]

    let missingFiles = false
    for (const file of requiredFiles) {
      const filePath = path.join(distDir, file)
      if (!await fs.pathExists(filePath)) {
        console.error(`Error: Required file missing: ${file}`)
        missingFiles = true
      } else {
        console.log(`File exists: ${file}`)
      }
    }

    if (missingFiles) {
      throw new Error('Build failed: Missing required files')
    }

    console.log('Build completed successfully!')
  } catch (err) {
    console.error('Build failed:', err)
    process.exit(1)
  }
}

build() 