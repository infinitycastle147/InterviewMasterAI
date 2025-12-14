import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, UserAnswer } from "../types";
import { SYSTEM_INSTRUCTION_CATEGORIZE, SYSTEM_INSTRUCTION_VALIDATE } from "../constants";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeQuestion = async (rawText: string): Promise<Partial<Question>> => {
  try {
    const ai = getAI();
    
    // Schema definition for categorization
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: [QuestionType.CONCEPTUAL, QuestionType.CODE_PREDICTION, QuestionType.MULTIPLE_CHOICE, QuestionType.CODING_CHALLENGE] },
        questionText: { type: Type.STRING },
        codeSnippet: { type: Type.STRING, nullable: true },
        language: { type: Type.STRING, nullable: true },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
      },
      required: ["type", "questionText"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: rawText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_CATEGORIZE,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result: Partial<Question> = JSON.parse(text);

    // --- FALLBACK & CLEANUP LOGIC ---
    
    // Improved Regex to find markdown code blocks.
    // Matches ``` (optional language) (whitespace/newline) (content) ```
    // We match liberally to catch standard markdown blocks.
    const codeBlockRegex = /```(\w*)\s+([\s\S]*?)```/;

    // 1. If AI failed to extract code snippet, check the ORIGINAL RAW TEXT.
    if (!result.codeSnippet) {
      const match = rawText.match(codeBlockRegex);
      if (match) {
        result.codeSnippet = match[2].trim();
        result.language = match[1]?.trim() || 'javascript';
        
        // If we found code, it's likely a prediction question or coding challenge
        if (result.type === QuestionType.CONCEPTUAL) {
             const lowerRaw = rawText.toLowerCase();
             if (lowerRaw.includes('output') || lowerRaw.includes('console.log') || lowerRaw.includes('predict') || lowerRaw.includes('guess')) {
                 result.type = QuestionType.CODE_PREDICTION;
             }
        }
      }
    }

    // 2. Clean up the question text.
    // Remove the code block from the question text to avoid duplication in UI
    if (result.questionText) {
        // Try to find the exact snippet in the text
        if (result.codeSnippet && result.questionText.includes(result.codeSnippet)) {
           // Replace the whole block including fences if possible, or just the content
           const escapedSnippet = result.codeSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex chars
           const looseRegex = new RegExp(`\`\`\`.*${escapedSnippet}.*\`\`\``, 's');
           result.questionText = result.questionText.replace(looseRegex, '').trim();
        }
    }

    return result;

  } catch (error) {
    console.error("AI Analysis Failed", error);
    
    // Emergency Fallback: Try to parse manually if AI fails completely
    // Allow loose whitespace after language identifier
    const codeBlockRegex = /```(\w*)\s+([\s\S]*?)```/;
    const match = rawText.match(codeBlockRegex);
    let codeSnippet = undefined;
    let language = undefined;
    let type = QuestionType.CONCEPTUAL;
    let qText = rawText;

    if (match) {
        codeSnippet = match[2].trim();
        language = match[1]?.trim() || 'javascript';
        qText = rawText.replace(match[0], '').trim();
        type = QuestionType.CODE_PREDICTION;
    }

    return {
      type: type,
      questionText: qText,
      codeSnippet,
      language,
      processed: false
    };
  }
};

/**
 * Prepares raw code snippets for execution.
 * Interview questions often contain incomplete fragments (e.g., missing variables or wrapper functions).
 * This function asks AI to make it executable while preserving the logic (including errors if they are the point).
 */
export const prepareExecutableCode = async (rawCode: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `
      You are a JavaScript runtime helper.
      The following code snippet is from a technical interview question "Predict the Output".
      
      It might be incomplete (e.g., missing a function wrapper, missing imports, or undefined variables that should be mocked).
      
      YOUR TASK:
      1. Wrap the code or add context so it can run in a browser console environment (using console.log).
      2. IF the code contains intentional logical errors (like Temporal Dead Zone, Hoisting issues, Scope issues), DO NOT FIX THEM. The user needs to see the error.
      3. IF the code is just a fragment (e.g. just a 'map' call without an array), provide a minimal valid context (e.g. define an array).
      4. RETURN ONLY THE RAW JAVASCRIPT CODE. NO MARKDOWN. NO COMMENTS.
      
      Snippet:
      ${rawCode}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    let text = response.text || rawCode;
    // Clean up if AI wraps in markdown
    text = text.replace(/```javascript/g, '').replace(/```/g, '').trim();
    return text;
  } catch (e) {
    return rawCode; // Fallback to raw code
  }
};

export const validateAnswerWithAI = async (
  question: Question,
  userAnswer: string
): Promise<Partial<UserAnswer>> => {
  try {
    const ai = getAI();

    const prompt = `
      Question Type: ${question.type}
      Question: ${question.questionText}
      Code Snippet:
      ${question.codeSnippet || "N/A"}
      
      User Answer: ${userAnswer}
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isCorrect: { type: Type.BOOLEAN },
        feedback: { type: Type.STRING },
        proof: { type: Type.STRING },
        actualOutput: { type: Type.STRING, nullable: true }
      },
      required: ["isCorrect", "feedback", "proof"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_VALIDATE,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 } // Fast validation
      },
    });

     const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("AI Validation Failed", error);
    return {
      isCorrect: false,
      feedback: "Validation service unavailable.",
      proof: "Error"
    };
  }
};