import { Question } from '../types';

export const parseQuestions = (markdown: string): Question[] => {
  const lines = markdown.split('\n');
  const questions: Question[] = [];
  let currentQuestion: Partial<Question> | null = null;
  let currentLines: string[] = [];
  let inCodeBlock = false;

  const questionStartRegex = /^\s*(\d+)[\.\)]\s*(.*)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceCount = (line.match(/```/g) || []).length;
    let lineTogglesState = false;
    if (fenceCount > 0 && fenceCount % 2 === 1) {
      lineTogglesState = true;
    }

    const isQuestionLine = !inCodeBlock && questionStartRegex.test(line);

    if (isQuestionLine) {
      const match = line.match(questionStartRegex);
      if (match) {
        if (currentQuestion) {
          currentQuestion.rawText = currentLines.join('\n').trim();
          questions.push(currentQuestion as Question);
        }
        currentQuestion = {
          id: `q-${Date.now()}-${questions.length}`,
          processed: false
        };
        currentLines = [match[2]]; 
      }
    } else {
      if (currentQuestion) {
        currentLines.push(line);
      }
    }

    if (lineTogglesState) {
      inCodeBlock = !inCodeBlock;
    }
  }

  if (currentQuestion) {
    currentQuestion.rawText = currentLines.join('\n').trim();
    questions.push(currentQuestion as Question);
  }

  return questions;
};
