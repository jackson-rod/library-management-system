import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';
import { resetMockLibraryData } from './mocks/handlers';

expect.extend(matchers);

// Suppress console.log during tests
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  server.listen({ onUnhandledRequest: 'warn' });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  resetMockLibraryData();
  server.resetHandlers();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();
  vi.restoreAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};
