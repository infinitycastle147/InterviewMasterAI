

// Placeholder repository that would contain markdown interview questions
// We will default to a "Demo Mode" content if this fails, or use a sample public repo.
export const DEFAULT_REPO_URL = "https://api.github.com/repos/ashish-jeavio/second-brain/contents/Interview%20Questions?ref=main";

export const DEMO_QUESTIONS_MARKDOWN = `
1. What is the difference between null and undefined in JavaScript?
2. Predict the output of the following code:
\`\`\`javascript
console.log(1 + "2" + "2");
console.log(1 + +"2" + "2");
\`\`\`
3. Which method is used to schedule a function to run after a certain delay in JavaScript?
4. Explain the concept of "Hoisting" in JavaScript.
5. What will be the output?
\`\`\`javascript
const bird = {
  size: 'small',
};
const mouse = {
  name: 'Mickey',
  small: true,
};
console.log(mouse[bird.size]);
console.log(mouse[bird.size] === mouse.small);
\`\`\`
`;

export const SYSTEM_INSTRUCTION_CATEGORIZE = `
You are an expert technical interviewer. 
Analyze the provided raw interview question text.

Your primary goal is to structure the content correctly.

Rules for Extraction:
1. **questionText**: The main text of the question. REMOVE any markdown code blocks from this text if you successfully extracted them to codeSnippet.
2. **codeSnippet**: EXPLICITLY EXTRACT any markdown code blocks (content between \`\`\` fences) into this field. Do not include the fences.
   - CHECK CAREFULLY: If the question asks to "Predict output" or "Guess output", there is ALMOST ALWAYS a code block. Find it.
3. **options**: If the text contains list items like "A)", "B)" or "1.", "2." that look like choices, extract them here.
4. **type**: Determine the best category.
   - CODE_PREDICTION: If there is a code snippet and the question asks for output/result/console.log.
   - CODING_CHALLENGE: If asking to write code.
   - MULTIPLE_CHOICE: If options are present.
   - CONCEPTUAL: Default.

Return strictly valid JSON matching this schema:
{
  "type": "CONCEPTUAL" | "CODE_PREDICTION" | "MULTIPLE_CHOICE" | "CODING_CHALLENGE",
  "questionText": "string",
  "codeSnippet": "string" | null,
  "language": "string",
  "options": ["string"] | null
}
`;

export const SYSTEM_INSTRUCTION_VALIDATE = `
You are a strict technical interviewer and code evaluator.
Validate the user's answer for the technical interview question.

Inputs provided:
1. Question Type
2. Original Question
3. Code Snippet (if any)
4. User's Answer

Your Logic:
- If CONCEPTUAL: Analyze accuracy. Be strict. Provide a brief explanation and a source/citation style proof.
- If CODE_PREDICTION:
  - You must MENTALLY EXECUTE the code snippet provided.
  - Determine the exact output (console logs, return values, or Errors).
  - Compare the User's Answer to your calculated output.
  - If the user predicts the correct output (logic wise), it is correct.
  - The 'proof' field should contain the actual output you calculated.
- If MULTIPLE_CHOICE: Check if selected option is correct.

Return strictly valid JSON:
{
  "isCorrect": boolean,
  "feedback": "Short explanation of why it is right or wrong",
  "proof": "Actual Output: <output> OR Explanation",
  "actualOutput": "The output you calculated"
}
`;