export enum QuestionType {
  CONCEPTUAL = 'CONCEPTUAL',
  CODE_PREDICTION = 'CODE_PREDICTION', // User predicts output
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CODING_CHALLENGE = 'CODING_CHALLENGE', // User writes code
  UNKNOWN = 'UNKNOWN'
}

export enum ValidationMethod {
  AI = 'AI',
  EXECUTION = 'EXECUTION',
  EXACT_MATCH = 'EXACT_MATCH'
}

export interface Question {
  id: string;
  rawText: string;
  processed?: boolean;
  type?: QuestionType;
  questionText?: string;
  codeSnippet?: string;
  language?: string;
  options?: string[]; // For MCQ
  correctAnswer?: string; // For MCQ or exact match
  expectedOutput?: string; // For code prediction
  explanation?: string;
}

export interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, UserAnswer>; // questionId -> UserAnswer
  score: number;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UserAnswer {
  questionId: string;
  userInput: string;
  isCorrect: boolean;
  feedback: string;
  actualOutput?: string; // For code execution results
  proof?: string; // Citation or execution log
  timestamp: number;
}

export interface RepoConfig {
  url: string;
  files: RepoFile[];
}

export interface RepoFile {
  name: string;
  download_url: string;
  content?: string; // Cached content
}