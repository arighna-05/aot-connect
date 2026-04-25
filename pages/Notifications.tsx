import React, { useState, useEffect } from 'react';
import { User, Notification, NotificationType } from '../types';
import { storageService } from '../services/storageService';
import { 
  Heart, MessageSquare, UserPlus, MessageCircle, 
  Shield, Users, Check, AtSign, Bell, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface NotificationsProps {
  user: User;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.LIKE: return <Heart className="fill-current" size={14} />;
    case NotificationType.COMMENT: return <MessageSquare className="fill-current" size={14} />;
    case NotificationType.DM_REQUEST: return <MessageCircle className="fill-current" size={14} />;
    case NotificationType.FOLLOW: return <UserPlus size={14} />;
    case NotificationType.SYSTEM: return <Shield className="fill-current" size={14} />;
    case NotificationType.COMMUNITY: return <Users size={14} />;
    case NotificationType.MENTION: return <AtSign size={14} />;
    default: return <Bell size={14} />;
  }
};

const getNotificationTheme = (type: NotificationType) => {
  switch (type) {
    case NotificationType.LIKE:
      return { 
        border: 'border-l-pink-500', 
        iconColor: 'text-pink-400', 
        iconBg: 'bg-pink-900/20 border-pink-900/30',
        hoverShadow: 'hover:shadow-pink-900/10'
      };
    case NotificationType.COMMENT:
    case NotificationType.MENTION:
      return { 
        border: 'border-l-blue-500', 
        iconColor: 'text-blue-400', 
        iconBg: 'bg-blue-900/20 border-blue-900/30',
        hoverShadow: 'hover:shadow-blue-900/10'
      };
    case NotificationType.DM_REQUEST:
      return { 
        border: 'border-l-indigo-500', 
        iconColor: 'text-indigo-400', 
        iconBg: 'bg-indigo-900/20 border-indigo-900/30',
        hoverShadow: 'hover:shadow-indigo-900/10'
      };
    case NotificationType.FOLLOW:
      return { 
        border: 'border-l-purple-500', 
        iconColor: 'text-purple-400', 
        iconBg: 'bg-purple-900/20 border-purple-900/30',
        hoverShadow: 'hover:shadow-purple-900/10'
      };
    case NotificationType.SYSTEM:
      return { 
        border: 'border-l-green-500', 
        iconColor: 'text-green-400', 
        iconBg: 'bg-green-900/20 border-green-900/30',
        hoverShadow: 'hover:shadow-green-900/10'
      };
    case NotificationType.COMMUNITY:
      return { 
        border: 'border-l-orange-500', 
        iconColor: 'text-orange-400', 
        iconBg: 'bg-orange-900/20 border-orange-900/30',
        hoverShadow: 'hover:shadow-orange-900/10'
      };
    default:
      return { 
        border: 'border-l-slate-500', 
        iconColor: 'text-slate-400', 
        iconBg: 'bg-slate-800 border-slate-700',
        hoverShadow: 'hover:shadow-slate-900/10'
      };
  }
};

