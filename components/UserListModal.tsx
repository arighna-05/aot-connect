import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { X, Search, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  userIds: string[];
  currentUserId: string;
  onUpdate?: () => void;
}

export default function UserListModal({ isOpen, onClose, title, userIds, currentUserId, onUpdate }: UserListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [myFollowing, setMyFollowing] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch user details for the IDs provided
      const list = userIds.map(id => storageService.getUserById(id)).filter(u => !!u) as User[];
      setUsers(list);
      
      // Fetch current user's following list to determine button states
      const me = storageService.getUserById(currentUserId);
      setMyFollowing(me?.following || []);
    }
  }, [isOpen, userIds, currentUserId]);

  if (!isOpen) return null;

  const handleToggleFollow = (targetId: string) => {
      storageService.toggleFollow(currentUserId, targetId);
      
      // Update local state for immediate UI feedback
      const me = storageService.getUserById(currentUserId);
      setMyFollowing(me?.following || []);
      
      if (onUpdate) onUpdate();
  };

  const filteredUsers = users.filter(u => 
      (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                  <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                      <X size={20} />
                  </button>
              </div>
              
              <div className="p-4 border-b border-slate-800">
                  <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                      <input 
                          type="text" 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search users..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors"
                      />
                  </div>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                  {filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">No users found.</div>
                  ) : (
                      <div className="space-y-1">
                          {filteredUsers.map(u => {
                              const isMe = u.id === currentUserId;
                              const isFollowing = myFollowing.includes(u.id);
                              
                              return (
                                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-800 rounded-xl transition-colors group">
                                      <Link to={`/u/${u.id}`} onClick={onClose} className="flex items-center gap-3 overflow-hidden">
                                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold border border-slate-700 overflow-hidden flex-shrink-0">
                                              {u.avatarUrl && !u.isAnonymous ? (
                                                  <img src={u.avatarUrl} className="w-full h-full object-cover" alt={u.username} />
                                              ) : (
                                                  <span className="text-slate-400">{u.isAnonymous ? '?' : u.fullName.charAt(0)}</span>
                                              )}
                                          </div>
                                          <div className="min-w-0">
                                              <div className="flex items-center gap-1">
                                                  <p className="font-bold text-white text-sm truncate">{u.isAnonymous ? 'Anonymous' : u.fullName}</p>
                                                  {u.isVerified && !u.isAnonymous && <Shield size={12} className="text-blue-500 fill-blue-500/20" />}
                                              </div>
                                              <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                                          </div>
                                      </Link>
                                      
                                      {!isMe && !u.isAnonymous && (
                                          <button 
                                              onClick={() => handleToggleFollow(u.id)}
                                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                                  isFollowing 
                                                  ? 'bg-slate-950 border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-900/50' 
                                                  : 'bg-blue-600 border-transparent text-white hover:bg-blue-500'
                                              }`}
                                          >
                                              {isFollowing ? 'Following' : 'Follow'}
                                          </button>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}