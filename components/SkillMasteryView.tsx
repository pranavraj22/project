import React, { useState } from 'react';
import { ArrowLeft, BookOpen, GraduationCap, Sparkles, Target, Loader2, Award, Youtube, Map, FileText, Network, ExternalLink, Download, CheckCircle2 } from 'lucide-react';
import { generateSkillRoadmap } from '../services/geminiService';
import { generateSkillRoadmapPdf } from '../services/pdfService';
import { SkillRoadmap } from '../types';

interface SkillMasteryViewProps {
    onBack: () => void;
    onLoadingChange: (loading: boolean) => void;
}

const SkillMasteryView: React.FC<SkillMasteryViewProps> = ({ onBack, onLoadingChange }) => {
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('');
    const [roadmap, setRoadmap] = useState<SkillRoadmap | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const handleAnalyze = async () => {
        if (!topic.trim()) {
            setError("Please specify the topic or skill to analyze.");
            return;
        }
        if (!goal) {
            setError("Please select your learning goal.");
            return;
        }

        setError(null);
        setRoadmap(null);
        onLoadingChange(true);

        try {
            const data = await generateSkillRoadmap(topic, goal);
            setRoadmap(data);
        } catch (err) {
            setError("Failed to generate roadmap. Please check your connection and try again.");
        } finally {
            onLoadingChange(false);
        }
    };

    const handleExportPDF = async () => {
        if (!roadmap) return;
        setIsGeneratingPdf(true);
        // Allow time for the hidden DOM to fully render images/icons
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            await generateSkillRoadmapPdf(topic);
        } catch (err) {
            console.error(err);
            alert("Failed to generate PDF");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto pb-16 animate-slide-down">
            <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-navy mb-6 transition-colors font-black group self-start"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>

            {!roadmap && (
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 mb-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-navy p-3 rounded-2xl shadow-lg">
                            <Award className="w-8 h-8 text-neon" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Skill Mastery (Zero to Hero)</h2>
                            <p className="text-slate-500 font-medium text-sm">Your linear path to complete mastery.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600 ml-1">
                                What topic or skill are you mastering? <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <BookOpen className="absolute left-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => { setTopic(e.target.value); if (error) setError(null); }}
                                    placeholder="e.g. Data Structures, Academic Writing, Calculus..."
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white outline-none transition-all duration-300 placeholder:text-slate-400 text-black border-slate-200 focus:border-neon focus:shadow-[0_0_15px_rgba(0,212,170,0.4)]`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-600 ml-1">
                                Learning Goal <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Sparkles className="absolute left-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                                <select
                                    value={goal}
                                    onChange={(e) => { setGoal(e.target.value); if (error) setError(null); }}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white outline-none transition-all duration-300 text-black appearance-none cursor-pointer border-slate-200 focus:border-neon focus:shadow-[0_0_15px_rgba(0,212,170,0.4)]`}
                                >
                                    <option value="" disabled>Select your goal</option>
                                    <option value="Exam preparation">Exam preparation</option>
                                    <option value="Project building">Project building</option>
                                    <option value="Research understanding">Research understanding</option>
                                    <option value="Industry readiness">Industry readiness</option>
                                </select>
                                <div className="absolute right-4 top-4 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 animate-slide-down">
                                <p className="font-medium text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleAnalyze}
                            className="w-full h-[60px] bg-neon hover:bg-neon-hover text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,212,170,0.4)] active:scale-[0.98]"
                        >
                            🚀 Generate Mastery Path
                        </button>
                    </div>
                </div>
            )}

            {roadmap && (
                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                                <Target size={12} /> {goal}
                            </div>
                            <h3 className="text-2xl font-black text-navy flex items-center gap-2">
                                {topic}
                            </h3>
                        </div>
                        
                        <button
                            onClick={handleExportPDF}
                            disabled={isGeneratingPdf}
                            className="bg-navy hover:bg-navy/90 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform hover:scale-[1.05] active:scale-[0.95] shadow-lg disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="text-neon" />}
                            {isGeneratingPdf ? "Generating PDF..." : "Export Roadmap"}
                        </button>
                    </div>

                    <div className="space-y-12 animate-fade-in">
                        {/* 1. Skill Overview */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-navy pb-2 border-b-2 border-slate-50">
                                <Target className="w-5 h-5 text-neon" />
                                <h4 className="text-lg font-black uppercase tracking-wider">1. Skill Overview</h4>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <p className="text-slate-700 leading-relaxed font-medium">{roadmap.overview}</p>
                            </div>
                        </section>

                        {/* 2. YouTube Foundation Resources */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-navy pb-2 border-b-2 border-slate-50">
                                <Youtube className="w-5 h-5 text-red-500" />
                                <h4 className="text-lg font-black uppercase tracking-wider">2. YouTube Foundation Resources</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-8">
                                {/* Beginner Section */}
                                {roadmap.youtubeFoundation.beginner && roadmap.youtubeFoundation.beginner.length > 0 && (
                                    <div className="space-y-4">
                                        <h5 className="text-md font-bold text-navy uppercase tracking-wider border-l-4 border-neon pl-3">Beginner Level</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {roadmap.youtubeFoundation.beginner.map((video, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-neon transition-colors group">
                                                    <h5 className="font-bold text-slate-800 line-clamp-1">{video.title}</h5>
                                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">{video.channel}</p>
                                                    <a
                                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-navy font-bold text-sm mt-4 hover:text-neon transition-colors"
                                                    >
                                                        Search on YouTube <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Intermediate Section */}
                                {roadmap.youtubeFoundation.intermediate && roadmap.youtubeFoundation.intermediate.length > 0 && (
                                    <div className="space-y-4">
                                        <h5 className="text-md font-bold text-navy uppercase tracking-wider border-l-4 border-indigo-500 pl-3">Intermediate Level</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {roadmap.youtubeFoundation.intermediate.map((video, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-colors group">
                                                    <h5 className="font-bold text-slate-800 line-clamp-1">{video.title}</h5>
                                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">{video.channel}</p>
                                                    <a
                                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-navy font-bold text-sm mt-4 hover:text-indigo-500 transition-colors"
                                                    >
                                                        Search on YouTube <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Advanced Section */}
                                {roadmap.youtubeFoundation.advanced && roadmap.youtubeFoundation.advanced.length > 0 && (
                                    <div className="space-y-4">
                                        <h5 className="text-md font-bold text-navy uppercase tracking-wider border-l-4 border-purple-500 pl-3">Advanced Level</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {roadmap.youtubeFoundation.advanced.map((video, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-500 transition-colors group">
                                                    <h5 className="font-bold text-slate-800 line-clamp-1">{video.title}</h5>
                                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">{video.channel}</p>
                                                    <a
                                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-navy font-bold text-sm mt-4 hover:text-purple-500 transition-colors"
                                                    >
                                                        Search on YouTube <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 3. Guided Learning Path */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-navy pb-2 border-b-2 border-slate-50">
                                <Map className="w-5 h-5 text-indigo-500" />
                                <h4 className="text-lg font-black uppercase tracking-wider">3. Guided Learning Path (Zero to Hero)</h4>
                            </div>
                            <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                                {roadmap.learningPath.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 relative">
                                        <div className="w-10 h-10 rounded-full bg-navy text-neon flex items-center justify-center font-black flex-shrink-0 z-10 border-4 border-white">
                                            {idx + 1}
                                        </div>
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex-1">
                                            <h5 className="font-bold text-navy">{item.step}</h5>
                                            <p className="text-sm text-slate-600 mt-1 mb-3">{item.description}</p>
                                            {item.practice && (
                                                <div className="bg-white p-3 rounded-xl border border-slate-200 text-sm">
                                                    <span className="font-bold text-green-600">💪 Practice: </span>
                                                    <span className="text-slate-600">{item.practice}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 4. Research Paper Navigator */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-navy pb-2 border-b-2 border-slate-50">
                                <FileText className="w-5 h-5 text-emerald-500" />
                                <h4 className="text-lg font-black uppercase tracking-wider">4. Research Paper Navigator</h4>
                            </div>
                            <div className="space-y-3">
                                {roadmap.researchPapers.map((paper, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                                        <h5 className="font-bold text-slate-800 flex items-center justify-between gap-4">
                                            {paper.title}
                                            <a href={paper.link} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-neon"><ExternalLink size={16} /></a>
                                        </h5>
                                        <p className="text-sm text-slate-500 mt-1">{paper.summary}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 5. Concept Dependency Map */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-navy pb-2 border-b-2 border-slate-50">
                                <Network className="w-5 h-5 text-amber-500" />
                                <h4 className="text-lg font-black uppercase tracking-wider">5. Concept Dependency Map</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <span className="text-xs font-black uppercase text-slate-400 tracking-tighter">Prerequisites</span>
                                    <div className="space-y-2">
                                        {roadmap.dependencyMap.prerequisites.map((p, i) => (
                                            <div key={i} className="text-sm font-bold p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">{p}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-xs font-black uppercase text-slate-400 tracking-tighter">Core Mastery</span>
                                    <div className="text-sm font-bold p-3 bg-navy text-neon rounded-xl border border-navy shadow-lg text-center ring-4 ring-slate-100">{roadmap.dependencyMap.currentSkill}</div>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-xs font-black uppercase text-slate-400 tracking-tighter">Advanced Topics</span>
                                    <div className="space-y-2">
                                        {roadmap.dependencyMap.advancedTopics.map((a, i) => (
                                            <div key={i} className="text-sm font-bold p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">{a}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* OFF-SCREEN PDF RENDERER (A4 OPTIMIZED) */}
            {roadmap && (
                <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '800px' }}>
                    <div
                        id="skill-mastery-pdf"
                        className="bg-white p-16 text-black"
                        style={{
                            minHeight: '1122px',
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: '12pt',
                            lineHeight: '1.6',
                            textAlign: 'justify'
                        }}
                    >
                         <div className="text-center mb-20 border-b-[10px] border-black pb-12">
                            <h1 className="text-7xl font-black text-black uppercase tracking-tighter mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{topic}</h1>
                            <p className="text-slate-600 font-black text-3xl uppercase tracking-[0.3em]">ZERO TO HERO MASTERY PATH</p>
                            <div className="mt-8 inline-flex items-center gap-3 bg-slate-100 px-10 py-4 rounded-full border border-black/10">
                                <Award className="text-black w-8 h-8" />
                                <span className="text-black font-black text-lg uppercase tracking-widest">Goal: {goal}</span>
                            </div>
                        </div>

                        {/* 1. Skill Overview */}
                        <div className="mb-16">
                            <h3 className="text-3xl font-black text-black border-b-4 border-black/10 pb-4 mb-8 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>1. Executive Summary</h3>
                            <p className="text-[13pt] text-black leading-relaxed font-medium bg-slate-50 p-8 rounded-3xl border border-black/5">{roadmap.overview}</p>
                        </div>

                        {/* 2. YouTube Foundation Resources */}
                         <div className="mb-16">
                            <h3 className="text-3xl font-black text-black border-b-4 border-black/10 pb-4 mb-10 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>2. Foundation Resources</h3>
                            <div className="space-y-10">
                                {['beginner', 'intermediate', 'advanced'].map((level) => {
                                    // @ts-ignore
                                    const resources = roadmap.youtubeFoundation[level];
                                    if (!resources || resources.length === 0) return null;
                                    return (
                                        <div key={level} className="break-inside-avoid border-l-8 border-black pl-8 py-2">
                                            <h4 className="font-black text-black text-2xl uppercase tracking-wider mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>{level} Tier</h4>
                                            <div className="space-y-6">
                                                {resources.map((vid: any, i: number) => (
                                                    <div key={i} className="mb-2">
                                                        <div className="font-black text-black text-xl leading-tight mb-1">{vid.title}</div>
                                                        <div className="text-sm text-slate-500 font-black uppercase tracking-widest opacity-80">Channel: {vid.channel}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* 3. Learning Path */}
                        <div className="mb-16 html2pdf__page-break">
                            <h3 className="text-3xl font-black text-black border-b-4 border-black/10 pb-4 mb-12 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>3. The Master Road</h3>
                            <div className="space-y-12">
                                {roadmap.learningPath.map((item, idx) => (
                                    <div key={idx} className="flex gap-8 break-inside-avoid">
                                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-black text-xl flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="font-black text-black text-2xl mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{item.step}</h5>
                                            <p className="text-[12pt] text-black leading-relaxed font-medium mb-4">{item.description}</p>
                                            {item.practice && (
                                                 <div className="text-[11pt] font-black text-black bg-slate-100 p-5 rounded-2xl border-2 border-black/5 inline-block">
                                                    <span className="opacity-60 uppercase mr-2">Practical Focus:</span> {item.practice}
                                                 </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                         {/* 4. Research Papers */}
                         <div className="mb-16 break-inside-avoid">
                            <h3 className="text-3xl font-black text-black border-b-4 border-black/10 pb-4 mb-10 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>4. Academic Foundations</h3>
                            <div className="space-y-8">
                                {roadmap.researchPapers.map((paper, idx) => (
                                    <div key={idx} className="p-8 bg-slate-50 rounded-[2.5rem] border border-black/10">
                                        <div className="font-black text-black text-2xl mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{paper.title}</div>
                                        <p className="text-[12pt] text-black italic leading-relaxed">"{paper.summary}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                         {/* 5. Dependency Map */}
                         <div className="break-inside-avoid">
                            <h3 className="text-3xl font-black text-black border-b-4 border-black/10 pb-4 mb-12 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>5. Strategic Dependency Map</h3>
                            <div className="grid grid-cols-3 gap-8 text-center">
                                 <div className="space-y-4">
                                     <div className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Prerequisites</div>
                                     {roadmap.dependencyMap.prerequisites.map((p, i) => (
                                         <div key={i} className="text-[11pt] font-bold p-4 bg-slate-50 rounded-2xl border border-black/5">{p}</div>
                                     ))}
                                 </div>
                                 <div className="space-y-4">
                                     <div className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Core Mastery</div>
                                     <div className="text-lg font-black p-6 bg-black text-white rounded-[2rem] shadow-2xl">{roadmap.dependencyMap.currentSkill}</div>
                                 </div>
                                 <div className="space-y-4">
                                     <div className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Next Horizons</div>
                                     {roadmap.dependencyMap.advancedTopics.map((p, i) => (
                                         <div key={i} className="text-[11pt] font-bold p-4 bg-slate-100 rounded-2xl border border-black/5">{p}</div>
                                     ))}
                                 </div>
                            </div>
                        </div>

                        <div className="mt-40 pt-16 border-t-2 border-black/5 text-center">
                            <div className="text-slate-400 font-black text-sm uppercase tracking-[0.8em] mb-4">Note2Exam AI • {new Date().getFullYear()}</div>
                            <p className="text-[10pt] text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed">Proprietary AI Synthesis • Optimized for High-End Academic Performance</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillMasteryView;