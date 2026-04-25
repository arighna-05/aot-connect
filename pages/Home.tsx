import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Post } from '../types';
import { storageService } from '../services/storageService';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { 
  Image as ImageIcon, BarChart2, Search, MoreHorizontal, Sparkles, Filter, X
} from 'lucide-react';

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- CREATE POST MODAL STATE --
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'TEXT' | 'MEDIA' | 'LINK' | 'POLL'>('TEXT');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadFeed();
    const interval = setInterval(() => {
      loadFeed();
    }, 5000); 
    
    // Listen for global events
    const handleUpdate = () => loadFeed();
    window.addEventListener('post-created', handleUpdate);
    window.addEventListener('profile-updated', handleUpdate);

    return () => {
        clearInterval(interval);
        window.removeEventListener('post-created', handleUpdate);
        window.removeEventListener('profile-updated', handleUpdate);
    };
  }, [user]); 

  // Read Query Params for Search
  useEffect(() => {
      const params = new URLSearchParams(location.search);
      const q = params.get('q');
      if (q) {
          setSearchTerm(q);
      }
  }, [location.search]);

  const loadFeed = async () => {
    const feed = await storageService.getHomeFeedAsync(user);
    setPosts(feed);
    const allUsers = storageService.getUsers();
    const map = allUsers.reduce((acc, u) => ({...acc, [u.id]: u}), {} as Record<string, User>);
    setUsersMap(map);
  };


  const handleOpenModal = (tab: 'TEXT' | 'MEDIA' | 'LINK' | 'POLL' = 'TEXT') => {
      setCreateTab(tab);
      setIsModalOpen(true);
  };

  const handleFollow = (targetId: string) => {
      storageService.toggleFollow(user.id, targetId);
      window.location.reload();
  };

  const handleTagClick = (tag: string) => {
      setSearchTerm(tag);
      navigate(`/?q=${encodeURIComponent(tag)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
      setSearchTerm('');
      navigate('/');
  };

  // Filter Logic
  let displayPosts = posts;
  if (searchTerm) {
      displayPosts = displayPosts.filter(p => 
          (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          p.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }
  if (!searchTerm && activeTab === 'following') {
      const followingIds = user.following || [];
      displayPosts = displayPosts.filter(p => followingIds.includes(p.authorId) || p.authorId === user.id);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-white">Home Feed</h1>
                    <p className="text-slate-400 text-sm">Updates from your communities & network.</p>
                </div>
                
                {!searchTerm && (
                    <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 inline-flex shadow-sm">
                        <button 
                            onClick={() => setActiveTab('foryou')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'foryou' 
                                ? 'bg-blue-900/30 text-blue-400 shadow-sm' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            For You
                        </button>
                        <button 
                            onClick={() => setActiveTab('following')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'following' 
                                ? 'bg-blue-900/30 text-blue-400 shadow-sm' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Following
                        </button>
                    </div>
                )}
            </div>

            {/* Search Results Banner */}
            {searchTerm && (
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-sm">Showing results for: <span className="text-blue-400">"{searchTerm}"</span></h3>
                        <p className="text-blue-300/70 text-xs mt-0.5">{displayPosts.length} posts found</p>
                    </div>
                    <button 
                        onClick={clearSearch}
                        className="text-slate-400 hover:text-white p-2 hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                        <span className="text-xs font-bold">Clear Search</span>
                    </button>
                </div>
            )}

            {/* COMPACT POST CREATION BOX (LINKEDIN STYLE) */}
            {!searchTerm && (
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
                        Start a post, {user.fullName.split(' ')[0]}...
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

            <CreatePostModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                onPostCreated={loadFeed}
                defaultTab={createTab}
            />

            {/* Posts Feed */}
            <div className="space-y-6">
                {displayPosts.map(post => (
                    <div key={post.id}>
                        <PostCard 
                            post={post} 
                            currentUser={user} 
                            authorDetails={usersMap[post.authorId]}
                            onUpdate={loadFeed}
                            onTagClick={handleTagClick}
                        />
                    </div>
                ))}
                {displayPosts.length === 0 && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 text-center">
                         <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                             <Filter size={32} />
                         </div>
                        <h3 className="text-lg font-bold text-white mb-2">{searchTerm ? 'No results found' : 'No posts found'}</h3>
                        <p className="text-slate-400">
                            {searchTerm 
                                ? `We couldn't find any posts containing "${searchTerm}".` 
                                : 'Join more communities or follow people to see posts here.'}
                        </p>
                        {searchTerm && (
                            <button 
                                onClick={clearSearch}
                                className="mt-4 text-blue-500 font-bold text-sm hover:underline"
                            >
                                Clear search and return to feed
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-6">
            
            {/* Search Card */}
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-950 focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm transition-all"
                        placeholder="Search posts, people..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            onClick={clearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
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
                    {(Object.values(usersMap) as User[]).filter(u => u.id !== user.id && !user.following.includes(u.id)).slice(0, 3).map(u => (
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

             {/* Footer */}
             <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 text-xs text-slate-500 justify-center">
                  <a href="#" className="hover:underline">Privacy</a>
                  <a href="#" className="hover:underline">Terms</a>
                  <a href="#" className="hover:underline">Cookies</a>
                  <span>© 2024 AOT Connect</span>
              </div>

        </div>
      </div>
    </div>
  );
}