import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { UserPlus, LogIn, Loader2, AlertCircle, FileText, Phone, MapPin, MessageCircle } from 'lucide-react';

interface SignupProps {
    onSwitchToLogin: () => void;
}

const ETHIOPIAN_REGIONS = [
    'Addis Ababa',
    'Dire Dawa',
    'Afar',
    'Amhara',
    'Benishangul-Gumuz',
    'Gambella',
    'Harari',
    'Oromia',
    'Sidama',
    'Somali',
    'South Ethiopia',
    'South West Ethiopia',
    'Tigray',
];

const REFERRAL_SOURCES = [
    'Social Media (Facebook, Telegram, etc.)',
    'Word of Mouth / Friend',
    'School / Teacher',
    'Online Advertisement',
    'Radio or TV',
    'Flyer or Poster',
    'Other',
];

const inputClass =
    'w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm';
const selectClass =
    'w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none cursor-pointer';
const labelClass = 'text-xs font-medium text-slate-400 ml-1 flex items-center gap-1.5';

export const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
    const { signup, isLoading, error } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [region, setRegion] = useState('');
    const [referral, setReferral] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        try {
            await signup(name, email, password);
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
                    <p className="text-slate-400 mt-2">Join us today to start learning.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {(error || localError) && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                            <AlertCircle size={18} />
                            <span>{error || localError}</span>
                        </div>
                    )}

                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className={labelClass}>Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Taye Belay"
                            className={inputClass}
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className={labelClass}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@example.com"
                            className={inputClass}
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className={labelClass}>
                            <Phone size={12} />
                            Phone Number
                        </label>
                        <div className="flex gap-2">
                            <span className="flex items-center px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 text-sm font-mono select-none">
                                🇪🇹 +251
                            </span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="9X XXX XXXX"
                                pattern="[0-9\s\-]{7,12}"
                                className={`${inputClass} flex-1`}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className={labelClass}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={inputClass}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label className={labelClass}>Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className={inputClass}
                        />
                    </div>

                    {/* Region */}
                    <div className="space-y-1">
                        <label className={labelClass}>
                            <MapPin size={12} />
                            Region
                        </label>
                        <div className="relative">
                            <select
                                required
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className={selectClass}
                            >
                                <option value="" disabled>Select your region…</option>
                                {ETHIOPIAN_REGIONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* How did you hear about us */}
                    <div className="space-y-1">
                        <label className={labelClass}>
                            <MessageCircle size={12} />
                            How did you hear about us?
                        </label>
                        <div className="relative">
                            <select
                                value={referral}
                                onChange={(e) => setReferral(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Select an option…</option>
                                {REFERRAL_SOURCES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                        Create Account
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col items-center gap-4">
                    <p className="text-slate-400 text-sm">Already have an account?</p>
                    <button
                        onClick={onSwitchToLogin}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2 transition-colors"
                    >
                        <LogIn size={18} />
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};
