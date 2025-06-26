import pako from 'pako';

/**
 * Service for compressing and decompressing data
 * Used to optimize data transfer and storage for large content
 */
class CompressionService {
  /**
   * Compress a string or object using gzip
   * @param data - The data to compress (string or object)
   * @returns Base64 encoded compressed data
   */
  compress(data: any): string {
    try {
      // Convert object to string if needed
      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Convert string to Uint8Array
      const uint8Array = new TextEncoder().encode(stringData);
      
      // Compress the data
      const compressed = pako.gzip(uint8Array);
      
      // Convert to base64 for storage/transmission
      return this.arrayBufferToBase64(compressed);
    } catch (error) {
      console.error('Error compressing data:', error);
      throw error;
    }
  }
  
  /**
   * Decompress a base64 encoded compressed string
   * @param compressedData - Base64 encoded compressed data
   * @param asObject - Whether to parse the result as JSON
   * @returns Decompressed string or object
   */
  decompress(compressedData: string, asObject: boolean = false): any {
    try {
      // Convert base64 to array buffer
      const compressed = this.base64ToArrayBuffer(compressedData);
      
      // Decompress the data
      const decompressed = pako.ungzip(compressed);
      
      // Convert Uint8Array to string
      const stringData = new TextDecoder().decode(decompressed);
      
      // Parse as JSON if requested
      return asObject ? JSON.parse(stringData) : stringData;
    } catch (error) {
      console.error('Error decompressing data:', error);
      throw error;
    }
  }
  
  /**
   * Calculate compression ratio
   * @param original - Original data
   * @param compressed - Compressed data
   * @returns Compression ratio as a percentage
   */
  getCompressionRatio(original: string, compressed: string): number {
    const originalSize = new TextEncoder().encode(original).length;
    const compressedSize = this.base64ToArrayBuffer(compressed).length;
    
    return Math.round((1 - (compressedSize / originalSize)) * 100);
  }
  
  /**
   * Convert ArrayBuffer to Base64 string
   * @param buffer - ArrayBuffer to convert
   * @returns Base64 string
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }
  
  /**
   * Convert Base64 string to ArrayBuffer
   * @param base64 - Base64 string to convert
   * @returns ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  }
  
  /**
   * Determine if data should be compressed based on size
   * Only compress data larger than the threshold
   * @param data - Data to check
   * @param threshold - Size threshold in bytes (default: 1KB)
   * @returns Whether the data should be compressed
   */
  shouldCompress(data: string, threshold: number = 1024): boolean {
    return new TextEncoder().encode(data).length > threshold;
  }
}

export const compressionService = new CompressionService();
export default compressionService;
