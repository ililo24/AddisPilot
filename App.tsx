import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { PDFReader } from './components/PDFReader';
import { Avatar } from './components/Avatar';
import { Dashboard } from './components/Dashboard';
import { generateExplanation, generateQuiz, speakText, getProviderName, translateText, generateSpokenSummary } from './services/aiService';
import { AppMode, ChatMessage, NavigationStep, GradeLevel, Subject, Language, QuizQuestion } from './types';
import { TRANSLATIONS } from './translations';
import {
  Play, Mic, FileText, Upload, School, AlertCircle,
  BookOpen, Calculator, Atom, Dna, Globe, ChevronLeft, Layers, Languages, Check, X,
  Brain, Send, Sparkles, StopCircle, Loader2, WifiOff, LogOut, User as UserIcon, LayoutDashboard
} from 'lucide-react';
import { useAuth } from './services/authContext';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Home } from './components/Home';
import { Notes } from './components/Notes';

// --- INTEGRATION GUIDE ---
// 1. Place your PDF files in the 'public' folder.
// 2. Update the URLs below.
const SAMPLE_PDF_URL = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";
// Updated to use the raw GitHub content URL which supports CORS directly
const PHY_11_URL = "https://raw.githubusercontent.com/mikiasendale/books/main/grade%2011-physics_fetena_net_e906.pdf";

const CURRICULUM: GradeLevel[] = [
  {
    id: '11',
    labelKey: 'grade_11',
    subjects: [
      { id: 'phy11', nameKey: 'physics', iconName: 'Atom', pdfUrl: PHY_11_URL, startPage: 7 },
      { id: 'math11', nameKey: 'math', iconName: 'Calculator', pdfUrl: SAMPLE_PDF_URL },
      { id: 'bio11', nameKey: 'biology', iconName: 'Dna', pdfUrl: SAMPLE_PDF_URL },
      { id: 'chem11', nameKey: 'chemistry', iconName: 'FlaskConical', pdfUrl: SAMPLE_PDF_URL },
      { id: 'eng11', nameKey: 'english', iconName: 'BookOpen', pdfUrl: SAMPLE_PDF_URL },
    ]
  },
  {
    id: '12',
    labelKey: 'grade_12',
    subjects: [
      { id: 'phy12', nameKey: 'physics', iconName: 'Atom', pdfUrl: SAMPLE_PDF_URL },
      { id: 'math12', nameKey: 'math', iconName: 'Calculator', pdfUrl: SAMPLE_PDF_URL },
      { id: 'bio12', nameKey: 'biology', iconName: 'Dna', pdfUrl: SAMPLE_PDF_URL },
      { id: 'chem12', nameKey: 'chemistry', iconName: 'FlaskConical', pdfUrl: SAMPLE_PDF_URL },
      { id: 'eng12', nameKey: 'english', iconName: 'BookOpen', pdfUrl: SAMPLE_PDF_URL },
    ]
  }
];

const IconMap: Record<string, React.FC<any>> = {
  Atom: Atom,
  Calculator: Calculator,
  Dna: Dna,
  BookOpen: BookOpen,
  Globe: Globe,
  FlaskConical: Layers
};

// Validate that a blob is actually a PDF by checking magic bytes
const isValidPdf = async (blob: Blob): Promise<boolean> => {
  if (blob.size < 5000) return false;
  try {
    const header = await blob.slice(0, 5).text();
    return header === '%PDF-';
  } catch {
    return false;
  }
};

