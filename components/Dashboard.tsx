import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Language, User } from '../types';
import { TRANSLATIONS } from '../translations';
import { TrendingUp, AlertTriangle, Brain, ChevronRight } from 'lucide-react';

interface DashboardProps {
  language: Language;
  user: User | null;
}

const mockPerformanceData = [
  { month: 'Sep', score: 65 },
  { month: 'Oct', score: 68 },
  { month: 'Nov', score: 72 },
  { month: 'Dec', score: 70 },
  { month: 'Jan', score: 78 },
  { month: 'Feb', score: 82 },
  { month: 'Mar', score: 85 }, // Projection
];

export const Dashboard: React.FC<DashboardProps> = ({ language, user }) => {
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  return (
    <div className="bg-slate-900 p-6 h-full flex flex-col overflow-y-auto text-slate-100">
      {/* Header with User Info */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            {t('welcome_back')}, <span className="text-indigo-400">{user?.name || 'Learner'}</span>!
          </h2>
          <p className="text-slate-400 mt-1">Ethiopia's digital classroom is ready. Empower your future.</p>
        </div>
        <div className="bg-indigo-600/20 border border-indigo-500/30 px-6 py-3 rounded-2xl backdrop-blur-sm">
          <span className="block text-xs font-bold uppercase tracking-wider text-indigo-300 opacity-75">{t('predicted_score')}</span>
          <span className="text-3xl font-black text-indigo-400">85.4%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance Chart */}
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm h-80">
            <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" />
              {t('trajectory_analysis')}
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={mockPerformanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#1e293b' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4 text-amber-400">
                <AlertTriangle size={24} />
                <h4 className="font-bold text-lg">{t('weakness_title')}</h4>
              </div>
              <p className="text-slate-200 font-semibold text-xl">Vector Dynamics</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Consistent hesitation on 3D vector resolution.
                <span className="block mt-4 text-indigo-400 font-bold cursor-pointer hover:text-indigo-300 transition-colors flex items-center gap-1">
                  Start Remedial Session <ChevronRight size={16} />
                </span>
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4 text-emerald-400">
                <TrendingUp size={24} />
                <h4 className="font-bold text-lg">{t('strength_title')}</h4>
              </div>
              <p className="text-slate-200 font-semibold text-xl">Thermodynamics</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Improvement rate is <span className="font-bold text-emerald-400 text-lg">+15%</span> faster than national average. Mastery imminent.
              </p>
            </div>
          </div>
        </div>

        {/* Motivation Section */}
        <div className="lg:col-span-1">
          <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-900/30 text-white relative overflow-hidden group h-full">
            <div className="relative z-10">
              <Brain className="mb-6 opacity-50" size={64} />
              <h3 className="text-3xl font-black mb-4">Keep Pushing, {user?.name.split(' ')[0]}!</h3>
              <p className="text-indigo-100 text-lg leading-relaxed mb-8">
                "Knowledge is power. Information is liberating. Education is the premise of progress, in every society, in every family."
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-sm font-bold opacity-90">3 Chapters completed this week</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-sm font-bold opacity-90">Physics quiz tomorrow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
