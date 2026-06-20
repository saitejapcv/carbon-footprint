import { vi } from 'vitest';

global.intersectionObservers = [];

const mockIntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
    global.lastIntersectionObserver = this; // Store so tests can trigger it manually
    global.intersectionObservers.push(this);
  }
  observe(element) {
    if (this.callback) {
      this.callback([{ target: element, isIntersecting: true }]);
    }
  }
  unobserve() {}
  disconnect() {}
};

const mockResizeObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    if (this.callback) {
      this.callback([{ target: element }]);
    }
  }
  unobserve() {}
  disconnect() {}
};

// Store scrollTrigger configuration for manual triggering in tests
global.lastScrollTriggerConfig = null;

const mockTimeline = {
  to: vi.fn((selector, vars) => {
    if (vars && typeof vars.onComplete === 'function') {
      vars.onComplete();
    }
    if (vars && vars.scrollTrigger && typeof vars.scrollTrigger.end === 'function') {
      vars.scrollTrigger.end();
    }
    return mockTimeline;
  }),
  fromTo: vi.fn((selector, fromVars, toVars) => {
    if (toVars && typeof toVars.onComplete === 'function') {
      toVars.onComplete();
    }
    if (toVars && toVars.scrollTrigger && typeof toVars.scrollTrigger.end === 'function') {
      toVars.scrollTrigger.end();
    }
    return mockTimeline;
  }),
  set: vi.fn().mockReturnThis(),
  clear: vi.fn().mockReturnThis(),
  play: vi.fn().mockReturnThis(),
  reverse: vi.fn().mockReturnThis(),
  restart: vi.fn().mockReturnThis(),
  pause: vi.fn().mockReturnThis(),
  kill: vi.fn().mockReturnThis(),
  isActive: vi.fn().mockReturnValue(false),
};

const mockGsap = {
  registerPlugin: vi.fn(),
  utils: {
    toArray: vi.fn((selector) => {
      if (typeof selector === 'string') {
        return Array.from(document.querySelectorAll(selector));
      }
      return Array.isArray(selector) ? selector : [selector];
    }),
    random: vi.fn((min, max) => (min + max) / 2),
  },
  set: vi.fn(),
  timeline: vi.fn((config) => {
    if (config && config.scrollTrigger) {
      global.lastScrollTriggerConfig = config.scrollTrigger;
    }
    return mockTimeline;
  }),
  to: vi.fn((selector, vars) => {
    if (vars && vars.scrollTrigger && typeof vars.scrollTrigger.end === 'function') {
      vars.scrollTrigger.end();
    }
    return mockTimeline;
  }),
  fromTo: vi.fn((selector, fromVars, toVars) => {
    if (toVars && toVars.scrollTrigger && typeof toVars.scrollTrigger.end === 'function') {
      toVars.scrollTrigger.end();
    }
    return mockTimeline;
  }),
};

// Define on global and window for compatibility with JSDOM
global.IntersectionObserver = mockIntersectionObserver;
global.ResizeObserver = mockResizeObserver;
global.gsap = mockGsap;
global.ScrollTrigger = {
  refresh: vi.fn(),
};

if (typeof window !== 'undefined') {
  window.IntersectionObserver = mockIntersectionObserver;
  window.ResizeObserver = mockResizeObserver;
  window.gsap = mockGsap;
  window.ScrollTrigger = global.ScrollTrigger;
  
  // Mock document.fonts
  Object.defineProperty(document, 'fonts', {
    value: {
      ready: Promise.resolve(),
    },
    writable: true,
  });

  // Mock window.innerWidth to be configurable and writable
  let mockWidth = 1024;
  Object.defineProperty(window, 'innerWidth', {
    get: () => mockWidth,
    set: (v) => { mockWidth = v; },
    configurable: true,
  });

  // Mock window.scrollY to be configurable and writable
  let mockScrollY = 0;
  Object.defineProperty(window, 'scrollY', {
    get: () => mockScrollY,
    set: (v) => { mockScrollY = v; },
    configurable: true,
  });
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
if (typeof window !== 'undefined') {
  window.requestAnimationFrame = global.requestAnimationFrame;
  window.cancelAnimationFrame = global.cancelAnimationFrame;
}

// Mock scrollIntoView globally on Element prototype since JSDOM doesn't implement it
Element.prototype.scrollIntoView = vi.fn();

// Mock canvas getContext using a Proxy to handle any drawing/context call without throwing errors
HTMLCanvasElement.prototype.getContext = () => {
  return new Proxy({}, {
    get: (target, prop) => {
      return () => {};
    }
  });
};

// Mock video play / pause methods
HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue();
HTMLMediaElement.prototype.pause = vi.fn();
HTMLMediaElement.prototype.load = vi.fn();

// Mock readyState property
Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
  get: () => 1,
  configurable: true,
});

// Mock fetch for markdown reading in Modal tests
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('# Mock Article\nThis is a mock article content.'),
});
