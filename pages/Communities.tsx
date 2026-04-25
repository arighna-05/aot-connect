import React, { useState, useEffect, useRef } from 'react';
import { User, Community, Post, Attachment, Poll, UserRole } from '../types';
import { storageService } from '../services/storageService';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { 
  Search, Users, ArrowLeft, Send, Hash, Check, 
  MapPin, Shield, Book, Info, Globe, Lock, MoreHorizontal,
  Image as ImageIcon, BarChart2, PlusCircle, X, Camera, Calendar, Eye,
  Pin, Sparkles, Filter, Activity, LogOut
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface CommunitiesProps {
  user: User;
}

const getCommunityTheme = (c: Community) => {
  // Color coding system based on Community Type
  switch (c.type) {
    case 'COMMON':
      return { 
        border: 'border-l-yellow-500', 
        text: 'text-yellow-500', 
        bg: 'bg-yellow-500', 
        gradient: 'from-yellow-900/40 to-slate-900', 
        badge: 'bg-yellow-900/20 text-yellow-500 border-yellow-900/30' 
      };
    case 'PUBLIC_DEPT':
      // Consistent Blue for all Public Departments
      return { 
        border: 'border-l-blue-600', 
        text: 'text-blue-500', 
        bg: 'bg-blue-600', 
        gradient: 'from-blue-900/40 to-slate-900', 
        badge: 'bg-blue-900/20 text-blue-400 border-blue-900/30' 
      };
    case 'RESTRICTED_YEAR':
      // Consistent Green for all Restricted/Private Groups
      return { 
        border: 'border-l-emerald-500', 
        text: 'text-emerald-500', 
        bg: 'bg-emerald-500', 
        gradient: 'from-emerald-900/40 to-slate-900', 
        badge: 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' 
      };
    case 'OPEN_CLUB':
      // Consistent Orange for all Clubs
      return { 
        border: 'border-l-orange-500', 
        text: 'text-orange-500', 
        bg: 'bg-orange-500', 
        gradient: 'from-orange-900/40 to-slate-900', 
        badge: 'bg-orange-900/20 text-orange-400 border-orange-900/30' 
      };
    default:
      return {
          border: 'border-l-slate-500',
          text: 'text-slate-400',
          bg: 'bg-slate-500',
          gradient: 'from-slate-800 to-slate-900',
          badge: 'bg-slate-800 text-slate-300 border-slate-700'
      };
  }
};

interface CommunityCardProps {
  c: Community;
  isMember: boolean;
  onAction: () => void;
  onCardClick: () => void;
  customActionLabel?: string;
  isViewOnly?: boolean;
  isPinned?: boolean;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ c, isMember, onAction, onCardClick, customActionLabel, isViewOnly, isPinned }) => {
    const theme = getCommunityTheme(c);
    
    return (
      <div 
          onClick={onCardClick}
          className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:shadow-slate-900/50 transition-all group relative border-l-4 ${theme.border} cursor-pointer`}
      >
          {/* Banner Area */}
          <div className={`h-24 relative bg-gradient-to-r ${theme.gradient}`}>
              {c.bannerUrl && <img src={c.bannerUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt={c.name} />}
              
              {/* Icon Overlay */}
              <div className="absolute -bottom-6 left-5 w-12 h-12 rounded-xl bg-slate-900 border-2 border-slate-900 flex items-center justify-center shadow-sm z-10 overflow-hidden">
                  {c.icon ? (
                      <img src={c.icon} className="w-full h-full object-cover" alt="Icon" />
                  ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-slate-800 ${theme.text} font-bold text-lg`}>
                        {c.name.substring(0, 2)}
                      </div>
                  )}
              </div>

              {/* Pinned Indicator */}
              {isPinned && (
                  <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm p-1.5 rounded-full text-slate-300 border border-slate-700/50">
                      <Pin size={14} className="fill-current" />
                  </div>
              )}
          </div>

          <div className="pt-8 px-5 pb-5">
              {/* Header Info */}
              <div className="mb-3">
                  <div className="flex justify-between items-start gap-2">
                      <h3 className={`font-bold text-white text-lg leading-snug group-hover:${theme.text} transition-colors line-clamp-1`}>
                          {c.name}
                      </h3>
                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${theme.badge} flex-shrink-0 mt-1`}>
                          {c.type === 'RESTRICTED_YEAR' ? 'Private' : (c.category === 'OFFICIAL' ? 'Official' : c.category)}
                      </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2 min-h-[40px] leading-relaxed">
                      {c.description}
                  </p>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Users size={14} />
                      <span>{c.memberCount} members</span>
                  </div>

                  <button 
                      onClick={(e) => { e.stopPropagation(); onAction(); }}
                      className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors z-20 shadow-sm
                        ${isViewOnly 
                           ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 cursor-default' 
                           : isMember 
                             ? `${theme.text} bg-slate-900 border border-slate-700 hover:bg-slate-800` 
                             : `bg-blue-600 text-white border border-transparent hover:bg-blue-500`
                        }`}
                  >
                      {customActionLabel || (isViewOnly ? 'View Only' : (isMember ? 'Open' : 'Join'))}
                  </button>
              </div>
          </div>
      </div>
    );
};

export default function Communities({ user }: CommunitiesProps) {
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [activeTab, setActiveTab] = useState<'YOURS' | 'EXPLORE'>('YOURS');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feed State for Active Community
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [communitySearchQuery, setCommunitySearchQuery] = useState(''); // NEW: Community specific search
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Post Modal State
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'TEXT' | 'MEDIA' | 'LINK' | 'POLL'>('TEXT');
  
  // Users Map for PostCard & Suggestions
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});

  // Leave Button Hover State
  const [isLeaveHovered, setIsLeaveHovered] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch communities respecting visibility rules
    const communities = storageService.getCommunities(user);
    setAllCommunities(communities);

    // Initial User Map
    const allUsers = storageService.getUsers();
    const map = allUsers.reduce((acc, u) => ({...acc, [u.id]: u}), {} as Record<string, User>);
    setUsersMap(map);
  }, [user]);

  // Deep Link Handling
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const commId = params.get('id');
    if (commId) {
        const comm = storageService.getCommunityById(commId);
        if (comm) {
            setActiveCommunity(comm);
        }
    }
  }, [location.search]);

  useEffect(() => {
      if (activeCommunity) {
          setCommunitySearchQuery(''); // Reset search on change
          loadCommunityPosts();
          const interval = setInterval(loadCommunityPosts, 5000);
          
          // Listen for global events
          const handleUpdate = () => loadCommunityPosts();
          window.addEventListener('post-created', handleUpdate);
          window.addEventListener('profile-updated', handleUpdate);

          return () => {
              clearInterval(interval);
              window.removeEventListener('post-created', handleUpdate);
              window.removeEventListener('profile-updated', handleUpdate);
          };
      }
  }, [activeCommunity]);

  const loadCommunityPosts = async () => {
      if (activeCommunity) {
          const posts = await storageService.getPostsAsync(activeCommunity.id);
          setCommunityPosts(posts);
      }
  };


  const handleJoin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    storageService.joinCommunity(user.id, id);
    // Refresh to update global user state
    window.location.reload(); 
  };
  
  const handleLeave = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (confirm("Are you sure you want to leave this community?")) {
          storageService.leaveCommunity(user.id, id);
          window.location.reload();
      }
  };

  const handleOpenModal = (tab: 'TEXT' | 'MEDIA' | 'LINK' | 'POLL' = 'TEXT') => {
      setCreateTab(tab);
      setIsCreatePostModalOpen(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
       if (e.target.files && e.target.files[0] && activeCommunity) {
           const file = e.target.files[0];
           try {
               const base64 = await storageService.fileToBase64(file);
               const communities = storageService.getCommunities();
               const target = communities.find(c => c.id === activeCommunity.id);
               if (target) {
                   target.bannerUrl = base64;
                   localStorage.setItem('aot_communities', JSON.stringify(communities));
                   setActiveCommunity({...activeCommunity, bannerUrl: base64});
                   setAllCommunities(storageService.getCommunities(user));
               }
           } catch (err) {
               console.error(err);
           }
       }
  };

  const handleFollow = (targetId: string) => {
      storageService.toggleFollow(user.id, targetId);
      window.location.reload();
  };

  const navigateToCommunity = (c: Community) => {
      setActiveCommunity(c);
      navigate(`/communities?id=${c.id}`);
  };

  const handleTagClick = (tag: string) => {
      navigate(`/?q=${encodeURIComponent(tag)}`);
  };

  // Categorize Communities
  const myCommunities = allCommunities.filter(c => user.joinedCommunityIds?.includes(c.id));
  const academicCommunities = allCommunities.filter(c => c.category === 'ACADEMIC' && c.type === 'PUBLIC_DEPT');
  const interestCommunities = allCommunities.filter(c => c.category === 'INTEREST');
  
  const filterList = (list: Community[]) => {
      if (!searchQuery) return list;
      return list.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  // Filter Active Community Posts
  const filteredCommunityPosts = communityPosts.filter(p => {
      if (!communitySearchQuery) return true;
      const q = communitySearchQuery.toLowerCase();
      return (
          p.content.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q))
      );
  });

  // --- COMMUNITY PAGE VIEW ---
  if (activeCommunity) {
      const isMember = user.joinedCommunityIds?.includes(activeCommunity.id) || false;
      const isRestricted = activeCommunity.type === 'RESTRICTED_YEAR';
      const isCommon = activeCommunity.type === 'COMMON';
      const isPublicDept = activeCommunity.type === 'PUBLIC_DEPT';
      const isClub = activeCommunity.type === 'OPEN_CLUB';
      
      const theme = getCommunityTheme(activeCommunity);
      const isAdmin = user.role === UserRole.ADMIN;
      
      // Access Control: 
      // ReadOnly: Non-members of Public Dept OR Non-members of Clubs
      const isReadOnly = (isPublicDept || isClub) && !isMember;

      // Mock Data for missing fields
      const onlineMembers = Math.ceil(activeCommunity.memberCount * 0.12) + 5;

      return (
        <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Back Button */}
                <button onClick={() => { setActiveCommunity(null); navigate('/communities'); }} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Back to Communities
                </button>

                {/* Community Header Card - Profile Style */}
                <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden group relative mb-6">
                    
                    {/* Banner Area */}
                    <div className="h-48 w-full relative bg-slate-800">
                         {activeCommunity.bannerUrl ? (
                             <img src={activeCommunity.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                         ) : (
                             <div className={`w-full h-full bg-gradient-to-r ${theme.gradient}`} />
                         )}
                         
                         {isAdmin && (
                             <button 
                                onClick={() => bannerInputRef.current?.click()}
                                className="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black/80 transition-colors flex items-center gap-2 backdrop-blur-md border border-white/20 shadow-lg z-20"
                             >
                                 <Camera size={18} /> Edit Banner
                             </button>
                         )}
                         <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                    </div>

                    <div className="px-8 pb-8 relative">
                        {/* New Layout to prevent overlap */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            
                            {/* Icon - Negative margin to overlap banner */}
                            <div className="-mt-16 md:-mt-20 flex-shrink-0 relative z-10">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-slate-900 p-1.5 shadow-xl border border-slate-800">
                                    {activeCommunity.icon ? (
                                        <img src={activeCommunity.icon} alt="Icon" className="w-full h-full rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                            <span className={`text-4xl md:text-5xl font-bold ${theme.text}`}>
                                                {activeCommunity.name.substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content Column - Starts below banner */}
                            <div className="flex-1 pt-3 min-w-0 w-full">
                                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-3">
                                    {/* Name & Badge */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                                            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                                                {activeCommunity.name}
                                            </h1>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${theme.badge} whitespace-nowrap`}>
                                                {activeCommunity.type === 'RESTRICTED_YEAR' ? 'Private Group' : activeCommunity.category}
                                            </span>
                                        </div>
                                        
                                        {/* Stats */}
                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Users size={16} /> <span className="text-slate-200">{activeCommunity.memberCount} Members</span>
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> <span className="text-slate-200">{onlineMembers} Online</span>
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={16} /> <span>Est. 2023</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 flex-shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
                                        {isMember && !isRestricted && !isCommon && (
                                            <button 
                                                onClick={(e) => handleLeave(activeCommunity.id, e)} 
                                                onMouseEnter={() => setIsLeaveHovered(true)}
                                                onMouseLeave={() => setIsLeaveHovered(false)}
                                                className="flex-1 lg:flex-none px-5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors shadow-sm flex items-center justify-center gap-2 min-w-[120px]"
                                            >
                                                {isLeaveHovered ? (
                                                    <>
                                                        <LogOut size={18} />
                                                        <span>Leave</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check size={18} />
                                                        <span>Joined</span>
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {isClub && !isMember && (
                                            <button 
                                                onClick={(e) => handleJoin(activeCommunity.id, e)} 
                                                className="flex-1 lg:flex-none px-6 py-2.5 bg-blue-600 text-white border border-transparent rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-md flex items-center justify-center gap-2 min-w-[120px]"
                                            >
                                                <PlusCircle size={18} /> Join Community
                                            </button>
                                        )}

                                        {isPublicDept && !isMember && (
                                            <button disabled className="flex-1 lg:flex-none px-6 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-slate-400 cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]">
                                                <Eye size={16} /> View Only
                                            </button>
                                        )}

                                        {isRestricted && (
                                            <div className="flex-1 lg:flex-none px-6 py-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-slate-400 cursor-default text-center min-w-[120px]">
                                                Private Group
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="mt-6 max-w-4xl border-t border-slate-800 pt-4">
                            <p className="text-slate-300 text-lg leading-relaxed">
                                {activeCommunity.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Feed (Main Content) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Create Post OR View Only/Join Warning */}
                        {isReadOnly ? (
                            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 flex items-start gap-4">
                                <div className="bg-slate-800 p-2 rounded-lg text-slate-400">
                                    <Info size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white mb-1">
                                        {isClub ? 'Join to Post' : 'View Only Mode'}
                                    </h3>
                                    <p className="text-slate-400 text-sm">
                                        {isClub 
                                            ? `You must be a member of ${activeCommunity.name} to create posts and comment.` 
                                            : `This department community is view-only for students outside ${activeCommunity.name.replace('AOT - ', '')}.`
                                        }
                                    </p>
                                </div>
                                {isClub && (
                                     <button 
                                        onClick={(e) => handleJoin(activeCommunity.id, e)} 
                                        className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 whitespace-nowrap"
                                     >
                                        Join Now
                                     </button>
                                )}
                            </div>
                        ) : (
                             // COMPACT POST CREATION BOX
                             <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-4 flex gap-4 items-center">
                                <Link to="/profile" className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold ring-1 ring-slate-700 overflow-hidden text-slate-300">
                                        {user.isAnonymous ? (
                                            <div className="bg-slate-700 w-full h-full flex items-center justify-center text-white">?</div>
                                        ) : (
                                            user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{user.fullName.charAt(0)}</span>
                                            )
                                        )}
                                    </div>
                                </Link>
                                <button 
                                    onClick={() => handleOpenModal('TEXT')}
                                    className="flex-1 text-left bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors rounded-full px-5 py-3 text-slate-400 font-medium text-sm shadow-inner"
                                >
                                    Post in {activeCommunity.name}...
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
                        )}
                        
                        {/* MODAL with Pre-selected Community */}
                        <CreatePostModal 
                            isOpen={isCreatePostModalOpen}
                            onClose={() => setIsCreatePostModalOpen(false)}
                            user={user}
                            preSelectedCommunity={activeCommunity}
                            onPostCreated={loadCommunityPosts}
                            defaultTab={createTab}
                        />

                        {/* Feed List */}
                        <div className="space-y-6">
                            {filteredCommunityPosts.length === 0 ? (
                                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                                        <Filter size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                        {communitySearchQuery ? 'No matching posts found' : 'No posts yet'}
                                    </h3>
                                    <p className="text-slate-400">
                                        {communitySearchQuery ? `Try searching for something else in ${activeCommunity.name}.` : 'Be the first to start a discussion in this community!'}
                                    </p>
                                </div>
                            ) : (
                                filteredCommunityPosts.map(post => (
                                    <div key={post.id}>
                                        <PostCard 
                                            post={post} 
                                            currentUser={user}
                                            authorDetails={usersMap[post.authorId]}
                                            onUpdate={loadCommunityPosts}
                                            readOnly={isReadOnly}
                                            onTagClick={handleTagClick}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        
                        {/* Community Specific Search */}
                        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                                <input 
                                    type="text"
                                    value={communitySearchQuery}
                                    onChange={(e) => setCommunitySearchQuery(e.target.value)}
                                    placeholder={`Search in ${activeCommunity.name}...`}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Trending Card */}
                        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                                <Sparkles size={20} className="text-blue-500" />
                                <h3 className="font-bold text-white">Trending at AOT</h3>
                            </div>
                            <div>
                                {[
                                    { tag: '#TechFest2024', count: '1.2k posts', topic: 'Events' },
                                    { tag: '#CSE_Exam', count: '450 posts', topic: 'Academic' },
                                    { tag: '#CanteenFries', count: '320 posts', topic: 'Food' },
                                ].map((trend, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => handleTagClick(trend.tag)}
                                        className="px-5 py-3 hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-800 last:border-0"
                                    >
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>{trend.topic}</span>
                                            <MoreHorizontal size={14} />
                                        </div>
                                        <div className="font-bold text-white text-sm mb-0.5">{trend.tag}</div>
                                        <div className="text-xs text-slate-500">{trend.count}</div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full py-3 text-sm text-blue-500 font-bold hover:bg-slate-800 transition-colors">
                                Show More
                            </button>
                        </div>

                        {/* Suggestions Card */}
                        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-800">
                                <h3 className="font-bold text-white">Who to follow</h3>
                            </div>
                            <div>
                                {(Object.values(usersMap) as User[]).filter(u => u.id !== user.id && !(user.following?.includes(u.id))).slice(0, 3).map(u => (
                                    <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Link to={`/u/${u.id}`} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold flex-shrink-0 text-blue-400 border border-slate-700 overflow-hidden">
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
                                            <span className="text-xs font-bold border border-blue-500/30 px-3 py-1 rounded-full">Follow</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
      );
  }

  // --- DIRECTORY VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="mb-2">
            <h1 className="text-2xl font-bold text-white">Communities</h1>
            <p className="text-slate-400 text-sm">Browse forums, join clubs, and connect with your department.</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800 flex gap-6">
            <button 
                onClick={() => setActiveTab('YOURS')}
                className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'YOURS' ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-white'}`}
            >
                Your Communities
            </button>
            <button 
                onClick={() => setActiveTab('EXPLORE')}
                className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'EXPLORE' ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-white'}`}
            >
                Explore All
            </button>
        </div>

        {/* YOUR COMMUNITIES TAB */}
        {activeTab === 'YOURS' && (
            <div className="space-y-8">
                
                {/* Auto Pinned */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide px-1 flex items-center gap-2">
                        <Pin size={14} /> Pinned & Official
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myCommunities.filter(c => c.type === 'COMMON' || c.type === 'RESTRICTED_YEAR' || c.type === 'PUBLIC_DEPT').map(c => (
                            <CommunityCard 
                                key={c.id} 
                                c={c} 
                                isMember={true}
                                isPinned={true} 
                                onAction={() => navigateToCommunity(c)}
                                onCardClick={() => navigateToCommunity(c)} 
                            />
                        ))}
                    </div>
                </section>

                {/* Joined Clubs */}
                {myCommunities.filter(c => c.type === 'OPEN_CLUB').length > 0 && (
                     <section className="space-y-4">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide px-1">Joined Clubs</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {myCommunities.filter(c => c.type === 'OPEN_CLUB').map(c => (
                                <CommunityCard 
                                    key={c.id} 
                                    c={c} 
                                    isMember={true} 
                                    onAction={() => navigateToCommunity(c)}
                                    onCardClick={() => navigateToCommunity(c)} 
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        )}

        {/* EXPLORE TAB */}
        {activeTab === 'EXPLORE' && (
            <div className="space-y-8">
                
                {/* Search Bar */}
                <div className="relative">
                     <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                     <input 
                        type="text" 
                        placeholder="Search communities..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors shadow-sm"
                     />
                </div>

                {/* Academic Departments */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Book size={18} className="text-blue-500" />
                        <h2 className="text-lg font-bold text-white">Academic Departments</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filterList(academicCommunities).map(c => {
                             const isMember = user.joinedCommunityIds?.includes(c.id) || false;
                             return (
                                <CommunityCard 
                                    key={c.id} 
                                    c={c} 
                                    isMember={isMember}
                                    isViewOnly={!isMember}
                                    onAction={() => navigateToCommunity(c)}
                                    onCardClick={() => navigateToCommunity(c)}
                                />
                             );
                        })}
                    </div>
                </section>

                {/* Clubs & Interests */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Users size={18} className="text-blue-500" />
                        <h2 className="text-lg font-bold text-white">Student Clubs & Interests</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filterList(interestCommunities).map(c => (
                             <CommunityCard 
                                key={c.id} 
                                c={c} 
                                isMember={user.joinedCommunityIds?.includes(c.id) || false}
                                onAction={() => user.joinedCommunityIds?.includes(c.id) ? navigateToCommunity(c) : handleJoin(c.id)}
                                onCardClick={() => navigateToCommunity(c)}
                             />
                        ))}
                    </div>
                </section>

            </div>
        )}

      </div>
    </div>
  );
}