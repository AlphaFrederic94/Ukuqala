/**
 * Chess sound effects utility
 */

// Sound effect types
export type ChessSoundType = 'move' | 'capture' | 'notify';

// Sound effect paths
const SOUND_PATHS: Record<ChessSoundType, string> = {
  move: '/sounds/chess/move-self.mp3',
  capture: '/sounds/chess/capture.mp3',
  notify: '/sounds/chess/notify.mp3'
};

// Cache for audio objects
const audioCache: Record<ChessSoundType, HTMLAudioElement> = {} as Record<ChessSoundType, HTMLAudioElement>;

/**
 * Preload all chess sound effects
 */
export function preloadChessSounds(): void {
  Object.entries(SOUND_PATHS).forEach(([type, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audioCache[type as ChessSoundType] = audio;
  });
}

/**
 * Play a chess sound effect
 */
export function playChessSound(type: ChessSoundType): void {
  // Check if sound is enabled in settings
  const soundEnabled = localStorage.getItem('chessSoundEnabled') !== 'false';
  
  if (!soundEnabled) return;
  
  // Get or create audio element
  let audio = audioCache[type];
  
  if (!audio) {
    audio = new Audio(SOUND_PATHS[type]);
    audioCache[type] = audio;
  }
  
  // Reset and play
  audio.currentTime = 0;
  audio.play().catch(err => {
    console.error('Error playing chess sound:', err);
  });
}

/**
 * Toggle chess sounds on/off
 */
export function toggleChessSounds(enabled?: boolean): boolean {
  const currentSetting = localStorage.getItem('chessSoundEnabled') !== 'false';
  const newSetting = enabled !== undefined ? enabled : !currentSetting;
  
  localStorage.setItem('chessSoundEnabled', newSetting.toString());
  return newSetting;
}

/**
 * Check if chess sounds are enabled
 */
export function areChessSoundsEnabled(): boolean {
  return localStorage.getItem('chessSoundEnabled') !== 'false';
}
