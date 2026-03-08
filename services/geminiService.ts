import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, Difficulty } from "../types";

// In a real app, this should be in process.env.API_KEY
// Using a placeholder or assuming the environment variable is set in the runtime
const API_KEY = process.env.API_KEY || ""; 

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert academic assistant designed to generate high-quality examination questions. 
Your output must be strictly JSON adhering to the requested schema.
`;

export const generateQuestionsFromPrompt = async (
  promptText: string,
  count: number = 5,
  difficulty: Difficulty = Difficulty.MEDIUM
): Promise<Question[]> => {
  if (!API_KEY) {
    console.warn("Gemini API Key is missing. Returning mock data.");
    return mockGenerateQuestions(count, difficulty);
  }

  try {
    const model = "gemini-2.5-flash";
    const userPrompt = `Generate ${count} ${difficulty} level questions based on this topic/context: "${promptText}". 
    Mix of Multiple Choice and Short Answer. Include marks (default 5 for short answer, 1 for MCQ).`;

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["MCQ", "SHORT_ANSWER", "LONG_ANSWER"] },
              difficulty: { type: Type.STRING, enum: ["EASY", "MEDIUM", "HARD"] },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                nullable: true 
              },
              correctAnswer: { type: Type.STRING },
              marks: { type: Type.NUMBER }
            },
            required: ["text", "type", "difficulty", "marks", "correctAnswer"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned from Gemini");

    const rawQuestions = JSON.parse(jsonText);
    
    // Map to our internal interface ensuring unique IDs
    return rawQuestions.map((q: any, index: number) => ({
      ...q,
      id: `gen-${Date.now()}-${index}`,
      options: q.options || []
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate questions using AI.");
  }
};

export const analyzeCurriculum = async (curriculumText: string): Promise<string[]> => {
    // Simulating extraction of topics from text
    // In a real scenario, we'd pass the file content to Gemini
     if (!API_KEY) return ["Introduction to AI", "Neural Networks", "Ethics in Computing"];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Extract the main 5 topics from this curriculum text: ${curriculumText.substring(0, 2000)}`,
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.ARRAY,
                     items: { type: Type.STRING }
                 }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Topic extraction failed", e);
        return ["Topic 1", "Topic 2", "Topic 3"];
    }
}

// Fallback for demo without API Key
const mockGenerateQuestions = (count: number, difficulty: Difficulty): Question[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-${i}`,
    text: `Mock Question ${i + 1} about the requested topic (${difficulty})`,
    type: i % 2 === 0 ? QuestionType.MCQ : QuestionType.SHORT_ANSWER,
    difficulty: difficulty,
    options: i % 2 === 0 ? ["Option A", "Option B", "Option C", "Option D"] : [],
    correctAnswer: "Option A",
    marks: i % 2 === 0 ? 1 : 5
  }));
};