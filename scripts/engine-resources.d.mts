import type { Buffer } from "node:buffer";

export interface NativeSkinSpriteReference {
  name: string;
  id: number;
}
export function isNativeLaneClipReference(name: string): boolean;
export function compactNativeSkinReferences<T extends NativeSkinSpriteReference>(sprites: readonly T[]): T[];
export function referencesEngineRom(bytes: Buffer, name: string): boolean;
export function loadEngineResources(engineDirectory: string): {
  playData: Buffer;
  watchData: Buffer;
  previewData: Buffer;
  tutorialData: Buffer;
  configuration: Buffer;
  rom?: Buffer;
};
