import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import { loginUser, signUpUser, sendWelcomeEmail } from '../services/mockServices';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, ChevronLeft } from 'lucide-react';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.FACULTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
          const user = await loginUser(email, password);
          onLogin(user);
      } else {
          const newUser = await signUpUser(email, password, {
              firstName,
              lastName: lastName || '',
              role,
              department: role === UserRole.FACULTY ? 'General' : undefined
          });
          await sendWelcomeEmail(newUser);
          onLogin(newUser);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Side - Visual */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Q-Genius</span>
          </div>
          
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            The future of <br />
            <span className="text-brand-400">academic assessment</span> <br />
            is here.
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Join thousands of educators streamlining their workflow with AI-powered question generation.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-2 border-slate-900" alt="User" referrerPolicy="no-referrer" />
            ))}
          </div>
          <p className="text-sm text-slate-400 font-medium">Trusted by 500+ institutions</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-500/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-brand-400/5 blur-3xl rounded-full" />
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">{isLogin ? 'Welcome back' : 'Create an account'}</h1>
            <p className="text-slate-500">
              {isLogin ? "Enter your credentials to access your dashboard" : "Start your journey with AI-powered exams"}
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">First Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="input-field pl-11"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="input-field"
                      placeholder="Doe"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="name@institution.edu"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Select your role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[UserRole.FACULTY, UserRole.ADMIN, UserRole.SUPER_ADMIN].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`text-[10px] font-bold py-2.5 rounded-xl border transition-all ${role === r ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 h-12"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
