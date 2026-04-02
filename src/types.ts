export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    studyReminders: boolean;
  };
}

export interface StudySession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  subject: string;
  topic: string;
  notes: string;
  focusScore?: number; // 1-10
  status: 'active' | 'completed' | 'paused';
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  subject: string;
  createdAt: string;
}

export interface StudyInsight {
  id: string;
  userId: string;
  date: string;
  content: string; // AI generated insight
  type: 'productivity' | 'focus' | 'subject-mastery';
}
