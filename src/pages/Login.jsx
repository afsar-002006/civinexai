import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { ShieldAlert, LogIn, AlertCircle, Loader2, CheckCircle2, UserPlus } from 'lucide-react';

export default function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotRegistered, setEmailNotRegistered] = useState(false);

  const { login, currentUser, userProfile, isEmailRegistered, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailNotRegistered(false);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password, location.state?.name);
      
      const role = userProfile?.role || (email.toLowerCase().includes('authority') || email.toLowerCase().includes('officer') ? 'Authority' : 'Citizen');
      if (role === 'Authority') {
        navigate('/authority-dashboard');
      } else {
        navigate('/citizen-dashboard');
      }
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        if (isEmailRegistered && !isEmailRegistered(email)) {
          setEmailNotRegistered(true);
          setError('');
        } else {
          setError('Invalid email or password. Please check your credentials.');
        }
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-xs text-slate-400">Sign in to access your CiviNex workspace</p>
          </div>

          {currentUser && (
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>Currently Signed In</span>
              </div>
              <p className="text-[11px] text-slate-300">
                You are currently signed in as <strong className="text-white">{userProfile?.name && !userProfile.name.includes('@') ? userProfile.name : (currentUser.displayName || 'Afsar')}</strong>.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/citizen-dashboard')}
                  className="flex-1 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="py-2 px-3 glass-panel border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {emailNotRegistered && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2.5 shadow-lg">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Account Not Found</span>
              </div>
              <p className="text-[11px] text-slate-300">
                No account found for this email. Would you like to create one now?
              </p>
              <button
                type="button"
                onClick={() => navigate('/register', { state: { email } })}
                className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New Account</span>
              </button>
            </div>
          )}

          {error && !emailNotRegistered && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailNotRegistered(false);
                }}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/60">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-cyan-400 hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
