import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
import type { Helia } from 'helia';
import type { UnixFS } from '@helia/unixfs';

class IpfsService {
  private heliaNode: Helia | null = null;
  private unixfsInstance: UnixFS | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize Helia node
      this.heliaNode = await createHelia();
      this.unixfsInstance = unixfs(this.heliaNode);
      console.log('Helia IPFS service initialized');
    } catch (error) {
      console.error('Failed to initialize Helia IPFS service:', error);
    }
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.heliaNode || !this.unixfsInstance) {
      await this.initialize();
    }
    if (!this.heliaNode || !this.unixfsInstance) {
      throw new Error('IPFS service failed to initialize');
    }
  }

  /**
   * Upload metadata to IPFS
   * @param metadata Object to upload to IPFS
   * @returns CID of the uploaded content
   */
  async uploadMetadata(metadata: Record<string, unknown>): Promise<string> {
    try {
      await this.ensureInitialized();
      
      const jsonData = JSON.stringify(metadata);
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonData);
      
      const cid = await this.unixfsInstance!.addBytes(data);
      
      // Pin the content
      await this.heliaNode!.pins.add(cid);
      
      return cid.toString();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
      }
      throw new Error('Failed to upload metadata to IPFS: Unknown error');
    }
  }

  /**
   * Get content from IPFS by CID
   * @param cid Content identifier
   * @returns Content data
   */
  async getContent(cid: string): Promise<Buffer> {
    try {
      await this.ensureInitialized();
      
      const cidObj = CID.parse(cid);
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of this.unixfsInstance!.cat(cidObj)) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to get content from IPFS: ${error.message}`);
      }
      throw new Error('Failed to get content from IPFS: Unknown error');
    }
  }

  /**
   * Check if content exists on IPFS
   * @param cid Content identifier
   * @returns True if content exists, false otherwise
   */
  async checkContentExists(cid: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const cidObj = CID.parse(cid);
      await this.unixfsInstance!.stat(cidObj);
      return true;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Shutdown the IPFS service
   */
  async shutdown(): Promise<void> {
    if (this.heliaNode) {
      await this.heliaNode.stop();
      this.heliaNode = null;
      this.unixfsInstance = null;
      console.log('Helia IPFS service shut down');
    }
  }
}

// Export as default
export default IpfsService; 