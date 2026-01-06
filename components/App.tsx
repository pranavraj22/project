import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, Loader2, Map, Sparkles, ClipboardList, GraduationCap, Layers } from 'lucide-react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ResultsSection from './components/ResultsSection';
import BoxBreathingLoader from './components/BoxBreathingLoader';
import LearningPlanView from './components/LearningPlanView';
import TopicClarifierView from './components/TopicClarifierView';
import { UploadedFile, UserDetails, ExamData } from './types';
import { generateExamContent } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'exam' | 'plan' | 'clarifier'>('exam');
  const [syllabusFiles, setSyllabusFiles] = useState<UploadedFile[]>([]);
  const [details, setDetails] = useState<UserDetails>({
    college: '',
    subject: '',
    semester: '',
    examType: '',
    units: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState<{
    files?: string;
    college?: string;
    subject?: string;
    semester?: string;
    examType?: string;
    units?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<ExamData | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSyllabusFilesChange = (newFiles: UploadedFile[]) => {
    setSyllabusFiles(newFiles);
    if (newFiles.length > 0 && fieldErrors.files) {
      setFieldErrors(prev => ({ ...prev, files: undefined }));
    }
  };

  const validateForm = () => {
    const errors: typeof fieldErrors = {};
    let isValid = true;

    if (syllabusFiles.length === 0) {
      errors.files = "Please upload the Official Syllabus (PDF or Image) to proceed.";
      isValid = false;
    }
    if (!details.college.trim()) {
      errors.college = "College Name is required.";
      isValid = false;
    }
    if (!details.subject.trim()) {
      errors.subject = "Subject is required.";
      isValid = false;
    }
    if (!details.semester.trim()) {
      errors.semester = "Semester is required.";
      isValid = false;
    }
    if (!details.examType) {
      errors.examType = "Please select an Exam Type.";
      isValid = false;
    }
    if (details.examType === 'Mid Examination' && !details.units?.trim()) {
      errors.units = "Please specify the Units/Modules for the Mid Exam.";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setApiError(null);
    setResult(null);

    try {
      // Passing empty array for lecture notes as the button was removed
      const data = await generateExamContent([], syllabusFiles, details);
      setResult(data);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00D4AA', '#1E3A8A', '#ffffff']
      });
      
    } catch (err: any) {
      console.error("Generation Error:", err);
      let msg = "Failed to generate content. Please try again with clearer files.";
      if (err instanceof Error && err.message.includes("quota")) {
        msg = "Service busy (Quota Exceeded). Try again in a minute.";
      }
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col print:bg-white relative">
      {loading && <BoxBreathingLoader />}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-grow flex flex-col items-center p-4 sm:p-6 w-full max-w-4xl mx-auto print:p-0 print:w-full print:max-w-none">
        
        {view === 'plan' ? (
          <LearningPlanView onBack={() => setView('exam')} onLoadingChange={setLoading} />
        ) : view === 'clarifier' ? (
          <TopicClarifierView onBack={() => setView('exam')} onLoadingChange={setLoading} />
        ) : (
          <>
            <div className={`w-full max-w-2xl bg-white rounded-3xl shadow-xl p-6 sm:p-8 transition-all duration-500 ease-out z-10 print:hidden ${result ? 'mb-8' : 'mb-0'}`}>
              
              <div className="mb-8">
                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1 flex items-center gap-2">
                  <ClipboardList size={18} className="text-navy" /> Official Syllabus <span className="text-red-500">*</span>
                </label>
                <UploadZone onFilesChange={handleSyllabusFilesChange} selectedFiles={syllabusFiles} />
                {fieldErrors.files && (
                  <p className="text-red-500 text-sm mt-2 ml-1 flex items-center gap-1">
                    <AlertCircle size={14} /> {fieldErrors.files}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-2 ml-1 uppercase font-black tracking-widest opacity-60">Source of Truth: Upload your university syllabus for precision.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">College Name <span className="text-red-500">*</span></label>
                  <input type="text" name="college" value={details.college} onChange={handleInputChange} placeholder="e.g. VIT Vellore" className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all duration-300 placeholder:text-slate-400 text-black ${fieldErrors.college ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-neon focus:shadow-[0_0_15px_rgba(0,212,170,0.4)]'}`} />
                  {fieldErrors.college && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.college}</p>}
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Exam Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-3.5 text-slate-400 w-5 h-5 pointer-events-none" />
                    <select 
                      name="examType" 
                      value={details.examType} 
                      onChange={handleInputChange} 
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white outline-none transition-all duration-300 text-black appearance-none cursor-pointer ${fieldErrors.examType ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-neon focus:shadow-[0_0_15px_rgba(0,212,170,0.4)]'}`}
                    >
                      <option value="" disabled>Select Exam Format</option>
                      <option value="Semester Examination">Semester Examination (Theory & Structure)</option>
                      <option value="Mid Examination">Mid Examination (Unit Restricted)</option>
                      <option value="Competitive Examination">Competitive Examination (Numericals & Objective)</option>
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  {fieldErrors.examType && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.examType}</p>}
                </div>

                {/* Units Input - Available for all, but highlighted/required for Mid Exam */}
                <div className={`group animate-fade-in transition-all duration-300 ${details.examType === 'Mid Examination' ? 'bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm' : ''}`}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
                    Target Units / Modules {details.examType === 'Mid Examination' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal text-xs ml-1">(Optional)</span>}
                  </label>
                  <div className="relative">
                    <Layers className={`absolute left-4 top-3.5 w-5 h-5 pointer-events-none ${details.examType === 'Mid Examination' ? 'text-navy' : 'text-slate-400'}`} />
                    <input 
                      type="text" 
                      name="units" 
                      value={details.units || ''} 
                      onChange={handleInputChange} 
                      placeholder={details.examType === 'Mid Examination' ? "e.g. Unit 1 & 2 (Strictly)" : "e.g. Unit 3 (Leave empty for full syllabus)"} 
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-white outline-none transition-all duration-300 placeholder:text-slate-400 text-black ${fieldErrors.units ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-navy focus:shadow-sm'}`} 
                    />
                  </div>
                  {fieldErrors.units && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.units}</p>}
                  {details.examType === 'Mid Examination' && (
                    <p className="text-[10px] text-blue-600 mt-2 ml-1 font-bold">⚠️ Questions will be strictly limited to these units.</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Subject <span className="text-red-500">*</span></label>
                    <input type="text" name="subject" value={details.subject} onChange={handleInputChange} placeholder="e.g. Digital Circuits" className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all duration-300 placeholder:text-slate-400 text-black ${fieldErrors.subject ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-neon focus:shadow-[0_0_15px_rgba(0,212,170,0.4)]'}`} />
                    {fieldErrors.subject && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.subject}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Semester <span className="text-red-500">*</span></label>
                    <input type="text" name="semester" value={details.semester} onChange={handleInputChange} placeholder="e.g. 3rd Sem" className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all duration-300 placeholder:text-slate-400 text-black ${fieldErrors.semester ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-neon focus:shadow-[0_0_15px_rgba(0,212,170,0.4)]'}`} />
                    {fieldErrors.semester && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.semester}</p>}
                  </div>
                </div>
              </div>

              {apiError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 animate-slide-down">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p className="font-medium text-sm">{apiError}</p>
                </div>
              )}

              <button onClick={handleGenerate} disabled={loading} className={`w-full h-[60px] rounded-xl font-bold text-lg text-white flex items-center justify-center gap-3 transition-all transform overflow-hidden mb-4 ${loading ? 'bg-slate-400 cursor-wait' : 'bg-neon hover:bg-neon-hover hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,212,170,0.4)] active:scale-[0.98]'}`}>
                {loading ? <><Loader2 className="animate-spin" /> Processing...</> : <>🚀 Generate Exam Master Guide</>}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setView('plan')} disabled={loading} className="h-[50px] rounded-xl font-semibold text-navy border-2 border-navy/10 hover:border-navy hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group text-sm sm:text-base">
                  <Map size={18} className="group-hover:scale-110 transition-transform" />
                  Create Learning Plan
                </button>
                <button onClick={() => setView('clarifier')} disabled={loading} className="h-[50px] rounded-xl font-semibold text-white bg-navy hover:bg-navy/90 transition-all flex items-center justify-center gap-2 group text-sm sm:text-base shadow-md hover:shadow-lg">
                  <Sparkles size={18} className="text-neon group-hover:scale-110 transition-transform" />
                  Topic Clarifier
                </button>
              </div>
            </div>
            {result && <ResultsSection data={result} userDetails={details} />}
          </>
        )}
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm print:hidden">Powered by Gemini 3 Pro • Optimized for University Standards</footer>
    </div>
  );
};

export default App;