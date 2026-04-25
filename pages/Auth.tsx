import React, { useState, useEffect } from "react";
import { storageService } from "../services/storageService";

import { login, register } from "../services/api";
import { User, UserRole, Department, Year } from "../types";
import {
  School,
  ArrowRight,
  AlertCircle,
  Zap,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  BookOpen,
  UserCircle,
  Hash,
  KeyRound,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  
  // User Type State
  const [userType, setUserType] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  
  // Login State
  const [loginId, setLoginId] = useState(''); // Email or Username
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup State
  const [signupStep, setSignupStep] = useState<'DETAILS' | 'VERIFICATION'>('DETAILS');
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: Department.CSE,
    year: Year.FIRST,
    isAnonymous: false
  });
  
  const [signupErrors, setSignupErrors] = useState<{[key: string]: string}>({});
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Dynamic Year Options based on Department
  const getYearOptions = () => {
    const years = Object.values(Year);
    if (formData.department === Department.MCA) {
      return years.filter(y => y !== Year.FOURTH);
    }
    return years;
  };

  const validateSignupDetails = () => {
    const errors: {[key: string]: string} = {};

    // Name
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";

    // Username
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "Only letters, numbers, and underscores";
    }

    // Email
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!formData.email.endsWith('@aot.edu.in') && formData.email !== 'admin@aot.edu.in') {
      errors.email = "Must use college email (@aot.edu.in)";
    }

    // Password
    if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setGlobalError("");

  try {
    const response = await login({
      loginId: loginId.trim(),
      password: loginPassword,
      role: userType,
    });

    // Store logged-in user and token
    storageService.setCurrentUser(response.user, response.token);

    onAuthSuccess();
  } catch (error: any) {
    setGlobalError(error.message || "Invalid credentials. Please try again.");
  }

  setIsLoading(false);
};
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    
    if (!validateSignupDetails()) return;
    
    setIsLoading(true);
    // Simulate sending email
    // await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    
    setIsLoading(false);
    setSignupStep('VERIFICATION');
    
    // SIMULATION ALERT
    setTimeout(() => {
        alert(`[SIMULATION] Email sent to ${formData.email}\nYour verification code is: ${code}`);
    }, 500);
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (inputCode !== verificationCode) {
        setGlobalError('Invalid verification code. Please try again.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        email: formData.email,
        username: formData.username,
        fullName: formData.fullName,
        password: formData.password,
        role: formData.email.startsWith('admin') ? UserRole.ADMIN : UserRole.STUDENT,
        department: formData.department,
        year: formData.year,
        isAnonymous: formData.isAnonymous
      });

      storageService.setCurrentUser(response.user, response.token);
      onAuthSuccess();
    } catch (error: any) {
      setGlobalError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypass = async () => {
    setIsLoading(true);
    setGlobalError('');

    try {
      const response = await login({
        loginId: userType === 'ADMIN' ? "admin@aot.edu.in" : "student@aot.edu.in",
        password: userType === 'ADMIN' ? "admin123" : "password123", 
        role: userType
      });

      storageService.setCurrentUser(response.user, response.token);
      onAuthSuccess();
    } catch (error: any) {
      console.error(error);
      setGlobalError("Demo login failed. Try again.");
    }

    setIsLoading(false);
  };



  // Common styles for inputs
  const inputBaseClasses = "block w-full py-3 rounded-xl bg-slate-950 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm transition-all";
  const defaultBorder = "border-slate-800";
  const errorBorder = "border-red-900 focus:ring-red-700";
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-white">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20 mb-6 transform transition-transform hover:scale-105">
          <School size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {isLogin ? 'Welcome Back' : 'Join AOT Connect'}
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
          {isLogin 
            ? 'Sign in to access your campus feed and communities.' 
            : 'Exclusive social platform for Academy of Technology students.'}
        </p>
      </div>

      <div className={`sm:mx-auto sm:w-full ${isLogin ? 'sm:max-w-md' : 'sm:max-w-xl'}`}>
        <div className="bg-slate-900 py-8 px-6 shadow-xl shadow-slate-950/50 sm:rounded-2xl sm:px-10 border border-slate-800 relative overflow-hidden">
          
          {/* Top Accent Line */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${userType === 'ADMIN' ? 'from-purple-600 to-indigo-600' : 'from-blue-600 to-cyan-500'}`}></div>

          {globalError && (
            <div className="mb-6 rounded-lg bg-red-900/20 p-4 border border-red-900/50 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-400">{globalError}</p>
            </div>
          )}

          {isLogin ? (
            /* --- LOGIN FORM --- */
            <form className="space-y-6" onSubmit={handleLogin}>
              
              {/* User Type Selection */}
              <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex relative">
                  <button
                    type="button"
                    onClick={() => setUserType('STUDENT')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10 ${userType === 'STUDENT' ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                     <GraduationCap size={16} /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('ADMIN')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10 ${userType === 'ADMIN' ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                     <Shield size={16} /> Admin
                  </button>
                  
                  {/* Sliding Background */}
                  <div 
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-800 rounded-lg transition-all duration-300 ease-in-out border border-slate-700 ${userType === 'ADMIN' ? 'translate-x-[calc(100%+6px)]' : 'left-1.5'}`}
                  />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className={`${inputBaseClasses} ${defaultBorder} pl-10 pr-3`}
                    placeholder={userType === 'ADMIN' ? 'admin@aot.edu.in' : 'student@aot.edu.in'}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="block text-sm font-bold text-slate-300">Password</label>
                   <a href="#" className="text-xs font-medium text-blue-500 hover:text-blue-400">Forgot password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    disabled={isLoading}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`${inputBaseClasses} ${defaultBorder} pl-10 pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg ${
                    userType === 'ADMIN' 
                    ? 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 hover:shadow-indigo-900/20' 
                    : 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500 hover:shadow-blue-900/20'
                }`}
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (userType === 'ADMIN' ? 'Admin Login' : 'Sign In')}
              </button>
            </form>
          ) : (
            /* --- SIGNUP FLOW --- */
            <>
              {signupStep === 'DETAILS' ? (
                /* STEP 1: Details Form */
                <form className="space-y-5" onSubmit={handleInitiateSignup}>
                  
                  {/* Name & Username Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserCircle className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                required
                                disabled={isLoading}
                                value={formData.fullName}
                                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                className={`${inputBaseClasses} ${signupErrors.fullName ? errorBorder : defaultBorder} pl-9 pr-3 py-2`}
                                placeholder="John Doe"
                            />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                required
                                disabled={isLoading}
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                                className={`${inputBaseClasses} ${signupErrors.username ? errorBorder : defaultBorder} pl-9 pr-3 py-2`}
                                placeholder="johndoe123"
                            />
                        </div>
                        {signupErrors.username && <p className="mt-1 text-xs text-red-500">{signupErrors.username}</p>}
                     </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">College Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="email"
                        required
                        disabled={isLoading}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={`${inputBaseClasses} ${signupErrors.email ? errorBorder : defaultBorder} pl-9 pr-3 py-2`}
                        placeholder="student@aot.edu.in"
                      />
                    </div>
                    {signupErrors.email && <p className="mt-1 text-xs text-red-500">{signupErrors.email}</p>}
                  </div>

                  {/* Dept & Year Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Department</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <BookOpen className="h-4 w-4 text-slate-500" />
                            </div>
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({...formData, department: e.target.value as Department, year: Year.FIRST})}
                                className={`${inputBaseClasses} ${defaultBorder} pl-9 pr-8 py-2`}
                            >
                                {Object.values(Department).map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                            </select>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Year</label>
                        <select
                            value={formData.year}
                            onChange={(e) => setFormData({...formData, year: e.target.value as Year})}
                            className={`${inputBaseClasses} ${defaultBorder} px-3 py-2`}
                        >
                            {getYearOptions().map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                        </select>
                     </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type={showSignupPassword ? "text" : "password"}
                                required
                                disabled={isLoading}
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className={`${inputBaseClasses} ${signupErrors.password ? errorBorder : defaultBorder} pl-9 pr-10 py-2`}
                            />
                             <button
                                type="button"
                                onClick={() => setShowSignupPassword(!showSignupPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                            >
                                {showSignupPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        {signupErrors.password && <p className="mt-1 text-xs text-red-500">{signupErrors.password}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Confirm</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type={showSignupPassword ? "text" : "password"}
                                required
                                disabled={isLoading}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                className={`${inputBaseClasses} ${signupErrors.confirmPassword ? errorBorder : defaultBorder} pl-9 pr-3 py-2`}
                            />
                        </div>
                        {signupErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{signupErrors.confirmPassword}</p>}
                      </div>
                  </div>

                  {/* Anonymity */}
                  <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div 
                        className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex-shrink-0 ${formData.isAnonymous ? 'bg-blue-600' : 'bg-slate-700'}`}
                        onClick={() => setFormData({...formData, isAnonymous: !formData.isAnonymous})}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.isAnonymous ? 'translate-x-5' : ''}`} />
                      </div>
                      <div className="cursor-pointer" onClick={() => setFormData({...formData, isAnonymous: !formData.isAnonymous})}>
                        <label className="text-sm font-bold text-white cursor-pointer select-none">Keep me anonymous</label>
                        <p className="text-xs text-slate-400 leading-tight">Your name will be hidden in public community posts.</p>
                      </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg mt-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Continue'}
                  </button>
                </form>
              ) : (
                /* STEP 2: Verification */
                <form className="space-y-6" onSubmit={handleVerifyAndRegister}>
                  <div className="text-center">
                    <div className="mx-auto w-14 h-14 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 mb-4 border border-blue-900/50">
                        <Mail size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Verify your email</h3>
                    <p className="text-sm text-slate-400">
                        We sent a 6-digit code to <span className="text-white font-medium block mt-1">{formData.email}</span>
                    </p>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2 text-center">Verification Code</label>
                     <div className="relative max-w-xs mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <KeyRound className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            disabled={isLoading}
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                            className="block w-full py-3 pl-12 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-center text-2xl font-bold tracking-widest"
                            placeholder="000000"
                        />
                     </div>
                     <p className="text-xs text-center text-slate-500 mt-3">
                        Didn't receive it? Check the browser alert (simulation).
                     </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || inputCode.length !== 6}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg"
                  >
                    {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify & Create Account'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setSignupStep('DETAILS')}
                    className="w-full flex justify-center items-center gap-2 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                      <ArrowLeft size={16} /> Back to details
                  </button>
                </form>
              )}
            </>
          )}

          {/* Quick Demo */}
          {isLogin && (
            <div className="mt-6">
              <button
                  type="button"
                  onClick={handleBypass}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 border rounded-xl shadow-sm text-sm font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                      userType === 'ADMIN'
                      ? 'border-indigo-900 text-indigo-400 bg-indigo-900/10 hover:bg-indigo-900/20'
                      : 'border-blue-900 text-blue-400 bg-blue-900/10 hover:bg-blue-900/20'
                  }`}
              >
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap className="h-4 w-4 fill-current" />}
                  {userType === 'ADMIN' ? 'Quick Admin Demo Access' : 'Quick Student Demo Access'}
              </button>
            </div>
          )}

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-slate-900 text-slate-400 font-medium">
                  {isLogin ? 'New to AOT Connect?' : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                   setIsLogin(!isLogin); 
                   setGlobalError('');
                   setSignupErrors({});
                   setSignupStep('DETAILS');
                   setInputCode('');
                   setUserType('STUDENT'); // Reset to student default on switch
                }}
                disabled={isLoading}
                className="text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1 transition-colors"
              >
                {isLogin ? 'Create an account' : 'Sign in to existing account'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}