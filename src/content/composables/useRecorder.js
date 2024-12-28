import { ref } from 'vue'

export function useRecorder() {
  const mediaRecorder = ref(null)
  const recordedChunks = ref([])
  const mediaStream = ref(null)

  const startRecording = async (streamId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId,
            maxWidth: window.screen.width,
            maxHeight: window.screen.height
          }
        },
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          }
        }
      })

      mediaStream.value = stream
      mediaRecorder.value = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      })

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        const blob = new Blob(recordedChunks.value, {
          type: 'video/webm;codecs=vp8,opus'
        })
        const url = URL.createObjectURL(blob)
        chrome.runtime.sendMessage({
          action: "downloadRecording",
          url: url
        })
        recordedChunks.value = []
        
        if (mediaStream.value) {
          mediaStream.value.getTracks().forEach(track => track.stop())
          mediaStream.value = null
        }
      }

      mediaRecorder.value.start(1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      throw error
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
    }
  }

  return {
    startRecording,
    stopRecording,
    isRecording: () => mediaRecorder.value?.state === 'recording'
  }
} 