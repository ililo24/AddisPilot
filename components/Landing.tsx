import React, { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen, Brain, Globe, Sparkles, Atom, Star } from 'lucide-react';

interface LandingProps {
    onGetStarted: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let t = 0;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        // Floating orb definitions — each has a color, base position, size, and drift speed
        const orbs = [
            { x: 0.2,  y: 0.3,  r: 0.52, color: [99,  102, 241], dx: 0.000040, dy: 0.000028 }, // indigo
            { x: 0.75, y: 0.2,  r: 0.44, color: [139, 92,  246], dx: -0.000034, dy: 0.000038 }, // violet
            { x: 0.15, y: 0.75, r: 0.38, color: [16,  185, 129], dx: 0.000030, dy: -0.000034 }, // emerald
            { x: 0.80, y: 0.70, r: 0.50, color: [79,  70,  229], dx: -0.000038, dy: -0.000025 }, // indigo-dark
            { x: 0.50, y: 0.10, r: 0.34, color: [167, 139, 250], dx: 0.000022, dy: 0.000046 }, // purple
        ];

        const draw = () => {
            t += 1;
            const W = canvas.width;
            const H = canvas.height;

            // Dark base fill
            ctx.fillStyle = 'rgb(2, 6, 23)';
            ctx.fillRect(0, 0, W, H);

            // Draw each animated orb
            orbs.forEach(orb => {
                const cx = (orb.x + Math.sin(t * orb.dx * 1000 + orb.r) * 0.15) * W;
                const cy = (orb.y + Math.cos(t * orb.dy * 1000 + orb.r) * 0.12) * H;
                const radius = orb.r * Math.min(W, H);

                const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                const [r, g, b] = orb.color;
                gradient.addColorStop(0,   `rgba(${r}, ${g}, ${b}, 0.30)`);
                gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.10)`);
                gradient.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // Subtle noise-like grid lines (scanlines feel)
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
            ctx.lineWidth = 1;
            const gridStep = 60;
            for (let x = 0; x < W; x += gridStep) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
                ctx.stroke();
            }
            for (let y = 0; y < H; y += gridStep) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
            {/* Animated gradient canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 0 }}
            />

            {/* Glassmorphic noise overlay */}
            <div
                className="absolute inset-0"
                style={{
                    zIndex: 1,
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
                    backdropFilter: 'blur(0px)',
                }}
            />

            {/* Top nav bar */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <div>
                        <span className="font-extrabold text-lg tracking-tight text-white">Addis Pilot</span>
                        <span className="ml-2 text-xs text-indigo-400 font-semibold uppercase tracking-widest border border-indigo-500/30 px-2 py-0.5 rounded-full">Beta</span>
                    </div>
                </div>
                <button
                    onClick={onGetStarted}
                    className="px-5 py-2 text-sm font-semibold text-slate-200 border border-slate-700 hover:border-indigo-500 hover:text-white rounded-xl transition-all backdrop-blur-sm bg-slate-800/40 hover:bg-slate-800/70"
                >
                    Sign In
                </button>
            </nav>

            {/* Hero — vertically centred */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">

                {/* Pill badge */}
                <div className="mb-7 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium backdrop-blur-lg">
                    <Star size={13} fill="currentColor" className="text-amber-400" />
                    Ethiopia's First AI-Powered Curriculum Tutor
                    <Star size={13} fill="currentColor" className="text-amber-400" />
                </div>

                {/* Main heading */}
                <h1
                    className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-none mb-6"
                    style={{
                        background: 'linear-gradient(135deg, #fff 0%, #c7d2fe 40%, #818cf8 70%, #6366f1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Learn Smarter.<br />Reach Higher.
                </h1>

                {/* Sub-heading */}
                <p className="max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed mb-10">
                    <span className="text-white font-semibold">leenjisaa</span> is your personal AI tutor — built for Ethiopian students.
                    Access Ministry-approved textbooks, get instant AI explanations, and ace your exams in
                    <span className="text-indigo-300 font-medium"> English, Amharic, </span>
                    or
                    <span className="text-emerald-400 font-medium"> Afaan Oromoo</span>.
                </p>

                {/* CTA button group */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <button
                        onClick={onGetStarted}
                        className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-900/40 transition-all duration-200 active:scale-95 flex items-center gap-3 overflow-hidden"
                    >
                        {/* Sheen sweep on hover */}
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <span className="relative">Get Started Free</span>
                        <ArrowRight className="relative group-hover:translate-x-1 transition-transform" size={20} />
                    </button>
                    <span className="text-slate-500 text-sm">No credit card required.</span>
                </div>

                {/* Floating stat pills */}
                <div className="mt-16 flex flex-wrap justify-center gap-4">
                    {[
                        { label: 'Grades 11 & 12', color: 'indigo' },
                        { label: '5 Core Subjects', color: 'violet' },
                        { label: '3 Languages', color: 'emerald' },
                        { label: 'Works Offline', color: 'amber' },
                    ].map(({ label, color }) => (
                        <div
                            key={label}
                            className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border
                                ${color === 'indigo'  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'  :
                                  color === 'violet'  ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'  :
                                  color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' :
                                                        'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Feature cards */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    {[
                        {
                            icon: <BookOpen size={28} className="text-indigo-400" />,
                            bg: 'from-indigo-500/10 to-transparent border-indigo-500/20',
                            title: 'Smart Library',
                            desc: 'All Ethiopian Ministry of Education textbooks, cached for offline use.',
                        },
                        {
                            icon: <Brain size={28} className="text-emerald-400" />,
                            bg: 'from-emerald-500/10 to-transparent border-emerald-500/20',
                            title: 'AI Tutor',
                            desc: 'Ask questions, get instant explanations, and generate adaptive quizzes.',
                        },
                        {
                            icon: <Globe size={28} className="text-violet-400" />,
                            bg: 'from-violet-500/10 to-transparent border-violet-500/20',
                            title: 'Multi-Lingual',
                            desc: 'Learn in English, Amharic, or Oromo — your choice, every time.',
                        },
                    ].map(({ icon, bg, title, desc }) => (
                        <div
                            key={title}
                            className={`relative p-7 rounded-3xl border bg-gradient-to-b ${bg} backdrop-blur-md text-left group hover:scale-[1.02] transition-transform duration-300 cursor-default`}
                        >
                            <div className="mb-5 w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center border border-slate-700/50">
                                {icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-8 text-center text-slate-600 text-xs border-t border-slate-800/60">
                © 2026 Addis Pilot · leenjisaa AI · Empowering Ethiopia's future through knowledge.
            </footer>
        </div>
    );
};
