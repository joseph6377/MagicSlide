'use client'

import React, { FormEvent, ChangeEvent } from 'react';
import { Sparkles, Wand2, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';
import Image from 'next/image';

const Examples = [
  "RGM levers in CPG industry",
  "Digital transformation in consumer goods",
  "Blockchain for CPG traceability"
]

interface Props {
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void
  onChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void
  setChatInput: (input: string) => void
  value: string
}
export default function Welcome({onSubmit, onChange, value, setChatInput}: Props) {
  const handleClick = (example: string) => {
    setChatInput(example)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="max-w-2xl w-full mx-auto p-8 rounded-xl bg-gradient-to-b from-slate-800/50 to-slate-900/70 backdrop-blur-sm border border-slate-700 transition-all duration-300 hover:border-indigo-500/50 mt-[100px]">
        <div className="flex items-center justify-center mb-10">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Image 
              src="/logo.svg" 
              alt="SlideMagic AI Logo" 
              width={46} 
              height={46} 
              className="text-white" 
              priority
            />
          </div>
          <h1 className="text-4xl font-bold ml-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            SlideMagic AI
          </h1>
        </div>
        
        <p className="text-center text-slate-300 mb-8 text-lg leading-relaxed">
          Create beautiful presentations with AI. Just describe what you want.
          <br />
          <span className="mt-4 block font-medium text-indigo-300">
            To start, get a free Google Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="underline hover:text-indigo-200">Google AI Studio</a> and enter it in the settings.
          </span>
        </p>
        
        <div>
          <form className="relative" onSubmit={onSubmit}>
            <Textarea
              className="w-full p-6 pr-16 text-lg text-white bg-slate-900/80 border border-slate-700 rounded-lg resize-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              rows={4}
              value={value}
              onKeyDown={handleKeyDown}
              onChange={onChange}
              placeholder="Describe your presentation topic..."
            />
            {value && 
            <Button variant="secondary" size="icon" className='absolute right-4 top-4 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-md'>
              <Wand2 className="h-6 w-6 text-white" />
            </Button>}
            <div className="absolute left-4 bottom-4 right-4 flex justify-between items-center text-sm text-slate-400">
              <span className="font-medium">Powered by AI</span>
            </div>
          </form>
        </div>
        
        <div className="mt-10">
          <p className="text-base text-slate-300 mb-4 font-medium">Try one of these examples:</p>
          <div className="flex flex-wrap gap-3">
            {Examples.map((example, index) => (
              <button 
                key={index} 
                className="px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-full text-base text-slate-300 hover:bg-indigo-600/20 hover:border-indigo-500 hover:text-white transition-all duration-300 text-left"
                onClick={() => handleClick(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Credits section with improved styling */}
      <div className="mt-8 text-center max-w-2xl w-full mx-auto">
        <p className="text-sm text-slate-400 leading-relaxed">
          <span className="block mb-2">Built by <a href="https://josepht.in" target="_blank" className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium">Joseph Thekkekara</a></span>
          <span>Based on <a href="https://github.com/YOYZHANG/ai-ppt" target="_blank" className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium">RevealJS AI</a> by YOYZHANG</span>
        </p>
      </div>
    </div>
  );
};