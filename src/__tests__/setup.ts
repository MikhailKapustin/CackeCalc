// Test setup file
import { vi } from 'vitest'

// Mock Capacitor core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'web',
    isNative: false,
  },
}))

// Mock HTMLCanvasElement for image generation in tests
class MockCanvasRenderingContext2D {
  fillStyle = ''
  strokeStyle = ''
  lineWidth = 1
  font = ''
  textAlign = 'left'

  fillRect() {}
  strokeRect() {}
  fillText() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
}

HTMLCanvasElement.prototype.getContext = function (contextType: string) {
  if (contextType === '2d') {
    return new MockCanvasRenderingContext2D() as any
  }
  return null
}

HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
  // Create a mock blob
  const mockBlob = new Blob(['mock image data'], { type: 'image/png' })
  setTimeout(() => callback(mockBlob), 0)
}
