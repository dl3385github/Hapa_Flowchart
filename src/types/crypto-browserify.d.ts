declare module 'crypto-browserify' {
  interface Hash {
    update(data: string | Buffer): Hash;
    digest(): Buffer;
    digest(encoding: string): string;
  }

  function createHash(algorithm: string): Hash;
  
  function randomBytes(size: number): Buffer;

  export {
    createHash,
    randomBytes
  };
} 