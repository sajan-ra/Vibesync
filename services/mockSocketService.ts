import { SyncEventPayload, Message, User, Video } from "../types";

// This service simulates a Socket.io client for the purpose of this frontend-only demo.
// In production, this would be replaced with actual socket.io-client code.

type EventHandler = (data: any) => void;

class MockSocketService {
  private listeners: Map<string, EventHandler[]> = new Map();
  private latency = 50; // Simulated latency in ms

  constructor() {
    console.log("Mock Socket Service Initialized");
  }

  on(event: string, callback: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: EventHandler) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    }
  }

  // Simulate sending to server, which then broadcasts to all (including self for simplicity in this demo)
  emit(event: string, data: any) {
    setTimeout(() => {
      // In a real app, the server would receive this, validate, and broadcast.
      // Here we just loop it back to listeners to simulate "room" activity.
      this.broadcast(event, data);
      
      // Auto-reply simulation for testing
      if (event === 'chat:message') {
          this.handleSimulatedChat(data);
      }
    }, this.latency);
  }

  private broadcast(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  private handleSimulatedChat(message: Message) {
      // Simulate another user joining or reacting occasionally
      if (Math.random() > 0.8) {
          setTimeout(() => {
             const reaction: Message = {
                 id: Date.now().toString(),
                 userId: 'simulated-user',
                 username: 'VibeBot',
                 text: '',
                 timestamp: Date.now(),
                 type: 'reaction',
                 reactionContent: '🔥'
             }
             this.broadcast('chat:message', reaction);
          }, 2000);
      }
  }
}

export const socketService = new MockSocketService();