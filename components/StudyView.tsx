/**
 * StudyView.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * THE MAIN STUDY SHELL — "The Split View"
 *
 * This component is the top-level layout for an active study session.
 * It owns:
 *   1. The TOP NAVIGATION BAR  — language selector, grade/subject breadcrumb,
 *                                 back button, and custom-PDF upload trigger.
 *   2. LEFT PANEL (flex-1)     — Will host <PDFReader> (currently a placeholder).
 *   3. RIGHT SIDEBAR (w-96)    — Will host <AvatarPanel> + <SocraticChat>
 *                                 (currently placeholders).
 *
 * Design rules:
 *   • Dark mode: bg-slate-900 / bg-slate-950 throughout.
 *   • All UI strings come from TRANSLATIONS — never hardcoded.
 *   • No PDF or 3D logic lives here; this is pure layout & state routing.
 *   • Props feed in everything from App.tsx so this component stays "dumb".
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import {
  ChevronLeft,
  Languages,
  School,
  Upload,
  Sparkles,
  MessageSquare,
  BookOpen,
  Loader2,
  WifiOff,
} from 'lucide-react';

import { Language, GradeLevel, Subject } from '../types';
import { TRANSLATIONS } from '../translations';

// ─── Prop Types ───────────────────────────────────────────────────────────────

interface StudyViewProps {
  /** Currently active display language for all UI strings. */
  language: Language;

  /** Cycle through ENGLISH → AMHARIC → OROMO → ENGLISH */
  onToggleLanguage: () => void;

  /** Human-readable language abbreviation shown on the button. */
  languageLabel: string;

  /** The grade the student selected (e.g. Grade 11). */
  selectedGrade: GradeLevel | null;

  /** The subject the student selected (e.g. Physics). */
  selectedSubject: Subject | null;

  /** Navigate back one level in the grade → subject → viewing flow. */
  onGoBack: () => void;

  /** Fired when the user picks a local PDF file via the upload button. */
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** True while the textbook PDF is being fetched/cached. */
  isLoadingPdf: boolean;

  /** True when the official textbook server was unreachable, showing demo PDF. */
  isFallbackMode: boolean;

  /**
   * Slot for the actual PDF viewer.
   * Pass <PDFReader ... /> when it's ready; until then the placeholder shows.
   */
  pdfSlot?: React.ReactNode;

  /**
   * Slot for the AI tutor sidebar (Avatar + Chat).
   * Pass <AvatarPanel ... /> when it's ready; until then the placeholder shows.
   */
  chatSlot?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StudyView: React.FC<StudyViewProps> = ({
  language,
  onToggleLanguage,
  languageLabel,
  selectedGrade,
  selectedSubject,
  onGoBack,
  onFileUpload,
  isLoadingPdf,
  isFallbackMode,
  pdfSlot,
  chatSlot,
}) => {
  /** Shorthand translation helper — falls back to key if string is missing. */
  const t = (key: string) => TRANSLATIONS[language][key] || key;

  // ── Breadcrumb label shown below the app title ──────────────────────────────
  //   "Grade 11 – Physics Textbook"  /  "Select Subject"  / etc.
  const breadcrumb = selectedSubject
    ? `${t(selectedGrade?.labelKey || '')} · ${t(selectedSubject.nameKey)} ${t('textbook')}`
    : selectedGrade
    ? `${t(selectedGrade.labelKey)} · ${t('select_subject')}`
    : t('select_grade');

  return (
    /**
     * ROOT SHELL
     * Full-screen flex column:
     *   ┌──────────────── TOP NAV ────────────────┐
     *   │                                         │
     *   │   LEFT PANEL  │  RIGHT SIDEBAR          │
     *   │   (PDF area)  │  (AI Tutor)             │
     *   │               │                         │
     *   └─────────────────────────────────────────┘
     */
    <div className="flex flex-col h-full w-full bg-slate-900 text-slate-100">

      {/* ── 1. TOP NAVIGATION BAR ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3
                         bg-slate-950 border-b border-slate-800
                         shrink-0 z-20">

        {/* Left cluster: back button + app title + breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Back chevron — only shown when there's somewhere to go back to */}
          {selectedGrade && (
            <button
              id="study-view-back-btn"
              onClick={onGoBack}
              title="Go back"
              className="p-2 rounded-lg text-slate-400 hover:text-white
                         hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* App identity */}
          <div>
            <h1 className="text-lg font-extrabold tracking-tight flex items-center gap-2 leading-none">
              {t('app_title')}
              {/* Version pill */}
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest
                               border border-indigo-500/30 px-2 py-0.5 rounded-full">
                v0.4.2
              </span>
            </h1>

            {/* Dynamic breadcrumb — updates as the student navigates */}
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <School size={11} />
              {breadcrumb}
            </p>
          </div>
        </div>

        {/* Right cluster: language selector + custom-PDF upload */}
        <div className="flex items-center gap-3">

          {/* ── LANGUAGE CYCLING BUTTON ──────────────────────────────────── */}
          {/*
            Cycles: ENGLISH → AMHARIC → OROMO → ENGLISH
            Highlighted in green when a non-English language is active so the
            student always knows the linguistic bridge is on.
          */}
          <button
            id="study-view-language-btn"
            onClick={onToggleLanguage}
            title="Switch language"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold
                        border transition-all
                        ${
                          language !== 'ENGLISH'
                            ? 'bg-green-900/30 border-green-700/40 text-green-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
          >
            <Languages size={16} />
            <span>{languageLabel}</span>
          </button>

          {/* ── CUSTOM PDF UPLOAD ─────────────────────────────────────────── */}
          {/*
            Only show when viewing a subject (no point showing it on
            grade/subject selection screens).
          */}
          {selectedSubject && (
            <label
              id="study-view-upload-btn"
              title={t('custom_pdf')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                         bg-slate-800 border border-slate-700 text-slate-400
                         hover:text-white hover:bg-slate-700 cursor-pointer
                         transition-colors"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">{t('custom_pdf')}</span>
              {/* Hidden real file input — the label acts as the click target */}
              <input
                type="file"
                accept="application/pdf"
                onChange={onFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </header>

      {/* ── OFFLINE DEMO BANNER ────────────────────────────────────────────── */}
      {/*
        Shown when the official Ministry textbook server is unreachable. A
        sample PDF is loaded so the session can continue without interruption.
      */}
      {isFallbackMode && (
        <div className="shrink-0 bg-amber-600/90 text-white text-xs font-bold
                        text-center py-1.5 flex items-center justify-center gap-2
                        backdrop-blur-sm z-10">
          <WifiOff size={13} />
          OFFLINE DEMO MODE — Official server unreachable. Showing sample content.
        </div>
      )}

      {/* ── 2. MAIN AREA (PDF left + AI sidebar right) ─────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL: PDF VIEWER ─────────────────────────────────────── */}
        {/*
          This panel flexes to fill all remaining width when the sidebar is
          closed. When <PDFReader> is wired up, pass it via `pdfSlot`.
        */}
        <section
          id="study-view-pdf-panel"
          className="flex-1 flex flex-col overflow-hidden
                     border-r border-slate-800 relative"
        >
          {isLoadingPdf ? (
            /* Loading state — shown while fetching the textbook blob */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-indigo-400">
              <Loader2 size={48} className="animate-spin" />
              <p className="text-base font-medium text-slate-400">
                Downloading Textbook (caching for offline use)…
              </p>
            </div>
          ) : pdfSlot ? (
            /* Real PDF viewer — rendered when parent wires it in */
            pdfSlot
          ) : (
            /* ── PLACEHOLDER ─────────────────────────────────────────────── */
            /*
              Shows until <PDFReader> is built and passed via `pdfSlot`.
              Styled to match the eventual PDF canvas area.
            */
            <div className="flex flex-col items-center justify-center h-full gap-6
                            text-slate-600 select-none">
              {/* Faint decorative book icon */}
              <div className="p-6 rounded-3xl border-2 border-dashed border-slate-800
                              bg-slate-900/50">
                <BookOpen size={56} strokeWidth={1.2} className="text-slate-700" />
              </div>

              <div className="text-center max-w-xs">
                <p className="text-slate-500 font-semibold text-sm">
                  📄 PDF Viewer — Coming Next
                </p>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  The <code className="text-indigo-500">{'<PDFReader>'}</code> component
                  will be slotted here. Select a subject to activate text-selection
                  and Socratic AI features.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── RIGHT SIDEBAR: AI TUTOR PANEL ──────────────────────────────── */}
        {/*
          Fixed-width sidebar (w-96).
          Upper half → 3D Avatar canvas (leenjisaa).
          Lower half → Scrollable Socratic Chat feed + text input.
          Pass actual components via `chatSlot`.
        */}
        <aside
          id="study-view-chat-sidebar"
          className="w-96 shrink-0 flex flex-col
                     bg-slate-950 border-l border-slate-800 overflow-hidden"
        >
          {chatSlot ? (
            /* Real avatar+chat panel — rendered when parent wires it in */
            chatSlot
          ) : (
            /* ── PLACEHOLDER ─────────────────────────────────────────────── */
            <div className="flex flex-col h-full">

              {/* Avatar area placeholder */}
              <div className="h-52 shrink-0 flex flex-col items-center justify-center
                              border-b border-slate-800 bg-slate-900/40 gap-3">
                {/* Pulsing avatar silhouette */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br
                                from-indigo-600/40 to-purple-700/30
                                border-2 border-indigo-500/30
                                flex items-center justify-center animate-pulse">
                  <Sparkles size={32} className="text-indigo-400 opacity-60" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  3D Avatar — Coming Next
                </p>
                <p className="text-[10px] text-slate-700 text-center px-6 leading-relaxed">
                  The <code className="text-indigo-600">{'<Avatar>'}</code> canvas
                  (leenjisaa) will render here via{' '}
                  <span className="text-purple-600">@react-three/fiber</span>.
                </p>
              </div>

              {/* Chat area placeholder */}
              <div className="flex-1 flex flex-col items-center justify-center
                              gap-4 text-slate-700 px-6">
                <MessageSquare size={40} strokeWidth={1.2} className="text-slate-800" />
                <div className="text-center">
                  <p className="text-slate-500 font-semibold text-sm">
                    💬 Socratic Chat — Coming Next
                  </p>
                  <p className="text-xs mt-1 leading-relaxed text-slate-700">
                    Select text in the PDF to trigger AI explanation, quiz, or
                    translation. Responses will stream here in Markdown.
                  </p>
                </div>
              </div>

              {/* Fake chat input footer — shows the intended shape */}
              <div className="p-3 border-t border-slate-800 bg-slate-900
                              flex gap-2 items-center shrink-0 opacity-40">
                <div className="flex-1 h-9 rounded-lg bg-slate-800 border border-slate-700" />
                <div className="w-9 h-9 rounded-lg bg-indigo-700/50 flex items-center
                                justify-center">
                  <Sparkles size={16} className="text-indigo-300" />
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
