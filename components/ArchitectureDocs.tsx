import React from 'react';

interface ArchitectureDocsProps {
  onClose: () => void;
}

const ArchitectureDocs: React.FC<ArchitectureDocsProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-vibe-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="p-8">
          <h1 className="text-3xl font-bold text-vibe-accent mb-6">Technical Specification & Execution Plan</h1>
          
          <div className="space-y-8 text-gray-200">
            
            <section className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-6 rounded-lg border border-blue-500/30">
              <h2 className="text-xl font-bold text-white mb-4">🚀 Getting Started: APIs & Setup</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-blue-300">1. Google Gemini API Key (Required for AI DJ)</h3>
                  <p className="text-sm text-gray-300 mb-2">Used to generate song suggestions based on chat sentiment.</p>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    <li>Go to <a href="https://aistudio.google.com/" target="_blank" className="text-blue-400 underline">Google AI Studio</a>.</li>
                    <li>Click <strong>Get API Key</strong> -> <strong>Create API Key</strong>.</li>
                    <li>In a local environment, create a <code className="bg-black px-1 rounded">.env</code> file and add: <code className="bg-black px-1 rounded">API_KEY=your_key_here</code>.</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-bold text-red-300">2. YouTube Data API (Required for Real Search)</h3>
                  <p className="text-sm text-gray-300 mb-2">Currently, the app mocks video IDs. To find real videos:</p>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-400 underline">Google Cloud Console</a>.</li>
                    <li>Enable <strong>YouTube Data API v3</strong>.</li>
                    <li>Update <code className="bg-black px-1 rounded">geminiService.ts</code> to fetch from: <br/><code className="text-xs break-all">https://www.googleapis.com/youtube/v3/search?part=snippet&q=QUERY&key=YOUR_YT_KEY</code></li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">1. Executive Summary</h2>
              <p>VibeSync is a real-time SPA built with React 18, utilizing the YouTube IFrame API for content and WebSockets for synchronization. It features a latency-compensated sync engine and Gemini-powered content recommendations.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">2. Architecture Overview</h2>
              <div className="bg-black/30 p-4 rounded-lg font-mono text-sm">
                [Client A] <--> [Load Balancer] <--> [Node.js Socket Cluster] <--> [Redis Pub/Sub]
                                                          |
                [Client B] <--> [WebSocket] <---------> [Core API Service] <--> [MongoDB]
              </div>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li><strong>Frontend:</strong> React 18, TypeScript, Tailwind CSS.</li>
                <li><strong>Backend (Planned):</strong> Node.js (Express) + Socket.io.</li>
                <li><strong>State Sync:</strong> Redis (for room state ephemeral data) + MongoDB (persistence).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">3. WebSocket Event Structure</h2>
              <pre className="bg-black/30 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`// Client -> Server
emit('room:join', { roomId, user });
emit('player:action', { action: 'play'|'pause'|'seek', timestamp, videoId });
emit('chat:message', { text, type: 'text'|'reaction' });

// Server -> Client
on('room:state', { playlist, currentVideo, users });
on('player:sync', { action, timestamp }); // Broadcast to others
on('chat:broadcast', { message });`}
              </pre>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-2">4. Database Schema (MongoDB)</h2>
              <pre className="bg-black/30 p-4 rounded-lg font-mono text-xs">
{`Room {
  _id: ObjectId,
  code: String (Index, Unique),
  hostId: String,
  currentVideo: { id: String, startTime: Date, isPlaying: Boolean },
  playlist: [VideoObject],
  mode: 'HOST_ONLY' | 'SHARED'
}

Message {
  roomId: ObjectId,
  userId: String,
  content: String,
  createdAt: Date
}`}
              </pre>
            </section>

             <section>
              <h2 className="text-xl font-bold text-white mb-2">5. Roadmap</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 p-3 rounded">
                    <h3 className="font-bold text-vibe-accent">MVP (Current)</h3>
                    <ul className="list-disc pl-4">
                        <li>Basic Room/Chat</li>
                        <li>Sync Play/Pause</li>
                        <li>Mock Backend</li>
                    </ul>
                </div>
                <div className="bg-white/5 p-3 rounded">
                    <h3 className="font-bold text-blue-400">Production</h3>
                    <ul className="list-disc pl-4">
                        <li>Real Node/Socket Server</li>
                        <li>User Auth (Firebase)</li>
                        <li>Spotify Integration</li>
                    </ul>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDocs;