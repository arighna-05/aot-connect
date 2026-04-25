import React, { useState, useEffect } from 'react';
import { User, UserRole, Post, Community } from '../types';
import { storageService } from '../services/storageService';
import { Shield, Trash2, Users, Plus, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { getAllUsers } from '../services/api';

interface AdminProps {
  user: User;
}

export default function Admin({ user }: AdminProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalPosts, setGlobalPosts] = useState<Post[]>(storageService.getPosts('c-global'));
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'communities'>('users');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-red-500 text-xl font-bold">Access Denied</h1>
        <p className="text-slate-400">You must be an admin to view this page.</p>
      </div>
    );
  }

  const handleDeletePost = (postId: string) => {
    storageService.deletePost(postId);
    setGlobalPosts(storageService.getPosts('c-global'));
  };

  const handleCreateCommunity = () => {
    // Basic mock implementation for adding a community
    const name = prompt('Enter Community Name:');
    if (name) {
        const communities = storageService.getCommunities();
        const newComm: Community = {
            id: `c-${Date.now()}`,
            name,
            description: 'Created by Admin',
            type: 'OPEN_CLUB', // Default type for admin created communities
            category: 'INTEREST',
            memberCount: 0
        };
        communities.push(newComm);
        localStorage.setItem('aot_communities', JSON.stringify(communities));
        alert('Community Created');
    }
  };

  const handleResetData = () => {
      if(confirm('WARNING: This will wipe all posts, chats, and new users. The app will reload. Are you sure?')) {
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-blue-500" /> Admin Dashboard
            </h1>
            <div className="flex gap-4">
                <button 
                    onClick={handleResetData}
                    className="flex items-center gap-2 bg-red-900/20 text-red-500 px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-900/40 border border-red-900/30"
                >
                    <AlertTriangle size={16} /> Reset Database
                </button>
                <div className="text-sm bg-blue-900/30 text-blue-400 px-3 py-1 rounded-lg font-medium flex items-center border border-blue-900/50">
                    Logged in as {user.fullName}
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-800 pb-1">
            <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}
            >
            Students ({users.length})
            </button>
            <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'posts' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}
            >
            Moderation
            </button>
            <button
            onClick={() => setActiveTab('communities')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'communities' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}
            >
            Communities
            </button>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
            
            {activeTab === 'users' && (
            <div className="overflow-x-auto min-h-[300px] flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                        <Loader2 className="animate-spin h-10 w-10 mb-4 text-blue-500" />
                        <p>Fetching students from database...</p>
                    </div>
                ) : (
                <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950 text-white font-semibold border-b border-slate-800">
                    <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Dept / Year</th>
                    <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {users.map(u => (
                    <tr key={u.id}>
                        <td className="px-6 py-4 font-medium text-white">{u.fullName || '(Setup Pending)'}</td>
                        <td className="px-6 py-4">{u.email}</td>
                        <td className="px-6 py-4">{u.department} - {u.year}</td>
                        <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isVerified ? 'bg-green-900/20 text-green-500' : 'bg-yellow-900/20 text-yellow-500'}`}>
                            {u.isVerified ? 'Verified' : 'Pending'}
                        </span>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                )}
            </div>
            )}

            {activeTab === 'posts' && (
            <div className="p-6 space-y-4">
                <h3 className="font-semibold text-white mb-4">Recent Global Posts</h3>
                {globalPosts.map(post => (
                <div key={post.id} className="flex items-start justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                    <p className="text-xs text-slate-500 mb-1">
                        Posted by {post.authorName} ({post.authorId}) • {new Date(post.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-slate-200">{post.content}</p>
                    </div>
                    <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                    title="Remove Post"
                    >
                    <Trash2 size={18} />
                    </button>
                </div>
                ))}
            </div>
            )}

            {activeTab === 'communities' && (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-white">Manage Communities</h3>
                        <button onClick={handleCreateCommunity} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500">
                            <Plus size={16} /> Create New
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {storageService.getCommunities().map(c => (
                            <div key={c.id} className="p-4 border border-slate-800 rounded-lg bg-slate-950">
                                <h4 className="font-bold text-white">{c.name}</h4>
                                <p className="text-xs text-slate-500">{c.category}</p>
                                <p className="text-sm mt-2 text-slate-400">{c.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}