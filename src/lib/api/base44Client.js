/**
 * Mock Base44 Client for production build
 * This is a placeholder implementation for the Base44 integrations
 */

// Mock integrations
const mockIntegrations = {
  Core: {
    InvokeLLM: {
      async invoke(params) {
        console.warn('Base44 InvokeLLM not available in production');
        return { result: 'Mock response' };
      }
    },
    
    SendEmail: {
      async send(params) {
        console.warn('Base44 SendEmail not available in production');
        return { success: true, messageId: 'mock-id' };
      }
    },
    
    UploadFile: {
      async upload(file) {
        console.warn('Base44 UploadFile not available in production');
        return { url: 'https://example.com/mock-file.jpg', id: 'mock-file-id' };
      }
    },
    
    GenerateImage: {
      async generate(params) {
        console.warn('Base44 GenerateImage not available in production');
        return { url: 'https://example.com/mock-image.jpg', id: 'mock-image-id' };
      }
    },
    
    ExtractDataFromUploadedFile: {
      async extract(fileId) {
        console.warn('Base44 ExtractDataFromUploadedFile not available in production');
        return { data: {}, extracted: true };
      }
    }
  }
};

// Mock base44 client
export const base44 = {
  integrations: mockIntegrations,
  
  // Mock authentication
  auth: {
    isAuthenticated: false,
    user: null,
    
    async login(credentials) {
      console.warn('Base44 auth not available in production');
      return { success: false, error: 'Not available in production' };
    },
    
    async logout() {
      console.warn('Base44 auth not available in production');
      return { success: true };
    }
  },
  
  // Mock configuration
  config: {
    apiUrl: 'https://api.base44.com',
    version: '1.0.0'
  }
};

export default base44;
