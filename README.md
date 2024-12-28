# Web Page Recorder Chrome Extension

A Chrome extension for recording web page content with audio support.

## Features

- Record web page content with system audio
- Keyboard shortcut support (Alt+Shift+X)
- Visual recording indicator
- Audio recording toggle
- High-quality video output (2.5 Mbps)
- High-quality audio output (128 kbps)
- Save recordings as WebM files
- Support for large file downloads
- Real-time recording status display

## Recent Updates

### Audio Recording Support
- Added system audio capture capability
- Implemented audio quality control (128 kbps)
- Added audio recording toggle in popup
- Improved media stream handling

### Performance Improvements
- Optimized data chunking (100ms intervals)
- Improved large file handling
- Enhanced error handling and user feedback
- Added detailed logging for troubleshooting

### UI Enhancements
- Added recording status indicator
- Improved popup interface with audio toggle
- Enhanced error messages and notifications
- Added recording progress feedback

## Installation

1. Clone the repository
2. Run `npm install`
3. Run `npm run build`
4. Load the `dist` folder as an unpacked extension in Chrome

## Usage

1. Click the extension icon or use Alt+Shift+X
2. Choose whether to include audio
3. Select the tab to record
4. Click "Stop Recording" when finished
5. Choose where to save the recording

## Development

- Built with Vue 3 and Vite
- Uses MediaRecorder API for capture
- Implements Chrome Extension Manifest V3
- TypeScript support included

## Known Issues

- Audio capture may require additional permissions on some systems
- Recording Chrome internal pages is not supported
- Large files may take longer to process

## License

MIT