import React, { useState } from 'react';
import { ArrowLeft, Search, Youtube, ExternalLink, Lightbulb, Sparkles, Globe } from 'lucide-react';
import { getTopicVideoResources, getTopicZeroToHero, ClarifierVideo, getTopicVideoResourcesWithWebSearch, SearchResult } from '../services/geminiService';

interface TopicClarifierViewProps {
  onBack: () => void;
  onLoadingChange: (loading: boolean) => void;
}

type Mode = 'select' | 'videos' | 'explanation';

const TopicClarifierView: React.FC<TopicClarifierViewProps> = ({ onBack, onLoadingChange }) => {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<Mode>('select');
  const [videoResults, setVideoResults] = useState<ClarifierVideo[] | null>(null);
  const [webResults, setWebResults] = useState<SearchResult[] | null>(null);
  const [explanationResult, setExplanationResult] = useState<string | null>(null);

  const handleFetchVideos = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first.");
      return;
    }
    onLoadingChange(true);
    try {
      // Fetch both AI suggestions and live web search results
      const { aiSuggestions, webResults: liveResults } = await getTopicVideoResourcesWithWebSearch(topic);
      setVideoResults(aiSuggestions);
      setWebResults(liveResults);
      setMode('videos');
    } catch (err) {
      alert("Failed to fetch videos. Please try again.");
    } finally {
      onLoadingChange(false);
    }
  };

  const handleFetchExplanation = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first.");
      return;
    }
    onLoadingChange(true);
    try {
      const result = await getTopicZeroToHero(topic);
      setExplanationResult(result);
      setMode('explanation');
    } catch (err) {
      alert("Failed to generate explanation. Please try again.");
    } finally {
      onLoadingChange(false);
    }
  };

  // Renderer for Markdown-like text
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle "1. Title" headers from Mode 2
      if (line.match(/^\d+\.\s+[A-Za-z]/)) {
        return <h2 key={i} className="text-2xl font-bold text-navy mt-8 mb-4 border-b border-blue-100 pb-2">{line}</h2>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-bold text-navy mt-8 mb-4 border-b border-blue-100 pb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <li key={i} className="ml-4 mb-2 text-slate-700 list-disc pl-2 marker:text-neon">
            {line.replace(/^[-•]\s*/, '').split('**').map((part, idx) =>
              idx % 2 === 1 ? <strong key={idx} className="text-slate-900 font-bold">{part}</strong> : part
            )}
          </li>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-2"></div>;

      return (
        <p key={i} className="text-slate-700 mb-2 leading-relaxed">
          {line.split('**').map((part, idx) =>
            idx % 2 === 1 ? <strong key={idx} className="text-slate-900 font-bold">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-down pb-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-navy mb-6 transition-colors font-black group self-start"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {/* Input Section - Always visible if selecting or if results are shown (for context) */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-navy mb-2 flex items-center gap-2">
          <Sparkles className="text-neon" /> Topic Clarifier
        </h1>
        <p className="text-slate-500 mb-6">Enter a complex topic and choose how you want to learn it.</p>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && mode !== 'select') {
                if (mode === 'videos') handleFetchVideos();
                else if (mode === 'explanation') handleFetchExplanation();
              }
            }}
            placeholder="e.g. Fourier Transform, Photosynthesis, Navier-Stokes Equation..."
            className={`w-full pl-12 ${mode !== 'select' ? 'pr-24' : 'pr-4'} py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-neon focus:shadow-[0_0_15px_rgba(0,212,170,0.2)] outline-none transition-all text-black placeholder:text-slate-400 font-medium`}
          />
          {mode !== 'select' && (
            <button
              onClick={() => {
                if (mode === 'videos') handleFetchVideos();
                else if (mode === 'explanation') handleFetchExplanation();
              }}
              className="absolute right-2 top-1.5 px-4 py-2 bg-gradient-to-r from-neon to-blue-500 text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
            >
              <Search size={16} />
              Search
            </button>
          )}
        </div>

        {/* Selection Cards */}
        {mode === 'select' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button
              onClick={handleFetchVideos}
              className="group text-left p-6 rounded-2xl border-2 border-slate-100 hover:border-red-200 hover:bg-red-50/50 transition-all shadow-sm hover:shadow-md"
            >
              <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-4 group-hover:scale-110 transition-transform">
                <Youtube size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Free Video Resources</h3>
              <p className="text-sm text-slate-500">Curated list of the best YouTube explanations, visualizations, and lectures.</p>
            </button>

            <button
              onClick={handleFetchExplanation}
              className="group text-left p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all shadow-sm hover:shadow-md"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Lightbulb size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Zero to Hero Explanation</h3>
              <p className="text-sm text-slate-500">Detailed text guide covering basics, technical depth, and exam keywords.</p>
            </button>
          </div>
        )}
      </div>

      {/* Results: Videos */}
      {mode === 'videos' && videoResults && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Top Video Picks for "{topic}"</h2>
            <button onClick={() => setMode('select')} className="text-sm text-navy font-medium hover:underline">Change Mode</button>
          </div>

          {videoResults.map((video, idx) => (
            <a
              key={idx}
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white p-5 rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-red-700 mb-1">{video.title}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{video.channel}</span>
                    <span>•</span>
                    <span>YouTube</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{video.description}</p>
                </div>
                <div className="ml-4 bg-slate-50 p-3 rounded-full text-slate-400 group-hover:text-red-600 group-hover:bg-red-50 transition-colors">
                  <ExternalLink size={20} />
                </div>
              </div>
            </a>
          ))}

          {/* Live Web Search Results */}
          {webResults && webResults.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-8 mb-4">
                <Globe className="text-neon" size={20} />
                <h2 className="text-xl font-bold text-slate-800">Latest Web Resources</h2>
                <span className="text-xs bg-neon/10 text-neon px-2 py-0.5 rounded-full font-medium">LIVE</span>
              </div>

              {webResults.map((result, idx) => (
                <a
                  key={`web-${idx}`}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white p-5 rounded-xl border border-slate-200 hover:border-neon hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-neon mb-1">{result.title}</h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        <span className="bg-neon/10 text-neon px-2 py-0.5 rounded-full">{result.source}</span>
                        <span>•</span>
                        <span>Web</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{result.description.substring(0, 150)}...</p>
                    </div>
                    <div className="ml-4 bg-slate-50 p-3 rounded-full text-slate-400 group-hover:text-neon group-hover:bg-neon/10 transition-colors">
                      <ExternalLink size={20} />
                    </div>
                  </div>
                </a>
              ))}
            </>
          )}
        </div>
      )}

      {/* Results: Explanation */}
      {mode === 'explanation' && explanationResult && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">Zero to Hero: {topic}</h2>
            <button onClick={() => setMode('select')} className="text-sm text-navy font-medium hover:underline">Change Mode</button>
          </div>
          <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
            <div className="prose max-w-none">
              {renderMarkdown(explanationResult)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicClarifierView;