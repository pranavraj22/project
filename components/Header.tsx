import React from 'react';
import { Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-navy text-white py-8 px-4 text-center shadow-md">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-neon animate-pulse-slow" />
          <h1 className="text-3xl font-bold tracking-tight font-sans">
            Note2Exam AI
          </h1>
        </div>
        <p className="text-blue-100 text-lg font-medium opacity-90">
          Upload notes → Get exam questions in 2min
        </p>
      </div>
    </header>
  );
};

export default Header;