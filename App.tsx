import React, { useState, useEffect, useCallback } from 'react';
import { User, RoomState, RoomMode, UserRole, Video, Message, PlayerState } from './types';
import VideoPlayer from './components/VideoPlayer';
import Chat from './components/Chat';
import { socketService } from './services/mockSocketService';
import { getSongSuggestions } from './services/geminiService';
import ArchitectureDocs from './components/ArchitectureDocs';

// Mock Initial Data
const INITIAL_USER: User = {
  id: 'user-' + Math.floor(Math.random() * 10000),
  username: 'Guest' + Math.floor(Math.random() * 100),
  role: UserRole.HOST // Default to host for demo purposes
};

const INITIAL_VIDEO: Video = {
  id: 'jfKfPfyJRdk', // Lofi Girl Stream ID
  title: 'lofi hip hop radio - beats to relax/study to',
  thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg'
};

const App: React.FC = () => {
  const [isInRoom, setIsInRoom] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [roomState, setRoomState] = useState<RoomState>({
    id: 'room-1',
    users: [INITIAL_USER],
    playlist: [INITIAL_VIDEO],
    currentVideoIndex: 0,
    playerState: {
      videoId: INITIAL_VIDEO.id,
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now()
    },
    mode: RoomMode.SHARED
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // --- Socket Listeners ---
  useEffect(() => {
    // Listen for incoming sync events from "server"
    const handlePlayerSync = (data: { action: string, timestamp: number, videoId?: string }) => {
      setRoomState(prev => ({
        ...prev,
        playerState: {
          ...prev.playerState,
          isPlaying: data.action === 'play',
          currentTime: data.timestamp,
          videoId: data.videoId || prev.playerState.videoId
        }
      }));
    };

    const handleChatMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };

    socketService.on('player:sync', handlePlayerSync);
    socketService.on('chat:message', handleChatMessage);

    return () => {
      socketService.off('player:sync', handlePlayerSync);
      socketService.off('chat:message', handleChatMessage);
    };
  }, []);

  // --- Handlers ---

  const handleJoin = () => {
    setIsInRoom(true);
    socketService.emit('room:join', { user });
    // Add system welcome message
    setMessages(prev => [...prev, {
      id: 'sys-1',
      userId: 'system',
      username: 'System',
      text: `Welcome to the room, ${user.username}!`,
      timestamp: Date.now(),
      type: 'system'
    }]);
  };

  const handleControlAction = (action: 'play' | 'pause' | 'seek', time: number) => {
    // Optimistic UI update could go here, but we rely on socket echo for pure sync demonstration
    socketService.emit('player:action', { 
      action, 
      timestamp: time, 
      videoId: roomState.playlist[roomState.currentVideoIndex].id 
    });
  };

  const handleQueueAdd = (video: Video) => {
    setRoomState(prev => ({
      ...prev,
      playlist: [...prev.playlist, video]
    }));
  };

  const handleNextVideo = () => {
    const nextIndex = (roomState.currentVideoIndex + 1) % roomState.playlist.length;
    const nextVideo = roomState.playlist[nextIndex];
    
    setRoomState(prev => ({
      ...prev,
      currentVideoIndex: nextIndex,
      playerState: { ...prev.playerState, videoId: nextVideo.id, currentTime: 0, isPlaying: true }
    }));
    
    socketService.emit('player:action', { 
      action: 'play', 
      timestamp: 0, 
      videoId: nextVideo.id 
    });
  };

  const handleAskAI = async () => {
    setIsLoadingAI(true);
    const currentSong = roomState.playlist[roomState.currentVideoIndex].title;
    const chatContext = messages.slice(-5).map(m => m.text).join(" ");
    
    const suggestions = await getSongSuggestions(currentSong, chatContext || "chill vibes");
    
    if (suggestions.length > 0) {
      handleQueueAdd(suggestions[0]); // Add first one automatically for demo flow
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        userId: 'ai-dj',
        username: 'AI DJ',
        text: `Based on the vibe, I added "${suggestions[0].title}" to the queue! 🤖`,
        timestamp: Date.now(),
        type: 'system'
      }]);
    }
    setIsLoadingAI(false);
  };

  // --- Renders ---

  if (!isInRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600/30 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

        <div className="glass-panel p-10 max-w-md w-full relative z-10 text-center">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 mb-2">VibeSync</h1>
          <p className="text-gray-400 mb-8">Listen together. Chat together. Vibe together.</p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              value={user.username}
              onChange={(e) => setUser({...user, username: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-vibe-accent outline-none"
              placeholder="Enter your username"
            />
            <button 
              onClick={handleJoin}
              className="w-full bg-gradient-to-r from-vibe-accent to-purple-600 py-3 rounded-lg font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/30"
            >
              Enter Room
            </button>
            <button 
              onClick={() => setShowDocs(true)}
              className="text-xs text-gray-500 hover:text-white underline mt-4"
            >
              View Technical Architecture
            </button>
          </div>
        </div>
        {showDocs && <ArchitectureDocs onClose={() => setShowDocs(false)} />}
      </div>
    );
  }

  const currentVideo = roomState.playlist[roomState.currentVideoIndex];

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Navbar */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <span className="font-bold text-xl tracking-tighter">VibeSync</span>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setShowDocs(true)} className="text-sm text-gray-400 hover:text-white transition-colors">
             Architecture & Docs
           </button>
           <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <span className="text-sm font-medium">{roomState.users.length + 1} Online</span> 
           </div>
           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="avatar" className="w-8 h-8 rounded-full border border-white/20" />
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full h-[calc(100vh-64px)]">
        
        {/* Left Col: Player & Controls (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <VideoPlayer 
            videoId={currentVideo.id}
            initialTime={roomState.playerState.currentTime}
            isPlaying={roomState.playerState.isPlaying}
            role={user.role}
            mode={roomState.mode}
            onStateChange={() => {}} // Heartbeat handled internally
          />

          {/* Controls Bar */}
          <div className="glass-panel p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="font-bold text-lg truncate max-w-[300px]">{currentVideo.title}</h2>
              <span className="text-xs text-gray-400">Now Playing • Sync Active</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleControlAction(roomState.playerState.isPlaying ? 'pause' : 'play', roomState.playerState.currentTime)}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
              >
                {roomState.playerState.isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                ) : (
                  <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>
              <button 
                 onClick={handleNextVideo}
                 className="text-gray-400 hover:text-white"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
          </div>

          {/* Queue & AI Suggestions */}
          <div className="glass-panel flex-1 p-4 overflow-hidden flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-300">Up Next</h3>
               <button 
                  onClick={handleAskAI}
                  disabled={isLoadingAI}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
               >
                 {isLoadingAI ? 'Thinking...' : '✨ AI Suggest'}
               </button>
             </div>
             
             <div className="space-y-2 overflow-y-auto pr-2">
                {roomState.playlist.map((video, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${idx === roomState.currentVideoIndex ? 'bg-white/10 border border-vibe-accent/50' : 'hover:bg-white/5'}`}>
                    <img src={video.thumbnailUrl} alt="thumb" className="w-16 h-9 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                       <p className={`text-sm font-medium truncate ${idx === roomState.currentVideoIndex ? 'text-vibe-accent' : 'text-gray-300'}`}>
                         {video.title}
                       </p>
                    </div>
                    {idx === roomState.currentVideoIndex && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-4 bg-vibe-accent animate-[bounce_1s_infinite]"></div>
                        <div className="w-1 h-4 bg-vibe-accent animate-[bounce_1.2s_infinite]"></div>
                        <div className="w-1 h-4 bg-vibe-accent animate-[bounce_0.8s_infinite]"></div>
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Col: Chat (4 cols) */}
        <div className="lg:col-span-4 h-full min-h-[500px]">
          <Chat currentUser={user} messages={messages} />
        </div>

      </main>

      {showDocs && <ArchitectureDocs onClose={() => setShowDocs(false)} />}
    </div>
  );
};

export default App;