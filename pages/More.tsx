import React, { useState, useEffect } from 'react';
import { 
  Bell, Lock, Accessibility, Globe, 
  HelpCircle, AlertTriangle, Mail, 
  Info, FileText, LogOut, ChevronRight, Shield,
  Settings, LifeBuoy, UserCog, ArrowLeft, Check,
  Eye, MessageSquare, Search, Database, Type, Zap, EyeOff,
  Bug, MessageCircle, Server, Code, Heart, ExternalLink,
  ShieldAlert, Sparkles, Clock, MapPin
} from 'lucide-react';
import { User, UserSettings } from '../types';
import { storageService } from '../services/storageService';

interface MoreProps {
  user: User;
  onLogout: () => void;
  onUpdate: () => void;
}

type SettingsPanel = 
  'NOTIFICATIONS' | 'PRIVACY' | 'ACCESSIBILITY' | 'LANGUAGE' | 
  'HELP' | 'REPORT' | 'CONTACT' | 
  'ABOUT' | 'POLICY' | 'TERMS' | null;

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    desc?: string;
}

const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, desc }) => (
    <div className="flex items-center justify-between py-4 group cursor-pointer" onClick={() => onChange(!checked)}>
        <div className="pr-4">
            <p className="font-bold text-white text-sm group-hover:text-blue-200 transition-colors">{label}</p>
            {desc && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>}
        </div>
        <button 
            type="button"
            className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : ''}`} />
        </button>
    </div>
);

interface SelectOptionProps {
    label: string;
    selected: boolean;
    onClick: () => void;
    desc?: string;
}

// Polished Radio Card Component
const RadioOption: React.FC<SelectOptionProps> = ({ label, selected, onClick, desc }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group mb-3 last:mb-0 relative overflow-hidden ${
            selected 
            ? 'bg-blue-900/10 border-blue-500/50 shadow-sm ring-1 ring-blue-500/20' 
            : 'bg-slate-950 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
        }`}
    >
        {selected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
        <div className="flex items-center gap-4 pl-2">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                selected ? 'border-blue-500 bg-blue-500' : 'border-slate-600 bg-transparent group-hover:border-slate-500'
            }`}>
                {selected && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
            </div>
            <div>
                <p className={`font-bold text-sm transition-colors ${selected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{label}</p>
                {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
            </div>
        </div>
    </button>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
    <div className="flex items-center gap-2 mb-4 px-1 mt-2">
        {Icon && <Icon size={16} className="text-blue-500" />}
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
    </div>
);

export default function More({ user, onLogout, onUpdate }: MoreProps) {
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);
  
  // Default Settings
  const defaultSettings: UserSettings = {
      notifications: { 
          push: true, email: true, inApp: true,
          likesComments: true, newFollowers: true, mentions: true, communityUpdates: true
      },
      privacy: { 
          profileVisibility: 'PUBLIC', 
          allowDMs: 'EVERYONE', 
          showActiveStatus: true,
          searchVisibility: true,
          dataUsage: true,
          defaultPostPrivacy: 'PUBLIC'
      },
      accessibility: { textSize: 'MEDIUM', reducedMotion: false, highContrast: false },
      language: 'English (US)'
  };

  const [settings, setSettings] = useState<UserSettings>(user.settings || defaultSettings);
  
  // Draft States for editing
  const [privacyDraft, setPrivacyDraft] = useState(settings.privacy);
  const [accessibilityDraft, setAccessibilityDraft] = useState(settings.accessibility);
  const [notificationsDraft, setNotificationsDraft] = useState(settings.notifications);
  const [languageDraft, setLanguageDraft] = useState(settings.language);

  // Report Form State
  const [reportForm, setReportForm] = useState({ 
    category: 'BUG', 
    description: '',
    urgency: 'LOW',
    email: user.email,
    reference: ''
  });
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
      if (user.settings) {
          setSettings(user.settings);
          setPrivacyDraft(user.settings.privacy || defaultSettings.privacy);
          setAccessibilityDraft(user.settings.accessibility || defaultSettings.accessibility);
          setNotificationsDraft(user.settings.notifications || defaultSettings.notifications);
          setLanguageDraft(user.settings.language || defaultSettings.language);
      }
  }, [user]);

  const handleOpenPanel = (panel: SettingsPanel) => {
      // Reset drafts when opening
      if (panel === 'PRIVACY') setPrivacyDraft(settings.privacy);
      if (panel === 'ACCESSIBILITY') setAccessibilityDraft(settings.accessibility);
      if (panel === 'NOTIFICATIONS') setNotificationsDraft(settings.notifications);
      if (panel === 'LANGUAGE') setLanguageDraft(settings.language);
      if (panel === 'REPORT') {
          setReportForm({ 
            category: 'BUG', 
            description: '',
            urgency: 'LOW',
            email: user.email,
            reference: '' 
          });
          setReportSubmitted(false);
      }
      setActivePanel(panel);
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
      setSettings(newSettings);
      const updatedUser = { ...user, settings: newSettings };
      storageService.saveUser(updatedUser);
      storageService.setCurrentUser(updatedUser);
      onUpdate();
  };

  const savePrivacyChanges = () => {
      const newSettings = { ...settings, privacy: privacyDraft };
      handleUpdateSettings(newSettings);
      setActivePanel(null); 
  };

  const saveAccessibilityChanges = () => {
      const newSettings = { ...settings, accessibility: accessibilityDraft };
      handleUpdateSettings(newSettings);
      setActivePanel(null);
  };

  const saveNotificationChanges = () => {
      const newSettings = { ...settings, notifications: notificationsDraft };
      handleUpdateSettings(newSettings);
      setActivePanel(null);
  };

  const saveLanguageChanges = () => {
      const newSettings = { ...settings, language: languageDraft };
      handleUpdateSettings(newSettings);
      setActivePanel(null);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate API call and success
      setTimeout(() => {
        setReportSubmitted(true);
        setTimeout(() => {
            setReportSubmitted(false);
            setActivePanel(null);
        }, 2000);
      }, 800);
  };

  const renderMainView = () => {
    const sections = [
        {
        title: 'Settings',
        icon: Settings,
        items: [
            { id: 'NOTIFICATIONS', icon: Bell, label: 'Notifications', desc: 'Push, Email, In-app', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { id: 'PRIVACY', icon: Lock, label: 'Privacy', desc: 'Visibility, DMs, Data', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { id: 'ACCESSIBILITY', icon: Accessibility, label: 'Accessibility', desc: 'Display, Text size, Motion', color: 'text-green-500', bg: 'bg-green-500/10' },
            { id: 'LANGUAGE', icon: Globe, label: 'Language', desc: settings.language, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ]
        },
        {
        title: 'Support',
        icon: LifeBuoy,
        items: [
            { id: 'HELP', icon: HelpCircle, label: 'Help Center', desc: 'FAQ and troubleshooting', color: 'text-slate-400', bg: 'bg-slate-800' },
            { id: 'REPORT', icon: AlertTriangle, label: 'Report a Problem', desc: 'Flag issues or bugs', color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { id: 'CONTACT', icon: Mail, label: 'Contact Us', desc: 'Get in touch with support', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        ]
        },
        {
        title: 'About',
        icon: Info,
        items: [
            { id: 'ABOUT', icon: Info, label: 'About AOT Connect', desc: 'Learn more about the platform', color: 'text-slate-400', bg: 'bg-slate-800' },
            { id: null, icon: Shield, label: 'Version Info', desc: 'v1.0.0 (Build 2024.11)', color: 'text-slate-400', bg: 'bg-slate-800' },
            { id: 'POLICY', icon: FileText, label: 'Privacy Policy', desc: 'Read our data policy', color: 'text-slate-400', bg: 'bg-slate-800' },
            { id: 'TERMS', icon: FileText, label: 'Terms of Service', desc: 'User agreements', color: 'text-slate-400', bg: 'bg-slate-800' },
        ]
        }
    ];

    return (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {sections.map((section) => (
                <div key={section.title} className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <section.icon className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold text-white">{section.title}</h2>
                    </div>
                    
                    <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                        {section.items.map((item, idx) => (
                        <button 
                            key={item.label}
                            onClick={() => item.id ? handleOpenPanel(item.id as SettingsPanel) : null}
                            className={`w-full flex items-center justify-between px-6 py-5 transition-all text-left group ${idx !== section.items.length - 1 ? 'border-b border-slate-800' : ''} ${item.id ? 'hover:bg-slate-800 cursor-pointer' : 'cursor-default'}`}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg} ${item.color} border border-transparent ${item.id ? 'group-hover:border-slate-700' : ''} transition-colors`}>
                                <item.icon size={24} />
                                </div>
                                <div>
                                <p className={`font-bold text-base mb-1 transition-colors ${item.id ? 'text-white group-hover:text-blue-400' : 'text-slate-300'}`}>{item.label}</p>
                                {item.desc && <p className="text-sm text-slate-500">{item.desc}</p>}
                                </div>
                            </div>
                            {item.id && <ChevronRight size={20} className="text-slate-600 group-hover:text-white transition-colors" />}
                        </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Account / Logout */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <UserCog className="text-blue-500" size={20} />
                    <h2 className="text-lg font-bold text-white">Account</h2>
                </div>
                <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-between px-6 py-5 hover:bg-red-900/10 transition-colors text-left group"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-red-900/20 flex items-center justify-center text-red-500 group-hover:bg-red-900/30 transition-colors border border-red-900/20 flex-shrink-0">
                                <LogOut size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-red-500 text-base mb-1">Log Out</p>
                                <p className="text-sm text-red-400/60">Sign out of {user.email}</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="text-center pt-8 text-xs text-slate-600 space-y-2 pb-8">
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                    <Shield size={14} />
                </div>
                <p className="font-semibold">AOT Connect for Web</p>
                <p>© 2024 Academy of Technology. All rights reserved.</p>
            </div>
        </div>
    );
  };

  const renderHelpPanel = () => (
      <div className="space-y-6 animate-in slide-in-from-right duration-200">
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <SectionHeader title="Frequently Asked Questions" icon={HelpCircle} />
              <div className="space-y-4 mt-4">
                  {[
                      { q: "How do I change my department?", a: "Your department is assigned during registration. Please contact admin to request a change." },
                      { q: "Is anonymous posting truly anonymous?", a: "Yes, your identity is hidden from other students in public posts, but admins can see it for moderation." },
                      { q: "How can I create a new club?", a: "Go to the Communities tab and look for the 'Create Community' option (Admins only currently)." },
                      { q: "Can I delete my account?", a: "Currently, you must contact support to permanently delete your account data." }
                  ].map((faq, i) => (
                      <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                          <h4 className="font-bold text-white text-sm mb-2">{faq.q}</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                      </div>
                  ))}
              </div>
          </div>
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 flex items-center justify-between">
              <div>
                  <h3 className="font-bold text-white">Still need help?</h3>
                  <p className="text-sm text-slate-400">Our support team is available 24/7.</p>
              </div>
              <button onClick={() => setActivePanel('CONTACT')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-500">Contact Us</button>
          </div>
      </div>
  );

  const renderReportPanel = () => {
    if (reportSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-2xl border border-slate-800 animate-in zoom-in-95 mt-10">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 ring-1 ring-green-500/50 shadow-lg shadow-green-500/20">
                    <Check size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Report Received</h2>
                <p className="text-slate-400 text-center max-w-sm">
                    Thank you for your feedback. Our team will review your report shortly.
                </p>
            </div>
        );
    }

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-200 pb-20">
           <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
               <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-1">Report a Problem</h2>
                  <p className="text-sm text-slate-400">Found a bug, inappropriate content, or have a suggestion? Let us know.</p>
               </div>
               
               <form onSubmit={handleReportSubmit} className="space-y-6">
                   {/* Categories */}
                   <div>
                       <label className="block text-sm font-bold text-slate-300 mb-3">What are you reporting?</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {[
                               { id: 'BUG', label: 'Bug Report', icon: Bug, desc: 'Something is broken' },
                               { id: 'SPAM', label: 'Spam or Abuse', icon: ShieldAlert, desc: 'Harassment or spam' },
                               { id: 'FEATURE', label: 'Feature Request', icon: Sparkles, desc: 'Suggest a new idea' },
                               { id: 'OTHER', label: 'Other', icon: HelpCircle, desc: 'General feedback' }
                           ].map(cat => (
                               <button
                                type="button"
                                key={cat.id}
                                onClick={() => setReportForm({...reportForm, category: cat.id})}
                                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                                    reportForm.category === cat.id
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-900'
                                }`}
                               >
                                   <cat.icon size={20} className={reportForm.category === cat.id ? 'text-white' : 'text-slate-500'} />
                                   <div>
                                       <p className={`font-bold text-sm ${reportForm.category === cat.id ? 'text-white' : 'text-slate-200'}`}>{cat.label}</p>
                                       <p className={`text-xs ${reportForm.category === cat.id ? 'text-blue-100' : 'text-slate-500'}`}>{cat.desc}</p>
                                   </div>
                               </button>
                           ))}
                       </div>
                   </div>

                   {/* Urgency */}
                   <div>
                      <label className="block text-sm font-bold text-slate-300 mb-3">Urgency Level</label>
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                          {['LOW', 'MEDIUM', 'HIGH'].map(level => (
                              <button
                                  type="button"
                                  key={level}
                                  onClick={() => setReportForm({...reportForm, urgency: level})}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                      reportForm.urgency === level
                                      ? (level === 'HIGH' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 
                                         level === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/50' :
                                         'bg-green-500/20 text-green-400 ring-1 ring-green-500/50')
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                              >
                                  {level}
                              </button>
                          ))}
                      </div>
                   </div>

                   {/* Reference & Email */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Impacted Page / Feature</label>
                          <div className="relative">
                              <MapPin className="absolute left-3 top-3 text-slate-500" size={16} />
                              <input 
                                  type="text"
                                  value={reportForm.reference}
                                  onChange={e => setReportForm({...reportForm, reference: e.target.value})}
                                  placeholder="e.g., Profile Page, Messages"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                              />
                          </div>
                      </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contact Email (Optional)</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
                              <input 
                                  type="email"
                                  value={reportForm.email}
                                  onChange={e => setReportForm({...reportForm, email: e.target.value})}
                                  placeholder="For follow-up questions"
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                              />
                          </div>
                      </div>
                   </div>
                   
                   {/* Description */}
                   <div>
                       <label className="block text-sm font-bold text-slate-300 mb-3">Description</label>
                       <textarea
                            required
                            value={reportForm.description}
                            onChange={e => setReportForm({...reportForm, description: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none min-h-[150px] resize-y"
                            placeholder="Please describe the issue in detail. Steps to reproduce are very helpful."
                       />
                   </div>
               </form>
           </div>
           
           {/* Footer Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-end gap-3 z-10 md:absolute md:rounded-b-2xl">
              <button 
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                  Cancel
              </button>
              <button 
                  onClick={handleReportSubmit}
                  disabled={!reportForm.description}
                  className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Submit Report <ChevronRight size={16} />
              </button>
          </div>
      </div>
    );
  };

  const renderContactPanel = () => (
      <div className="space-y-6 animate-in slide-in-from-right duration-200">
           <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
               <SectionHeader title="Get in Touch" icon={Mail} />
               <div className="mt-4 space-y-2">
                   <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-500">
                           <Mail size={20} />
                       </div>
                       <div>
                           <p className="font-bold text-white text-sm">General Support</p>
                           <a href="mailto:support@aot.edu.in" className="text-sm text-blue-400 hover:underline">support@aot.edu.in</a>
                       </div>
                   </div>
                   <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-purple-900/20 flex items-center justify-center text-purple-500">
                           <Shield size={20} />
                       </div>
                       <div>
                           <p className="font-bold text-white text-sm">Admin Office</p>
                           <p className="text-sm text-slate-400">Main Building, Ground Floor</p>
                       </div>
                   </div>
               </div>
           </div>
      </div>
  );

  const renderAboutPanel = () => (
      <div className="space-y-6 animate-in slide-in-from-right duration-200 text-center">
           <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8 flex flex-col items-center">
               <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-6">
                   <Shield size={40} className="text-white" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">AOT Connect</h2>
               <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                   The exclusive social platform for students of Academy of Technology. Connect, share, and grow together.
               </p>
               
               <div className="grid grid-cols-2 gap-4 w-full max-w-sm text-left">
                   <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                       <Code size={20} className="text-blue-500 mb-2" />
                       <p className="text-xs text-slate-500 uppercase font-bold">Version</p>
                       <p className="text-white font-bold">1.0.0 Beta</p>
                   </div>
                   <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                       <Heart size={20} className="text-pink-500 mb-2" />
                       <p className="text-xs text-slate-500 uppercase font-bold">Made with Love</p>
                       <p className="text-white font-bold">AOT Dev Team</p>
                   </div>
               </div>
           </div>
           
           <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 text-left">
               <SectionHeader title="Credits" icon={Server} />
               <p className="text-sm text-slate-400 leading-relaxed">
                   Developed by the final year students of CSE Department as a capstone project. Special thanks to our faculty mentors.
               </p>
           </div>
      </div>
  );

  const renderPolicyPanel = () => (
      <div className="space-y-6 animate-in slide-in-from-right duration-200">
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Privacy Policy</h2>
              <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                  <p>Last Updated: November 2024</p>
                  <p>
                      At AOT Connect, we take your privacy seriously. This policy describes how we collect, use, and handle your information.
                  </p>
                  
                  <h3 className="text-lg font-bold text-white pt-2">1. Information We Collect</h3>
                  <p>
                      We collect information you provide directly to us, such as your name, college email, department, year, and any content you post.
                  </p>

                  <h3 className="text-lg font-bold text-white pt-2">2. How We Use Information</h3>
                  <p>
                      We use this information to operate, maintain, and improve the platform. We verify your status as a student using your college email.
                  </p>

                  <h3 className="text-lg font-bold text-white pt-2">3. Data Sharing</h3>
                  <p>
                      We do not share your personal data with third parties. Your posts are visible to other students based on your privacy settings.
                  </p>
              </div>
          </div>
      </div>
  );

  const renderTermsPanel = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-200">
        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Terms of Service</h2>
            <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
                <p>
                    By accessing AOT Connect, you agree to be bound by these Terms of Service and our Community Guidelines.
                </p>
                
                <h3 className="text-lg font-bold text-white pt-2">1. Student Only Access</h3>
                <p>
                    You must be a current student or faculty member of Academy of Technology to use this platform. Misrepresentation is grounds for account termination.
                </p>

                <h3 className="text-lg font-bold text-white pt-2">2. Acceptable Use</h3>
                <p>
                    You agree not to post content that is harassing, abusive, or violates college policies. We reserve the right to remove content and ban users.
                </p>

                <h3 className="text-lg font-bold text-white pt-2">3. Liability</h3>
                <p>
                    AOT Connect is provided "as is". We are not liable for any damages arising from your use of the platform.
                </p>
            </div>
        </div>
    </div>
);

  const renderNotificationsPanel = () => (
      <div className="space-y-8 animate-in slide-in-from-right duration-200 pb-20">
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <SectionHeader title="Delivery Methods" icon={Bell} />
              <div className="divide-y divide-slate-800">
                <Toggle 
                    label="Push Notifications" 
                    desc="Receive real-time alerts on your device"
                    checked={notificationsDraft.push}
                    onChange={(v) => setNotificationsDraft({...notificationsDraft, push: v})}
                />
                <Toggle 
                    label="Email Notifications" 
                    desc="Receive digest emails for important updates"
                    checked={notificationsDraft.email}
                    onChange={(v) => setNotificationsDraft({...notificationsDraft, email: v})}
                />
                <Toggle 
                    label="In-App Notifications" 
                    desc="Show badge and alerts within the app header"
                    checked={notificationsDraft.inApp}
                    onChange={(v) => setNotificationsDraft({...notificationsDraft, inApp: v})}
                />
              </div>
          </div>
          
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <SectionHeader title="Activity" icon={Settings} />
               <div className="divide-y divide-slate-800">
                  <Toggle 
                    label="Likes & Comments" 
                    desc="Notify when someone engages with your posts"
                    checked={notificationsDraft.likesComments ?? true} 
                    onChange={(v) => setNotificationsDraft({...notificationsDraft, likesComments: v})} 
                  />
                  <Toggle 
                    label="New Followers" 
                    desc="Notify when someone starts following you"
                    checked={notificationsDraft.newFollowers ?? true} 
                    onChange={(v) => setNotificationsDraft({...notificationsDraft, newFollowers: v})} 
                  />
                  <Toggle 
                    label="Mentions" 
                    desc="Notify when you are mentioned in a post or comment"
                    checked={notificationsDraft.mentions ?? true} 
                    onChange={(v) => setNotificationsDraft({...notificationsDraft, mentions: v})} 
                  />
                  <Toggle 
                    label="Community Updates" 
                    desc="Important announcements from your joined communities"
                    checked={notificationsDraft.communityUpdates ?? true} 
                    onChange={(v) => setNotificationsDraft({...notificationsDraft, communityUpdates: v})} 
                  />
               </div>
          </div>

          {/* Footer Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-end gap-3 z-10 md:absolute md:rounded-b-2xl">
              <button 
                  onClick={() => setActivePanel(null)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                  Cancel
              </button>
              <button 
                  onClick={saveNotificationChanges}
                  className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
              >
                  <Check size={18} /> Save Changes
              </button>
          </div>
      </div>
  );

  const renderPrivacyPanel = () => (
      <div className="space-y-8 animate-in slide-in-from-right duration-200 pb-20">
          {/* Profile Visibility */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <SectionHeader title="Profile Visibility" icon={Eye} />
              <div className="space-y-3 mt-4">
                  <p className="text-sm text-slate-400 mb-2 px-1">Choose who can see your full profile details and posts.</p>
                  <RadioOption 
                    label="Everyone (Public)" 
                    desc="Anyone on AOT Connect can see your profile"
                    selected={privacyDraft.profileVisibility === 'PUBLIC'}
                    onClick={() => setPrivacyDraft({...privacyDraft, profileVisibility: 'PUBLIC'})}
                  />
                  <RadioOption 
                    label="Followers Only" 
                    desc="Only users who follow you can see your profile"
                    selected={privacyDraft.profileVisibility === 'FOLLOWERS'}
                    onClick={() => setPrivacyDraft({...privacyDraft, profileVisibility: 'FOLLOWERS'})}
                  />
                  <RadioOption 
                    label="Private" 
                    desc="Your profile is hidden from search and suggestions"
                    selected={privacyDraft.profileVisibility === 'PRIVATE'}
                    onClick={() => setPrivacyDraft({...privacyDraft, profileVisibility: 'PRIVATE'})}
                  />
              </div>
          </div>

          {/* Interactions */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <SectionHeader title="Interactions" icon={MessageSquare} />
              <div className="mt-4 space-y-6">
                 <div>
                    <Toggle 
                        label="Show Active Status" 
                        desc="Allow others to see when you are online"
                        checked={privacyDraft.showActiveStatus}
                        onChange={(v) => setPrivacyDraft({...privacyDraft, showActiveStatus: v})}
                    />
                 </div>
                 
                 <div className="pt-4 border-t border-slate-800">
                     <p className="font-bold text-white text-sm mb-3">Who can send you messages?</p>
                     <RadioOption 
                        label="Everyone" 
                        selected={privacyDraft.allowDMs === 'EVERYONE'}
                        onClick={() => setPrivacyDraft({...privacyDraft, allowDMs: 'EVERYONE'})}
                     />
                     <RadioOption 
                        label="Followers Only" 
                        selected={privacyDraft.allowDMs === 'FOLLOWERS'}
                        onClick={() => setPrivacyDraft({...privacyDraft, allowDMs: 'FOLLOWERS'})}
                     />
                      <RadioOption 
                        label="No One" 
                        selected={privacyDraft.allowDMs === 'NONE'}
                        onClick={() => setPrivacyDraft({...privacyDraft, allowDMs: 'NONE'})}
                     />
                 </div>
              </div>
          </div>

          {/* Data & Permissions */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <SectionHeader title="Data & Permissions" icon={Database} />
              <div className="divide-y divide-slate-800">
                  <Toggle 
                    label="Include in Search"
                    desc="Allow your profile to appear in search results"
                    checked={privacyDraft.searchVisibility ?? true}
                    onChange={(v) => setPrivacyDraft({...privacyDraft, searchVisibility: v})}
                  />
                  <Toggle 
                    label="Personalized Data"
                    desc="Use my activity to improve recommendations"
                    checked={privacyDraft.dataUsage ?? true}
                    onChange={(v) => setPrivacyDraft({...privacyDraft, dataUsage: v})}
                  />
                  <div className="py-4">
                      <p className="font-bold text-white text-sm mb-2">Default Post Privacy</p>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setPrivacyDraft({...privacyDraft, defaultPostPrivacy: 'PUBLIC'})}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border ${privacyDraft.defaultPostPrivacy === 'PUBLIC' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-950 text-slate-400 border-slate-700'}`}
                          >
                              Public
                          </button>
                          <button 
                            onClick={() => setPrivacyDraft({...privacyDraft, defaultPostPrivacy: 'COMMUNITY'})}
                            className={`px-4 py-2 rounded-lg text-sm font-bold border ${privacyDraft.defaultPostPrivacy === 'COMMUNITY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-950 text-slate-400 border-slate-700'}`}
                          >
                              Community Only
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          {/* Footer Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-end gap-3 z-10 md:absolute md:rounded-b-2xl">
              <button 
                  onClick={() => setActivePanel(null)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                  Cancel
              </button>
              <button 
                  onClick={savePrivacyChanges}
                  className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
              >
                  <Check size={18} /> Save Changes
              </button>
          </div>
      </div>
  );

  const renderAccessibilityPanel = () => (
      <div className="space-y-8 animate-in slide-in-from-right duration-200 pb-20">
           <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <SectionHeader title="Display Preferences" icon={Type} />
              
              <div className="space-y-4 mt-4">
                  <p className="font-bold text-white text-sm">Text Size</p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                      <p className={`text-slate-300 mb-4 transition-all ${
                          accessibilityDraft.textSize === 'SMALL' ? 'text-sm' : 
                          accessibilityDraft.textSize === 'LARGE' ? 'text-lg' : 'text-base'
                      }`}>
                          The quick brown fox jumps over the lazy dog.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                         {(['SMALL', 'MEDIUM', 'LARGE'] as const).map(size => (
                             <button
                                key={size}
                                onClick={() => setAccessibilityDraft({...accessibilityDraft, textSize: size})}
                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                    accessibilityDraft.textSize === size 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                                }`}
                             >
                                 {size}
                             </button>
                         ))}
                      </div>
                  </div>
              </div>

              <div className="divide-y divide-slate-800 border-t border-slate-800 pt-2">
                <Toggle 
                    label="High Contrast" 
                    desc="Increase contrast for better legibility"
                    checked={accessibilityDraft.highContrast}
                    onChange={(v) => setAccessibilityDraft({...accessibilityDraft, highContrast: v})}
                />
                <Toggle 
                    label="Reduced Motion" 
                    desc="Minimize animations across the app"
                    checked={accessibilityDraft.reducedMotion}
                    onChange={(v) => setAccessibilityDraft({...accessibilityDraft, reducedMotion: v})}
                />
              </div>
          </div>

          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
             <SectionHeader title="Color Mode" icon={Zap} />
             <div className="mt-4">
                 <RadioOption 
                    label="Dark Mode"
                    desc="Default theme for AOT Connect"
                    selected={true}
                    onClick={() => {}}
                 />
                 <div className="opacity-50 pointer-events-none">
                    <RadioOption 
                        label="Light Mode"
                        desc="Coming soon"
                        selected={false}
                        onClick={() => {}}
                    />
                 </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-end gap-3 z-10 md:absolute md:rounded-b-2xl">
              <button 
                  onClick={() => setActivePanel(null)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                  Cancel
              </button>
              <button 
                  onClick={saveAccessibilityChanges}
                  className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
              >
                  <Check size={18} /> Save Changes
              </button>
          </div>
      </div>
  );

  const renderLanguagePanel = () => {
      const languages = ['English (US)', 'Hindi', 'Bengali'];
      return (
        <div className="space-y-8 animate-in slide-in-from-right duration-200 pb-20">
             <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
                <SectionHeader title="Select Language" icon={Globe} />
                <div className="mt-4 space-y-2">
                    {languages.map(lang => (
                        <RadioOption 
                            key={lang}
                            label={lang}
                            selected={languageDraft === lang}
                            onClick={() => setLanguageDraft(lang)}
                        />
                    ))}
                </div>
             </div>

             {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-end gap-3 z-10 md:absolute md:rounded-b-2xl">
                <button 
                    onClick={() => setActivePanel(null)}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={saveLanguageChanges}
                    className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                >
                    <Check size={18} /> Save Changes
                </button>
            </div>
        </div>
      );
  };

  const getPanelTitle = () => {
      if (!activePanel) return 'More';
      switch(activePanel) {
          case 'HELP': return 'Help Center';
          case 'REPORT': return 'Report a Problem';
          case 'CONTACT': return 'Contact Us';
          case 'ABOUT': return 'About';
          case 'POLICY': return 'Privacy Policy';
          case 'TERMS': return 'Terms of Service';
          default: return activePanel.toLowerCase() + ' Settings';
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 md:px-8 md:py-8 relative">
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        
        {/* Header */}
        <div className="flex flex-col gap-1 mb-2">
            {activePanel ? (
                 <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setActivePanel(null)}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                     >
                         <ArrowLeft size={24} />
                     </button>
                     <h1 className="text-2xl font-bold text-white capitalize">
                         {getPanelTitle()}
                     </h1>
                 </div>
            ) : (
                <>
                    <h1 className="text-2xl font-bold text-white">More</h1>
                    <p className="text-slate-400 text-sm">Settings, support, and account management.</p>
                </>
            )}
        </div>

        {/* Content */}
        {activePanel === null && renderMainView()}
        {activePanel === 'NOTIFICATIONS' && renderNotificationsPanel()}
        {activePanel === 'PRIVACY' && renderPrivacyPanel()}
        {activePanel === 'ACCESSIBILITY' && renderAccessibilityPanel()}
        {activePanel === 'LANGUAGE' && renderLanguagePanel()}
        
        {/* Support Panels */}
        {activePanel === 'HELP' && renderHelpPanel()}
        {activePanel === 'REPORT' && renderReportPanel()}
        {activePanel === 'CONTACT' && renderContactPanel()}
        
        {/* Info Panels */}
        {activePanel === 'ABOUT' && renderAboutPanel()}
        {activePanel === 'POLICY' && renderPolicyPanel()}
        {activePanel === 'TERMS' && renderTermsPanel()}

      </div>
    </div>
  );
}