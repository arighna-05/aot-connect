



import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Post, Comment } from '../types';
import { storageService } from '../services/storageService';
import { 
  ThumbsUp, ThumbsDown, MessageSquare, Share2, Trash2, 
  FileText, Globe, Bookmark, Eye, MoreVertical, 
  Flag, XCircle, Clock, TrendingUp, Shield, Hash,
  ExternalLink, Copy, Check, Heart, Edit2, CornerDownRight, Send
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUser: User;
  authorDetails?: User;
  onUpdate: () => void;
  readOnly?: boolean;
  onTagClick?: (tag: string) => void;
}

export default function PostCard({ post, currentUser, authorDetails, onUpdate, readOnly = false, onTagClick }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);
  const [animateDislike, setAnimateDislike] = useState(false);

  // Comment Interaction State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');

  const isMyPost = post.authorId === currentUser.id;
  const likedBy = post.likedBy || [];
  const dislikedBy = post.dislikedBy || [];
  const isLiked = likedBy.includes(currentUser.id);
  const isDisliked = dislikedBy.includes(currentUser.id);
  const isBookmarked = post.bookmarkedBy?.includes(currentUser.id) || false;
  const isFollowing = currentUser.following.includes(post.authorId);

  useEffect(() => {
    // Increment view count handled elsewhere or backend
  }, []);

  const handleLike = () => {
      if (readOnly) return;
      storageService.toggleLike(post.id, currentUser.id);
      if (!isLiked) {
          setAnimateLike(true);
          setTimeout(() => setAnimateLike(false), 500); 
      }
      onUpdate();
  };

  const handleDislike = () => {
      if (readOnly) return;
      storageService.toggleDislike(post.id, currentUser.id);
      if (!isDisliked) {
          setAnimateDislike(true);
          setTimeout(() => setAnimateDislike(false), 500);
      }
      onUpdate();
  };

  const handleBookmark = () => {
      storageService.toggleBookmark(post.id, currentUser.id);
      onUpdate();
  };

  const handleFollow = () => {
      if (readOnly) return;
      storageService.toggleFollow(currentUser.id, post.authorId);
      onUpdate();
  };

  const handleVote = (optionId: string) => {
      if (readOnly) return;
      storageService.votePoll(post.id, optionId);
      onUpdate();
  };

  const handleDeletePost = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setShowMenu(false);
      
      if (window.confirm("Are you sure you want to delete this post?")) {
          storageService.deletePost(post.id);
          onUpdate();
      }
  };

  const handleCommentSubmit = () => {
      if (readOnly) return;
      if (!commentInput.trim()) return;
      const newComment: Comment = {
          id: `cmt-${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.isAnonymous ? 'Anonymous Student' : currentUser.fullName,
          content: commentInput,
          timestamp: Date.now(),
          likes: 0,
          likedBy: [],
          replies: []
      };
      storageService.addComment(post.id, newComment);
      setCommentInput('');
      onUpdate();
      if (!showComments) setShowComments(true);
  };

  const handleReplySubmit = (parentCommentId: string) => {
      if (readOnly) return;
      if (!replyInput.trim()) return;
      const reply: Comment = {
          id: `rep-${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.isAnonymous ? 'Anonymous Student' : currentUser.fullName,
          content: replyInput,
          timestamp: Date.now(),
          likes: 0,
          likedBy: [],
          replies: []
      };
      storageService.addReply(post.id, parentCommentId, reply);
      setReplyInput('');
      setReplyingTo(null);
      onUpdate();
  };

  const handleEditSubmit = (commentId: string) => {
      if (!editInput.trim()) return;
      storageService.updateComment(post.id, commentId, editInput);
      setEditingCommentId(null);
      setEditInput('');
      onUpdate();
  };

  const handleDeleteComment = (commentId: string) => {
      if (window.confirm("Are you sure you want to delete this comment?")) {
          storageService.deleteComment(post.id, commentId);
          onUpdate();
      }
  };

  const handleCommentLike = (commentId: string) => {
      if (readOnly) return;
      storageService.toggleCommentLike(post.id, commentId, currentUser.id);
      onUpdate();
  };

  const handleShare = () => {
      navigator.clipboard.writeText(`${window.location.origin}/#/post/${post.id}`);
      alert("Post link copied to clipboard!");
      setShowMenu(false);
  };

  const extractUrl = (text: string) => {
    const match = text.match(/(https?:\/\/[^\s]+)/g);
    return match ? match[0] : null;
  };

  const urlPreview = extractUrl(post.content);
  const readingTime = Math.max(1, Math.ceil(post.content.split(' ').length / 200));

  const getTypeBorder = () => {
      switch(post.postType) {
          case 'ANNOUNCEMENT': return 'border-l-4 border-l-yellow-500';
          case 'QUESTION': return 'border-l-4 border-l-red-500';
          case 'DISCUSSION': return 'border-l-4 border-l-green-500';
          default: return 'border-l-4 border-l-blue-600';
      }
  };

  // Helper to parse content and make hashtags clickable
  const renderContentWithTags = (text: string) => {
      if (!text) return null;
      // Split by hashtags (capturing the hashtag to keep it in the array)
      const parts = text.split(/(\#[a-zA-Z0-9-_]+)/g);
      
      return parts.map((part, index) => {
          if (part.startsWith('#') && part.length > 1) {
              return (
                  <span 
                    key={index} 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onTagClick) onTagClick(part);
                    }}
                    className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer font-medium"
                  >
                      {part}
                  </span>
              );
          }
          return part;
      });
  };

  // Helper to render a single comment item (recursive for replies)
  const renderComment = (comment: Comment, isReply = false) => {
      const isMyComment = comment.authorId === currentUser.id;
      const isCommentLiked = comment.likedBy?.includes(currentUser.id);
      const isEditing = editingCommentId === comment.id;
      
      // Determine if comment author is effectively anonymous based on name
      const isCommentAnon = comment.authorName === 'Anonymous Student';

      return (
        <div key={comment.id} className={`flex gap-3 group ${isReply ? 'mt-3' : 'mb-6'}`}>
            <div className="flex-shrink-0">
                {isCommentAnon ? (
                     <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">?</div>
                ) : (
                    <Link to={`/u/${comment.authorId}`} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-400 border border-slate-700 overflow-hidden shadow-sm hover:ring-2 hover:ring-blue-900 block">
                        {(comment.authorAvatar) ? (
                            <img src={comment.authorAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span>{comment.authorName.charAt(0)}</span>
                        )}
                    </Link>
                )}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-300 relative group-hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                        {isCommentAnon ? (
                            <span className="font-bold text-slate-400 text-xs italic">Anonymous Student</span>
                        ) : (
                            <Link to={`/u/${comment.authorId}`} className="font-bold text-white text-xs hover:underline">{comment.authorName}</Link>
                        )}
                        <span className="text-[10px] text-slate-500">{new Date(comment.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    
                    {isEditing ? (
                        <div className="flex gap-2 items-center">
                            <input 
                                type="text"
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit(comment.id)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                autoFocus
                            />
                            <button onClick={() => handleEditSubmit(comment.id)} className="text-blue-500 p-1 hover:bg-slate-800 rounded">
                                <Check size={14} />
                            </button>
                            <button onClick={() => setEditingCommentId(null)} className="text-slate-500 p-1 hover:bg-slate-800 rounded">
                                <XCircle size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap">{renderContentWithTags(comment.content)}</div>
                    )}
                </div>
                
                {!readOnly && (
                    <div className="flex gap-4 mt-1 ml-2 items-center">
                        <button 
                            onClick={() => handleCommentLike(comment.id)} 
                            className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${isCommentLiked ? 'text-pink-500' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Heart size={10} className={isCommentLiked ? "fill-current" : ""} />
                            {comment.likes > 0 && comment.likes} {isCommentLiked ? 'Liked' : 'Like'}
                        </button>
                        
                        {!isReply && (
                            <button 
                                onClick={() => {
                                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                    setReplyInput('');
                                }} 
                                className={`text-[11px] font-bold transition-colors ${replyingTo === comment.id ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}
                            >
                                Reply
                            </button>
                        )}

                        {isMyComment && (
                            <>
                                <button 
                                    onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditInput(comment.content);
                                    }} 
                                    className="text-[11px] font-bold text-slate-500 hover:text-white transition-colors"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteComment(comment.id)} 
                                    className="text-[11px] font-bold text-slate-500 hover:text-red-500 transition-colors"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Reply Input */}
                {replyingTo === comment.id && !readOnly && (
                    <div className="mt-2 flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
                        <CornerDownRight size={14} className="text-slate-600" />
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                value={replyInput}
                                onChange={(e) => setReplyInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(comment.id)}
                                placeholder={`Reply to ${comment.authorName}...`}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-600 outline-none"
                                autoFocus
                            />
                            <button 
                                onClick={() => handleReplySubmit(comment.id)}
                                disabled={!replyInput.trim()}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-blue-500 hover:bg-slate-800 rounded disabled:opacity-50"
                            >
                                <Send size={12} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Render Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 pl-2 border-l-2 border-slate-800 ml-1">
                        {comment.replies.map(reply => renderComment(reply, true))}
                    </div>
                )}
            </div>
        </div>
      );
  };

  return (
    <div className={`bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-visible hover:shadow-md hover:shadow-slate-900/50 transition-all ${getTypeBorder()}`}>
        <div className="p-6">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                    {/* Avatar Logic */}
                    <div className="flex-shrink-0">
                        {post.isAnonymousPost ? (
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold ring-1 ring-slate-700 overflow-hidden text-slate-400 cursor-default">
                                ?
                            </div>
                        ) : (
                            <Link to={`/u/${post.authorId}`} className="block">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold ring-1 ring-slate-700 overflow-hidden text-slate-300 relative">
                                    {(post.authorAvatar || (authorDetails && authorDetails.avatarUrl)) ? (
                                        <img src={post.authorAvatar || authorDetails?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{post.authorName.charAt(0)}</span>
                                    )}
                                </div>
                            </Link>
                        )}
                    </div>
                    
                    <div className="flex flex-col">
                         {/* Community & Type Context Line */}
                         {( (post.communityName && post.communityId !== 'c-global') || post.postType !== 'DEFAULT' ) && (
                             <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-0.5">
                                  {post.communityName && post.communityId !== 'c-global' && (
                                     <Link to="/communities" className="hover:text-blue-400 transition-colors">
                                         {post.communityName}
                                     </Link>
                                  )}
                                  
                                  {post.communityName && post.communityId !== 'c-global' && post.postType !== 'DEFAULT' && (
                                      <span>•</span>
                                  )}

                                  {post.postType !== 'DEFAULT' && (
                                      <span className={`
                                        ${post.postType === 'ANNOUNCEMENT' ? 'text-yellow-500' : ''}
                                        ${post.postType === 'QUESTION' ? 'text-red-400' : ''}
                                        ${post.postType === 'DISCUSSION' ? 'text-green-400' : ''}
                                      `}>
                                          #{post.postType}
                                      </span>
                                  )}
                             </div>
                         )}
                         
                         {/* Username */}
                         <div className="flex items-center gap-2">
                            {post.isAnonymousPost ? (
                                <span className="font-bold text-white text-sm">
                                    {post.authorName}
                                </span>
                            ) : (
                                <Link to={`/u/${post.authorId}`} className="font-bold text-white text-sm hover:underline flex items-center gap-1">
                                    {post.authorName}
                                    {authorDetails?.isVerified && <Shield size={12} className="text-blue-500 fill-blue-500/20" />}
                                </Link>
                            )}
                            
                            {!post.isAnonymousPost && !isMyPost && !isFollowing && !readOnly && (
                                <>
                                    <span className="text-slate-600">•</span>
                                    <button onClick={handleFollow} className="text-blue-500 text-xs font-bold hover:underline">Follow</button>
                                </>
                            )}
                         </div>
                    </div>
                </div>

                <div className="flex items-start gap-2">
                     <span className="text-xs text-slate-500 mt-0.5">
                        {new Date(post.timestamp).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                     </span>
                     <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="text-slate-500 hover:text-white p-0.5 rounded transition-colors">
                             <MoreVertical size={16} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-6 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                 {isMyPost ? (
                                     <button onClick={handleDeletePost} className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-slate-800 flex items-center gap-2 text-sm font-medium">
                                         <Trash2 size={16} /> Delete Post
                                     </button>
                                 ) : (
                                     <>
                                         <button className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-800 flex items-center gap-2 text-sm font-medium">
                                             <Flag size={16} /> Report
                                         </button>
                                         <button className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-800 flex items-center gap-2 text-sm font-medium">
                                             <XCircle size={16} /> Hide Post
                                         </button>
                                     </>
                                 )}
                                 <hr className="border-slate-800 my-1"/>
                                 <button onClick={handleShare} className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-800 flex items-center gap-2 text-sm font-medium">
                                     <Copy size={16} /> Copy Link
                                 </button>
                            </div>
                        )}
                        {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>}
                     </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="mb-4">
                {post.title && (
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                        {post.title}
                    </h3>
                )}

                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {post.tags.map(tag => (
                            <span 
                                key={tag} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onTagClick) onTagClick(tag);
                                }}
                                className="text-blue-400 text-sm hover:underline cursor-pointer"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                
                <div className="text-slate-100 text-[15px] leading-relaxed whitespace-pre-wrap mb-3">
                    {renderContentWithTags(post.content)}
                </div>

                {urlPreview && (
                    <a href={urlPreview} target="_blank" rel="noopener noreferrer" className="block mb-4 rounded-xl border border-slate-700 bg-slate-950 overflow-hidden hover:border-blue-700 transition-colors group">
                        <div className="p-4 flex gap-4">
                            <div className="h-20 w-20 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 flex-shrink-0">
                                <Globe size={24} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className="font-bold text-slate-200 truncate group-hover:text-blue-400">External Link</h4>
                                <p className="text-sm text-slate-500 truncate">{urlPreview}</p>
                                <span className="text-xs text-blue-500 mt-1 flex items-center gap-1"><ExternalLink size={10} /> aot.edu.in</span>
                            </div>
                        </div>
                    </a>
                )}

                {post.poll && (
                    <div className="mb-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <h4 className="font-bold text-white mb-3 text-sm">{post.poll.question}</h4>
                        <div className="space-y-3">
                            {post.poll.options.map(option => {
                                const percentage = post.poll!.totalVotes > 0 ? Math.round((option.votes / post.poll!.totalVotes) * 100) : 0;
                                return (
                                    <div key={option.id} className={`relative group ${!readOnly ? 'cursor-pointer' : ''}`} onClick={(e) => { e.stopPropagation(); handleVote(option.id); }}>
                                        <div className="w-full text-left relative z-10 flex justify-between items-center px-4 py-2.5 rounded-lg border border-slate-700 group-hover:border-blue-500 transition-all overflow-hidden bg-slate-800/40">
                                            <span className="text-sm font-medium text-slate-200 z-10">{option.text}</span>
                                            <span className="text-xs font-bold text-blue-400 z-10">{percentage}%</span>
                                            <div className="absolute top-0 left-0 h-full bg-blue-600/20 z-0 transition-all duration-500" style={{ width: `${percentage}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center mt-3 text-xs text-slate-500 font-medium">
                            <span>{post.poll.totalVotes} votes</span>
                            {post.poll.totalVotes > 10 && <span className="text-blue-400 flex items-center gap-1"><TrendingUp size={12} /> Hot Poll</span>}
                        </div>
                    </div>
                )}
                
                {post.attachments && post.attachments.length > 0 && (
                    <div className={`mb-4 rounded-xl overflow-hidden border border-slate-800 shadow-sm ${post.attachments.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}`}>
                        {post.attachments.map(att => (
                            <div key={att.id} className="relative bg-slate-950">
                                {att.type === 'image' ? (
                                    <img src={att.url} alt="Post attachment" className="w-full max-h-[500px] object-cover hover:opacity-95 transition-opacity cursor-pointer" />
                                ) : (
                                    <div className="p-4 flex items-center gap-3 hover:bg-slate-900 transition-colors cursor-pointer">
                                        <div className="bg-blue-900/20 p-2 rounded-lg text-blue-400">
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-bold text-slate-200 block truncate">{att.name}</span>
                                            <span className="text-xs text-slate-500 uppercase">Document</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                     <span className="flex items-center gap-1"><Clock size={12} /> {readingTime} min read</span>
                     {post.views && post.views > 0 && (
                         <span className="flex items-center gap-1"><Eye size={12} /> {post.views} views</span>
                     )}
                </div>
                {post.likes > 10 && <span className="text-blue-400 flex items-center gap-1 font-bold"><TrendingUp size={12} /> Trending</span>}
            </div>

            <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        {/* Like */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleLike(); }}
                            disabled={readOnly}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isLiked ? 'text-blue-400 bg-blue-900/20' : 'text-slate-400 hover:bg-slate-800'} ${readOnly && 'opacity-50 cursor-not-allowed'}`}
                        >
                            <div className={`transition-transform relative ${animateLike ? 'scale-125' : ''}`}>
                                <ThumbsUp size={18} className={isLiked ? "fill-current" : ""} />
                            </div>
                            <span>{post.likes || 0}</span>
                        </button>

                        {/* Dislike */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDislike(); }}
                            disabled={readOnly}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDisliked ? 'text-red-400 bg-red-900/20' : 'text-slate-400 hover:bg-slate-800'} ${readOnly && 'opacity-50 cursor-not-allowed'}`}
                        >
                            <div className={`transition-transform relative ${animateDislike ? 'scale-125' : ''}`}>
                                <ThumbsDown size={18} className={isDisliked ? "fill-current" : ""} />
                            </div>
                            <span>{post.dislikes || 0}</span>
                        </button>

                        {/* Comment Toggle */}
                        <button 
                             onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showComments ? 'text-blue-400 bg-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            <MessageSquare size={18} />
                            <span>{post.comments?.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) || 0} Comments</span>
                        </button>

                         {/* Share */}
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleShare(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-green-400 transition-colors"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={handleBookmark}
                            className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${isBookmarked ? 'text-blue-400' : 'text-slate-400'}`}
                            title="Save Post"
                        >
                            <Bookmark size={20} className={isBookmarked ? "fill-current" : ""} />
                        </button>
                    </div>
            </div>
        </div>
        
        {showComments && (
            <div className="bg-slate-950 border-t border-slate-800 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                {!readOnly ? (
                    <div className="flex gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 border border-slate-700 overflow-hidden">
                                {(currentUser.avatarUrl && !currentUser.isAnonymous) ? (
                                    <img src={currentUser.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                        {currentUser.isAnonymous ? '?' : currentUser.fullName.charAt(0)}
                                    </div>
                                )}
                        </div>
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                value={commentInput}
                                onChange={e => setCommentInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
                                placeholder="Write a comment..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none shadow-sm transition-all"
                            />
                            <button 
                                onClick={handleCommentSubmit} 
                                disabled={!commentInput.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:bg-slate-800 rounded-lg disabled:opacity-50 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                        <p className="text-sm text-slate-500">Comments are disabled in view-only mode.</p>
                    </div>
                )}

                <div className="space-y-2">
                    {post.comments?.length === 0 && (
                        <div className="text-center py-4">
                            <p className="text-sm text-slate-500">No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    )}
                    {post.comments?.map(comment => renderComment(comment))}
                </div>
            </div>
        )}
    </div>
  );
}