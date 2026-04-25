import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, UserRole, Department, Year } from "../types";

const API_URL = "http://localhost:5001";

async function apiRequest(path: string, method = "GET", body?: any) {
  const token = localStorage.getItem("aot_token");
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "API request failed");
  }

  return response.json();
}

// Helper to check domain
const checkDomain = (email: string) => {
  return email.endsWith('@aot.edu.in') || email === 'admin@aot.edu.in';
};

// AUTH
export const register = async (data: any) => {
  return apiRequest("/auth/register", "POST", data);
};

export const login = async (data: any) => {
  return apiRequest("/auth/login", "POST", data);
};

export const logout = async () => {
  try {
    await auth.signOut();
    localStorage.removeItem("aot_token");
    localStorage.removeItem("aot_current_user");
  } catch (error: any) {
    console.error("Logout failed", error);
  }
};

// USERS
export const getUserProfile = (id: string) => apiRequest(`/users/${id}`);
export const updateUserProfile = async (id: string, data: Partial<User>) => {
  try {
    const userRef = doc(db, "users", id);
    await setDoc(userRef, data, { merge: true });
    
    // Optionally also call backend if it exists
    try {
      await apiRequest(`/users/${id}`, "PUT", data);
    } catch (e) {
      console.warn("Backend profile update failed, but Firestore succeeded", e);
    }

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Failed to update profile");
  }
};

export const getAllUsers = async () => {
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => doc.data() as User);
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch users");
  }
};

// POSTS
export const getPosts = (communityId?: string) => apiRequest(`/posts${communityId ? `?communityId=${communityId}` : ""}`);
export const createPost = (data: any) => apiRequest("/posts", "POST", data);
export const interactWithPost = (postId: string, userId: string, type: string) => apiRequest(`/posts/${postId}/interact`, "POST", { userId, type });
export const getComments = (postId: string) => apiRequest(`/posts/${postId}/comments`);
export const addComment = (postId: string, data: any) => apiRequest(`/posts/${postId}/comments`, "POST", data);

// COMMUNITIES
export const getCommunities = () => apiRequest("/communities");
export const joinCommunity = (userId: string, communityId: string) => apiRequest("/communities/join", "POST", { userId, communityId });
export const leaveCommunity = (userId: string, communityId: string) => apiRequest("/communities/leave", "POST", { userId, communityId });

// USERS & NETWORK
export const getNetwork = (id: string) => apiRequest(`/users/${id}/network`);
export const toggleFollow = (targetId: string, userId: string) => apiRequest(`/users/${targetId}/follow`, "POST", { userId });

// CHATS
export const getUserChats = (userId: string) => apiRequest(`/chats/user/${userId}`);
export const getChatMessages = (chatId: string) => apiRequest(`/chats/${chatId}/messages`);
export const startChat = (user1Id: string, user2Id: string) => apiRequest("/chats", "POST", { user1Id, user2Id });
export const sendChatMessage = (data: { chatId: string, senderId: string, content: string, attachments?: any[] }) => 
  apiRequest("/chats/messages", "POST", data);
export const updateChatStatus = (chatId: string, status: string) => 
  apiRequest(`/chats/${chatId}/status`, "PUT", { status });