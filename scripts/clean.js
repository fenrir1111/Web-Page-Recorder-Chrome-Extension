import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')

try {
  // 删除 dist 目录
  await fs.remove(distDir)
  console.log('Successfully cleaned dist directory')
} catch (err) {
  console.error('Error cleaning dist directory:', err)
  process.exit(1)
} 