// Enhanced Fetcher with Multi-Proxy Fallback and Cache Validation
const fetchPdfWithCache = async (url: string): Promise<Blob> => {
  const CACHE_NAME = 'addis-pilot-textbooks-v1';

  // 1. Try Cache — validate the cached blob before returning
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        if (await isValidPdf(blob)) {
          console.log(`[Cache Hit] Loading ${url} from local cache (${(blob.size / 1024).toFixed(0)} KB).`);
          return blob;
        }
        // Cached entry is corrupt/invalid — evict and re-fetch
        console.warn(`[Cache] Invalid PDF in cache for ${url}, evicting.`);
        await cache.delete(url);
      }
    } catch (e) {
      console.warn("Cache lookup failed", e);
    }
  }

  // Helper to fetch, validate, and cache
  const fetchAndCache = async (fetchUrl: string, cacheKey: string) => {
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();

    if (!(await isValidPdf(blob))) {
      throw new Error("Downloaded file is not a valid PDF (bad magic bytes or too small).");
    }

    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        // Store with proper Content-Type so the blob retains its MIME on retrieval
        await cache.put(cacheKey, new Response(blob, {
          headers: { 'Content-Type': 'application/pdf', 'X-Cached-At': new Date().toISOString() }
        }));
        console.log(`[Cache] Stored ${cacheKey} (${(blob.size / 1024).toFixed(0)} KB).`);
      } catch (e) { console.warn("Cache put failed", e); }
    }
    return blob;
  };

  // Strategy: Direct -> AllOrigins -> CorsProxy -> Fail
  try {
    console.log(`[Network] Attempting direct fetch: ${url}`);
    return await fetchAndCache(url, url);
  } catch (directError) {
    console.warn("Direct fetch failed. Initiating proxy fallback sequence...", directError);

    const proxies = [
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`
    ];

    for (const proxyGen of proxies) {
      try {
        const proxyUrl = proxyGen(url);
        console.log(`[Proxy] Trying: ${proxyUrl}`);
        return await fetchAndCache(proxyUrl, url);
      } catch (proxyError) {
        console.warn(`Proxy attempt failed for ${proxyGen(url)}:`, proxyError);
      }
    }

    throw new Error("All network and proxy attempts failed.");
  }
};

function App() {
  const { user, isLoading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [navStep, setNavStep] = useState<NavigationStep>('LANDING');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [language, setLanguage] = useState<Language>('ENGLISH');
  const [file, setFile] = useState<File | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Ask leenjisaa Input State
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizActive, setQuizActive] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserState, setAnalyserState] = useState<AnalyserNode | null>(null);
  const [providerLabel, setProviderLabel] = useState<string>('Detecting...');

  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const AudioContextPolyfill = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextPolyfill({ sampleRate: 24000 });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    setAnalyserState(analyser);

    // Fix: Resume AudioContext after user gesture to avoid "prevented from starting" warning
    const handleGesture = () => {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      window.removeEventListener('click', handleGesture);
    };
    window.addEventListener('click', handleGesture);

    return () => {
      ctx.close();
      window.removeEventListener('click', handleGesture);
    }
  }, []);

  // Detect AI provider on mount
  useEffect(() => {
    getProviderName().then(setProviderLabel);
  }, []);

  // Initialize Speech Recognition
  // --- Speech Recognition Disabled (Review: Listening feature postponed) ---
  /*
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // ... (code commented out)
    }
  }, [language]);
  */

  const toggleListening = () => {
    alert("Voice input is currently disabled. Coming in v2.0!");
    // setIsListening(false);
  };

  const processAIResponse = async (text: string, context: string, shouldSpeak: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const explanation = await generateExplanation(text, context, language);
      const aiMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: explanation, timestamp: Date.now() };
      setChatHistory(prev => [...prev, aiMsg]);

      // Re-detect provider after first successful call
      getProviderName().then(setProviderLabel);

      if (shouldSpeak) {
        // Try to generate a concise spoken summary
        let spokenText = "";
        try {
          spokenText = await generateSpokenSummary(explanation, context, language);
        } catch (summaryErr) {
          console.warn('Speech summary generation failed:', summaryErr);
        }

        // FALLBACK: If summary is empty/failed, use first 2 sentences of original text
        if (!spokenText) {
          console.log('[AI] Using fallback speech (first 2 sentences)');
          spokenText = explanation.split(/[.!?]/).slice(0, 2).join('.') + '.';
        }

        if (spokenText) {
          speakText(
            spokenText,
            language,
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
          ).catch(err => {
            console.error('[TTS] Speech failed:', err);
            setIsSpeaking(false);
            setChatHistory(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: "_Voice service unavailable. Please check your ElevenLabs configuration._",
              timestamp: Date.now()
            }]);
          });
        }
      }
    } catch (err) { console.error(err); } finally { setIsProcessing(false); }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage("");

    const recentHistory = chatHistory.slice(-4).map(m => `${m.role === 'user' ? 'Student' : 'leenjisaa'}: ${m.text}`).join('\n');
    const subjectName = selectedSubject ? t(selectedSubject.nameKey) : 'General Knowledge';

    await processAIResponse(text, `Subject: ${subjectName}.\n\nRecent Conversation Context:\n${recentHistory}\n\nThe user is asking you directly.`, true);
  };

  const handleExplain = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: `Explain: "${text.substring(0, 30)}..."`, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    const subjectName = selectedSubject ? t(selectedSubject.nameKey) : '';
    await processAIResponse(text, `Subject: ${subjectName}`, false);
  };

  const handleAskleenjisaaButton = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
    } else {
      // toggleListening(); // Disabled
      alert("Please type your question.");
    }
  };

  const handleQuiz = async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setQuizActive(true);
    setQuizQuestions([]);
    setQuizAnswers([]);

    setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', text: "Generate a quiz based on this section.", timestamp: Date.now() }]);

    try {
      const questions = await generateQuiz(text, language);
      setQuizQuestions(questions);
      setQuizAnswers(new Array(questions.length).fill(-1));

      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `I've prepared ${questions.length} questions for you — easy to hard. Good luck!`, timestamp: Date.now() }]);
    } catch (err) {
      console.error(err);
      setQuizActive(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: `Translate: "${text.substring(0, 30)}..." to ${language.toLowerCase()}`,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, userMsg]);

    const placeholderId = (Date.now() + 1).toString();
    setChatHistory(prev => [...prev, {
      id: placeholderId,
      role: 'model',
      text: "Translating...",
      timestamp: Date.now()
    }]);

    try {
      const translation = await translateText(text, language);
      setChatHistory(prev => prev.map(msg =>
        msg.id === placeholderId ? { ...msg, text: translation } : msg
      ));
    } catch (err) {
      console.error(err);
      setChatHistory(prev => prev.map(msg =>
        msg.id === placeholderId ? { ...msg, text: "Wait, translation failed. Please check your connection and try again." } : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const submitQuizAnswer = (qIndex: number, optionIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[qIndex] = optionIndex;
    setQuizAnswers(newAnswers);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setNavStep('VIEWING');
      setIsFallbackMode(false);
      setSelectedSubject(null);
    }
  };

  const selectGrade = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setNavStep('SUBJECT_SELECT');
  };

  const selectSubject = async (subject: Subject) => {
    setSelectedSubject(subject);
    setIsLoadingPdf(true);
    setIsFallbackMode(false);

    try {
      // Attempt main URL
      const blob = await fetchPdfWithCache(subject.pdfUrl);
      const pdfFile = new File([blob], `${t(subject.nameKey)}.pdf`, { type: "application/pdf" });
      setFile(pdfFile);
      setNavStep('VIEWING');
    } catch (e) {
      console.warn(`Primary PDF load failed for ${subject.nameKey}. Switching to fallback.`, e);

      try {
        // Fallback to SAMPLE_PDF_URL
        const fallbackBlob = await fetchPdfWithCache(SAMPLE_PDF_URL);
        const fallbackFile = new File([fallbackBlob], `${t(subject.nameKey)} (Demo).pdf`, { type: "application/pdf" });
        setFile(fallbackFile);
        setIsFallbackMode(true);
        setNavStep('VIEWING');

        // Notify user via chat so they know why
        setTimeout(() => {
          setChatHistory(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: `**Network Notice:** The official Ministry textbook server for ${t(subject.nameKey)} is currently unreachable. \n\nI have loaded the **Offline Demo Textbook** so we can continue our session. All AI features (Quiz, Explanation, Voice) are fully functional!`,
            timestamp: Date.now()
          }]);
        }, 1000);

      } catch (fallbackError) {
        console.error("Even fallback failed", fallbackError);
        alert("Critial Error: Could not load any textbook content. Please check your connection.");
      }
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const goBack = () => {
    if (navStep === 'VIEWING') {
      setNavStep('SUBJECT_SELECT');
      setFile(null);
      setQuizActive(false);
    } else if (navStep === 'SUBJECT_SELECT') {
      setNavStep('GRADE_SELECT');
      setSelectedGrade(null);
    }
  };

  const resetToGradeSelect = () => {
    setNavStep('GRADE_SELECT');
    setSelectedGrade(null);
    setSelectedSubject(null);
    setFile(null);
    setQuizActive(false);
  };

  const toggleLanguage = () => {
    setLanguage(prev => {
      if (prev === 'ENGLISH') return 'AMHARIC';
      if (prev === 'AMHARIC') return 'OROMO';
      return 'ENGLISH';
    });
  };

  const getLanguageLabel = () => {
    if (language === 'ENGLISH') return 'EN';
    if (language === 'AMHARIC') return 'አማ';
    return 'ORO';
  };

  const { logout } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-indigo-400">
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  if (!user && navStep !== 'LANDING') {
    return authView === 'LOGIN' ? (
      <Login onSwitchToSignup={() => setAuthView('SIGNUP')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('LOGIN')} />
    );
  }

  if (navStep === 'LANDING' && !user) {
    return <Home onGetStarted={() => setNavStep('GRADE_SELECT')} />;
  }

  // Redirect to dashboard if logged in and at landing
  if (user && navStep === 'LANDING') {
    setNavStep('DASHBOARD');
  }

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 font-sans">
      <nav className="w-20 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-6 space-y-8 z-20">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
          <FileText className="text-white" size={24} />
        </div>
        <div className="flex flex-col space-y-4 w-full items-center">
          <button onClick={() => setNavStep('DASHBOARD')} title="Dashboard" className={`p-3 rounded-lg transition-all ${navStep === 'DASHBOARD' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <LayoutDashboard size={24} />
          </button>
          <button onClick={() => setNavStep('NOTES')} title="Notes" className={`p-3 rounded-lg transition-all ${navStep === 'NOTES' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <FileText size={24} />
          </button>
          <button onClick={resetToGradeSelect} title={t('student_mode')} className={`p-3 rounded-lg transition-all ${navStep === 'GRADE_SELECT' || navStep === 'SUBJECT_SELECT' || navStep === 'VIEWING' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <School size={24} />
          </button>
        </div>
        <div className="mt-auto flex flex-col items-center gap-4">
          <button onClick={toggleLanguage} className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 ${language !== 'ENGLISH' ? 'bg-green-900/30 text-green-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <Languages size={24} />
            <span className="text-[10px] font-bold">{getLanguageLabel()}</span>
          </button>
          <button onClick={logout} title="Sign Out" className="p-3 rounded-lg text-slate-500 hover:text-red-400 transition-all">
            <LogOut size={24} />
          </button>
        </div>
      </nav >

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 flex flex-col min-w-0">
          <header className="mb-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {(navStep === 'SUBJECT_SELECT' || navStep === 'VIEWING') && (
                <button onClick={goBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  {t('app_title')}
                  <span className="text-indigo-500 text-xs uppercase tracking-widest border border-indigo-500/30 px-2 py-0.5 rounded-full">v0.4.2</span>
                </h1>
                <p className="text-slate-400 text-sm">
                  {navStep === 'GRADE_SELECT' ? t('select_grade') :
                    navStep === 'SUBJECT_SELECT' ? `${t(selectedGrade?.labelKey || '')} - ${t('select_subject')}` :
                      navStep === 'VIEWING' ? `${t(selectedSubject?.nameKey || '')} ${t('textbook')}` : 'Offline-Ready Education'}
                </p>
              </div>
            </div>
            {navStep === 'VIEWING' && (
              <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-2">
                <Upload size={16} />
                <span>{t('custom_pdf')}</span>
                <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </header>

          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-sm relative">
            {navStep === 'DASHBOARD' ? (
              <Dashboard language={language} user={user} />
            ) : navStep === 'NOTES' ? (
              <Notes language={language} user={user} />
            ) : (
              <>
                {navStep === 'GRADE_SELECT' && (
                  <div className="h-full flex items-center justify-center p-10">
                    <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                      {CURRICULUM.map(grade => (
                        <button key={grade.id} onClick={() => selectGrade(grade)} className="h-48 rounded-2xl bg-slate-800 hover:bg-indigo-600 transition-all duration-300 group flex flex-col items-center justify-center border border-slate-700 hover:border-indigo-400 shadow-xl">
                          <School size={48} className="text-slate-400 group-hover:text-white mb-4 transition-colors" />
                          <span className="text-2xl font-bold text-slate-200 group-hover:text-white">{t(grade.labelKey)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {navStep === 'SUBJECT_SELECT' && selectedGrade && (
                  <div className="h-full flex items-center justify-center p-10">
                    {isLoadingPdf ? (
                      <div className="flex flex-col items-center gap-4 text-indigo-400">
                        <Loader2 size={48} className="animate-spin" />
                        <span className="text-lg font-medium">Downloading Textbook (Offline Ready)...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                        {selectedGrade.subjects.map(subject => {
                          const Icon = IconMap[subject.iconName] || Layers;
                          return (
                            <button key={subject.id} onClick={() => selectSubject(subject)} className="aspect-square rounded-2xl bg-slate-800 hover:bg-slate-700 transition-all duration-300 group flex flex-col items-center justify-center border border-slate-700 hover:border-indigo-400 shadow-lg">
                              <div className="p-4 rounded-full bg-slate-900/50 group-hover:bg-indigo-500/20 mb-4 transition-colors">
                                <Icon size={32} className="text-indigo-400 group-hover:text-indigo-300" />
                              </div>
                              <span className="text-lg font-semibold text-slate-200 group-hover:text-white">{t(subject.nameKey)}</span>
                              <span className="text-xs text-slate-500 mt-2">{t('ministry_label')}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {navStep === 'VIEWING' && (
                  <div className="h-full flex relative">
                    {/* Fallback Banner */}
                    {isFallbackMode && (
                      <div className="absolute top-0 left-0 right-0 z-20 bg-amber-600/90 text-white text-xs font-bold text-center py-1 flex items-center justify-center gap-2 backdrop-blur-sm">
                        <WifiOff size={14} />
                        OFFLINE DEMO MODE: Official server unreachable. Displaying sample content.
                      </div>
                    )}

                    {/* PDF Area */}
                    <div className={`transition-all duration-500 ease-in-out ${quizActive ? 'w-1/2' : 'w-full'}`}>
                      <PDFReader
                        onExplain={handleExplain}
                        onQuiz={handleQuiz}
                        onTranslate={handleTranslate}
                        file={file}
                        startPage={selectedSubject?.startPage}
                      />
                    </div>

                    {/* Quiz Panel Overlay */}
                    <div className={`absolute right-0 top-0 bottom-0 bg-slate-900/95 border-l border-slate-700 transition-all duration-500 ease-in-out overflow-y-auto ${quizActive ? 'w-1/2 translate-x-0' : 'w-1/2 translate-x-full'}`}>
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Brain size={24} className="text-emerald-400" />
                            Mastery Quiz
                          </h2>
                          <button onClick={() => setQuizActive(false)} className="p-2 hover:bg-slate-800 rounded-full">
                            <X size={20} />
                          </button>
                        </div>

                        {/* Progress Bar */}
                        {quizQuestions.length > 0 && (() => {
                          const answered = quizAnswers.filter(a => a !== -1).length;
                          const correct = quizAnswers.filter((a, i) => a !== -1 && a === quizQuestions[i]?.correctIndex).length;
                          const total = quizQuestions.length;
                          const allDone = answered === total;
                          const pct = Math.round((answered / total) * 100);

                          return (
                            <div className="mb-6">
                              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                                <span>{answered}/{total} answered</span>
                                <span>{correct} correct</span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-out"
                                  style={{
                                    width: `${pct}%`,
                                    background: allDone
                                      ? (correct / total >= 0.8 ? '#10b981' : correct / total >= 0.5 ? '#f59e0b' : '#ef4444')
                                      : '#6366f1'
                                  }}
                                />
                              </div>

                              {/* Score Summary (shown when all answered) */}
                              {allDone && (
                                <div className={`mt-4 p-4 rounded-xl text-center border ${correct / total >= 0.8
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : correct / total >= 0.5
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                                  }`}>
                                  <div className="text-3xl font-bold mb-1">{correct}/{total}</div>
                                  <div className="text-sm">
                                    {correct / total >= 0.8
                                      ? 'Excellent! You have mastered this section.'
                                      : correct / total >= 0.5
                                        ? 'Good effort! Review the explanations below.'
                                        : 'Keep studying — re-read this section and try again.'}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {quizQuestions.length === 0 && (
                          <div className="text-center py-20 text-slate-500 animate-pulse">
                            Generating 5 questions from textbook...
                          </div>
                        )}

                        <div className="space-y-6">
                          {quizQuestions.map((q, qIndex) => {
                            const isAnswered = quizAnswers[qIndex] !== -1;
                            const isCorrectAnswer = isAnswered && quizAnswers[qIndex] === q.correctIndex;
                            const diffColor = q.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                              : q.difficulty === 'hard' ? 'text-red-400 bg-red-400/10 border-red-400/20'
                                : 'text-amber-400 bg-amber-400/10 border-amber-400/20';

                            return (
                              <div key={qIndex} className={`p-5 rounded-xl border transition-all duration-300 ${isAnswered
                                ? isCorrectAnswer
                                  ? 'bg-emerald-500/5 border-emerald-500/20'
                                  : 'bg-red-500/5 border-red-500/20'
                                : 'bg-slate-800 border-slate-700'
                                }`}>
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="font-semibold text-base text-slate-200 flex-1 pr-3">
                                    <span className="text-slate-500 mr-2">{qIndex + 1}.</span>
                                    {q.question}
                                  </h3>
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border whitespace-nowrap ${diffColor}`}>
                                    {q.difficulty}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {q.options.map((opt, optIndex) => {
                                    const isSelected = quizAnswers[qIndex] === optIndex;
                                    const isCorrect = q.correctIndex === optIndex;
                                    const showCorrect = isAnswered && isCorrect;

                                    let btnClass = "w-full text-left p-3 rounded-lg border transition-all text-sm ";
                                    if (isAnswered) {
                                      if (isSelected && isCorrect) {
                                        btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-200";
                                      } else if (isSelected && !isCorrect) {
                                        btnClass += "bg-red-500/20 border-red-500 text-red-200";
                                      } else if (showCorrect) {
                                        btnClass += "bg-emerald-500/10 border-emerald-500/50 text-emerald-300";
                                      } else {
                                        btnClass += "bg-slate-900/50 border-slate-700/50 text-slate-500";
                                      }
                                    } else {
                                      btnClass += "bg-slate-900 border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-300";
                                    }

                                    return (
                                      <button
                                        key={optIndex}
                                        onClick={() => submitQuizAnswer(qIndex, optIndex)}
                                        disabled={isAnswered}
                                        className={btnClass}
                                      >
                                        <div className="flex justify-between items-center">
                                          <span className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 font-mono w-4">{String.fromCharCode(65 + optIndex)}.</span>
                                            {opt}
                                          </span>
                                          {isSelected && isCorrect && <Check size={16} />}
                                          {isSelected && !isCorrect && <X size={16} />}
                                          {!isSelected && showCorrect && <Check size={16} className="text-emerald-400" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                                {isAnswered && (
                                  <div className={`mt-3 p-3 rounded-lg text-sm ${isCorrectAnswer ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-900/50 text-slate-400'
                                    }`}>
                                    <span className="font-bold text-indigo-400">Explanation:</span> {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: The Soul (Avatar & Chat) */}
        <div className="w-96 bg-slate-950 border-l border-slate-800 flex flex-col z-10">
          <div className="p-4 border-b border-slate-800">
            <Avatar analyser={analyserState} isSpeaking={isSpeaking} />
            <div className="mt-2 flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Mic size={12} className={isSpeaking || isListening ? "text-red-500 animate-pulse" : ""} />
                STATUS: {isSpeaking ? t('status_speaking') : isListening ? "LISTENING..." : t('status_listening')}
              </span>
              <span className="font-mono text-indigo-400">{providerLabel.toUpperCase()}</span>
            </div>

            {/* ASK leenjisaa CONTROL - Text Only Mode */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleAskleenjisaaButton}
                disabled={isProcessing || !inputMessage.trim()}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 
                  ${inputMessage.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
              >
                {inputMessage.trim() ? (
                  <>
                    <Send size={18} />
                    Ask leenjisaa
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    Type to Ask...
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-slate-600 mt-10">
                <p className="text-sm">
                  {navStep === 'VIEWING' ? t('welcome_msg_viewing') : t('welcome_msg_nav')}
                </p>
              </div>
            )}
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}>
                  <ReactMarkdown className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-strong:text-current">
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none text-xs text-slate-400 animate-pulse">
                  {t('analyzing')}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* TEXT INPUT AREA */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                placeholder={isListening ? "Listening..." : t('chat_placeholder')}
                disabled={isListening}
                className={`flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 ${isListening ? 'placeholder-red-400' : ''}`}
              />
              <button
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isListening}
                className="p-2 bg-indigo-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div >
  );
}

export default App;