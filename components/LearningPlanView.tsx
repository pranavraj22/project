
import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, BookOpen, GraduationCap, School, Map, ChevronDown, List, Printer,
  ClipboardList, Loader2, Sparkles, Globe, ExternalLink, FileText, Download, Library, Scroll, Clock, Target, Search, Youtube, PlayCircle
} from 'lucide-react';
import { generateLearningPlan } from '../services/geminiService';
import { UploadedFile } from '../types';
import UploadZone from './UploadZone';
import { generateRobustPdf, generateLearningPlanPdf } from '../services/pdfService';

interface LearningPlanViewProps {
  onBack: () => void;
  onLoadingChange: (loading: boolean) => void;
}

// Utility to clean text
const cleanText = (text: string) => {
  if (!text) return '';
  return text.trim();
};

interface AccordionItemProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-5 transition-all duration-300 hover:shadow-md break-inside-avoid">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-6 transition-colors ${isOpen ? 'bg-slate-50 border-b border-slate-100' : 'bg-white'}`}
      >
        <div className="flex items-center gap-4 text-left">
          <div className={`p-3 rounded-2xl ${isOpen ? 'bg-navy text-white' : 'bg-slate-100 text-navy'}`}>
            <Icon size={22} />
          </div>
          <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">{title}</h3>
        </div>
        <div className={`text-slate-400 transform transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={24} />
        </div>
      </button>
      {isOpen && (
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

// --- TYPES FOR PARSER ---
interface ResourceItem {
  title: string;
  sourceLabel?: string;
  sourceValue?: string;
  description?: string; // "Why it is useful"
}

interface ResourceCategory {
  type: string;
  items: ResourceItem[];
}

interface ParsedUnit {
  title: string;
  coreTopics: string[];
  resources: ResourceCategory[];
  practiceGuidance: string[];
  studyTime: string;
}

// Mapping the prompt headers to icons
const RESOURCE_ICONS: Record<string, React.ElementType> = {
  "YouTube Videos / Playlists": Youtube,
  "Written Tutorials": BookOpen,
  "Official Documentation": FileText,
  "Lecture Notes (PDF)": Download,
  "Open Textbooks": Library,
  "Research Papers": Scroll,
  "Technical Blogs": Globe,
};

const LearningPlanView: React.FC<LearningPlanViewProps> = ({ onBack, onLoadingChange }) => {
  const [college, setCollege] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [syllabusFiles, setSyllabusFiles] = useState<UploadedFile[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string }>({});

  const handleGenerate = async () => {
    if (!subject.trim()) {
      // Corrected the typo 'M' to 'setErrors'
      setErrors({ subject: "Subject title is required." });
      return;
    }
    onLoadingChange(true);
    setErrors({});
    try {
      const result = await generateLearningPlan(college, subject, semester, "", syllabusFiles);
      setPlan(result);
    } catch (error) {
      alert("Plan generation failed. Please try again with different inputs.");
    } finally {
      onLoadingChange(false);
    }
  };

  const handleSavePDF = async () => {
    if (!parsedPlan) return;
    setIsGeneratingPdf(true);
    
    // Give time for the hidden DOM to fully render, especially images/icons if any
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const success = await generateLearningPlanPdf(
        parsedPlan.units,
        subject,
        college,
        semester
      );

      if (!success) {
        alert("PDF generation failed. A plain text version has been downloaded instead.");
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("An unexpected error occurred during PDF export.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const parsedPlan = useMemo(() => {
    if (!plan) return null;

    const lines = plan.split('\n');
    const units: ParsedUnit[] = [];

    let currentUnit: ParsedUnit | null = null;
    let currentSection: 'core' | 'resources' | 'guidance' | 'time' | null = null;
    let currentCategory: string | null = null;
    let currentItems: ResourceItem[] = [];
    let currentItem: Partial<ResourceItem> | null = null;

    const flushItem = () => {
      if (currentItem && currentItem.title) {
        currentItems.push(currentItem as ResourceItem);
      }
      currentItem = null;
    };

    const flushCategory = () => {
      flushItem();
      if (currentUnit && currentCategory && currentItems.length > 0) {
        currentUnit.resources.push({ type: currentCategory, items: [...currentItems] });
      }
      currentItems = [];
      currentCategory = null;
    };

    const flushUnit = () => {
      flushCategory();
      if (currentUnit) units.push(currentUnit);
      currentUnit = null;
      currentSection = null;
    };

    for (let i = 0; i < lines.length; i++) {
      let line = cleanText(lines[i]);
      if (!line || line.match(/^-+$/)) continue;

      // 1. Detect Unit
      const unitMatch = line.match(/^UNIT\s+(\d+)[:\.\-]?\s*(.+)/i);
      if (unitMatch) {
        flushUnit();
        currentUnit = {
          title: unitMatch[2].trim(),
          coreTopics: [],
          resources: [],
          practiceGuidance: [],
          studyTime: ''
        };
        currentSection = null;
        continue;
      }

      if (!currentUnit) continue;

      // 2. Detect Sections
      if (line.match(/^Core Topics:/i)) {
        currentSection = 'core';
        continue;
      }
      if (line.match(/^Resources:/i)) {
        currentSection = 'resources';
        continue;
      }
      if (line.match(/^Practice Guidance:/i)) {
        currentSection = 'guidance';
        continue;
      }
      if (line.match(/^Estimated Study Time:/i)) {
        currentSection = 'time';
        continue;
      }

      // 3. Process Content based on Section
      if (currentSection === 'core') {
        const topicMatch = line.match(/^[-•]\s*(.+)/);
        if (topicMatch) {
          currentUnit.coreTopics.push(topicMatch[1].trim());
        }
      } else if (currentSection === 'guidance') {
        const guideMatch = line.match(/^[-•]\s*(.+)/);
        if (guideMatch) {
          currentUnit.practiceGuidance.push(guideMatch[1].trim());
        }
      } else if (currentSection === 'time') {
        const timeMatch = line.match(/^[-•]?\s*(.+)/);
        if (timeMatch) {
          currentUnit.studyTime = timeMatch[1].trim();
        }
      } else if (currentSection === 'resources') {
        // Detect Category Header
        const categoryMatch = line.match(/^([A-Za-z\s\(\)\/]+):$/);
        if (categoryMatch) {
          // Avoid capturing property lines
          if (!line.includes('Title:') && !line.includes('Why it is useful:')) {
            flushCategory();
            currentCategory = categoryMatch[1].trim();
            continue;
          }
        }

        // Detect Item Start
        const itemStartMatch = line.match(/^\d+\.\s*Title:\s*(.+)/);
        if (itemStartMatch) {
          flushItem();
          currentItem = { title: itemStartMatch[1].trim() };
          continue;
        }

        // Detect Metadata fields (Source info)
        if (currentItem) {
          // Flexible regex to catch Channel Name, Platform, Organization, etc.
          const sourceMatch = line.match(/^(Channel Name|Platform \/ Source|Organization|University \/ Institution|Author \/ Publisher|Research Area \/ Publisher|Author \/ Platform):\s*(.+)/);
          if (sourceMatch) {
            currentItem.sourceLabel = sourceMatch[1].trim();
            currentItem.sourceValue = sourceMatch[2].trim();
            continue;
          }

          const descMatch = line.match(/^Why it is useful:\s*(.+)/);
          if (descMatch) {
            currentItem.description = descMatch[1].trim();
            continue;
          }
        }
      }
    }
    flushUnit();

    return { units };
  }, [plan]);

  return (
    <div className="w-full max-w-4xl mx-auto pb-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-navy mb-6 transition-colors font-black group self-start"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {!plan ? (
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 animate-slide-down">
          <div className="flex items-center gap-5 mb-10 text-left">
            <div className="bg-navy p-4 rounded-3xl shadow-lg">
              <Map className="w-8 h-8 text-neon" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Create Learning Plan</h2>
              <p className="text-slate-500 font-medium text-sm">Fresh, exam-focused resource discovery.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 ml-1 uppercase">College Name</label>
                <div className="relative">
                  <School className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                  <input type="text" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. IIT Bombay" className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-neon outline-none transition-all text-black font-semibold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-600 ml-1 uppercase">Semester</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                  <input type="text" value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. 4th" className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-neon outline-none transition-all text-black font-semibold" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-600 ml-1 uppercase">Subject Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                <input type="text" value={subject} onChange={e => { setSubject(e.target.value); if (errors.subject) setErrors({}); }} placeholder="e.g. Operating Systems" className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all text-black font-semibold ${errors.subject ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-neon'}`} />
              </div>
              {errors.subject && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.subject}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-600 ml-1 flex items-center gap-2 uppercase">
                <ClipboardList size={16} className="text-navy" /> Official Syllabus
              </label>
              <UploadZone onFilesChange={setSyllabusFiles} selectedFiles={syllabusFiles} />
            </div>

            <button onClick={handleGenerate} className="w-full h-14 bg-navy text-white rounded-2xl font-black text-lg hover:bg-slate-900 shadow-xl transition-all flex items-center justify-center gap-3">
              <Sparkles size={20} className="text-neon" /> Build My Plan
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in text-center max-w-4xl mx-auto">
          <div className="bg-navy rounded-[3rem] shadow-2xl overflow-hidden mb-12 p-10 text-white relative text-left">
            <div className="absolute top-0 right-0 w-96 h-96 bg-neon opacity-10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-neon/20 border border-neon/30 text-neon px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <Sparkles size={14} /> Intelligence Roadmap
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tighter leading-tight">{subject}</h1>
              <div className="flex flex-wrap gap-6 text-blue-200 font-bold opacity-80 text-sm">
                {college && <span className="flex items-center gap-2"><School size={16} /> {college}</span>}
                {semester && <span className="flex items-center gap-2"><GraduationCap size={16} /> Semester {semester}</span>}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            {parsedPlan?.units.map((unit, uIdx) => (
              <AccordionItem key={uIdx} title={`Unit ${uIdx + 1}: ${unit.title}`} icon={List} defaultOpen={true}>
                <div className="space-y-8 text-left">

                  {/* Core Topics & Study Time */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex flex-col md:flex-row md:justify-between gap-6">
                      <div className="flex-1">
                        <h4 className="flex items-center gap-2 font-black text-slate-700 text-sm uppercase tracking-wider mb-3">
                          <Target size={16} className="text-navy" /> Core Topics
                        </h4>
                        <ul className="space-y-2">
                          {unit.coreTopics.map((topic, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon flex-shrink-0" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {unit.studyTime && (
                        <div className="md:w-48 flex-shrink-0">
                          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center h-full">
                            <Clock className="text-navy mb-2" size={24} />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Time</span>
                            <span className="text-xl font-black text-slate-800">{unit.studyTime}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resources Grid */}
                  <div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Top Resources</h4>
                    <div className="grid grid-cols-1 gap-6">
                      {unit.resources.map((resCat, rIdx) => {
                        const Icon = RESOURCE_ICONS[resCat.type] || BookOpen;
                        const isYoutube = resCat.type.toLowerCase().includes('youtube');

                        return (
                          <div key={rIdx} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:border-navy/30 transition-all shadow-sm hover:shadow-md ${isYoutube ? 'border-l-4 border-l-red-500' : ''}`}>
                            <div className="bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                              <Icon size={18} className={isYoutube ? "text-red-500" : "text-navy"} />
                              <h5 className="font-bold text-sm text-navy uppercase tracking-wide">{resCat.type}</h5>
                            </div>
                            <div className="p-5 space-y-6">
                              {resCat.items.map((item, iIdx) => {
                                const searchUrl = isYoutube
                                  ? `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + " " + (item.sourceValue || ""))}`
                                  : `https://www.google.com/search?q=${encodeURIComponent(item.title + " " + (item.sourceValue || "") + " " + subject)}`;

                                return (
                                  <div key={iIdx} className="flex flex-col gap-2">
                                    <div>
                                      <div className="font-bold text-slate-800 text-base">{item.title}</div>
                                      {item.sourceValue && (
                                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                                          {item.sourceLabel && <span className="opacity-70">{item.sourceLabel}:</span>}
                                          <span className={isYoutube ? "text-red-600" : "text-slate-700"}>{item.sourceValue}</span>
                                        </div>
                                      )}
                                    </div>

                                    {item.description && (
                                      <p className="text-sm text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-3">"{item.description}"</p>
                                    )}

                                    <a
                                      href={searchUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-2 text-xs font-bold transition-colors mt-1 self-start px-4 py-2 rounded-lg ${isYoutube ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-navy/5 text-navy hover:bg-navy/10 hover:text-neon'}`}
                                    >
                                      {isYoutube ? <PlayCircle size={14} /> : <Search size={14} />}
                                      {isYoutube ? "Watch on YouTube" : "Search Resource"}
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {unit.resources.length === 0 && (
                        <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
                          <Library className="mx-auto text-slate-300 mb-3" size={32} />
                          <p className="text-sm text-slate-500 font-medium italic mb-2">No reliable recent resource identified for this specific unit.</p>
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(unit.title + " " + subject + " tutorial filetype:pdf")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-white bg-navy px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
                          >
                            <Search size={12} /> Search Web for PDF
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Practice Guidance */}
                  {unit.practiceGuidance.length > 0 && (
                    <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                      <h4 className="flex items-center gap-2 font-black text-orange-800 text-sm uppercase tracking-wider mb-3">
                        <Target size={16} /> Exam Focus & Guidance
                      </h4>
                      <ul className="space-y-2">
                        {unit.practiceGuidance.map((guide, i) => (
                          <li key={i} className="text-sm font-medium text-orange-900/80 leading-relaxed">
                            • {guide}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </AccordionItem>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button onClick={handleSavePDF} disabled={isGeneratingPdf} className="h-16 px-12 bg-navy text-white font-black rounded-2xl shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 min-w-[280px] disabled:opacity-70 disabled:cursor-wait">
              {isGeneratingPdf ? <Loader2 size={24} className="animate-spin text-neon" /> : <Printer size={24} className="text-neon" />}
              {isGeneratingPdf ? 'Exporting PDF...' : 'Download Master Plan'}
            </button>
            <button onClick={() => { setPlan(null); setSyllabusFiles([]); }} className="h-16 px-12 bg-white border-2 border-slate-200 text-navy font-black rounded-2xl shadow-sm hover:bg-slate-50 hover:border-navy transition-all flex items-center justify-center gap-4 min-w-[280px]">
              <Map size={24} /> Build New Roadmap
            </button>
          </div>
        </div>
      )}

      {/* OFF-SCREEN PDF RENDERER (A4 OPTIMIZED) */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '0',
          width: '800px',
          backgroundColor: '#ffffff'
        }}
      >
        <div
          id="learning-plan-pdf"
          className="bg-white p-16 text-black"
          style={{
            minHeight: '1122px',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '12pt',
            lineHeight: '1.6',
            textAlign: 'justify'
          }}
        >
          <div className="text-center mb-16 border-b-[8px] border-black pb-10">
            <h1 className="text-7xl font-black text-black uppercase tracking-tighter mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{subject}</h1>
            <p className="text-slate-600 font-black text-2xl uppercase tracking-[0.2em]">{college} • SEMESTER {semester}</p>
            <div className="mt-8 inline-flex items-center gap-3 bg-slate-100 px-8 py-3 rounded-full border border-black/5">
              <Sparkles className="text-black w-6 h-6" />
              <span className="text-black font-black text-sm uppercase tracking-widest">Master Study Roadmap • Note2Exam AI</span>
            </div>
          </div>

          <div className="space-y-20">
            {parsedPlan?.units.map((unit, i) => (
              <div key={i} className="html2pdf__page-break mb-16">
                <div className="flex items-center gap-5 mb-8 border-b-2 border-black/10 pb-4">
                  <div className="bg-black text-white text-2xl font-black px-5 py-2 rounded-xl">UNIT {i + 1}</div>
                  <h2 className="text-4xl font-black text-black uppercase tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>{unit.title}</h2>
                </div>

                {/* Core Topics PDF */}
                <div className="mb-10 p-8 bg-slate-50 border border-black/10 rounded-2xl">
                  <h3 className="font-black text-black uppercase tracking-wider mb-5 border-b border-black/5 pb-2 text-lg">Core Learning Objectives</h3>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-3">
                    {unit.coreTopics.map((t, idx) => (
                      <div key={idx} className="text-[11pt] text-black flex items-start gap-2">
                         <span className="font-bold">•</span> <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources PDF */}
                <div className="space-y-10">
                  <h3 className="font-black text-black uppercase tracking-wider mb-2 text-lg">Recommended Academic Resources</h3>
                  {unit.resources.map((res, ri) => (
                    <div key={ri} className="border-l-4 border-black pl-8 py-1 break-inside-avoid">
                      <h4 className="font-black text-xl text-black mb-4 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>{res.type}</h4>
                      <div className="space-y-6">
                        {res.items.map((item, ii) => (
                          <div key={ii} className="bg-white">
                            <div className="font-bold text-black text-lg leading-tight mb-1">{item.title}</div>
                            {item.sourceValue && (
                              <div className="text-[10pt] text-slate-500 font-bold uppercase tracking-wide mb-2">
                                <span className="opacity-60">{item.sourceLabel || 'Platform'}:</span> {item.sourceValue}
                              </div>
                            )}
                            {item.description && <div className="text-[11pt] text-black italic leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-black/5">"{item.description}"</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Guidance PDF */}
                {unit.practiceGuidance.length > 0 && (
                  <div className="mt-12 p-8 bg-slate-100 border-l-[12px] border-black text-black rounded-r-2xl">
                    <span className="font-black uppercase block mb-4 text-lg tracking-widest">Exam Focus & Strategic Guidance</span>
                    <ul className="space-y-3">
                        {unit.practiceGuidance.map((g, gi) => (
                          <li key={gi} className="text-[11pt] font-medium leading-relaxed flex items-start gap-2">
                             <span className="font-bold">›</span> {g}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-32 pt-16 border-t-2 border-black/5 text-center">
            <div className="text-slate-400 font-black text-xs uppercase tracking-[0.5em] mb-4">Note2Exam AI • Study Master Edition</div>
            <p className="text-[10pt] text-slate-400 max-w-2xl mx-auto italic font-medium">Success is a journey of planned steps. This roadmap is designed to optimize your exam preparation cycle.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPlanView;
