import { create, IPFSHTTPClient } from 'ipfs-http-client';

class IpfsService {
  private client: IPFSHTTPClient;

  constructor() {
    // Connect to local IPFS node or Infura IPFS gateway
    this.client = create({
      host: process.env.IPFS_HOST || 'ipfs.infura.io',
      port: parseInt(process.env.IPFS_PORT || '5001'),
      protocol: process.env.IPFS_PROTOCOL || 'https'
    });
  }

  /**
   * Upload metadata to IPFS
   * @param metadata Object to upload to IPFS
   * @returns CID of the uploaded content
   */
  async uploadMetadata(metadata: Record<string, unknown>): Promise<string> {
    try {
      const { cid } = await this.client.add(JSON.stringify(metadata));
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
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.client.cat(cid)) {
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
      // Try to get content info (lightweight check)
      const chunks: Uint8Array[] = [];
      let hasContent = false;
      for await (const chunk of this.client.cat(cid, { length: 1 })) {
        hasContent = true;
        break;
      }
      return hasContent;
    } catch (error: unknown) {
      return false;
    }
  }
}

// Export as default
export default IpfsService; 