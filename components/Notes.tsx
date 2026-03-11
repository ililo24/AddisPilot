import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, BookOpen, AlertCircle } from 'lucide-react';
import { Language, User } from '../types';
import { TRANSLATIONS } from '../translations';

interface NotesProps {
    language: Language;
    user: User | null;
}

interface Note {
    id: string;
    name: string;
    subject: string;
    timestamp: number;
}

const SUBJECTS = ['Physics', 'Chemistry', 'Math', 'Biology', 'English'];

export const Notes: React.FC<NotesProps> = ({ language, user }) => {
    const t = (key: string) => TRANSLATIONS[language][key] || key;
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedSubject) {
            setIsUploading(true);
            const file = e.target.files[0];

            // Simulate upload delay
            setTimeout(() => {
                const newNote: Note = {
                    id: Date.now().toString(),
                    name: file.name,
                    subject: selectedSubject,
                    timestamp: Date.now(),
                };
                setNotes(prev => [newNote, ...prev]);
                setIsUploading(false);
            }, 1000);
        }
    };

    return (
        <div className="bg-slate-900 p-8 h-full flex flex-col overflow-y-auto text-slate-100">
            <div className="max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2">My Notebook</h2>
                    <p className="text-slate-400">Organize your scans and summaries by subject for a better learning experience.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Action Column */}
                    <div className="space-y-8">
                        <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={16} className="text-indigo-400" />
                                Step 1: Pick a Subject
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {SUBJECTS.map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => setSelectedSubject(subject)}
                                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${selectedSubject === subject
                                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                                                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Conditional Upload Box */}
                        <div className={`transition-all duration-500 transform ${selectedSubject ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4 pointer-events-none'}`}>
                            <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-900/30 text-white relative overflow-hidden group">
                                <div className="relative z-10 text-center">
                                    <h3 className="text-2xl font-black mb-2 flex items-center justify-center gap-2">
                                        <Upload size={24} />
                                        Step 2: Upload for {selectedSubject}
                                    </h3>
                                    <p className="text-indigo-100 text-sm mb-6 opacity-90">Store your notebook scans or summaries digitally.</p>

                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-400 rounded-2xl p-10 hover:bg-indigo-700 transition-colors cursor-pointer group bg-indigo-700/50">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                                                <span className="text-sm font-bold">Uploading to Cloud...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <FileText className="mb-3 text-indigo-200 group-hover:scale-110 transition-transform" size={48} />
                                                <span className="font-black text-lg">Pick File</span>
                                                <span className="text-xs opacity-70 mt-1">PDF or Images accepted</span>
                                                <input type="file" className="hidden" onChange={handleFileUpload} />
                                            </>
                                        )}
                                    </label>
                                </div>

                                {/* Decoration */}
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                            </div>
                        </div>

                        {!selectedSubject && (
                            <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30 text-slate-500 italic text-sm">
                                <AlertCircle size={18} />
                                Please select a subject to enable uploading.
                            </div>
                        )}
                    </div>

                    {/* List Column */}
                    <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8 backdrop-blur-sm flex flex-col h-[500px]">
                        <h3 className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-widest">Recently Uploaded</h3>
                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {notes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center px-10">
                                    <FileText size={64} className="opacity-10 mb-6" />
                                    <p className="text-slate-500 font-medium">Your digital notebook is empty.</p>
                                    <p className="text-xs text-slate-600 mt-2">Start scanning your notes to keep them safe and accessible.</p>
                                </div>
                            ) : (
                                notes.map(note => (
                                    <div key={note.id} className="flex items-center gap-5 bg-slate-900/50 p-5 rounded-2xl border border-slate-700/30 hover:border-indigo-500/30 transition-all group animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="p-4 bg-slate-800 rounded-xl group-hover:bg-indigo-600/20 transition-colors shadow-inner">
                                            <FileText size={24} className="text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-base truncate">{note.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{note.subject}</span>
                                                <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter opacity-70">Saved Offline</span>
                                            </div>
                                        </div>
                                        <CheckCircle2 size={20} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
