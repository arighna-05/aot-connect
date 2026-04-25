
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { X, Camera, Check, Upload, UserCircle, Image as ImageIcon } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: () => void;
}

const INTEREST_OPTIONS = [
  'Coding', 'Robotics', 'Music', 'Sports', 'Reading', 'Gaming', 
  'Design', 'Photography', 'Literature', 'Debate', 'Startup', 'AI/ML'
];

const PRONOUN_OPTIONS = ['He/Him', 'She/Her', 'They/Them', 'Other', 'Prefer not to say'];

export default function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    username: user.username || user.email.split('@')[0],
    bio: user.bio || '',
    interests: user.interests || [],
    isAnonymous: user.isAnonymous,
    pronouns: user.pronouns || ''
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: user.fullName,
        username: user.username || user.email.split('@')[0],
        bio: user.bio || '',
        interests: user.interests || [],
        isAnonymous: user.isAnonymous,
        pronouns: user.pronouns || ''
      });
      setAvatarPreview(null);
      setBannerPreview(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
            const base64 = await storageService.fileToBase64(file);
            if (type === 'avatar') setAvatarPreview(base64);
            else setBannerPreview(base64);
        } catch (err) {
            console.error(err);
            alert("Failed to upload image.");
        }
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const canChangeUsername = () => {
      if (!user.usernameLastChanged) return true;
      const daysSinceChange = (Date.now() - user.usernameLastChanged) / (1000 * 60 * 60 * 24);
      return daysSinceChange >= 14;
  };

  const handleSave = () => {
    if (formData.username.length < 3) {
        alert("Username must be at least 3 characters.");
        return;
    }

    if (formData.bio.length > 180) {
        alert("Bio exceeds 180 characters limit.");
        return;
    }

    const updatedUser: User = {
      ...user,
      ...formData,
      avatarUrl: avatarPreview || user.avatarUrl,
      bannerUrl: bannerPreview || user.bannerUrl,
      usernameLastChanged: formData.username !== user.username ? Date.now() : user.usernameLastChanged
    };

    storageService.saveUser(updatedUser);
    storageService.setCurrentUser(updatedUser);
    
    // Trigger global update event
    window.dispatchEvent(new Event('profile-updated'));

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Edit Profile</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-8">
            
            {/* Images Section */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Profile Images</label>
                
                {/* Banner Upload */}
                <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-800 border border-slate-700 group">
                    {(bannerPreview || user.bannerUrl) ? (
                        <img src={bannerPreview || user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <ImageIcon size={32} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                            onClick={() => bannerInputRef.current?.click()}
                            className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black/80 flex items-center gap-2 backdrop-blur-md"
                        >
                            <Camera size={16} /> Change Banner
                        </button>
                    </div>
                    <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                </div>

                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 group flex-shrink-0">
                        {(avatarPreview || user.avatarUrl) ? (
                            <img src={avatarPreview || user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-2xl">
                                {user.fullName.charAt(0)}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            <Camera size={20} className="text-white" />
                        </div>
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">Profile Picture</p>
                        <p className="text-slate-500 text-xs">Click image to upload. Recommended: Square, JPG/PNG.</p>
                    </div>
                </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Public Information</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Display Name</label>
                        <input 
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            placeholder="Your Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Username 
                            {!canChangeUsername() && <span className="text-xs font-normal text-red-400 ml-2">(Cooldown active)</span>}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-500 font-bold">@</span>
                            <input 
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                                disabled={!canChangeUsername()}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="username"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Pronouns</label>
                    <div className="relative">
                        <select
                            value={formData.pronouns}
                            onChange={(e) => setFormData({...formData, pronouns: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all appearance-none"
                        >
                            <option value="">Select Pronouns (Optional)</option>
                            {PRONOUN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Bio</label>
                    <textarea 
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value.slice(0, 180)})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none min-h-[100px]"
                        placeholder="Tell us about yourself..."
                        rows={3}
                    />
                    <div className={`text-right text-xs mt-1 ${formData.bio.length >= 180 ? 'text-red-500' : (formData.bio.length > 150 ? 'text-yellow-500' : 'text-slate-500')}`}>
                        {formData.bio.length}/180
                    </div>
                </div>
            </div>

            {/* Interests */}
            <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider">Interests & Hobbies</label>
                <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(interest => (
                        <button
                            key={interest}
                            type="button"
                            onClick={() => toggleInterest(interest)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                formData.interests.includes(interest)
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-900/20'
                                : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
                            }`}
                        >
                            {interest}
                            {formData.interests.includes(interest) && <Check size={14} className="inline ml-2" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Privacy */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                    <p className="font-bold text-white text-sm">Post Anonymously</p>
                    <p className="text-xs text-slate-500">Your name will be hidden in public communities by default.</p>
                </div>
                <button 
                    type="button"
                    onClick={() => setFormData({...formData, isAnonymous: !formData.isAnonymous})}
                    className={`w-12 h-6 rounded-full relative transition-colors focus:outline-none ${formData.isAnonymous ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${formData.isAnonymous ? 'translate-x-6' : ''}`} />
                </button>
            </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
            <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
            >
                Save Changes <Check size={18} />
            </button>
        </div>

      </div>
    </div>
  );
}
