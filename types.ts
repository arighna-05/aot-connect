

export enum Department {
  CSE = 'CSE',
  MCA = 'MCA',
  EE = 'EE',
  AIML = 'AIML',
  ECE = 'ECE',
  EEE = 'EEE',
  ME = 'ME',
  CSBS = 'CSBS'
}

export enum Year {
  FIRST = '1st Year',
  SECOND = '2nd Year',
  THIRD = '3rd Year',
  FOURTH = '4th Year'
}

export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    inApp: boolean;
    likesComments?: boolean;
    newFollowers?: boolean;
    mentions?: boolean;
    communityUpdates?: boolean;
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
    allowDMs: 'EVERYONE' | 'FOLLOWERS' | 'NONE';
    showActiveStatus: boolean;
    searchVisibility?: boolean;
    dataUsage?: boolean;
    defaultPostPrivacy?: 'PUBLIC' | 'COMMUNITY';
  };
  accessibility: {
    textSize: 'SMALL' | 'MEDIUM' | 'LARGE';
    reducedMotion: boolean;
    highContrast: boolean;
  };
  language: string;
}

export interface User {
  id: string;
  email: string;
  username: string; 
  usernameLastChanged?: number;
  fullName: string;
  isAnonymous: boolean;
  department?: Department;
  year?: Year;
  interests: string[];
  role: UserRole;
  joinedCommunityIds: string[];
  avatarUrl?: string;
  bannerUrl?: string;
  isVerified: boolean;
  following: string[];
  followers: string[];
  bio?: string;
  pronouns?: string; // NEW
  settings?: UserSettings;
}

export type CommunityType = 'COMMON' | 'PUBLIC_DEPT' | 'RESTRICTED_YEAR' | 'OPEN_CLUB';

export interface Community {
  id: string;
  name: string;
  description: string;
  type: CommunityType;
  category: 'ACADEMIC' | 'INTEREST' | 'OFFICIAL';
  memberCount: number;
  bannerUrl?: string;
  icon?: string;
  rules?: string[];
  isPrivate?: boolean; // For Restricted Year
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'doc';
  url: string;
  name: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
}

export type PostType = 'ANNOUNCEMENT' | 'QUESTION' | 'DISCUSSION' | 'DEFAULT';

export interface Post {
  id: string;
  title?: string; // NEW
  communityId: string;
  communityName?: string; // Hydrated
  authorId: string;
  authorName: string; 
  authorAvatar?: string;
  content: string;
  timestamp: number;
  lastEdited?: number;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  comments: Comment[];
  isAnonymousPost: boolean;
  isPublic: boolean;
  attachments?: Attachment[];
  poll?: Poll;
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  };
  views?: number;
  tags?: string[];
  postType?: PostType;
  bookmarkedBy?: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  likes: number;
  likedBy: string[];
  replies?: Comment[];
}

// --- NEW CHAT TYPES ---

export enum ChatStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface Chat {
  id: string;
  participantIds: string[];
  initiatorId: string;
  status: ChatStatus;
  lastMessage?: {
    content: string;
    timestamp: number;
  };
  updatedAt: number;
  otherParticipantName?: string;
  otherParticipantAvatar?: string;
  otherParticipantUsername?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

// --- NOTIFICATION TYPES ---

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  MENTION = 'MENTION',
  DM_REQUEST = 'DM_REQUEST',
  SYSTEM = 'SYSTEM',
  COMMUNITY = 'COMMUNITY',
  FOLLOW = 'FOLLOW'
}

export interface Notification {
  id: string;
  type: NotificationType;
  actorId?: string;
  actorName?: string;
  content: string;
  targetId?: string;
  timestamp: number;
  isRead: boolean;
  link?: string;
}