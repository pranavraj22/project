import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, X, Plus } from 'lucide-react';
import { UploadedFile } from '../types';

interface UploadZoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
  selectedFiles: UploadedFile[];
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesChange, selectedFiles }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    const filesArray = Array.from(files);

    const processFile = (file: File) => {
      return new Promise<UploadedFile | null>((resolve) => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          alert(`File ${file.name} is not a supported format (Image or PDF).`);
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const base64String = (e.target.result as string).split(',')[1];
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              file,
              previewUrl: URL.createObjectURL(file),
              base64: base64String,
              mimeType: file.type
            });
          } else {
            resolve(null);
          }
        };
        reader.readAsDataURL(file);
      });
    };

    Promise.all(filesArray.map(processFile)).then((results) => {
      const validResults = results.filter((f): f is UploadedFile => f !== null);
      onFilesChange([...selectedFiles, ...validResults]);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [onFilesChange, selectedFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    onFilesChange(selectedFiles.filter(f => f.id !== id));
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative w-full min-h-[250px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 p-6
          ${isDragging ? 'border-neon bg-neon/5 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
          ${selectedFiles.length > 0 ? 'border-navy/20' : ''}
        `}
      >
        {selectedFiles.length > 0 ? (
          <div className="w-full space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedFiles.map((file) => (
                <div key={file.id} className="relative group bg-white border border-slate-200 rounded-xl p-2 shadow-sm flex flex-col items-center transition-all hover:shadow-md">
                   <button 
                    onClick={() => removeFile(file.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm z-10"
                   >
                     <X size={14} />
                   </button>
                   
                   {file.mimeType.startsWith('image/') ? (
                     <div className="h-20 w-full mb-2 rounded overflow-hidden bg-slate-50">
                       <img 
                        src={file.previewUrl} 
                        alt="Preview" 
                        className="h-full w-full object-contain" 
                       />
                     </div>
                   ) : (
                     <div className="h-20 w-full flex flex-col items-center justify-center bg-red-50 rounded-lg mb-2 border border-red-100 group-hover:bg-red-100 transition-colors">
                       <FileText className="w-8 h-8 text-red-500 mb-1" />
                       <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">PDF</span>
                     </div>
                   )}
                   <p className="text-[10px] font-bold text-slate-700 truncate w-full text-center px-1" title={file.file.name}>
                     {file.file.name}
                   </p>
                </div>
              ))}
              
              <label className="cursor-pointer border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 hover:bg-white hover:border-neon transition-all group min-h-[120px]">
                <Plus className="w-6 h-6 text-slate-300 group-hover:text-neon mb-1" />
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-neon">Add More</span>
                <input type="file" className="hidden" accept="image/*,.pdf" multiple onChange={handleFileInput} />
              </label>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 font-medium">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected for analysis
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <UploadCloud className="w-10 h-10 text-neon" />
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-2">Drag syllabus or PDF here</p>
            <p className="text-slate-500 text-sm mb-6">Select one or multiple photos/PDFs</p>
            <label className="cursor-pointer">
              <span className="bg-neon text-white font-semibold py-2.5 px-8 rounded-full hover:bg-neon-hover transition-all shadow-md hover:shadow-lg active:transform active:scale-95 inline-flex items-center gap-2">
                <Plus size={18} /> Browse Files
              </span>
              <input type="file" className="hidden" accept="image/*,.pdf" multiple onChange={handleFileInput} />
            </label>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadZone;