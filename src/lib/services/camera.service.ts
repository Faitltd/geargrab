// Refactored camera service with better error handling and type safety

import type { CapturedPhoto, CameraSettings } from '$lib/types';

export class CameraService {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  /**
   * Initialize camera with settings
   */
  async initialize(
    videoElement: HTMLVideoElement,
    settings: Partial<CameraSettings> = {}
  ): Promise<void> {
    try {
      this.video = videoElement;
      
      // Create canvas for photo capture
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      
      if (!this.context) {
        throw new Error('Failed to get canvas context');
      }

      // Default camera settings
      const defaultSettings: CameraSettings = {
        facingMode: 'environment',
        resolution: { width: 1920, height: 1080 },
        quality: 0.9
      };

      const cameraSettings = { ...defaultSettings, ...settings };

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraSettings.facingMode,
          width: { ideal: cameraSettings.resolution.width },
          height: { ideal: cameraSettings.resolution.height }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        this.video!.onloadedmetadata = () => {
          this.video!.play()
            .then(() => resolve())
            .catch(reject);
        };
        this.video!.onerror = reject;
      });

      // Set canvas dimensions to match video
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;

    } catch (error) {
      this.handleError(error, 'initialize camera');
    }
  }

  /**
   * Capture photo from video stream
   */
  async capturePhoto(quality: number = 0.9): Promise<CapturedPhoto> {
    if (!this.video || !this.canvas || !this.context) {
      throw new Error('Camera not initialized');
    }

    if (!this.stream || !this.stream.active) {
      throw new Error('Camera stream not active');
    }

    try {
      // Draw current video frame to canvas
      this.context.drawImage(
        this.video,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        this.canvas!.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          quality
        );
      });

      // Create object URL for preview
      const url = URL.createObjectURL(blob);

      const photo: CapturedPhoto = {
        id: this.generatePhotoId(),
        blob,
        url,
        timestamp: new Date().toISOString(),
        metadata: {
          size: blob.size,
          type: blob.type
        }
      };

      return photo;
    } catch (error) {
      this.handleError(error, 'capture photo');
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.video) {
      throw new Error('Camera not initialized');
    }

    try {
      const currentFacingMode = this.getCurrentFacingMode();
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      
      // Stop current stream
      this.stopCamera();
      
      // Reinitialize with new facing mode
      await this.initialize(this.video, {
        facingMode: newFacingMode
      });
    } catch (error) {
      this.handleError(error, 'switch camera');
    }
  }

  /**
   * Stop camera and release resources
   */
  stopCamera(): void {
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
   * Check if camera is supported
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      HTMLCanvasElement.prototype.toBlob
    );
  }

  /**
   * Get available camera devices
   */
  static async getDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  /**
   * Check camera permissions
   */
  static async checkPermissions(): Promise<PermissionState> {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permission.state;
    } catch (error) {
      console.warn('Permission API not supported:', error);
      return 'prompt';
    }
  }

  /**
   * Request camera permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }

  /**
   * Get current facing mode
   */
  private getCurrentFacingMode(): 'user' | 'environment' {
    if (!this.stream) return 'environment';
    
    const videoTrack = this.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    return settings.facingMode as 'user' | 'environment' || 'environment';
  }

  /**
   * Generate unique photo ID
   */
  private generatePhotoId(): string {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any, operation: string): never {
    console.error(`Camera service error in ${operation}:`, error);
    
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera access denied. Please allow camera permissions.');
    }
    
    if (error.name === 'NotFoundError') {
      throw new Error('No camera found on this device.');
    }
    
    if (error.name === 'NotReadableError') {
      throw new Error('Camera is already in use by another application.');
    }
    
    if (error.name === 'OverconstrainedError') {
      throw new Error('Camera does not support the requested settings.');
    }
    
    if (error.name === 'SecurityError') {
      throw new Error('Camera access blocked due to security restrictions.');
    }
    
    throw new Error(error.message || `Failed to ${operation}`);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopCamera();
    this.video = null;
    this.canvas = null;
    this.context = null;
  }
}

// Export singleton instance
export const cameraService = new CameraService();



// Legacy exports for backward compatibility
export type { CapturedPhoto };
export const initializeCamera = cameraService.initialize.bind(cameraService);
export const capturePhoto = cameraService.capturePhoto.bind(cameraService);
export const switchCamera = cameraService.switchCamera.bind(cameraService);
export const stopCamera = cameraService.stopCamera.bind(cameraService);
