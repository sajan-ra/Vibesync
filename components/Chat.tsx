import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { socketService } from '../services/mockSocketService';

interface ChatProps {
  currentUser: User;
  messages: Message[];
}

const EMOJIS = ['🔥', '❤️', '😂', '🤯', '🎵', '💃'];

const Chat: React.FC<ChatProps> = ({ currentUser, messages }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      text: inputText,
      timestamp: Date.now(),
      type: 'chat'
    };

    socketService.emit('chat:message', newMsg);
    setInputText('');
  };

  const sendReaction = (emoji: string) => {
    const reaction: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      text: '',
      timestamp: Date.now(),
      type: 'reaction',
      reactionContent: emoji
    };
    socketService.emit('chat:message', reaction);
  };

  return (
    <div className="flex flex-col h-full glass-panel overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/20">
        <h2 className="font-bold text-lg text-white tracking-wide">Live Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
            {msg.type === 'reaction' ? (
              <div className="animate-float">
                <span className="text-sm text-gray-400 mr-2">{msg.username} reacted</span>
                <span className="text-4xl filter drop-shadow-lg">{msg.reactionContent}</span>
              </div>
            ) : (
              <div className={`max-w-[85%] ${msg.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-gray-400 mb-1 block">{msg.username}</span>
                <div className={`px-4 py-2 rounded-2xl ${
                  msg.userId === currentUser.id 
                    ? 'bg-vibe-accent text-white rounded-tr-none' 
                    : 'bg-vibe-800 text-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reaction Bar */}
      <div className="px-4 py-2 flex gap-2 justify-center border-t border-white/5 bg-black/10">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="hover:scale-125 transition-transform text-xl p-1"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-vibe-900/50 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-vibe-accent transition-colors"
          />
          <button 
            type="submit"
            className="bg-vibe-accent hover:bg-pink-600 text-white rounded-full p-2 px-4 font-bold text-sm transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;