import { GoogleGenAI, Type } from "@google/genai";
import { Video } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// We simulate YouTube video IDs for the suggested songs since we don't have a YouTube Search API key here.
// In a production app, we would search the YouTube Data API with the titles returned by Gemini.
const MOCK_VIDEOS = [
  "jfKfPfyJRdk", "L_jWHffIx5E", "fLexgOxsZu0", "9bZkp7q19f0", "5qx7wqCPbLE",
  "CevxZvSJLk8", "op4B9sNGi0k", "m7Bc3pLyXV0", "kJQP7kiw5Fk", "09R8_2nJtjg"
];

function getRandomMockId() {
  return MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)];
}

export const getSongSuggestions = async (currentSongTitle: string, chatContext: string): Promise<Video[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided for Gemini");
    return [];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a DJ in a collaborative music room. The current song is "${currentSongTitle}". 
      The chat vibe is: "${chatContext}".
      Suggest 3 songs that fit the current mood and would be good additions to the queue.
      Return strictly a JSON list.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the song and artist" },
              reason: { type: Type.STRING, description: "Short reason why it fits" }
            },
            required: ["title"]
          }
        }
      }
    });

    // Clean up response if it contains markdown code blocks (e.g., ```json ... ```)
    let jsonStr = response.text || "[]";
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    const suggestions = JSON.parse(jsonStr);

    return suggestions.map((s: any) => ({
      id: getRandomMockId(), // Simulating a YouTube ID lookup
      title: s.title,
      thumbnailUrl: `https://picsum.photos/seed/${s.title.replace(/\s/g, '')}/320/180`,
      duration: "3:45"
    }));

  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return [];
  }
};