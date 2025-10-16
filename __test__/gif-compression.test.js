/**
 * Test file for GIF compression functionality
 * This file tests the modern-gif integration
 */

// Mock modern-gif for testing
jest.mock('modern-gif', () => ({
  decode: jest.fn(),
  decodeFrames: jest.fn(),
  encode: jest.fn(),
}));

import * as modernGif from 'modern-gif';
import { compressGif } from '../src/lib/image-compression';

describe('GIF Compression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return original file if not a GIF', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await expect(compressGif(mockFile)).rejects.toThrow('File is not a GIF');
  });

  test('should return original file if too small to compress', async () => {
    const mockFile = new File(['test'], 'test.gif', { type: 'image/gif' });
    Object.defineProperty(mockFile, 'size', { value: 400 * 1024 }); // 400KB

    const result = await compressGif(mockFile);
    expect(result).toBe(mockFile);
  });

  test('should compress GIF successfully', async () => {
    // Create a proper mock File with arrayBuffer method
    const mockArrayBuffer = new ArrayBuffer(1000 * 1024);
    const mockFile = {
      name: 'test.gif',
      type: 'image/gif',
      size: 1000 * 1024,
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
    };

    // Mock decode to return basic GIF structure
    modernGif.decode.mockReturnValue({
      width: 100,
      height: 100,
      looped: true,
      loopCount: 0,
    });

    // Mock decodeFrames to return frame data
    modernGif.decodeFrames.mockReturnValue([
      {
        width: 100,
        height: 100,
        delay: 100,
        data: new Uint8ClampedArray(100 * 100 * 4),
      },
    ]);

    // Mock encode to return compressed data
    const mockCompressedData = new ArrayBuffer(500 * 1024); // 500KB compressed
    modernGif.encode.mockResolvedValue(mockCompressedData);

    console.log = jest.fn(); // Mock console.log

    const result = await compressGif(mockFile, {
      colors: 64,
    });

    expect(modernGif.decode).toHaveBeenCalled();
    expect(modernGif.decodeFrames).toHaveBeenCalled();
    expect(modernGif.encode).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 100,
        height: 100,
        maxColors: 64,
        looped: true,
        loopCount: 0,
        format: 'arrayBuffer',
      })
    );

    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe('image/gif');
    expect(result.name).toBe('test.gif');
  });

  test('should return original file if compression is ineffective', async () => {
    // Create a proper mock File with arrayBuffer method
    const mockArrayBuffer = new ArrayBuffer(1000 * 1024);
    const mockFile = {
      name: 'test.gif',
      type: 'image/gif',
      size: 1000 * 1024,
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
    };

    modernGif.decode.mockReturnValue({
      width: 100,
      height: 100,
      looped: true,
      loopCount: 0,
    });

    modernGif.decodeFrames.mockReturnValue([
      {
        width: 100,
        height: 100,
        delay: 100,
        data: new Uint8ClampedArray(100 * 100 * 4),
      },
    ]);

    // Mock encode to return data that's only 5% smaller (ineffective compression)
    const mockCompressedData = new ArrayBuffer(950 * 1024); // 950KB (only 5% reduction)
    modernGif.encode.mockResolvedValue(mockCompressedData);

    console.log = jest.fn();

    const result = await compressGif(mockFile);

    expect(result).toBe(mockFile); // Should return original file
    expect(console.log).toHaveBeenCalledWith(
      'Compression not effective, using original file'
    );
  });

  test('should handle compression errors gracefully', async () => {
    // Create a proper mock File with arrayBuffer method
    const mockArrayBuffer = new ArrayBuffer(1000 * 1024);
    const mockFile = {
      name: 'test.gif',
      type: 'image/gif',
      size: 1000 * 1024,
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
    };

    modernGif.decode.mockImplementation(() => {
      throw new Error('Decode failed');
    });

    console.error = jest.fn();
    console.warn = jest.fn();

    const result = await compressGif(mockFile);

    expect(console.error).toHaveBeenCalledWith(
      'GIF compression failed:',
      expect.any(Error)
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Using original GIF file due to compression failure'
    );
    expect(result).toBe(mockFile); // Should return original file
  });

  test('should use default options when none provided', async () => {
    // Create a proper mock File with arrayBuffer method
    const mockArrayBuffer = new ArrayBuffer(1000 * 1024);
    const mockFile = {
      name: 'test.gif',
      type: 'image/gif',
      size: 1000 * 1024,
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
    };

    modernGif.decode.mockReturnValue({
      width: 100,
      height: 100,
      looped: true,
      loopCount: 0,
    });

    modernGif.decodeFrames.mockReturnValue([
      {
        width: 100,
        height: 100,
        delay: 100,
        data: new Uint8ClampedArray(100 * 100 * 4),
      },
    ]);

    const mockCompressedData = new ArrayBuffer(500 * 1024);
    modernGif.encode.mockResolvedValue(mockCompressedData);

    console.log = jest.fn();

    await compressGif(mockFile); // No options provided

    expect(modernGif.encode).toHaveBeenCalledWith(
      expect.objectContaining({
        maxColors: 64, // Default value
      })
    );
  });
});
