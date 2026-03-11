import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { LogIn, UserPlus, Loader2, AlertCircle, FileText } from 'lucide-react';

interface LoginProps {
    onSwitchToSignup: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
    const { login, isLoading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err) {
            // Error is handled by context
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 text-slate-100">
            <div className="w-full max-w-md bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 mb-4">
                        <FileText className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">leenjisaa AI</h1>
                    <p className="text-slate-400 mt-2">Welcome back! Please sign in.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@example.com"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                        Sign In
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col items-center gap-4">
                    <p className="text-slate-400 text-sm">Don't have an account?</p>
                    <button
                        onClick={onSwitchToSignup}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2 transition-colors"
                    >
                        <UserPlus size={18} />
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
};
