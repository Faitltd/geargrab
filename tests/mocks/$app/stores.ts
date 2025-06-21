/**
 * Mock SvelteKit stores for testing
 */

export const page = {
  subscribe: jest.fn(),
  set: jest.fn(),
  update: jest.fn()
};

export const navigating = {
  subscribe: jest.fn(),
  set: jest.fn(),
  update: jest.fn()
};

export const updated = {
  subscribe: jest.fn(),
  set: jest.fn(),
  update: jest.fn()
};
