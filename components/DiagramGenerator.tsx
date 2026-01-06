import React, { useState, useEffect } from 'react';
import { Image, Loader2, RefreshCw } from 'lucide-react';
import { generateDiagramImage } from '../services/geminiService';

interface DiagramGeneratorProps {
  prompt: string;
  onlyCached?: boolean;
}

const DiagramGenerator: React.FC<DiagramGeneratorProps> = ({ prompt, onlyCached = false }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(false);
    try {
      const url = await generateDiagramImage(prompt, onlyCached);
      if (url) {
        setImageUrl(url);
      } else {
        // If we are in onlyCached mode, a null return is not an error, it just means no image.
        if (!onlyCached) {
          setError(true);
        }
      }
    } catch (err) {
      if (!onlyCached) {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on mount
  useEffect(() => {
    generate();
  }, [prompt]);

  if (error) {
    return (
      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <span className="text-sm text-slate-500">Could not generate diagram</span>
        <button 
          onClick={generate}
          className="text-navy hover:text-neon transition-colors"
          title="Retry"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 break-inside-avoid">
      {loading ? (
        <div className="w-full h-64 bg-slate-50 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 gap-3 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-neon" />
          <span className="text-sm font-medium">Drawing diagram with Nano Banana...</span>
        </div>
      ) : imageUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Image size={12} />
            <span>AI Generated</span>
          </div>
          <img 
            src={imageUrl} 
            alt="AI Generated Diagram" 
            className="w-full h-auto object-contain max-h-[500px] bg-white" 
          />
        </div>
      ) : null}
    </div>
  );
};

export default DiagramGenerator;