import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const gemini = {
  suggestPriority: async (title: string, description: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Given the task title: "${title}" and description: "${description}", suggest a priority (low, medium, high) and a short reason. Return as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              reason: { type: Type.STRING }
            },
            required: ['priority', 'reason']
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      // Silent error
      return { priority: 'medium', reason: 'Could not determine priority automatically.' };
    }
  },

  categorizeTask: async (title: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Categorize this task: "${title}". Suggest one category from: Work, Personal, Urgent, Study, Health, Finance. Return as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING }
            },
            required: ['category']
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      // Silent error
      return { category: 'General' };
    }
  }
};
