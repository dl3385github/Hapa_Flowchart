// Import browser-compatible Node.js modules
import process from 'process';
import { Buffer } from 'buffer';

// Polyfill global objects
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.global = window;
  // @ts-ignore
  window.process = process;
  // @ts-ignore
  window.Buffer = Buffer;
}

// Additional browser compatibility
if (typeof window !== 'undefined') {
  // Patch missing stream implementations
  try {
    // @ts-ignore
    if (!window.Duplex) {
      const streamBrowserify = require('stream-browserify');
      // @ts-ignore
      window.Duplex = streamBrowserify.Duplex;
      // @ts-ignore
      window.Readable = streamBrowserify.Readable;
      // @ts-ignore
      window.Writable = streamBrowserify.Writable;
      // @ts-ignore
      window.Transform = streamBrowserify.Transform;
    }
  } catch (e) {
    console.warn('Failed to polyfill stream:', e);
  }

  // Add URL parsing capability if needed
  if (typeof URL !== 'undefined' && typeof URL.parse !== 'function') {
    // @ts-ignore
    URL.parse = (url: string) => new URL(url);
  }

  // Add TextEncoder/TextDecoder if missing
  if (typeof TextEncoder === 'undefined') {
    // @ts-ignore
    window.TextEncoder = function TextEncoder() {};
    // @ts-ignore
    window.TextEncoder.prototype.encode = function(str: string) {
      const buf = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        buf[i] = str.charCodeAt(i);
      }
      return buf;
    };
  }

  if (typeof TextDecoder === 'undefined') {
    // @ts-ignore
    window.TextDecoder = function TextDecoder() {};
    // @ts-ignore
    window.TextDecoder.prototype.decode = function(buf: Uint8Array) {
      let str = '';
      for (let i = 0; i < buf.length; i++) {
        str += String.fromCharCode(buf[i]);
      }
      return str;
    };
  }
}

// Log successful polyfill
console.log('Node.js compatibility polyfills loaded'); 