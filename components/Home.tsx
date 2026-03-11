import React from 'react';
import { ArrowRight, BookOpen, Brain, Globe, Sparkles } from 'lucide-react';

interface HomeProps {
    onGetStarted: () => void;
}

export const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
                <div className="mb-8 p-4 bg-indigo-600/20 rounded-3xl border border-indigo-500/30 animate-bounce">
                    <Sparkles className="text-indigo-400" size={48} />
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                    Education for Everyone, Anywhere.
                </h1>

                <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl leading-relaxed">
                    leenjisaa AI is your personalized digital tutor. Access textbooks,
                    generate smart summaries, and master your curriculum with the power
                    of AI—all in one place, even offline.
                </p>

                <button
                    onClick={onGetStarted}
                    className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-900/20 transition-all active:scale-95 flex items-center gap-3"
                >
                    Get Started
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent opacity-50"></div>
                </button>

                {/* Features Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">
                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                            <BookOpen className="text-indigo-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Smart Library</h3>
                        <p className="text-slate-400 text-sm">All Ethiopian Ministry of Education textbooks at your fingertips.</p>
                    </div>

                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                            <Brain className="text-emerald-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">AI Tutor</h3>
                        <p className="text-slate-400 text-sm">Ask questions, get explanations, and generate quizzes in real-time.</p>
                    </div>

                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6">
                            <Globe className="text-amber-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Multi-Lingual</h3>
                        <p className="text-slate-400 text-sm">Learn in English, Amharic, or Oromo with our intelligent bridge.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-8 text-center text-slate-500 text-sm border-t border-slate-800/50">
                <p>© 2026 leenjisaa AI. Empowering Ethiopia's future through knowledge.</p>
            </footer>
        </div>
    );
};
