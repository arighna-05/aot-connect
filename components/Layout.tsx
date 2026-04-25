
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import CreatePostModal from './CreatePostModal';
import { 
  Home, 
  Users, 
  UserCircle, 
  LogOut, 
  School,
  Mail,
  Bell,
  MoreHorizontal,
  PenSquare,
  Menu,
  Check
} from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = React.useState(false);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handlePostCreated = () => {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      // Trigger global event for feeds to refresh
      window.dispatchEvent(new Event('post-created')); 
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Messages', path: '/messages', icon: Mail },
    { name: 'Communities', path: '/communities', icon: Users },
    { name: 'Profile', path: '/profile', icon: UserCircle },
    { name: 'More', path: '/more', icon: MoreHorizontal },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white w-[275px] border-r border-slate-800 shadow-sm">
      <div className="p-6 mb-2">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <School size={28} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">AOT Connect</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-lg ${
              isActive(item.path)
                ? 'bg-blue-900/30 text-blue-400 shadow-sm ring-1 ring-blue-800'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={24} className={isActive(item.path) ? "stroke-[2.5px]" : "stroke-2"} />
            <span>{item.name}</span>
          </Link>
        ))}
        
        {/* Post Button */}
        <div className="mt-8">
            <button 
                onClick={() => setIsCreatePostModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-3 rounded-xl w-full shadow-md hover:shadow-lg hover:shadow-blue-900/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
                <PenSquare size={20} />
                <span>Create Post</span>
            </button>
        </div>
      </nav>

      {/* User Profile - Polished Bottom Section */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <div 
            onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 transition-all cursor-pointer group border border-transparent hover:border-slate-700/50"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold flex-shrink-0 text-slate-300 ring-1 ring-slate-700 overflow-hidden shadow-sm">
                    {(user?.avatarUrl && !user?.isAnonymous) ? (
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        user?.isAnonymous ? '?' : user?.fullName.charAt(0)
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate text-white group-hover:text-blue-400 transition-colors">
                        {user?.isAnonymous ? 'Anonymous' : user?.fullName}
                    </p>
                    <p className="text-xs text-slate-500 truncate font-medium">
                        @{user?.isAnonymous ? 'anonymous' : (user?.username || user?.email?.split('@')[0])}
                    </p>
                </div>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
                title="Log out"
            >
                <LogOut size={18} />
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed top-0 left-0 h-screen z-20">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
        <div 
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden ring-1 ring-slate-700 cursor-pointer" 
            onClick={() => setIsMobileMenuOpen(true)}
        >
             {(user?.avatarUrl && !user.isAnonymous) ? (
                 <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
             ) : (
                 user?.isAnonymous ? '?' : user?.fullName.charAt(0)
             )}
        </div>
        <div className="flex items-center gap-2 text-blue-500 font-bold">
          <School size={24} className="fill-current" />
          <span>AOT Connect</span>
        </div>
        <div className="w-8 flex justify-end">
            <Menu className="text-slate-400" onClick={() => setIsMobileMenuOpen(true)} />
        </div> 
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
           <div className="absolute top-0 left-0 h-full bg-slate-900 shadow-2xl w-3/4 max-w-sm overflow-y-auto" onClick={e => e.stopPropagation()}>
             <Sidebar />
           </div>
        </div>
      )}

      {/* Main Content Wrapper - Pushes content right on desktop */}
      <div className="flex-1 md:ml-[275px] min-h-screen w-full">
        <main className="w-full min-h-screen pt-14 md:pt-0 text-white">
          {children}
        </main>
      </div>

      {/* Toast Notification */}
      {showSuccessToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-green-900/20 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
              <Check size={20} className="font-bold" />
              <span className="font-bold">Post created successfully!</span>
          </div>
      )}

      {/* Global Create Post Modal */}
      {user && (
        <CreatePostModal 
            isOpen={isCreatePostModalOpen}
            onClose={() => setIsCreatePostModalOpen(false)}
            user={user}
            onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
    