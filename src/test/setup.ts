import "@testing-library/jest-dom";
import { vi } from "vitest";

// -- matchMedia mock --
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// -- SpeechRecognition mock --
(globalThis as any).SpeechRecognition = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onresult: null,
  onerror: null,
  onend: null,
}));
(globalThis as any).webkitSpeechRecognition = (globalThis as any).SpeechRecognition;

// -- SpeechSynthesis mock --
Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});
(globalThis as any).SpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({
  text: "",
  rate: 1,
  pitch: 1,
  volume: 1,
  voice: null,
}));

// -- IntersectionObserver mock --
(globalThis as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// -- ResizeObserver mock --
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// -- URL.createObjectURL mock --
URL.createObjectURL = vi.fn(() => "blob:mock-url");
URL.revokeObjectURL = vi.fn();

// -- Clipboard mock --
Object.defineProperty(navigator, "clipboard", {
  writable: true,
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve("")),
  },
});
