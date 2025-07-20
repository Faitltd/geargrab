// Common types used throughout the application

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PaginationParams {
  limit?: number;
  lastDoc?: any;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  location?: Coordinates;
  radius?: number;
  condition?: string;
  availability?: DateRange;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FileUpload {
  file: File;
  url?: string;
  progress?: number;
  error?: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortOrder = 'asc' | 'desc';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
