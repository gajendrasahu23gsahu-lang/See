export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  bio: string;
  avatar: string;
  banner: string;
  followers: number;
  following: number;
  isVerified: boolean;
  createdAt: string;
  location?: string;
  website?: string;
  phone?: string;
  address?: string;
  password?: string; // stored for mock auth only
}

export interface Article {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  imageUrl: string;
  category?: string;
  content?: string;
}

export interface MiniBlogPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  imageUrl?: string;
  videoUrl?: string;
  location?: string;
  audioUrl?: string;
  likes: string;
  replies: string;
  reposts: string;
  views: string;
  isVerified: boolean;
  user_id?: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  timestampRaw: number;
}

export enum Tab {
  HOME = 'HOME',
  ARTICLE = 'ARTICLE',
  UPLOAD = 'UPLOAD',
  PROFILE = 'PROFILE',
  CHAT = 'CHAT'
}

export interface SearchResult {
  text: string;
  sources?: {
    uri: string;
    title: string;
  }[];
  relatedArticles?: Article[];
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  isVerified?: boolean;
  isActive?: boolean;
  activeStatus?: string;
  hasUnread?: boolean;
  isRestricted?: boolean; 
  isBlocked?: boolean;
  handle: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  isUser: boolean;
  timestamp: string;
  isStoryReply?: boolean;
  isSystem?: boolean;
  expiresAt?: number;
  isExpired?: boolean;
}

export interface MediaAttachment {
  url: string;
  type: 'image' | 'video';
}

export interface DraftPost {
  text: string;
  media: MediaAttachment | null;
  location: { title: string; subtitle: string; lat?: number; lng?: number } | null;
  poll: string[];
  audio: string | null;
  timestamp: number;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'reply' | 'follow' | 'system';
  user?: string;
  userAvatar?: string;
  content?: string;
  time: string;
  isRead: boolean;
}