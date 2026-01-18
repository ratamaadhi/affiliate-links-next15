import '@testing-library/jest-dom';

// Polyfill for TextEncoder and TextDecoder
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for fetch (required for @libsql/client)
global.fetch = jest.fn();

// Polyfill Headers class
global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = new Map();

    if (typeof init === 'string') {
      throw new Error('Not implemented');
    }

    if (Array.isArray(init)) {
      init.forEach(([name, value]) => this._headers.set(name, value));
    } else if (init instanceof Headers) {
      init._headers.forEach((value, name) => this._headers.set(name, value));
    } else if (init) {
      Object.entries(init).forEach(([name, value]) =>
        this._headers.set(name, value)
      );
    }
  }

  append(name, value) {
    this._headers.set(name, value);
  }

  delete(name) {
    this._headers.delete(name);
  }

  get(name) {
    return this._headers.get(name);
  }

  has(name) {
    return this._headers.has(name);
  }

  set(name, value) {
    this._headers.set(name, value);
  }

  entries() {
    return this._headers.entries();
  }

  keys() {
    return this._headers.keys();
  }

  values() {
    return this._headers.values();
  }

  forEach(callback, thisArg) {
    this._headers.forEach((value, name) => {
      callback.call(thisArg, value, name, this);
    });
  }

  [Symbol.iterator]() {
    return this._headers[Symbol.iterator]();
  }
};

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

// Mock window.matchMedia for responsive hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => {
    // Default to desktop (min-width: 768px returns true)
    const isDesktopQuery =
      query.includes('min-width') && query.includes('768px');
    const isMobileQuery =
      query.includes('max-width') && query.includes('767px');
    const isDarkQuery = query.includes('prefers-color-scheme');

    let matches = false;
    if (isDesktopQuery) {
      matches = true; // Mock as desktop screen
    } else if (isMobileQuery) {
      matches = false;
    } else if (isDarkQuery) {
      matches = false;
    }

    return {
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  }),
});

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

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => new URLSearchParams('_page=1')),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock better-auth client to avoid ES module issues
jest.mock('better-auth/client', () => ({
  createAuthClient: jest.fn(() => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    getSession: jest.fn(),
  })),
  customSessionClient: jest.fn(),
  usernameClient: jest.fn(),
}));

// Mock better-auth package
const mockBetterAuth = {
  emailAndPassword: {
    enabled: false,
    requireEmailVerification: false,
    sendResetPassword: jest.fn(),
    resetPasswordTokenExpiresIn: 3600,
    rateLimit: {
      window: 5,
      max: 5,
    },
  },
  socialProviders: {},
  advanced: {},
  twoFactor: {},
  databaseHooks: {},
  account: {},
  session: {},
  user: {},
};

jest.mock('better-auth', () => ({
  __esModule: true,
  auth: jest.fn(() => mockBetterAuth),
  betterAuth: jest.fn(() => mockBetterAuth),
}));

// Mock uncrypto to avoid ES module issues
jest.mock('uncrypto', () => ({
  getRandomValues: jest.fn(),
  randomUUID: jest.fn(() => 'mock-uuid'),
  subtle: {},
}));

jest.mock('crypto', () => ({
  getRandomValues: jest.fn(),
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

// Mock slug package to avoid ES module issues
jest.mock('slug', () => ({
  __esModule: true,
  default: jest.fn((input) => {
    return input
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }),
}));

// Mock jose package to avoid ES module issues
jest.mock('jose', () => {
  const mockJose = new Proxy(
    {
      __esModule: true,
      default: {
        compactDecrypt: jest.fn(),
        decrypt: jest.fn(),
        encrypt: jest.fn(),
        sign: jest.fn(),
        verify: jest.fn(),
        signJWT: jest.fn(),
        verifyJWT: jest.fn(),
        jwtDecrypt: jest.fn(),
        jwtVerify: jest.fn(),
        base64url: jest.fn(),
        base64: jest.fn(),
        calculateJwkThumbprint: jest.fn(),
        exportJWK: jest.fn(),
        exportKey: jest.fn(),
        exportPKCS8: jest.fn(),
        generateKeyPair: jest.fn(),
        generateSecret: jest.fn(),
        importJWK: jest.fn(),
        importKey: jest.fn(),
        importPKCS8: jest.fn(),
        importSPKI: jest.fn(),
        importX509: jest.fn(),
        unwrapKey: jest.fn(),
      },
      compactDecrypt: jest.fn(),
      decrypt: jest.fn(),
      encrypt: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      signJWT: jest.fn(),
      verifyJWT: jest.fn(),
      jwtDecrypt: jest.fn(),
      jwtVerify: jest.fn(),
      base64url: jest.fn(),
      base64: jest.fn(),
      calculateJwkThumbprint: jest.fn(),
      exportJWK: jest.fn(),
      exportKey: jest.fn(),
      exportPKCS8: jest.fn(),
      generateKeyPair: jest.fn(),
      generateSecret: jest.fn(),
      importJWK: jest.fn(),
      importKey: jest.fn(),
      importPKCS8: jest.fn(),
      importSPKI: jest.fn(),
      importX509: jest.fn(),
      unwrapKey: jest.fn(),
      FlattenedSign: { sign: jest.fn() },
      FlattenedDecrypt: { decrypt: jest.fn() },
      GeneralSign: { sign: jest.fn() },
      GeneralEncrypt: { encrypt: jest.fn() },
      GeneralDecrypt: { decrypt: jest.fn() },
      EmbeddedX509: { certPEM: jest.fn() },
      KeyLike: { fromKeyObject: jest.fn() },
      errors: {
        JOSEError: class extends Error {},
        JWEDecryptionFailed: class extends Error {},
        JWEInvalid: class extends Error {},
        JWKImportFailed: class extends Error {},
        JWKSInvalid: class extends Error {},
        JWKMultipleMatchingKeys: class extends Error {},
        JWKSNoMatchingKey: class extends Error {},
        JWSSignatureVerificationFailed: class extends Error {},
        JWSTimeInvalid: class extends Error {},
        JWSSignatureVerificationFailed: class extends Error {},
      },
    },
    {
      get: () => jest.fn(),
    }
  );
  return mockJose;
});

// Mock nanoid to avoid ES module issues
jest.mock('nanoid', () => {
  const mockCustomAlphabet = jest.fn((alphabet, size) => () => {
    const chars = '1234567890abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < size; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  });

  return {
    __esModule: true,
    nanoid: jest.fn(() => 'test-slug-123456789'),
    default: jest.fn(() => 'test-slug-123456789'),
    customAlphabet: mockCustomAlphabet,
    customRandom: jest.fn(),
  };
});

// Mock nanostores to avoid ES module issues
jest.mock('nanostores', () => ({
  atom: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// Mock the auth-client module itself
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    getSession: jest.fn(),
  },
}));

// Mock sonner for toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));
