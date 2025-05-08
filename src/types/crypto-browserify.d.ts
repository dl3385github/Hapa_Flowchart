declare module 'crypto-browserify' {
  // This is a minimal declaration for crypto-browserify
  // It provides a subset of Node's crypto module for the browser
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: string | Buffer): any;
  export function randomBytes(size: number): Buffer;
  export function createCipheriv(algorithm: string, key: Buffer, iv: Buffer): any;
  export function createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): any;
  export function pbkdf2(password: string, salt: string | Buffer, iterations: number, keylen: number, digest: string, callback: (err: Error | null, derivedKey: Buffer) => void): void;
  export function pbkdf2Sync(password: string, salt: string | Buffer, iterations: number, keylen: number, digest: string): Buffer;
  export function createSign(algorithm: string): any;
  export function createVerify(algorithm: string): any;
} 