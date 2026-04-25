import React, { useState, useEffect, useRef } from 'react';
import { User, Chat, ChatMessage, ChatStatus, UserRole, Attachment } from '../types';
import { storageService } from '../services/storageService';
import { 
  Send, UserCircle, Search, MessageCircle, Megaphone, 
  ArrowLeft, Check, Trash2, MoreHorizontal, Paperclip, 
  Image as ImageIcon, X, FileText, Sparkles, Bookmark,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SelfChat from '../components/SelfChat';
import { socket, connectSocket } from '../services/socket';
import * as api from '../services/api';

interface DirectMessagesProps {
  currentUser: User;
}

// Simple highlighter component
const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
          ? <span key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{part}</span> 
          : part
      )}
    </>
  );
};

export default function DirectMessages({ currentUser }: DirectMessagesProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const userChats = await api.getUserChats(currentUser.id);
        setChats(userChats);
        
        // Fetch users from API instead of storageService if possible
        // For now, keep storageService.getUsers() for the search list 
        // until we have a proper backend users list route
        setAllUsers(storageService.getUsers());

        if (!activeChat && userChats.length > 0) {
          setActiveChat(userChats[0]);
        }
      } catch (error) {
        console.error('Failed to load initial chats:', error);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      connectSocket(currentUser.id);
      loadChats();
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      socket.emit('join_room', activeChat.id);
    }

    const handleReceiveMessage = (message: any) => {
      if (activeChat && message.chat_id === activeChat.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
      loadChats(); // Refresh last message in list
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [activeChat]);

  const loadChats = async () => {
    try {
      const userChats = await api.getUserChats(currentUser.id);
      setChats(userChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const history = await api.getChatMessages(chatId);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'doc') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 10 * 1024 * 1024) {
              alert("File size exceeds 10MB limit.");
              return;
          }

          try {
              const base64 = await storageService.fileToBase64(file);
              const newAtt: Attachment = {
                  id: `att-${Date.now()}`,
                  type: type === 'image' ? 'image' : 'doc',
                  url: base64,
                  name: file.name
              };
              setAttachments([...attachments, newAtt]);
          } catch (err) {
              console.error("Upload failed", err);
              alert("Failed to upload file.");
          }
      }
      e.target.value = '';
  };

  const removeAttachment = (id: string) => {
      setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat) return;
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      const messageData = {
        chatId: activeChat.id,
        senderId: currentUser.id,
        content: newMessage.trim(),
        attachments: attachments.length > 0 ? attachments : undefined
      };

      const sentMessage = await api.sendChatMessage(messageData);
      
      // Update local state immediately for better UX
      setMessages(prev => [...prev, sentMessage]);
      
      // Emit via socket for real-time
      socket.emit('send_message', {
        chatId: activeChat.id,
        message: sentMessage
      });

      setNewMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
      
      // Refresh chat list to update last message
      loadChats();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleAccept = async () => {
      if (!activeChat) return;
      try {
        await api.updateChatStatus(activeChat.id, 'ACCEPTED');
        loadChats();
        setActiveChat(prev => prev ? { ...prev, status: ChatStatus.ACCEPTED } : null);
      } catch (error) {
        console.error('Failed to accept chat:', error);
      }
  };

  const handleReject = async () => {
      if (!activeChat) return;
      if (confirm('Are you sure you want to decline this request?')) {
          try {
            await api.updateChatStatus(activeChat.id, 'REJECTED');
            setActiveChat(null);
            loadChats();
          } catch (error) {
            console.error('Failed to reject chat:', error);
          }
      }
  };

  const getOtherParticipantId = (chat: Chat) => {
      if (chat.id === 'chat-announcements') return 'u-admin';
      return chat.participantIds.find(id => id !== currentUser.id) || '';
  };

  const getOtherParticipant = (chat: Chat) => {
      const otherId = getOtherParticipantId(chat);
      const localUser = storageService.getUserById(otherId);
      if (localUser) return localUser;
      
      // Fallback to info provided by backend in the Chat object
      return {
        id: otherId,
        fullName: chat.otherParticipantName || 'Unknown User',
        avatarUrl: chat.otherParticipantAvatar,
        username: chat.otherParticipantUsername || 'unknown',
        isAnonymous: false
      } as User;
  };

  const handleStartNewChat = async (targetUserId: string) => {
      try {
        const newChat = await api.startChat(currentUser.id, targetUserId);
        await loadChats();
        setActiveChat(newChat);
        setSearchQuery('');
      } catch (error) {
        console.error('Failed to start new chat:', error);
      }
  };

  // --- Search Logic ---

  const getFilteredItems = () => {
      if (!searchQuery.trim()) return { filteredChats: chats, newUsers: [] };

      const query = searchQuery.toLowerCase();

      // 1. Filter existing chats
      const filteredChats = chats.filter(chat => {
          const otherUser = getOtherParticipant(chat);
          const name = otherUser?.fullName.toLowerCase() || '';
          const username = otherUser?.username.toLowerCase() || '';
          const lastMsg = chat.lastMessage?.content.toLowerCase() || '';
          
          // Special Handlers
          if (chat.id === 'chat-announcements') return 'official announcements'.includes(query) || lastMsg.includes(query);
          if (chat.id === storageService.getSelfChatId(currentUser.id)) return 'my notes'.includes(query) || lastMsg.includes(query);

          return name.includes(query) || username.includes(query) || lastMsg.includes(query);
      });

      // 2. Search for new users (not in active chats)
      // Collect IDs of people we are already chatting with
      const existingContactIds = new Set<string>();
      chats.forEach(c => {
          c.participantIds.forEach(id => existingContactIds.add(id));
      });
      // Add 'u-admin' if announcements exists
      if (chats.some(c => c.id === 'chat-announcements')) existingContactIds.add('u-admin');

      const newUsers = allUsers.filter(u => {
          if (u.id === currentUser.id) return false;
          if (existingContactIds.has(u.id)) return false; // Already filtered above

          const name = u.fullName.toLowerCase();
          const username = u.username.toLowerCase();
          return name.includes(query) || username.includes(query);
      });

      return { filteredChats, newUsers };
  };

  const { filteredChats, newUsers } = getFilteredItems();
  const totalResults = filteredChats.length + newUsers.length;

  const isAnnouncementChat = activeChat?.id === 'chat-announcements';
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isSelfChat = activeChat?.id === storageService.getSelfChatId(currentUser.id);

  const isSameDay = (d1: number, d2: number) => {
      const date1 = new Date(d1);
      const date2 = new Date(d2);
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
  };

  const renderMessagesWithSeparators = () => {
      const rendered: React.ReactNode[] = [];
      let lastDate = 0;

      messages.forEach((msg, index) => {
          if (!isSameDay(lastDate, msg.timestamp)) {
             const label = new Date(msg.timestamp).toDateString() === new Date().toDateString() 
                ? 'Today' 
                : new Date(msg.timestamp).toLocaleDateString([], {weekday: 'long', month: 'short', day: 'numeric'});
             
             rendered.push(
                 <div key={`date-${index}`} className="flex justify-center my-6">
                     <span className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-700 uppercase tracking-wide">
                         {label}
                     </span>
                 </div>
             );
             lastDate = msg.timestamp;
          }

          const isMe = msg.senderId === currentUser.id;
          const showAvatar = isAnnouncementChat && msg.senderId === 'u-admin';
          
          rendered.push(
              <div key={msg.id} className={`flex mb-4 ${isMe && !isAnnouncementChat ? 'justify-end' : 'justify-start'}`}>
                  {showAvatar && (
                      <div className="mr-2 flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-yellow-900/30 flex items-center justify-center text-yellow-500 font-bold text-[10px] border border-yellow-800/50">
                              ADM
                          </div>
                      </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 shadow-sm flex flex-col ${
                      isMe && !isAnnouncementChat
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-none'
                  } ${isAnnouncementChat ? 'bg-yellow-900/10 border-yellow-900/20 text-yellow-100' : ''}`}>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-2 space-y-2">
                              {msg.attachments.map(att => (
                                  <div key={att.id}>
                                      {att.type === 'image' ? (
                                          <img src={att.url} alt="attachment" className="rounded-lg max-h-60 w-auto object-cover border border-white/10" />
                                      ) : (
                                          <div className={`flex items-center gap-2 p-2 rounded-lg ${isMe ? 'bg-white/10' : 'bg-slate-800'}`}>
                                              <FileText size={20} />
                                              <span className="text-sm truncate max-w-[150px]">{att.name}</span>
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      )}

                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right font-medium opacity-80 ${isMe && !isAnnouncementChat ? 'text-blue-100' : 'text-slate-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                  </div>
              </div>
          );
      });
      return rendered;
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)]">
        
        {/* Left Column: List */}
        <div className={`lg:col-span-1 flex flex-col gap-6 h-full ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* Header */}
            <div className="mb-2">
               <h1 className="text-2xl font-bold text-white">Messages</h1>
               <p className="text-slate-400 text-sm">Connect with your peers privately.</p>
            </div>

            {/* Search */}
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-950 focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm transition-all"
                        placeholder="Search messages..."
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Conversations</h3>
                    </div>
                    {searchQuery && (
                        <span className="text-xs font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-900/30">
                            {totalResults} found
                        </span>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {/* No Results State */}
                    {totalResults === 0 && searchQuery && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                            <Search size={24} className="mb-2 opacity-50" />
                            <p>No conversations found.</p>
                        </div>
                    )}
                    
                    {/* Empty State */}
                    {chats.length === 0 && !searchQuery && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                            <MessageCircle size={24} className="mb-2 opacity-50" />
                            <p>No conversations yet.</p>
                        </div>
                    )}

                    {/* Filtered Existing Chats */}
                    {filteredChats.map(chat => {
                        const otherUser = getOtherParticipant(chat);
                        const isPending = chat.status === ChatStatus.PENDING;
                        const amIInitiator = chat.initiatorId === currentUser.id;
                        const isAnnounce = chat.id === 'chat-announcements';
                        const isSelf = chat.id === storageService.getSelfChatId(currentUser.id);
                        const isActive = activeChat?.id === chat.id;
                        const lastMsg = chat.lastMessage?.content || '';
                        
                        return (
                          <div 
                            key={chat.id}
                            onClick={() => { setActiveChat(chat); setSearchQuery(''); }}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-blue-900/20 border border-blue-900/50' : 'hover:bg-slate-800 border border-transparent'}`}
                          >
                            {isAnnounce ? (
                                <div className="w-12 h-12 rounded-full bg-yellow-900/20 flex items-center justify-center font-bold text-yellow-500 flex-shrink-0 border border-yellow-900/30 shadow-sm">
                                    <Megaphone size={20} />
                                </div>
                            ) : isSelf ? (
                                <div className="w-12 h-12 rounded-full bg-indigo-900/20 flex items-center justify-center font-bold text-indigo-400 flex-shrink-0 border border-indigo-900/30 shadow-sm">
                                    <Bookmark size={20} className="fill-current" />
                                </div>
                            ) : (
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700 text-base shadow-sm">
                                        {otherUser?.isAnonymous ? '?' : otherUser?.fullName.charAt(0)}
                                    </div>
                                    {isPending && !amIInitiator && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900"></span>}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                  <h4 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                                      {isAnnounce ? <Highlight text="Announcements" highlight={searchQuery} /> 
                                       : isSelf ? <Highlight text="My Notes" highlight={searchQuery} /> 
                                       : <Highlight text={otherUser?.isAnonymous ? 'Anonymous Student' : (otherUser?.fullName || '')} highlight={searchQuery} />
                                      }
                                  </h4>
                                  <span className={`text-xs font-medium ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                      {new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                              </div>
                              <p className={`text-xs truncate ${isPending ? 'font-bold text-blue-500' : (isActive ? 'text-blue-300' : 'text-slate-500')}`}>
                                 {isAnnounce 
                                    ? (lastMsg ? <Highlight text={lastMsg} highlight={searchQuery} /> : 'Check updates')
                                    : isSelf
                                    ? (lastMsg ? <Highlight text={lastMsg} highlight={searchQuery} /> : 'Save messages privately')
                                    : (isPending 
                                        ? (amIInitiator ? 'Request sent' : 'New request') 
                                        : (lastMsg ? <Highlight text={lastMsg} highlight={searchQuery} /> : 'Start chatting'))}
                              </p>
                            </div>
                          </div>
                        );
                    })}

                    {/* New User Matches */}
                    {newUsers.length > 0 && (
                        <>
                            <div className="px-2 py-2 mt-2 border-t border-slate-800">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start New Chat</p>
                            </div>
                            {newUsers.map(u => (
                                <div 
                                    key={u.id}
                                    onClick={() => handleStartNewChat(u.id)}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700 shadow-sm relative">
                                        {u.isAnonymous ? '?' : u.fullName.charAt(0)}
                                        <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 border border-slate-700">
                                            <UserPlus size={12} className="text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-white truncate">
                                            <Highlight text={u.fullName} highlight={searchQuery} />
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate">
                                            @{u.username} • {u.department}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Active Chat */}
        <div className={`lg:col-span-2 h-full flex flex-col ${!activeChat ? 'hidden lg:flex' : 'flex'}`}>
             
             {activeChat ? (
                // CONDITIONAL RENDER: Check if it is a self chat
                isSelfChat ? (
                    <SelfChat currentUser={currentUser} onBack={() => setActiveChat(null)} />
                ) : (
                    // STANDARD CHAT RENDER
                    <div className="flex-1 bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col">
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 flex-shrink-0">
                             <div className="flex items-center gap-4">
                                 <button onClick={() => setActiveChat(null)} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white">
                                     <ArrowLeft size={20} />
                                 </button>
                                 {isAnnouncementChat ? (
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-900/20 flex items-center justify-center font-bold text-yellow-500 border border-yellow-900/30">
                                            <Megaphone size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white leading-tight">Official Announcements</h3>
                                            <p className="text-sm text-slate-400">Admin Broadcast Channel</p>
                                        </div>
                                     </div>
                                 ) : (
                                     <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(`/u/${getOtherParticipantId(activeChat)}`)}>
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700 text-sm shadow-sm">
                                            {getOtherParticipant(activeChat)?.isAnonymous ? '?' : getOtherParticipant(activeChat)?.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white leading-tight group-hover:text-blue-400 transition-colors">
                                                {getOtherParticipant(activeChat)?.isAnonymous ? 'Anonymous Student' : getOtherParticipant(activeChat)?.fullName}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                <p className="text-xs text-slate-400 font-bold">Online</p>
                                            </div>
                                        </div>
                                     </div>
                                 )}
                             </div>
                             
                             {!isAnnouncementChat && (
                                 <button className="text-slate-400 hover:bg-slate-800 p-2 rounded-full transition-colors">
                                     <MoreHorizontal size={24} />
                                 </button>
                             )}
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
                            {!isAnnouncementChat && activeChat.status === ChatStatus.PENDING ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-800">
                                       <UserCircle size={40} className="text-slate-600" />
                                    </div>
                                    {activeChat.initiatorId === currentUser.id ? (
                                        <>
                                           <h3 className="font-bold text-lg text-white mb-1">Request Sent</h3>
                                           <p className="text-slate-400 text-sm max-w-xs mx-auto">You can send messages once {getOtherParticipant(activeChat)?.fullName} accepts your request.</p>
                                        </>
                                    ) : (
                                        <>
                                           <h3 className="font-bold text-lg text-white mb-1">Message Request</h3>
                                           <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                                               {getOtherParticipant(activeChat)?.fullName} wants to send you a message.
                                           </p>
                                           <div className="flex gap-3">
                                               <button onClick={handleAccept} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors shadow-sm">Accept</button>
                                               <button onClick={handleReject} className="bg-slate-900 border border-slate-700 text-slate-300 px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">Decline</button>
                                           </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                   {messages.length === 0 && (
                                       <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                           <p className="text-sm font-medium">No messages yet</p>
                                       </div>
                                   )}
                                   {renderMessagesWithSeparators()}
                                   <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        {(activeChat.status === ChatStatus.ACCEPTED || (isAnnouncementChat && isAdmin)) && (
                            <div className="p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
                                
                                {/* Attachments Preview */}
                                {attachments.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto pb-3 mb-2 px-1">
                                        {attachments.map(att => (
                                            <div key={att.id} className="relative group flex-shrink-0 bg-slate-800 border border-slate-700 rounded-lg p-2 pr-8 flex items-center gap-2 max-w-[200px]">
                                                {att.type === 'image' ? (
                                                    <ImageIcon size={16} className="text-blue-500" />
                                                ) : (
                                                    <FileText size={16} className="text-blue-500" />
                                                )}
                                                <span className="text-xs truncate text-slate-300 font-medium">{att.name}</span>
                                                <button 
                                                    onClick={() => removeAttachment(att.id)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500 p-1"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isAnnouncementChat && !isAdmin ? (
                                    <div className="text-center text-sm text-slate-500 bg-slate-950 py-3 rounded-xl border border-slate-800 flex items-center justify-center gap-2">
                                        <Megaphone size={16} />
                                        Only administrators can post announcements.
                                    </div>
                                ) : (
                                    <form onSubmit={handleSend} className="relative flex items-end gap-3">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            onChange={(e) => handleFileUpload(e, 'doc')}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                        />
                                        <input 
                                            type="file" 
                                            ref={imageInputRef} 
                                            className="hidden" 
                                            onChange={(e) => handleFileUpload(e, 'image')}
                                            accept="image/png, image/jpeg, image/gif"
                                        />
                                        
                                        <div className="flex gap-1 mb-1">
                                            <button 
                                                type="button" 
                                                onClick={() => imageInputRef.current?.click()}
                                                className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-full transition-colors"
                                                title="Upload Image"
                                            >
                                                <ImageIcon size={22} />
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-full transition-colors"
                                                title="Upload Document"
                                            >
                                                <Paperclip size={22} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl focus-within:ring-2 focus-within:ring-blue-900 focus-within:border-blue-700 transition-all flex items-center px-4 py-3">
                                            <input 
                                                type="text" 
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                placeholder={isAnnouncementChat ? "Broadcast announcement..." : "Type a message..."}
                                                className="flex-1 bg-transparent focus:outline-none text-white placeholder-slate-500 text-base"
                                            />
                                        </div>
                                        
                                        <button 
                                            type="submit" 
                                            disabled={!newMessage.trim() && attachments.length === 0} 
                                            className="bg-blue-600 text-white p-3.5 rounded-full hover:bg-blue-500 shadow-sm transition-all disabled:opacity-50 disabled:scale-95 flex-shrink-0 mb-0.5"
                                        >
                                            <Send size={20} className={newMessage.trim() || attachments.length > 0 ? "ml-0.5" : ""} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                )
             ) : (
                <div className="flex-1 bg-slate-900 rounded-2xl shadow-sm border border-slate-800 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-600">
                        <MessageCircle size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
                    <p className="text-slate-400 max-w-xs">Select a conversation from the list or start a new one to connect with your peers.</p>
                </div>
             )}
        </div>

      </div>
    </div>
  );
}