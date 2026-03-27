export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface UserSettings {
  dailyBriefingTime: string;
  focusGoal: number;
  focusDuration: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  settings?: UserSettings;
}

export interface Task {
  id: string;
  uid: string;
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4;
  status: TaskStatus;
  dueDate?: string;
  estimatedTime?: number;
  aiAnalysis?: {
    whyPriority: string;
    suggestedApproach: string;
  };
  createdAt: string;
}

export interface FocusSession {
  id: string;
  uid: string;
  taskId?: string;
  startTime: string;
  endTime: string;
  duration: number;
  focusScore?: number;
  notes?: string;
}

export interface Note {
  id: string;
  uid: string;
  title: string;
  content: string;
  taskId?: string;
  createdAt: string;
}

export interface DailyBriefing {
  greeting: string;
  topPriorities: string[];
  scheduleSuggestion: string;
  motivationalQuote: string;
}
