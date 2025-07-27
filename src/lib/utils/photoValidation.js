/**
 * Photo validation utilities for GearGrab photo documentation
 */

// Supported image formats
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];

// File size limits (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_FILE_SIZE = 1024; // 1KB

// Image dimension requirements
export const MIN_WIDTH = 400;
export const MIN_HEIGHT = 400;
export const MAX_WIDTH = 4000;
export const MAX_HEIGHT = 4000;

/**
 * Validate a single file
 * @param {File} file - The file to validate
 * @returns {Promise<{isValid: boolean, errors: string[]}>}
 */
export async function validateFile(file) {
  const errors = [];

  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    errors.push(`Unsupported file format. Please use JPG, PNG, HEIC, or WebP.`);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
  }

  if (file.size < MIN_FILE_SIZE) {
    errors.push(`File size too small. Minimum size is ${MIN_FILE_SIZE / 1024}KB.`);
  }

  // Check image dimensions (if it's an image)
  if (file.type.startsWith('image/')) {
    try {
      const dimensions = await getImageDimensions(file);
      
      if (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT) {
        errors.push(`Image resolution too low. Minimum size is ${MIN_WIDTH}x${MIN_HEIGHT} pixels.`);
      }

      if (dimensions.width > MAX_WIDTH || dimensions.height > MAX_HEIGHT) {
        errors.push(`Image resolution too high. Maximum size is ${MAX_WIDTH}x${MAX_HEIGHT} pixels.`);
      }
    } catch (error) {
      errors.push('Unable to read image dimensions. Please try a different file.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate multiple files
 * @param {FileList|File[]} files - The files to validate
 * @param {Object} options - Validation options
 * @returns {Promise<{isValid: boolean, errors: string[], validFiles: File[]}>}
 */
export async function validateFiles(files, options = {}) {
  const {
    maxFiles = 10,
    minFiles = 1,
    allowDuplicates = false
  } = options;

  const fileArray = Array.from(files);
  const errors = [];
  const validFiles = [];

  // Check file count
  if (fileArray.length < minFiles) {
    errors.push(`At least ${minFiles} photo${minFiles > 1 ? 's are' : ' is'} required.`);
  }

  if (fileArray.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} photos allowed.`);
  }

  // Check for duplicates if not allowed
  if (!allowDuplicates) {
    const fileNames = fileArray.map(f => f.name);
    const uniqueNames = [...new Set(fileNames)];
    if (fileNames.length !== uniqueNames.length) {
      errors.push('Duplicate files detected. Please select unique files.');
    }
  }

  // Validate each file
  for (const file of fileArray) {
    const validation = await validateFile(file);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${validation.errors.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0 && validFiles.length >= minFiles,
    errors,
    validFiles
  };
}

/**
 * Get image dimensions from a file
 * @param {File} file - The image file
 * @returns {Promise<{width: number, height: number}>}
 */
function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validate photo documentation requirements
 * @param {string[]} photos - Array of photo URLs
 * @param {string} type - Type of documentation ('checkout', 'pickup', 'return')
 * @returns {Object} Validation result
 */
export function validatePhotoDocumentation(photos, type) {
  const requirements = {
    checkout: {
      minPhotos: 2,
      maxPhotos: 8,
      description: 'Initial condition documentation requires at least 2 photos showing overall condition and any existing damage.'
    },
    pickup: {
      minPhotos: 2,
      maxPhotos: 10,
      description: 'Pickup documentation requires at least 2 photos confirming the gear condition at handover.'
    },
    return: {
      minPhotos: 3,
      maxPhotos: 10,
      description: 'Return documentation requires at least 3 photos showing the gear condition upon return, including any new damage.'
    }
  };

  const requirement = requirements[type] || requirements.checkout;
  const errors = [];

  if (photos.length < requirement.minPhotos) {
    errors.push(`${requirement.description}`);
  }

  if (photos.length > requirement.maxPhotos) {
    errors.push(`Maximum ${requirement.maxPhotos} photos allowed for ${type} documentation.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirement
  };
}

/**
 * Generate photo documentation checklist
 * @param {string} type - Type of documentation
 * @returns {string[]} Array of checklist items
 */
export function getPhotoChecklist(type) {
  const checklists = {
    checkout: [
      'Overall view of the gear',
      'Close-up of any existing damage or wear',
      'Serial numbers or identifying marks',
      'All included accessories and components'
    ],
    pickup: [
      'Overall condition at pickup',
      'Any damage noted during inspection',
      'Confirmation of included items',
      'Gear in working condition'
    ],
    return: [
      'Overall condition upon return',
      'Any new damage or wear',
      'All components and accessories returned',
      'Gear cleaned and ready for next rental'
    ]
  };

  return checklists[type] || checklists.checkout;
}

/**
 * Compress image file if needed
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed file
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: format,
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, format, quality);
    };

    img.src = URL.createObjectURL(file);
  });
}
