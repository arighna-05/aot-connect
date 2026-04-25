
import React, { useState, useEffect, useRef } from 'react';
import { User, Post, Attachment, Poll, PostType, Community } from '../types';
import { storageService } from '../services/storageService';
import { 
  X, Image as ImageIcon, BarChart2, FileText, Link as LinkIcon, 
  ChevronDown, Check, Flag, Sparkles, Hash, Send, EyeOff, Shield 
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  preSelectedCommunity?: Community | null;
  onPostCreated: () => void;
  defaultTab?: 'TEXT' | 'MEDIA' | 'LINK' | 'POLL';
}

export default function CreatePostModal({ 
  isOpen, onClose, user, preSelectedCommunity, onPostCreated, defaultTab = 'TEXT' 
}: CreatePostModalProps) {
  const [activeTab, setActiveTab] = useState<'TEXT' | 'MEDIA' | 'LINK' | 'POLL'>(defaultTab);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(preSelectedCommunity || null);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  
  // Inputs
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postLink, setPostLink] = useState('');
  const [isAnonymousPost, setIsAnonymousPost] = useState(user.isAnonymous);
  
  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Poll
  const [pollOptions, setPollOptions] = useState(['', '']);
  
  // Metadata
  const [postType, setPostType] = useState<PostType>('DEFAULT');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setActiveTab(defaultTab);
      setPostTitle('');
      setPostBody('');
      setPostLink('');
      setAttachments([]);
      setPollOptions(['', '']);
      setPostType('DEFAULT');
      setTags([]);
      setTagInput('');
      setIsAnonymousPost(user.isAnonymous);
      
      if (preSelectedCommunity) {
          setSelectedCommunity(preSelectedCommunity);
      } else {
          // Load joined communities
          const allComms = storageService.getCommunities(user);
          const joined = allComms.filter(c => user.joinedCommunityIds.includes(c.id));
          setJoinedCommunities(joined);
          
          // Default selection logic
          if (!selectedCommunity) {
             const common = joined.find(c => c.id === 'c-global');
             if (common) setSelectedCommunity(common);
             else if (joined.length > 0) setSelectedCommunity(joined[0]);
          }
      }
    }
  }, [isOpen, defaultTab, preSelectedCommunity, user]);

  // Determine if anonymity is enforced by global setting
  const isPublicSpace = selectedCommunity?.type !== 'RESTRICTED_YEAR' && selectedCommunity?.id !== 'profile';
  const isGlobalEnforced = user.isAnonymous && isPublicSpace;

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let type: 'image' | 'video' | 'doc' = 'doc';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      
      try {
        const base64 = await storageService.fileToBase64(file);
        const newAttachment: Attachment = {
          id: `att-${Date.now()}`,
          type,
          url: base64,
          name: file.name
        };
        setAttachments([...attachments, newAttachment]);
      } catch (err) {
        console.error("Error reading file", err);
      }
    }
    e.target.value = ''; // Reset
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const val = tagInput.trim().replace(/,/g, '');
          if (val) {
              const formatted = val.startsWith('#') ? val : `#${val}`;
              if (!tags.includes(formatted)) {
                  setTags([...tags, formatted]);
              }
              setTagInput('');
          }
      }
  };

  const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunity) return;
    if (!postTitle.trim()) {
        alert("Please enter a title.");
        return;
    }

    let content = postBody;
    let pollData: Poll | undefined = undefined;
    let finalAttachments = attachments;

    if (activeTab === 'LINK') {
        if (!postLink.trim()) {
            alert("Please enter a URL.");
            return;
        }
        content = postLink;
    }

    if (activeTab === 'POLL') {
       const validOptions = pollOptions.filter(o => o.trim());
       if (validOptions.length < 2) {
           alert("Poll must have at least 2 options.");
           return;
       }
       pollData = {
           question: postTitle,
           options: validOptions.map((opt, idx) => ({ id: `opt-${idx}`, text: opt, votes: 0 })),
           totalVotes: 0
       };
    }
    
    // Effective Anonymity: User choice OR Global Enforcement
    const effectiveAnon = isAnonymousPost || isGlobalEnforced;

    const newPost: Post = {
      id: `p-${Date.now()}`,
      title: postTitle,
      communityId: selectedCommunity.id, 
      communityName: selectedCommunity.id === 'profile' ? 'My Profile' : selectedCommunity.name,
      authorId: user.id,
      authorName: effectiveAnon ? 'Anonymous Student' : user.fullName,
      content: content,
      timestamp: Date.now(),
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      comments: [],
      isAnonymousPost: effectiveAnon,
      isPublic: selectedCommunity.id === 'profile' ? true : (selectedCommunity.type !== 'RESTRICTED_YEAR'), 
      attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
      poll: pollData,
      postType: postType,
      tags: tags.length > 0 ? tags : undefined,
      views: 0
    };

    storageService.createPost(newPost);
    onPostCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
            className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
        >
                {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">Create a post</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
                    <form id="createPostForm" onSubmit={handleSubmit}>
                    
                    {/* Header: Community & Post Type */}
                    <div className="px-6 py-4 grid grid-cols-2 gap-4">
                            
                            {/* Community Selector */}
                            <div className="relative">
                            {preSelectedCommunity ? (
                                // Fixed Community Display
                                <div className="w-full flex items-center gap-2 bg-slate-800/50 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 cursor-default">
                                    <span className="text-xs font-bold uppercase text-slate-500 mr-1">Posting to:</span>
                                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
                                        {preSelectedCommunity.name.substring(0,2)}
                                    </div>
                                    <span className="font-bold text-sm truncate">{preSelectedCommunity.name}</span>
                                </div>
                            ) : (
                                // Dropdown Selector
                                <button 
                                    type="button"
                                    onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                                    className="w-full flex items-center justify-between gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {selectedCommunity ? (
                                            <>
                                                <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
                                                    {selectedCommunity.id === 'profile' ? (
                                                        user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Me" /> : (user.isAnonymous ? '?' : user.fullName.charAt(0))
                                                    ) : (
                                                        selectedCommunity.name.substring(0,2)
                                                    )}
                                                </div>
                                                <span className="font-bold text-sm truncate">{selectedCommunity.name}</span>
                                            </>
                                        ) : (
                                            <span className="font-bold text-sm text-slate-400">Choose community</span>
                                        )}
                                    </div>
                                    <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
                                </button>
                            )}

                            {!preSelectedCommunity && showCommunityDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowCommunityDropdown(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                                        
                                        {/* My Profile Option */}
                                        <button
                                            type="button"
                                            onClick={() => { 
                                                setSelectedCommunity({
                                                    id: 'profile',
                                                    name: 'My Profile',
                                                    description: 'Post to your followers',
                                                    type: 'COMMON',
                                                    category: 'OFFICIAL',
                                                    memberCount: user.followers?.length || 0
                                                }); 
                                                setShowCommunityDropdown(false); 
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center gap-3 transition-colors border-b border-slate-800"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold border border-slate-700 overflow-hidden text-slate-300">
                                                {user.isAnonymous ? '?' : (user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Profile"/> : user.fullName.charAt(0))}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-200">My Profile</p>
                                                <p className="text-[10px] text-slate-500">Visible to followers</p>
                                            </div>
                                            {selectedCommunity?.id === 'profile' && <Check size={16} className="text-blue-500" />}
                                        </button>

                                        <div className="p-2 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                                            <p className="text-xs font-bold text-slate-500 uppercase px-2">Your Communities</p>
                                        </div>
                                        {joinedCommunities.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => { setSelectedCommunity(c); setShowCommunityDropdown(false); }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                                                    {c.name.substring(0,2)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-200 truncate">{c.name}</p>
                                                    <p className="text-[10px] text-slate-500">{c.memberCount} members</p>
                                                </div>
                                                {selectedCommunity?.id === c.id && <Check size={16} className="ml-auto text-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                            </div>

                            {/* Post Type Selector */}
                            <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                <Flag size={14} className="text-slate-500" />
                            </div>
                            <select 
                                value={postType} 
                                onChange={(e) => setPostType(e.target.value as PostType)}
                                className="appearance-none w-full bg-slate-800 border border-slate-700 text-white text-sm font-bold rounded-lg py-2 pl-9 pr-8 hover:bg-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
                            >
                                <option value="DEFAULT">Normal Post</option>
                                <option value="QUESTION">Question</option>
                                <option value="ANNOUNCEMENT">Announcement</option>
                                <option value="DISCUSSION">Discussion</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            </div>
                    </div>

                    {/* Content Type Tabs */}
                    <div className="flex border-b border-slate-800 mx-6 mb-4">
                        <button type="button" onClick={() => setActiveTab('TEXT')} className={`pb-3 pr-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'TEXT' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-white'}`}>
                            <FileText size={16} /> Text
                        </button>
                        <button type="button" onClick={() => setActiveTab('MEDIA')} className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'MEDIA' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-white'}`}>
                            <ImageIcon size={16} /> Media
                        </button>
                        <button type="button" onClick={() => setActiveTab('LINK')} className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'LINK' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-white'}`}>
                            <LinkIcon size={16} /> Link
                        </button>
                        <button type="button" onClick={() => setActiveTab('POLL')} className={`pb-3 px-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'POLL' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-white'}`}>
                            <BarChart2 size={16} /> Poll
                        </button>
                    </div>

                    {/* Dynamic Content Inputs */}
                    <div className="px-6 space-y-4">
                        
                        <input 
                            type="text" 
                            value={postTitle}
                            onChange={(e) => setPostTitle(e.target.value)}
                            placeholder="What do you want to talk about? (Title)"
                            maxLength={300}
                            className="w-full bg-transparent border-none p-0 text-xl font-bold text-white placeholder-slate-500 focus:ring-0"
                            autoFocus
                        />
                        
                        {activeTab === 'TEXT' && (
                            <textarea 
                                value={postBody}
                                onChange={(e) => setPostBody(e.target.value)}
                                placeholder="Share your thoughts..."
                                rows={6}
                                className="w-full bg-transparent border-none p-0 text-base text-slate-200 placeholder-slate-600 focus:ring-0 resize-y min-h-[150px]"
                            />
                        )}

                        {activeTab === 'MEDIA' && (
                            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition-colors">
                                {attachments.length === 0 ? (
                                    <div className="space-y-3">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                            <ImageIcon className="text-slate-400" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Drag and drop images or videos</p>
                                            <p className="text-xs text-slate-500 mt-1">or</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-slate-800 text-blue-400 border border-slate-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-slate-700 transition-colors"
                                        >
                                            Upload
                                        </button>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {attachments.map(att => (
                                            <div key={att.id} className="relative group w-32 h-32 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                                                {att.type === 'image' ? (
                                                    <img src={att.url} alt="prev" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center flex-col gap-2 p-2">
                                                        <FileText size={24} className="text-blue-500" />
                                                        <span className="text-[10px] text-slate-400 truncate w-full text-center">{att.name}</span>
                                                    </div>
                                                )}
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeAttachment(att.id)}
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                                        >
                                            <Sparkles size={20} className="text-slate-500" />
                                            <span className="text-xs font-bold text-slate-500">Add More</span>
                                        </button>
                                    </div>
                                )}
                                <div className="mt-4 border-t border-slate-700/50 pt-4">
                                    <textarea 
                                        value={postBody}
                                        onChange={(e) => setPostBody(e.target.value)}
                                        placeholder="Add a caption..."
                                        rows={2}
                                        className="w-full bg-transparent border-none p-0 text-sm text-slate-200 placeholder-slate-600 focus:ring-0 resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'LINK' && (
                            <div className="space-y-4">
                                <input 
                                    type="text"
                                    value={postLink}
                                    onChange={(e) => setPostLink(e.target.value)}
                                    placeholder="Paste your link here..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-base text-blue-400 placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors font-mono"
                                />
                                {postLink && (
                                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4 opacity-70">
                                        <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                                            <LinkIcon className="text-slate-500" />
                                        </div>
                                        <p className="text-xs text-slate-500">Preview generated upon posting.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'POLL' && (
                            <div className="space-y-3 p-4 border border-slate-800 rounded-xl bg-slate-950">
                                <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Poll Options</label>
                                        <span className={`text-xs font-bold ${pollOptions.length >= 4 ? 'text-red-400' : 'text-slate-500'}`}>
                                            {pollOptions.length}/4
                                        </span>
                                </div>
                                <textarea 
                                    value={postBody}
                                    onChange={(e) => setPostBody(e.target.value)}
                                    placeholder="Add context about the poll (optional)..."
                                    rows={2}
                                    className="w-full bg-transparent border-b border-slate-800 pb-2 mb-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-colors resize-none"
                                />
                                {pollOptions.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
                                        <input
                                            type="text"
                                            placeholder={`Option ${idx + 1}`}
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500"
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...pollOptions];
                                                newOpts[idx] = e.target.value;
                                                setPollOptions(newOpts);
                                            }}
                                        />
                                        {pollOptions.length > 2 && (
                                            <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-500 p-1">
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setPollOptions([...pollOptions, ''])} 
                                        disabled={pollOptions.length >= 4}
                                        className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        + Add Option
                                    </button>
                                    {pollOptions.length >= 4 && (
                                        <span className="text-xs text-red-400 font-medium">Maximum 4 options allowed</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags Section with Chips */}
                    <div className="px-6 mt-4 mb-4">
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-wrap gap-2 items-center">
                                <Hash size={16} className="text-slate-500 flex-shrink-0" />
                                {tags.map(tag => (
                                    <span key={tag} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded-md text-xs font-bold border border-blue-900/50 flex items-center gap-1">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-white"><X size={12} /></button>
                                    </span>
                                ))}
                                <input 
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder={tags.length === 0 ? "Add tags (press Enter or comma)" : "Add another..."}
                                className="bg-transparent border-none text-sm text-white placeholder-slate-600 focus:ring-0 flex-1 min-w-[150px] p-0"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 pl-2">Example: #Exam, #Event, #Query</p>
                    </div>
                    </form>
            </div>

                {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
                 {/* Anonymity Toggle */}
                 <div className="flex items-center gap-2">
                     <button
                        type="button"
                        onClick={() => !isGlobalEnforced && setIsAnonymousPost(!isAnonymousPost)}
                        disabled={isGlobalEnforced}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                            isAnonymousPost || isGlobalEnforced
                            ? 'bg-blue-900/20 border-blue-500/50 text-blue-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        } ${isGlobalEnforced ? 'cursor-not-allowed opacity-80' : ''}`}
                        title={isGlobalEnforced ? "Enforced by your privacy settings" : "Toggle anonymity"}
                     >
                        {isAnonymousPost || isGlobalEnforced ? <EyeOff size={16} /> : <Shield size={16} />}
                        <span className="text-xs font-bold">
                            {isGlobalEnforced 
                             ? 'Posting Anonymously (Enforced)' 
                             : (isAnonymousPost ? 'Posting Anonymously' : 'Post Anonymously')}
                        </span>
                     </button>
                 </div>

                 <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-full font-bold text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="createPostForm"
                        disabled={!selectedCommunity || !postTitle.trim()}
                        className="px-6 py-2 rounded-full font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        Post <Send size={16} />
                    </button>
                 </div>
            </div>
        </div>
    </div>
  );
}
