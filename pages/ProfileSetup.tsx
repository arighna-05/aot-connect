import React, { useState } from 'react';
import { Department, Year, User } from '../types';
import { storageService } from '../services/storageService';
import { UserCircle, Shield, BookOpen, Check, Loader2 } from 'lucide-react';
import { updateUserProfile } from '../services/api';

interface ProfileSetupProps {
  onComplete: () => void;
}

const INTERESTS_LIST = [
  'Coding', 'Robotics', 'Music', 'Dance', 'Sports', 'Photography', 
  'Literature', 'Debate', 'Gaming', 'Art', 'Startup', 'AI/ML'
];

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const user = storageService.getCurrentUser();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    department: user?.department || Department.CSE,
    year: user?.year || Year.FIRST,
    isAnonymous: user?.isAnonymous || false,
    interests: user?.interests || [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Auto Assign Department Community ID
      const deptCommunityId = storageService.getAutoJoinCommunityId(formData.department, formData.year);
      
      const updatedUser: User = {
        ...user,
        fullName: formData.fullName,
        department: formData.department,
        year: formData.year,
        isAnonymous: formData.isAnonymous,
        interests: formData.interests,
        // Ensure global + dept community are joined
        joinedCommunityIds: Array.from(new Set([...user.joinedCommunityIds, 'c-global', deptCommunityId]))
      };

      await updateUserProfile(user.id, updatedUser);

      storageService.saveUser(updatedUser);
      storageService.setCurrentUser(updatedUser);
      onComplete();
    } catch (error) {
      console.error("Profile setup failed", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
          <p className="mt-2 text-slate-400">Tell us about yourself to get connected with your batchmates.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 shadow-xl rounded-2xl overflow-hidden border border-slate-800">
          <div className="p-8 space-y-8">
            
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-500">
                <UserCircle size={20} /> Personal Information
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="mt-1 block w-full border border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-slate-950 text-white"
                    placeholder="John Doe"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.isAnonymous ? 'bg-blue-600' : 'bg-slate-700'}`}
                       onClick={() => setFormData({...formData, isAnonymous: !formData.isAnonymous})}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.isAnonymous ? 'translate-x-6' : ''}`} />
                  </div>
                  <div>
                    <label className="font-medium text-white cursor-pointer" onClick={() => setFormData({...formData, isAnonymous: !formData.isAnonymous})}>
                      Enable Anonymity
                    </label>
                    <p className="text-xs text-slate-400">
                      If enabled, you will appear as "Anonymous Student" in public spaces.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* Academic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-500">
                <BookOpen size={20} /> Academic Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value as Department})}
                    className="mt-1 block w-full border border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-slate-950 text-white"
                  >
                    {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value as Year})}
                    className="mt-1 block w-full border border-slate-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-slate-950 text-white"
                  >
                    {Object.values(Year).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-sm text-blue-400 bg-blue-900/20 p-3 rounded-md border border-blue-900/40">
                ℹ️ You will be automatically added to the <strong>{formData.department} {formData.year}</strong> community.
              </p>
            </div>

            <hr className="border-slate-800" />

            {/* Interests */}
            <div className="space-y-4">
               <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-500">
                <Shield size={20} /> Interests & Communities
              </h3>
              <p className="text-sm text-slate-400">Select topics you follow to get recommendations.</p>
              
              <div className="flex flex-wrap gap-2">
                {INTERESTS_LIST.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.interests.includes(interest)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {interest}
                    {formData.interests.includes(interest) && <Check size={14} className="inline ml-1" />}
                  </button>
                ))}
              </div>
            </div>

          </div>
          
          <div className="bg-slate-950 px-8 py-5 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
              {isLoading ? 'Saving...' : 'Complete Profile & Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}