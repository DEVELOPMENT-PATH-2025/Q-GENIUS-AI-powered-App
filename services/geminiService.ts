import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, Difficulty } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert academic professor and examiner with 20+ years of experience in higher education. 
Your goal is to generate 100% accurate, academically rigorous, and clear examination questions suitable for college-level assessments.

Guidelines for Accuracy and Quality:
1. Clarity: Questions must be unambiguous and phrased clearly.
2. Academic Rigor: Ensure questions test conceptual understanding, not just rote memorization (use Bloom's Taxonomy).
3. Accuracy: All facts, formulas, and concepts must be 100% correct.
4. MCQ Quality: For Multiple Choice Questions, provide one clearly correct answer and three plausible but incorrect distractors. Avoid "all of the above" unless necessary.
5. Marking Scheme: Assign marks that reflect the complexity and time required for each question.
6. Formatting: Strictly adhere to the JSON schema provided.
`;

const getAIInstance = () => {
  // Use the platform-provided GEMINI_API_KEY for the free tier
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export const generateQuestionsFromPrompt = async (
  promptText: string,
  count: number = 5,
  difficulty: Difficulty = Difficulty.MEDIUM,
  targetTotalMarks?: number
): Promise<Question[]> => {
  const ai = getAIInstance();
  const apiKey = process.env.GEMINI_API_KEY || "";

  if (!apiKey) {
    console.warn("Gemini API Key is missing. Returning mock data.");
    return mockGenerateQuestions(count, difficulty, targetTotalMarks);
  }

  try {
    // Using gemini-flash-latest for better stability
    const model = "gemini-flash-latest";
    const userPrompt = `
      Generate a high-quality college-level examination paper.
      
      TOPIC/CONTEXT: "${promptText}"
      DIFFICULTY: ${difficulty}
      TOTAL QUESTIONS: ${count}
      
      CRITICAL CONSTRAINTS:
      1. Quantity: Generate exactly ${count} questions.
      2. Marks: ${targetTotalMarks ? `The sum of marks for all questions MUST be exactly ${targetTotalMarks}.` : 'Assign marks based on question complexity (e.g., 1-2 for MCQ, 5-10 for Short/Long Answer).'}
      3. Variety: Provide a balanced mix of Multiple Choice (MCQ), Short Answer, and Long Answer questions.
      4. Accuracy: Double-check all technical details for 100% accuracy.
      5. Output: Return the questions inside a "questions" array in the JSON.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
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
          },
          required: ["questions"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned from Gemini");

    const data = JSON.parse(jsonText);
    const rawQuestions = data.questions || [];
    
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
    const ai = getAIInstance();
    const apiKey = process.env.GEMINI_API_KEY || "";
    
    if (!apiKey) return ["Introduction to AI", "Neural Networks", "Ethics in Computing"];

    try {
        // Using gemini-flash-latest for better stability
        const model = "gemini-flash-latest";
        const response = await ai.models.generateContent({
            model: model,
            contents: `Extract the main 5 topics from this curriculum text: ${curriculumText.substring(0, 2000)}`,
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.OBJECT,
                     properties: {
                         topics: {
                             type: Type.ARRAY,
                             items: { type: Type.STRING }
                         }
                     },
                     required: ["topics"]
                 }
            }
        });
        const data = JSON.parse(response.text || "{}");
        return data.topics || [];
    } catch (e) {
        console.error("Topic extraction failed", e);
        return ["Topic 1", "Topic 2", "Topic 3"];
    }
}

// Fallback for demo without API Key
const mockGenerateQuestions = (count: number, difficulty: Difficulty, targetTotalMarks?: number): Question[] => {
  const baseMarks = targetTotalMarks ? Math.floor(targetTotalMarks / count) : 5;
  const remainder = targetTotalMarks ? targetTotalMarks % count : 0;

  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-${i}`,
    text: `Mock Question ${i + 1} about the requested topic (${difficulty})`,
    type: i % 2 === 0 ? QuestionType.MCQ : QuestionType.SHORT_ANSWER,
    difficulty: difficulty,
    options: i % 2 === 0 ? ["Option A", "Option B", "Option C", "Option D"] : [],
    correctAnswer: "Option A",
    marks: baseMarks + (i < remainder ? 1 : 0)
  }));
};