const NotificationCard: React.FC<{ item: Notification }> = ({ item }) => {
  const theme = getNotificationTheme(item.type);
  const timeString = item.timestamp > Date.now() - 1000 * 60 * 60 * 24 
      ? new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      : new Date(item.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'});

  return (
    <Link 
      to={item.link || '#'} 
      className={`block bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-5 transition-all hover:shadow-md ${theme.hoverShadow} ${theme.border} border-l-4 relative group`}
    >
      {/* Unread Indicator */}
      {!item.isRead && (
         <div className="absolute top-5 right-5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500/50"></div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar / Icon Area */}
        <div className="flex-shrink-0 relative">
             <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-sm overflow-hidden">
                {item.actorName && item.type !== NotificationType.SYSTEM ? (
                    <span className="font-bold text-slate-300 text-lg">{item.actorName.charAt(0)}</span>
                ) : (
                    <Shield className="text-slate-400" size={20} />
                )}
             </div>
             {/* Small Badge Icon */}
             <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-sm border ${theme.iconBg} ${theme.iconColor}`}>
                {getIcon(item.type)}
             </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 pt-0.5">
           <div className="flex justify-between items-start mb-1">
              <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">
                          {item.actorName || 'System'}
                      </span>
                      {/* Context Badge */}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${theme.iconBg} ${theme.iconColor} uppercase tracking-wider opacity-80`}>
                          {item.type.replace('_', ' ')}
                      </span>
                  </div>
              </div>
              
              <span className="text-xs text-slate-500 whitespace-nowrap ml-4 flex items-center gap-1 pr-4">
                 <Clock size={10} /> {timeString}
              </span>
           </div>

           <p className="text-slate-300 text-sm leading-relaxed pr-6">
              {item.content}
           </p>
        </div>
      </div>
    </Link>
  );
};

export default function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'MENTIONS' | 'VERIFIED'>('ALL');

  useEffect(() => {
    // Mock Notification Generator based on existing data to make it look realistic
    const users = storageService.getUsers();
    const demoUser = users.find(u => u.id === 'u-demo');
    const adminUser = users.find(u => u.id === 'u-admin');
    const janeUser = users.find(u => u.id === 'u-jane');

    const now = Date.now();
    const hour = 1000 * 60 * 60;

    const mockNotifications: Notification[] = [
      {
        id: 'n-1',
        type: NotificationType.DM_REQUEST,
        actorId: janeUser?.id,
        actorName: janeUser?.fullName || 'Jane Doe',
        content: 'sent you a message request.',
        timestamp: now - (hour * 2), // 2 hours ago
        isRead: false,
        link: '/messages'
      },
      {
        id: 'n-2',
        type: NotificationType.LIKE,
        actorId: demoUser?.id,
        actorName: demoUser?.fullName || 'Demo Student',
        content: 'liked your post about "Exam Syllabus".',
        timestamp: now - (hour * 3),
        isRead: false,
        link: '/'
      },
      {
        id: 'n-3',
        type: NotificationType.COMMENT,
        actorId: adminUser?.id,
        actorName: adminUser?.fullName || 'System Admin',
        content: 'commented on your post: "Welcome to the platform!"',
        timestamp: now - (hour * 5),
        isRead: true,
        link: '/'
      },
      {
        id: 'n-4',
        type: NotificationType.SYSTEM,
        content: 'Your student profile has been verified successfully.',
        timestamp: now - (hour * 24), // Yesterday
        isRead: true,
        link: '/profile'
      },
      {
        id: 'n-5',
        type: NotificationType.COMMUNITY,
        content: 'New announcement in CSE 3rd Year: "Lab schedule updated"',
        timestamp: now - (hour * 26),
        isRead: true,
        link: '/communities'
      },
      {
        id: 'n-6',
        type: NotificationType.FOLLOW,
        actorId: demoUser?.id,
        actorName: demoUser?.fullName,
        content: 'started following you.',
        timestamp: now - (hour * 28),
        isRead: true,
        link: `/u/${demoUser?.id}`
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'MENTIONS') return n.type === NotificationType.MENTION || n.type === NotificationType.COMMENT;
    if (filter === 'VERIFIED') return n.type === NotificationType.SYSTEM;
    return true;
  });

  // Group by Date
  const today = filteredNotifications.filter(n => new Date(n.timestamp).toDateString() === new Date().toDateString());
  const yesterday = filteredNotifications.filter(n => {
    const d = new Date(n.timestamp);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  });
  const older = filteredNotifications.filter(n => {
    const d = new Date(n.timestamp);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d < y;
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-white">Notifications</h1>
                    <p className="text-slate-400 text-sm">Stay updated with your campus interactions.</p>
                </div>
                <button 
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 text-blue-400 font-bold text-sm hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                >
                    <Check size={18} /> Mark all as read
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
                {(['ALL', 'MENTIONS', 'VERIFIED'] as const).map(f => (
                    <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                        filter === f 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 ring-1 ring-blue-500' 
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800 hover:text-white'
                    }`}
                    >
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-8">
                
                {today.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">Today</h3>
                        <div className="space-y-3">
                            {today.map(n => <NotificationCard key={n.id} item={n} />)}
                        </div>
                    </div>
                )}

                {yesterday.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">Yesterday</h3>
                        <div className="space-y-3">
                            {yesterday.map(n => <NotificationCard key={n.id} item={n} />)}
                        </div>
                    </div>
                )}

                {older.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">Earlier</h3>
                        <div className="space-y-3">
                            {older.map(n => <NotificationCard key={n.id} item={n} />)}
                        </div>
                    </div>
                )}

                {notifications.length === 0 && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500 border border-slate-700">
                            <Bell size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">All caught up!</h3>
                        <p className="text-slate-400">You have no new notifications.</p>
                    </div>
                )}

            </div>
      </div>
    </div>
  );
}