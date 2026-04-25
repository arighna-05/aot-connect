import React, { useState, useEffect, useRef } from 'react';
import { User, Department, Year, Post, UserRole } from '../types';
import { storageService } from '../services/storageService';
import PostCard from '../components/PostCard';
import UserListModal from '../components/UserListModal';
import CreatePostModal from '../components/CreatePostModal';
import EditProfileModal from '../components/EditProfileModal';
import { 
  UserCircle, Mail, Book, Hash, Edit2, Check, X, 
  MapPin, Calendar, Users, FileText, Camera, EyeOff, Shield, Lock,
  Search, Image as ImageIcon, BarChart2, Filter, Sparkles, GraduationCap,
  MoreHorizontal
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface ProfileProps {
  user: User;
  onUpdate: () => void;
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState(storageService.getCommunities().filter(c => user.joinedCommunityIds?.includes(c.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [whoToFollow, setWhoToFollow] = useState<User[]>([]);
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'FOLLOWERS' | 'FOLLOWING' | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'TEXT' | 'MEDIA' | 'LINK' | 'POLL'>('TEXT');
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const navigate = useNavigate();
  const isAdmin = user.role === UserRole.ADMIN;

  // DISPLAY LOGIC FOR ANONYMITY
  const displayUser = {
      fullName: user.isAnonymous ? 'Anonymous Student' : user.fullName,
      username: user.isAnonymous ? 'anonymous' : (user.username || 'username'),
      avatarUrl: user.isAnonymous ? undefined : user.avatarUrl,
      bannerUrl: user.isAnonymous ? undefined : user.bannerUrl,
      pronouns: user.isAnonymous ? undefined : user.pronouns,
      academicInfo: user.isAnonymous ? 'Student' : (isAdmin ? 'System Admin' : `${user.department} • ${user.year}`),
      isVerified: user.isAnonymous ? false : user.isVerified,
      firstName: user.isAnonymous ? 'Student' : user.fullName.split(' ')[0]
  };

  useEffect(() => {
      loadUserPosts();
      loadWhoToFollow();

      // Add listener for global events
      const handleUpdate = () => {
          loadUserPosts();
          // Reload suggestions if needed
          loadWhoToFollow();
      };

      window.addEventListener('post-created', handleUpdate);
      window.addEventListener('profile-updated', handleUpdate);
      
      return () => {
          window.removeEventListener('post-created', handleUpdate);
          window.removeEventListener('profile-updated', handleUpdate);
      }
  }, [user.id]);

  const loadUserPosts = async () => {
      const posts = await storageService.getUserPostsAsync(user.id);
      setUserPosts(posts);
  };


  const loadWhoToFollow = () => {
      const allUsers = storageService.getUsers();
      // Safe check for following array
      const myFollowing = user.following || [];
      const suggestions = allUsers.filter(u => u.id !== user.id && !myFollowing.includes(u.id)).slice(0, 3);
      setWhoToFollow(suggestions);
  };

  const handleTagClick = (tag: string) => {
      navigate(`/?q=${encodeURIComponent(tag)}`);
  };

  const handleOpenModal = (tab: 'TEXT' | 'MEDIA' | 'LINK' | 'POLL' = 'TEXT') => {
      setCreateTab(tab);
      setIsCreatePostModalOpen(true);
  };

  const handleFollow = (targetId: string) => {
      storageService.toggleFollow(user.id, targetId);
      window.location.reload();
  };

  // Filter Posts
  const filteredPosts = userPosts.filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
          p.content.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
      );
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-slate-400 text-sm">Your personal dashboard and activity.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Feed & Posting (Order 2 on Mobile, 1 on Desktop) */}
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
              
              {/* Compact Post Box */}
              <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-4 flex gap-4 items-center">
                  <Link to="/profile" className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold ring-1 ring-slate-700 overflow-hidden text-slate-300">
                          {displayUser.avatarUrl ? (
                              <img src={displayUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-700 text-white">?</div>
                          )}
                      </div>
                  </Link>
                  <button 
                      onClick={() => handleOpenModal('TEXT')}
                      className="flex-1 text-left bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors rounded-full px-5 py-3 text-slate-400 font-medium text-sm shadow-inner"
                  >
                      Post in your profile...
                  </button>
                  <div className="flex gap-2 text-slate-500">
                      <button onClick={() => handleOpenModal('MEDIA')} className="p-2 hover:bg-slate-800 rounded-lg hover:text-blue-400 transition-colors" title="Media">
                          <ImageIcon size={20} />
                      </button>
                      <button onClick={() => handleOpenModal('POLL')} className="p-2 hover:bg-slate-800 rounded-lg hover:text-orange-400 transition-colors" title="Poll">
                          <BarChart2 size={20} />
                      </button>
                  </div>
              </div>

              <CreatePostModal 
                  isOpen={isCreatePostModalOpen}
                  onClose={() => setIsCreatePostModalOpen(false)}
                  user={user}
                  preSelectedCommunity={{
                      id: 'profile',
                      name: 'My Profile',
                      description: 'Post to your followers',
                      type: 'COMMON',
                      category: 'OFFICIAL',
                      memberCount: user.followers?.length || 0
                  } as any}
                  onPostCreated={loadUserPosts}
                  defaultTab={createTab}
              />

              {/* Feed */}
              <div className="space-y-6">
                  {filteredPosts.length === 0 ? (
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
                          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 border border-slate-700">
                              <FileText size={32} />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">
                              {searchQuery ? 'No matching posts' : 'No posts yet'}
                          </h3>
                          <p className="text-slate-400">
                              {searchQuery ? `Couldn't find posts matching "${searchQuery}"` : 'Your shared posts and thoughts will appear here.'}
                          </p>
                      </div>
                  ) : (
                      filteredPosts.map(post => (
                          <div key={post.id}>
                              <PostCard 
                                  post={post}
                                  currentUser={user}
                                  authorDetails={user}
                                  onUpdate={loadUserPosts}
                                  onTagClick={handleTagClick}
                              />
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* Right Column: Profile Info & Widgets (Order 1 on Mobile, 2 on Desktop) */}
          <div className="space-y-6 order-1 lg:order-2">
              
              {/* Profile Card Sidebar */}
              <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden group relative">
                  {/* Banner */}
                  <div className="h-32 w-full relative bg-slate-800">
                      {displayUser.bannerUrl ? (
                          <img src={displayUser.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-900 to-slate-900 opacity-90"></div>
                      )}
                  </div>

                  <div className="px-5 pb-5 relative">
                      {/* Avatar & Edit */}
                      <div className="flex justify-between items-end -mt-10 mb-3">
                          <div className="relative z-10">
                              <div className="w-20 h-20 rounded-full bg-slate-900 p-1 shadow-xl relative ring-4 ring-slate-900">
                                  {displayUser.avatarUrl ? (
                                      <img src={displayUser.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover bg-slate-800" />
                                  ) : (
                                      <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500">
                                          ?
                                      </div>
                                  )}
                              </div>
                          </div>
                          <button
                              onClick={() => setIsEditProfileModalOpen(true)}
                              className="mb-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                              title="Edit Profile"
                          >
                              <Edit2 size={16} />
                          </button>
                      </div>

                      {/* Identity */}
                      <div className="mb-4">
                          <div className="flex items-center gap-1.5 mb-0.5">
                              <h2 className="text-xl font-bold text-white leading-tight">
                                  {displayUser.fullName}
                              </h2>
                              {displayUser.isVerified && <Shield size={16} className="text-blue-500 fill-blue-500/20" />}
                          </div>
                          <p className="text-sm text-slate-400 font-medium">@{displayUser.username}</p>
                          
                          {displayUser.pronouns && (
                              <p className="text-xs text-slate-500 mt-1">{displayUser.pronouns}</p>
                          )}

                          <div className="mt-3 inline-flex items-center gap-1.5 text-blue-400 font-bold text-xs bg-blue-900/10 border border-blue-900/20 px-2.5 py-1 rounded-md">
                              <GraduationCap size={14} />
                              <span>{displayUser.academicInfo}</span>
                          </div>
                      </div>

                      {/* Bio */}
                      <div className="mb-4">
                          <div className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap ${!isBioExpanded ? 'line-clamp-3' : ''}`}>
                              {user.bio || "No bio added yet."}
                          </div>
                          {user.bio && user.bio.length > 100 && (
                              <button 
                                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                                  className="text-blue-500 text-xs font-bold hover:underline mt-1 focus:outline-none"
                              >
                                  {isBioExpanded ? 'Show less' : 'Read more'}
                              </button>
                          )}
                      </div>

                      {/* Interests */}
                      {user.interests && user.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                              {user.interests.slice(0, 5).map(tag => (
                                  <span key={tag} className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-700">
                                      {tag}
                                  </span>
                              ))}
                              {user.interests.length > 5 && (
                                  <span className="text-xs text-slate-500 flex items-center">+{user.interests.length - 5}</span>
                                )}
                          </div>
                      )}

                      {/* Stats Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs font-medium text-slate-400">
                          <div className="flex items-center gap-1.5">
                              <Calendar size={14} /> 
                              <span>Joined {new Date().getFullYear()}</span>
                          </div>
                          <div className="flex gap-3">
                              <button onClick={() => setActiveModal('FOLLOWERS')} className="hover:text-white transition-colors">
                                  <strong className="text-white">{user.followers?.length || 0}</strong> Followers
                              </button>
                              <button onClick={() => setActiveModal('FOLLOWING')} className="hover:text-white transition-colors">
                                  <strong className="text-white">{user.following?.length || 0}</strong> Following
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* Profile Search */}
              <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-4">
                  <div className="relative">
                      <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                      <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={`Search in @${displayUser.username}'s posts...`}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors text-sm"
                      />
                  </div>
              </div>

              {/* Communities */}
              <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                      <Users size={18} className="text-blue-500" />
                      <h3 className="font-bold text-white text-sm">Communities</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {communities.map(c => (
                          <Link to={`/communities?id=${c.id}`} key={c.id} className="bg-slate-800 hover:bg-blue-900/40 text-slate-300 hover:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 hover:border-blue-700 transition-colors">
                              {c.name}
                          </Link>
                      ))}
                      {communities.length === 0 && <span className="text-slate-500 text-xs">No communities joined.</span>}
                  </div>
              </div>

              {/* Who to Follow */}
              <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-white text-sm">Who to follow</h3>
                      <Sparkles size={16} className="text-blue-500" />
                  </div>
                  <div>
                      {whoToFollow.map(u => (
                          <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800 transition-colors">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <Link to={`/u/${u.id}`} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold flex-shrink-0 text-blue-400 border border-slate-700 overflow-hidden">
                                      {(u.avatarUrl && !u.isAnonymous) ? (
                                          <img src={u.avatarUrl} alt="User" className="w-full h-full object-cover" />
                                      ) : (
                                          u.isAnonymous ? '?' : u.fullName.charAt(0)
                                      )}
                                  </Link>
                                  <div className="min-w-0">
                                      <Link to={`/u/${u.id}`} className="font-bold text-sm text-white truncate hover:text-blue-400 block">
                                          {u.isAnonymous ? 'Anonymous' : u.fullName}
                                      </Link>
                                      <p className="text-xs text-slate-400 truncate">{u.department || 'Student'}</p>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => handleFollow(u.id)}
                                  className="text-blue-500 hover:bg-blue-900/20 p-2 rounded-full transition-colors"
                                  title="Follow"
                              >
                                  <span className="text-xs font-bold border border-blue-500/30 px-2 py-1 rounded-lg">Follow</span>
                              </button>
                          </div>
                      ))}
                      {whoToFollow.length === 0 && (
                          <div className="p-5 text-center text-slate-500 text-xs">
                              No suggestions available.
                          </div>
                      )}
                  </div>
              </div>

          </div>
        </div>
      </div>

      <UserListModal 
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={activeModal === 'FOLLOWERS' ? 'Followers' : 'Following'}
        userIds={activeModal === 'FOLLOWERS' ? user.followers : user.following}
        currentUserId={user.id}
        onUpdate={onUpdate}
      />

      <EditProfileModal 
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onSave={() => {
            onUpdate();
            loadUserPosts();
        }}
      />
    </div>
  );
}