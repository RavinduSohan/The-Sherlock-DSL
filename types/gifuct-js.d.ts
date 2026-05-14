// Type definitions for gifuct-js
declare module 'gifuct-js' {
  export interface GIFFrame {
    delay: number;
    dims: {
      width: number;
      height: number;
      top: number;
      left: number;
    };
    patch: Uint8ClampedArray;
    disposalType: number;
  }

  export interface ParsedGIF {
    width: number;
    height: number;
    frames: any[];
  }

  export function parseGIF(arrayBuffer: ArrayBuffer): ParsedGIF;
  export function decompressFrames(gif: ParsedGIF, buildImagePatch: boolean): GIFFrame[];
}
