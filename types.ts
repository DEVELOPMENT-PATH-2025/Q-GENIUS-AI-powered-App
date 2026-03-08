export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY'
}

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
}

export enum QuestionType {
  MCQ = 'MCQ',
  SHORT_ANSWER = 'SHORT_ANSWER',
  LONG_ANSWER = 'LONG_ANSWER'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  options?: string[]; // For MCQs
  correctAnswer?: string;
  marks: number;
}

export enum PaperStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface QuestionPaper {
  id: string;
  title: string;
  courseCode: string;
  facultyId: string;
  facultyName: string;
  createdAt: string;
  status: PaperStatus;
  questions: Question[];
  totalMarks: number;
  durationMinutes: number;
  adminFeedback?: string;
  templateId?: string; // ID of the uploaded college format
}

export interface PaperTemplate {
  id: string;
  name: string;
  fileUrl: string; // Mock URL
  uploadedAt: string;
}

export interface DashboardStats {
  totalPapers: number;
  approved: number;
  rejected: number;
  pending: number;
  topTopics: { name: string; count: number }[];
  difficultyDistribution: { name: string; value: number }[];
}

export type ViewType = 
  | 'dashboard' 
  | 'my_papers' 
  | 'templates' 
  | 'review_queue' 
  | 'reports' 
  | 'users';