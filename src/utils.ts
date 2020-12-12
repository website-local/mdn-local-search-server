const entityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export const escapeHtml = (string: string): string =>
  String(string).replace(/[&<>"'`=\\/]/g, s => entityMap[s]);

export interface Writable {
  push(str: string): this | boolean | void;
}

export class StringBuffer implements Writable {
  buffer: Buffer;
  capacity: number;
  size: number;

  constructor(public blockSize = 4096) {
    this.buffer = Buffer.allocUnsafe(blockSize);
    this.capacity = blockSize;
    this.size = 0;
  }

  append(str: string): this {
    if (!str || !str.length) {
      return this;
    }
    const byteLength = Buffer.byteLength(str);
    this.writeString(str, byteLength);
    return this;
  }

  push(str: string): this {
    return this.append(str);
  }

  writeString(str: string, byteLength: number): void {
    const requiredCapacity = this.size + byteLength;
    this.ensureCapacity(requiredCapacity);
    this.size += this.buffer.write(str, this.size, byteLength);
  }

  ensureCapacity(minimumCapacity: number): void {
    if (minimumCapacity > this.capacity) {
      const nextCapacity = Math.ceil(minimumCapacity / this.blockSize) * this.blockSize;
      const nextBuffer = Buffer.allocUnsafe(nextCapacity);
      this.buffer.copy(nextBuffer);
      this.buffer = nextBuffer;
      this.capacity = nextCapacity;
    }
  }

  toBuffer(): Buffer {
    return this.buffer.subarray(0, this.size);
  }
}

export const countChar = (str: string, char: string): number => {
  const charCode = char.charCodeAt(0);
  let count = 0;
  for (let i = 0, l = str.length, c = -1; i < l; i++) {
    c = str.charCodeAt(i);
    if (c === charCode) {
      count++;
    }
  }
  return count;
};
