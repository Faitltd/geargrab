import { browser } from '$app/environment';

// Camera capture configuration
export interface CameraConfig {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

// Captured photo data
export interface CapturedPhoto {
  id: string;
  blob: Blob;
  dataUrl: string;
  timestamp: number;
  size: number;
}

// Camera error types
export type CameraError = 
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'CONSTRAINT_NOT_SATISFIED'
  | 'UNKNOWN_ERROR';

export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private isInitialized = false;

  constructor(private config: CameraConfig = {}) {
    // Set default configuration
    this.config = {
      width: 1920,
      height: 1080,
      facingMode: 'environment', // Back camera for condition checks
      quality: 0.8,
      format: 'image/jpeg',
      ...config
    };
  }

  /**
   * Check if camera is supported in current environment
   */
  static isSupported(): boolean {
    return (
      browser &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  /**
   * Initialize camera and get user permission
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    if (!CameraService.isSupported()) {
      throw new Error('Camera not supported in this environment');
    }

    try {
      // Request camera permission and stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          facingMode: { ideal: this.config.facingMode }
        },
        audio: false
      });

      // Set up video element
      this.video = videoElement;
      this.video.srcObject = this.stream;
      this.video.playsInline = true;
      this.video.muted = true;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.video) {
          reject(new Error('Video element not available'));
          return;
        }

        this.video.onloadedmetadata = () => {
          this.video?.play().then(() => resolve()).catch(reject);
        };

        this.video.onerror = () => {
          reject(new Error('Failed to load video stream'));
        };
      });

      // Create canvas for photo capture
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');

      if (!this.context) {
        throw new Error('Failed to get canvas context');
      }

      this.isInitialized = true;
    } catch (error) {
      await this.cleanup();
      throw this.mapError(error);
    }
  }

  /**
   * Capture a photo from the current video stream
   */
  async capturePhoto(): Promise<CapturedPhoto> {
    if (!this.isInitialized || !this.video || !this.canvas || !this.context) {
      throw new Error('Camera not initialized');
    }

    if (this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
      throw new Error('Video not ready for capture');
    }

    try {
      // Set canvas dimensions to match video
      const { videoWidth, videoHeight } = this.video;
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;

      // Draw current video frame to canvas
      this.context.drawImage(this.video, 0, 0, videoWidth, videoHeight);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        this.canvas!.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          this.config.format,
          this.config.quality
        );
      });

      // Create data URL for preview
      const dataUrl = this.canvas.toDataURL(this.config.format, this.config.quality);

      // Generate unique ID
      const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        id,
        blob,
        dataUrl,
        timestamp: Date.now(),
        size: blob.size
      };
    } catch (error) {
      throw new Error(`Failed to capture photo: ${error}`);
    }
  }

  /**
   * Get available camera devices
   */
  async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    if (!CameraService.isSupported()) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.warn('Failed to enumerate camera devices:', error);
      return [];
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.isInitialized || !this.video) {
      throw new Error('Camera not initialized');
    }

    // Toggle facing mode
    const newFacingMode = this.config.facingMode === 'user' ? 'environment' : 'user';
    this.config.facingMode = newFacingMode;

    // Stop current stream
    await this.stopStream();

    // Restart with new facing mode
    await this.initialize(this.video);
  }

  /**
   * Get current camera capabilities
   */
  getCapabilities(): MediaTrackCapabilities | null {
    if (!this.stream) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    return videoTrack?.getCapabilities() || null;
  }

  /**
   * Stop the camera stream
   */
  async stopStream(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.stopStream();
    this.video = null;
    this.canvas = null;
    this.context = null;
    this.isInitialized = false;
  }

  /**
   * Check if camera is currently active
   */
  isActive(): boolean {
    return this.isInitialized && this.stream !== null;
  }

  /**
   * Get current video dimensions
   */
  getVideoDimensions(): { width: number; height: number } | null {
    if (!this.video) {
      return null;
    }

    return {
      width: this.video.videoWidth,
      height: this.video.videoHeight
    };
  }

  /**
   * Map native errors to our error types
   */
  private mapError(error: any): Error {
    let errorType: CameraError = 'UNKNOWN_ERROR';
    let message = 'An unknown camera error occurred';

    if (error.name) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorType = 'PERMISSION_DENIED';
          message = 'Camera permission denied. Please allow camera access and try again.';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorType = 'DEVICE_NOT_FOUND';
          message = 'No camera device found. Please ensure a camera is connected.';
          break;
        case 'NotSupportedError':
          errorType = 'NOT_SUPPORTED';
          message = 'Camera not supported in this browser.';
          break;
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
          errorType = 'CONSTRAINT_NOT_SATISFIED';
          message = 'Camera constraints could not be satisfied. Try adjusting settings.';
          break;
      }
    }

    const cameraError = new Error(message);
    (cameraError as any).type = errorType;
    return cameraError;
  }
}

/**
 * Utility function to compress image blob
 */
export async function compressImage(
  blob: Blob,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Convert blob to File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, {
    type: blob.type,
    lastModified: Date.now()
  });
}
