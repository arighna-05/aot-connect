import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, ChatStatus, UserRole, Post } from '../types';
import { storageService } from '../services/storageService';
import { 
  UserCircle, MessageCircle, BookOpen, Check, ArrowLeft, 
  Shield, MapPin, Calendar, Users, Hash, FileText, Search, GraduationCap,
  Sparkles, Heart, Plus
} from 'lucide-react';
import PostCard from '../components/PostCard';
import UserListModal from '../components/UserListModal';

interface PublicProfileProps {
  currentUser: User;
}

export default function PublicProfile({ currentUser }: PublicProfileProps) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatStatus, setChatStatus] = useState<ChatStatus | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [whoToFollow, setWhoToFollow] = useState<User[]>([]);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'FOLLOWERS' | 'FOLLOWING' | null>(null);

  useEffect(() => {
    if (userId) {
      if (userId === currentUser.id) {
          navigate('/profile');
          return;
      }
      const user = storageService.getUserById(userId);
      setProfileUser(user || null);
      
      if (user) {
          const chat = storageService.getChatBetweenUsers(currentUser.id, user.id);
          setChatStatus(chat ? chat.status : null);
          setUserPosts(storageService.getUserPosts(user.id));
          setCommunities(storageService.getCommunities().filter(c => user.joinedCommunityIds.includes(c.id)));
          
          // Suggestions logic (simple random for now)
          const allUsers = storageService.getUsers();
          // Safe check for following array
          const myFollowing = currentUser.following || [];
          const suggestions = allUsers.filter(u => u.id !== currentUser.id && u.id !== user.id && !myFollowing.includes(u.id)).slice(0, 3);
          setWhoToFollow(suggestions);
      }
    }
    setLoading(false);
  }, [userId, currentUser.id, navigate]);

  useEffect(() => {
    // Listener for profile updates (e.g. anonymity change) to refresh posts view
    const handleUpdate = () => {
        if (profileUser) {
             // Re-fetch posts to apply new anonymity filters if needed
             setUserPosts(storageService.getUserPosts(profileUser.id));
        }
    };

    window.addEventListener('profile-updated', handleUpdate);
    return () => {
        window.removeEventListener('profile-updated', handleUpdate);
    }
  }, [profileUser]);

  const handleMessage = () => {
      if (!profileUser) return;
      
      if (chatStatus === ChatStatus.ACCEPTED || chatStatus === ChatStatus.PENDING) {
          navigate('/messages');
      } else {
          storageService.createChatRequest(currentUser.id, profileUser.id);
          setChatStatus(ChatStatus.PENDING);
          alert('Message request sent!');
      }
  };

  const handleFollow = (targetId?: string) => {
      const idToFollow = targetId || profileUser?.id;
      if (!idToFollow) return;
      storageService.toggleFollow(currentUser.id, idToFollow);
      window.location.reload();
  };

  const handleTagClick = (tag: string) => {
      navigate(`/?q=${encodeURIComponent(tag)}`);
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;
  if (!profileUser) return <div className="p-10 text-center text-slate-400">User not found.</div>;

  const isAdmin = profileUser.role === UserRole.ADMIN;
  // Safe check for following
  const isFollowing = (currentUser.following || []).includes(profileUser.id);

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

  const academicInfo = isAdmin 
    ? 'System Admin' 
    : `${profileUser.department} • ${profileUser.year}`;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-8">
            <div className="flex items-center gap-3">
                 <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-white">Profile</h1>
            </div>
            <p className="text-slate-400 text-sm ml-9">View student profile and activity.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Feed (Order 2 on Mobile, 1 on Desktop) */}
            <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
                
                {/* Feed List */}
                <div className="space-y-6">
                    {filteredPosts.length === 0 ? (
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 border border-slate-700">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{searchQuery ? 'No matching posts' : 'No posts yet'}</h3>
                            <p className="text-slate-400">{searchQuery ? 'Try a different search term.' : `${profileUser.fullName} hasn't posted anything yet.`}</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div key={post.id}>
                                <PostCard 
                                    post={post}
                                    currentUser={currentUser}
                                    authorDetails={profileUser}
                                    onUpdate={() => {
                                        setUserPosts(storageService.getUserPosts(profileUser.id));
                                    }}
                                    onTagClick={handleTagClick}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Column: Profile Info Sidebar (Order 1 on Mobile, 2 on Desktop) */}
            <div className="space-y-6 order-1 lg:order-2">
                
                 {/* Profile Card Sidebar */}
                <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden group relative">
                    {/* Banner */}
                    <div className="h-32 w-full relative bg-slate-800">
                        {profileUser.bannerUrl ? (
                            <img src={profileUser.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-900 to-slate-900 opacity-90"></div>
                        )}
                    </div>

                    <div className="px-5 pb-5 relative">
                        {/* Avatar & Actions */}
                        <div className="flex justify-between items-end -mt-10 mb-3">
                            <div className="relative z-10">
                                <div className="w-20 h-20 rounded-full bg-slate-900 p-1 shadow-xl relative ring-4 ring-slate-900">
                                    {(profileUser.avatarUrl && !profileUser.isAnonymous) ? (
                                        <img src={profileUser.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover bg-slate-800" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500">
                                            {profileUser.isAnonymous ? '?' : profileUser.fullName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mb-1">
                                {!profileUser.isAnonymous && (
                                    <button 
                                        onClick={() => handleFollow()}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${isFollowing ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-red-400' : 'bg-blue-600 border-transparent text-white hover:bg-blue-500'}`}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                                <button
                                    onClick={handleMessage}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                        chatStatus === ChatStatus.ACCEPTED 
                                        ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' 
                                        : chatStatus === ChatStatus.PENDING
                                        ? 'bg-slate-900 border-slate-700 text-slate-500 cursor-default'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                    disabled={chatStatus === ChatStatus.PENDING}
                                    title="Message"
                                >
                                    <MessageCircle size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Identity */}
                        <div className="mb-4">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <h2 className="text-xl font-bold text-white leading-tight">
                                    {profileUser.isAnonymous ? 'Anonymous Student' : profileUser.fullName}
                                </h2>
                                {profileUser.isVerified && !profileUser.isAnonymous && <Shield size={16} className="text-blue-500 fill-blue-500/20" />}
                            </div>
                            <p className="text-sm text-slate-400 font-medium">
                                {profileUser.isAnonymous ? '@anonymous' : `@${profileUser.username || profileUser.email.split('@')[0]}`}
                            </p>
                            
                            {profileUser.pronouns && !profileUser.isAnonymous && (
                                <p className="text-xs text-slate-500 mt-1">{profileUser.pronouns}</p>
                            )}

                            <div className="mt-3 inline-flex items-center gap-1.5 text-blue-400 font-bold text-xs bg-blue-900/10 border border-blue-900/20 px-2.5 py-1 rounded-md">
                                <GraduationCap size={14} />
                                <span>{academicInfo}</span>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="mb-4">
                            <div className={`text-slate-300 text-sm leading-relaxed whitespace-pre-wrap ${!isBioExpanded ? 'line-clamp-3' : ''}`}>
                                {profileUser.bio || "No bio added yet."}
                            </div>
                            {profileUser.bio && profileUser.bio.length > 100 && (
                                <button 
                                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                                    className="text-blue-500 text-xs font-bold hover:underline mt-1 focus:outline-none"
                                >
                                    {isBioExpanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>

                        {/* Interests */}
                        {profileUser.interests && profileUser.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {profileUser.interests.slice(0, 5).map(tag => (
                                    <span key={tag} className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-700">
                                        {tag}
                                    </span>
                                ))}
                                {profileUser.interests.length > 5 && (
                                    <span className="text-xs text-slate-500 flex items-center">+{profileUser.interests.length - 5}</span>
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
                                    <strong className="text-white">{profileUser.followers?.length || 0}</strong> Followers
                                </button>
                                <button onClick={() => setActiveModal('FOLLOWING')} className="hover:text-white transition-colors">
                                    <strong className="text-white">{profileUser.following?.length || 0}</strong> Following
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
                            placeholder={`Search in @${profileUser.username}'s posts...`}
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
                        {communities.length > 0 ? (
                            communities.map(c => (
                                <Link to={`/communities?id=${c.id}`} key={c.id} className="bg-slate-800 hover:bg-blue-900/40 text-slate-300 hover:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 hover:border-blue-700 transition-colors">
                                    {c.name}
                                </Link>
                            ))
                        ) : (
                            <span className="text-slate-500 italic text-xs">No public communities.</span>
                        )}
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
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
      
      <UserListModal 
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={activeModal === 'FOLLOWERS' ? 'Followers' : 'Following'}
        userIds={activeModal === 'FOLLOWERS' ? profileUser.followers : profileUser.following}
        currentUserId={currentUser.id}
        onUpdate={() => { /* No-op */ }}
      />
    </div>
  );
}