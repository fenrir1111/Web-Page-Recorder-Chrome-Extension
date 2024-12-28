import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    modulePreload: false,
    cssCodeSplit: false,
    minify: false,
    sourcemap: false,
    rollupOptions: {
      input: {
        'popup/index': path.resolve(__dirname, 'src/popup/main.js'),
        'options/index': path.resolve(__dirname, 'src/options/main.js'),
        'background/background': path.resolve(__dirname, 'src/background/main.js'),
        'content/content': path.resolve(__dirname, 'src/content/main.js')
      },
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name].[ext]'
          }
          return 'assets/[name].[ext]'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: false
  }
}) 