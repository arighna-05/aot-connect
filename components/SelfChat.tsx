
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, Attachment } from '../types';
import { storageService } from '../services/storageService';
import { 
  ArrowLeft, FileText, ImageIcon, Paperclip, Send, 
  Trash2, X, Bookmark, Cloud 
} from 'lucide-react';

interface SelfChatProps {
  currentUser: User;
  onBack: () => void;
}

export default function SelfChat({ currentUser, onBack }: SelfChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = () => {
    setMessages(storageService.getSelfMessages(currentUser.id));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    storageService.sendSelfMessage(currentUser.id, newMessage, attachments.length > 0 ? attachments : undefined);
    setNewMessage('');
    setAttachments([]);
    loadMessages();
  };

  const handleDelete = (msgId: string) => {
    if (confirm('Delete this note?')) {
        storageService.deleteMessage(msgId);
        loadMessages();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'doc') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          try {
              const base64 = await storageService.fileToBase64(file);
              setAttachments([...attachments, {
                  id: `att-${Date.now()}`,
                  type: type === 'image' ? 'image' : 'doc',
                  url: base64,
                  name: file.name
              }]);
          } catch (err) {
              console.error(err);
          }
      }
      e.target.value = '';
  };

  const removeAttachment = (id: string) => {
      setAttachments(attachments.filter(a => a.id !== id));
  };

  return (
    <div className="flex-1 bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900 flex-shrink-0">
         <button onClick={onBack} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white">
             <ArrowLeft size={20} />
         </button>
         <div className="w-10 h-10 rounded-full bg-indigo-900/20 flex items-center justify-center font-bold text-indigo-400 border border-indigo-900/30">
            <Bookmark size={20} className="fill-current" />
         </div>
         <div>
            <h3 className="font-bold text-lg text-white leading-tight">My Notes</h3>
            <p className="text-sm text-slate-400">Save messages privately</p>
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
          {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                  <Cloud size={48} className="text-slate-600 mb-4" />
                  <p className="text-slate-400">This space is just for you.</p>
                  <p className="text-xs text-slate-500 mt-1">Draft messages, save files, or keep notes here.</p>
              </div>
          )}
          
          {messages.map((msg) => (
              <div key={msg.id} className="flex mb-4 justify-end">
                   <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 shadow-sm flex flex-col bg-indigo-900/20 border border-indigo-900/30 text-indigo-100 rounded-2xl rounded-tr-none group">
                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mb-2 space-y-2">
                                {msg.attachments.map(att => (
                                    <div key={att.id}>
                                        {att.type === 'image' ? (
                                            <img src={att.url} alt="attachment" className="rounded-lg max-h-60 w-auto object-cover border border-white/10" />
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-900/40">
                                                <FileText size={20} />
                                                <span className="text-sm truncate max-w-[150px]">{att.name}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        
                        <div className="flex justify-between items-center mt-1 gap-4">
                            <button onClick={() => handleDelete(msg.id)} className="text-indigo-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <Trash2 size={12} />
                            </button>
                            <p className="text-[10px] font-medium opacity-70 text-indigo-300">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                   </div>
              </div>
          ))}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
          {attachments.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-3 mb-2 px-1">
                  {attachments.map(att => (
                      <div key={att.id} className="relative group flex-shrink-0 bg-slate-800 border border-slate-700 rounded-lg p-2 pr-8 flex items-center gap-2 max-w-[200px]">
                          {att.type === 'image' ? <ImageIcon size={16} className="text-blue-500" /> : <FileText size={16} className="text-blue-500" />}
                          <span className="text-xs truncate text-slate-300 font-medium">{att.name}</span>
                          <button onClick={() => removeAttachment(att.id)} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500 p-1">
                              <X size={14} />
                          </button>
                      </div>
                  ))}
              </div>
          )}

          <form onSubmit={handleSend} className="relative flex items-end gap-3">
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'doc')} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" />
              <input type="file" ref={imageInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'image')} accept="image/*" />
              
              <div className="flex gap-1 mb-1">
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-colors">
                      <ImageIcon size={22} />
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-colors">
                      <Paperclip size={22} />
                  </button>
              </div>
              
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-900 focus-within:border-indigo-700 transition-all flex items-center px-4 py-3">
                  <input 
                      type="text" 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a note to yourself..."
                      className="flex-1 bg-transparent focus:outline-none text-white placeholder-slate-500 text-base"
                  />
              </div>
              
              <button 
                  type="submit" 
                  disabled={!newMessage.trim() && attachments.length === 0} 
                  className="bg-indigo-600 text-white p-3.5 rounded-full hover:bg-indigo-500 shadow-sm transition-all disabled:opacity-50 disabled:scale-95 flex-shrink-0 mb-0.5"
              >
                  <Send size={20} className={newMessage.trim() || attachments.length > 0 ? "ml-0.5" : ""} />
              </button>
          </form>
      </div>
    </div>
  );
}
