/**
 * Mock Svelte store for testing
 */

export const writable = jest.fn((initialValue?: any) => ({
  subscribe: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  get: jest.fn(() => initialValue)
}));

export const readable = jest.fn((initialValue?: any) => ({
  subscribe: jest.fn(),
  get: jest.fn(() => initialValue)
}));

export const derived = jest.fn(() => ({
  subscribe: jest.fn(),
  get: jest.fn()
}));

export const get = jest.fn();
