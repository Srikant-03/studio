export interface Annotation {
  id: string;
  userId: string;
  userName: string;
  pageNumber: number;
  x: number; // percentage
  y: number; // percentage
  content: string;
  timestamp: number;
  color: string;
}

export interface Highlight {
  id: string;
  userId: string;
  userName: string;
  pageNumber: number;
  rects: { x: number; y: number; width: number; height: number }[]; // percentage based
  color: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: 'text' | 'system';
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: {
    pageNumber: number;
    x: number;
    y: number;
  };
}
