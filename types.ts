export enum UserRole {
  HOST = 'HOST',
  GUEST = 'GUEST',
}

export enum RoomMode {
  HOST_ONLY = 'HOST_ONLY',
  SHARED = 'SHARED',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  status?: string; // e.g., "vibing", "away"
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration?: string;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  type: 'chat' | 'system' | 'reaction';
  reactionContent?: string;
}

export interface PlayerState {
  videoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number; // For drift correction
}

export interface RoomState {
  id: string;
  users: User[];
  playlist: Video[];
  currentVideoIndex: number;
  playerState: PlayerState;
  mode: RoomMode;
}

// Socket Event Payloads (Simulated)
export interface SyncEventPayload {
  action: 'play' | 'pause' | 'seek' | 'sync';
  timestamp: number;
  videoId?: string;
}
