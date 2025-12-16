import { GoogleGenAI } from "@google/genai";
import { AIAdapter, Message } from "../types";

// Helper to convert Blob/URL to Base64 Data for Gemini
const urlToInlineData = async (url: string): Promise<{ mimeType: string; data: string } | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Check if result is valid
        if (!base64 || !base64.includes(',')) {
            resolve(null);
            return;
        }
        const [header, data] = base64.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || blob.type || 'application/octet-stream';
        resolve({ mimeType, data });
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to fetch file for context:", url, e);
    return null;
  }
};

export class GeminiAdapter implements AIAdapter {
  private client: GoogleGenAI;

  constructor(apiKey: string, baseUrl?: string) {
    // If no key is provided, use a placeholder to avoid immediate constructor crash
    const safeKey = apiKey || 'MISSING_API_KEY';
    
    const options: any = { apiKey: safeKey };
    
    if (baseUrl) {
      options.baseUrl = baseUrl; 
    }
    this.client = new GoogleGenAI(options);
  }

  async chatStream(
    messages: Message[],
    modelName: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: any) => void,
    attachment?: string
  ): Promise<void> {
    try {
      // 1. Prepare history for Gemini
      const history = await Promise.all(messages.slice(0, -1).map(async (m) => {
        const parts: any[] = [{ text: m.content }];
        
        if (m.attachments && m.attachments.length > 0) {
           for (const att of m.attachments) {
             let inlineData: { mimeType: string, data: string } | null = null;

             if (att.startsWith('data:')) {
               const [header, data] = att.split(',');
               const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
               inlineData = { mimeType, data };
             } else if (att.startsWith('http')) {
               inlineData = await urlToInlineData(att);
             }

             if (inlineData) {
               parts.push({ inlineData });
             }
           }
        }
        
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: parts
        };
      }));

      const lastMessage = messages[messages.length - 1];
      let messageContent: any = [{ text: lastMessage.content }];
      
      // Handle the NEW attachment
      if (attachment) {
        const [header, data] = attachment.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
        messageContent.push({ inlineData: { mimeType, data } });
      } 
      else if (lastMessage.attachments?.length) {
         for (const att of lastMessage.attachments) {
            if (att.startsWith('http')) {
               const inlineData = await urlToInlineData(att);
               if (inlineData) messageContent.push({ inlineData });
            } else if (att.startsWith('data:')) {
               const [header, data] = att.split(',');
               const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
               messageContent.push({ inlineData: { mimeType, data } });
            }
         }
      }

      const chat = this.client.chats.create({
        model: modelName,
        history: history,
      });

      const result = await chat.sendMessageStream({
        message: messageContent
      });

      for await (const chunk of result) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }

      onComplete();

    } catch (error) {
      console.error("Gemini Chat Stream Error:", error);
      onError(error);
    }
  }

  async generateImage(prompt: string, modelName: string): Promise<string> {
    try {
      // 1. Try Imagen models
      if (modelName.includes('imagen')) {
         const imgResponse = await this.client.models.generateImages({
            model: modelName,
            prompt: prompt,
            config: { numberOfImages: 1 }
         });
         const b64 = imgResponse.generatedImages?.[0]?.image?.imageBytes;
         if (b64) return `data:image/jpeg;base64,${b64}`;
      }

      // 2. Try Gemini Image Generation (Nano Banana / Flash Image)
      // This requires the correct model name (e.g. gemini-2.5-flash-image)
      const response = await this.client.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
             aspectRatio: "1:1",
             imageSize: "1K" 
          }
        }
      });
      
      // Parse response for image
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        // Iterate parts to find inlineData
        for (const part of candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        // Fallback: Check if the model refused and sent text
        if (candidates[0].content.parts[0]?.text) {
            const text = candidates[0].content.parts[0].text;
            console.warn("Model returned text instead of image:", text);
            if (text.toLowerCase().includes("cannot generate images")) {
                 throw new Error("This model (" + modelName + ") does not support image generation. Please select 'gemini-2.5-flash-image' or an Imagen model in Admin settings.");
            }
            throw new Error(`Model returned text instead of image: ${text.substring(0, 100)}...`);
        }
      }
      
      throw new Error("No image data found in model response.");

    } catch (error) {
      console.error("Gemini Image Gen Error:", error);
      throw error;
    }
  }
}

let adapterInstance: GeminiAdapter | null = null;

export const getGeminiAdapter = (): GeminiAdapter => {
  if (!adapterInstance) {
    const key = process.env.API_KEY || '';
    adapterInstance = new GeminiAdapter(key);
  }
  return adapterInstance;
};