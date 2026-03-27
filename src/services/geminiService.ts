import { GoogleGenAI, Type } from "@google/genai";
import { Task, DailyBriefing } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function analyzeTask(taskTitle: string, taskDescription?: string): Promise<{ priority: 1 | 2 | 3 | 4; whyPriority: string; suggestedApproach: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze this task and determine its priority (1-4) based on the Eisenhower Matrix.
    1: Urgent & Important
    2: Important but Not Urgent
    3: Urgent but Not Important
    4: Neither
    
    Task Title: ${taskTitle}
    Description: ${taskDescription || "No description provided."}
    
    Return a JSON object with:
    - priority: number (1-4)
    - whyPriority: string (brief explanation)
    - suggestedApproach: string (how to tackle this efficiently)`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.INTEGER },
          whyPriority: { type: Type.STRING },
          suggestedApproach: { type: Type.STRING }
        },
        required: ["priority", "whyPriority", "suggestedApproach"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateDailyBriefing(tasks: Task[], userName: string): Promise<DailyBriefing> {
  const taskList = tasks.map(t => `- ${t.title} (Priority: ${t.priority}, Status: ${t.status})`).join("\n");
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are a world-class productivity coach. Generate a daily briefing for ${userName}.
    
    Current Tasks:
    ${taskList}
    
    Return a JSON object with:
    - greeting: string (personalized and energetic)
    - topPriorities: string[] (top 3 things to focus on today)
    - scheduleSuggestion: string (a brief suggested flow for the day)
    - motivationalQuote: string (a short, relevant quote)`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          greeting: { type: Type.STRING },
          topPriorities: { type: Type.ARRAY, items: { type: Type.STRING } },
          scheduleSuggestion: { type: Type.STRING },
          motivationalQuote: { type: Type.STRING }
        },
        required: ["greeting", "topPriorities", "scheduleSuggestion", "motivationalQuote"]
      }
    }
  });

  return JSON.parse(response.text);
}
