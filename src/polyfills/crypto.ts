// Browser crypto polyfill

class Hash {
  private algorithm: string;
  private data: Uint8Array[];

  constructor(algorithm: string) {
    this.algorithm = algorithm.toLowerCase().replace('-', '');
    this.data = [];
  }

  update(data: string | Buffer): Hash {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      this.data.push(encoder.encode(data));
    } else {
      this.data.push(new Uint8Array(data));
    }
    return this;
  }

  async digest(): Promise<Buffer> {
    // Combine all data chunks
    let totalLength = 0;
    for (const chunk of this.data) {
      totalLength += chunk.length;
    }
    
    const combinedData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.data) {
      combinedData.set(chunk, offset);
      offset += chunk.length;
    }

    // Use the Web Crypto API
    const subtleCrypto = window.crypto.subtle;
    const hashBuffer = await subtleCrypto.digest(this.algorithm, combinedData);
    
    // Convert to Buffer
    return Buffer.from(hashBuffer);
  }
}

export function createHash(algorithm: string): Hash {
  return new Hash(algorithm);
}

export function randomBytes(size: number): Buffer {
  const bytes = new Uint8Array(size);
  window.crypto.getRandomValues(bytes);
  return Buffer.from(bytes);
}

export default {
  createHash,
  randomBytes
}; 