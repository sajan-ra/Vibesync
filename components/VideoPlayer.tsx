import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayerState, RoomMode, UserRole } from '../types';
import { socketService } from '../services/mockSocketService';

// Add type for YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  videoId: string;
  initialTime: number;
  isPlaying: boolean;
  role: UserRole;
  mode: RoomMode;
  onStateChange: (state: PlayerState) => void;
}

const SYNC_THRESHOLD = 2; // seconds allowed to drift

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  initialTime, 
  isPlaying, 
  role, 
  mode,
  onStateChange 
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Can this user control playback?
  const canControl = role === UserRole.HOST || mode === RoomMode.SHARED;

  // Initialize YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = loadPlayer;
    } else {
      loadPlayer();
    }

    return () => {
       if (playerRef.current) {
         playerRef.current.destroy();
       }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update video when ID changes
  useEffect(() => {
    if (isReady && playerRef.current && videoId) {
        // playerRef.current.loadVideoById(videoId);
        // The cue/load logic is handled better by recreating or using loadVideoById
        // For simplicity in this structure, we let the player instance handle it via effect
        const currentId = playerRef.current.getVideoData()?.video_id;
        if (currentId !== videoId) {
             playerRef.current.loadVideoById(videoId, 0); // Start new video at 0
             if (!isPlaying) playerRef.current.pauseVideo();
        }
    }
  }, [videoId, isReady, isPlaying]);

  const loadPlayer = () => {
    if (playerRef.current) return;
    
    playerRef.current = new window.YT.Player('yt-player', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'autoplay': 0, // Auto-play policies often block this without user interaction
        'controls': 0, // We build our own controls or rely on sync
        'rel': 0,
        'modestbranding': 1,
        'disablekb': 1,
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  };

  const onPlayerReady = (event: any) => {
    setIsReady(true);
    // Initial sync
    event.target.seekTo(initialTime);
    if (isPlaying) {
      event.target.playVideo();
    } else {
      event.target.pauseVideo();
    }
  };

  // Handle Internal Player Events (User clicked the YouTube Iframe directly if controls enabled, or updates)
  const onPlayerStateChange = (event: any) => {
     // We mostly rely on external controls, but if we wanted to support clicking the video:
     // 1 = playing, 2 = paused
     if (!canControl) return; // Ignore updates from guests

     const time = event.target.getCurrentTime();
     
     if (event.data === 1) { // Play
        socketService.emit('player:action', { action: 'play', timestamp: time, videoId });
     } else if (event.data === 2) { // Pause
        socketService.emit('player:action', { action: 'pause', timestamp: time, videoId });
     }
  };

  // Handle Incoming Socket Events
  useEffect(() => {
    const handleSync = (data: { action: string, timestamp: number, videoId?: string }) => {
      if (!playerRef.current || !isReady) return;

      const player = playerRef.current;
      const currentTime = player.getCurrentTime();
      
      switch (data.action) {
        case 'play':
          if (Math.abs(currentTime - data.timestamp) > SYNC_THRESHOLD) {
            player.seekTo(data.timestamp, true);
          }
          player.playVideo();
          break;
        case 'pause':
          player.seekTo(data.timestamp, true);
          player.pauseVideo();
          break;
        case 'seek':
          player.seekTo(data.timestamp, true);
          break;
      }
    };

    socketService.on('player:sync', handleSync);
    return () => socketService.off('player:sync', handleSync);
  }, [isReady]);

  // Periodic Drift Check (Simulating the Heartbeat)
  useEffect(() => {
    if (!isReady || !isPlaying) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        // Send heartbeat to context/parent
        onStateChange({
          videoId,
          isPlaying,
          currentTime: playerRef.current.getCurrentTime(),
          lastUpdated: Date.now()
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isReady, isPlaying, videoId, onStateChange]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10 group">
      <div id="yt-player" className="w-full h-full pointer-events-none" />
      
      {/* Overlay to prevent direct interaction if guest, or custom controls overlay */}
      {!canControl && (
        <div className="absolute inset-0 z-10 bg-transparent cursor-default" />
      )}
      
      {/* Visual Indicator of Control Status */}
      <div className="absolute top-4 right-4 z-20">
         <span className={`px-2 py-1 rounded text-xs font-bold ${canControl ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
           {canControl ? 'YOU HAVE CONTROL' : 'HOST CONTROLS'}
         </span>
      </div>
    </div>
  );
};

export default VideoPlayer;