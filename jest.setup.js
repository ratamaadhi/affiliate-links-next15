import '@testing-library/jest-dom';

// Polyfill for TextEncoder and TextDecoder
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Request and Response for testing
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.nextUrl = new URL(url);
  }
};

global.Response = class Response {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  static json(body, options = {}) {
    return new Response(JSON.stringify(body), options);
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
};

global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
};

// Mock next/server module
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body, options = {}) => {
      const response = new Response(JSON.stringify(body), options);
      // Store headers both as Map and as plain object for compatibility
      const headers = options.headers || {};
      response.headers = new Map(Object.entries(headers));
      response._headers = headers;
      // Also add get method for compatibility
      response.headers.get = (key) => headers[key];
      return response;
    },
  },
}));
