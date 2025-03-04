'use client'

import React, { FormEvent, ChangeEvent } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Examples = [
  "RGM levers in CPG industry",
  "Digital transformation in consumer goods",
  "Blockchain for CPG traceability"
]

// Theme preview images
const themePreviewImages: Record<string, string> = {
  black: '/theme-previews/black.svg',
  white: '/theme-previews/white.svg',
  league: '/theme-previews/league.svg',
  night: '/theme-previews/night.svg',
  moon: '/theme-previews/moon.svg',
  solarized: '/theme-previews/solarized.svg'
}

interface Props {
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void
  onChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void
  setChatInput: (input: string) => void
  value: string
  theme?: string
  setTheme?: (theme: string) => void
  themes?: string[]
}

export default function Welcome({onSubmit, onChange, value, setChatInput, theme, setTheme, themes}: Props) {
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
    <div className="flex flex-col items-center w-full pt-16 pb-8 px-4">
      {/* Header with logo - Now positioned at the top of the component and not inside the card */}
      <div className="flex items-center justify-center mb-6 w-full">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <Image 
            src="/logo.svg" 
            alt="SlideMagic AI Logo" 
            width={40} 
            height={40} 
            className="text-white" 
            priority
          />
        </div>
        <h1 className="text-3xl font-bold ml-3 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
          SlideMagic AI
        </h1>
      </div>
      
      <div className="max-w-3xl w-full mx-auto rounded-xl bg-slate-800/40 backdrop-blur-sm border border-slate-700 shadow-xl shadow-indigo-500/5 overflow-hidden">
        {/* Description section */}
        <div className="p-6 border-b border-slate-700/50">
          <p className="text-center text-slate-300 leading-relaxed">
            Create beautiful presentations with AI. Just describe what you want.
            <span className="mt-3 block font-medium text-indigo-300 text-sm">
              To start, get a free Google Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="underline hover:text-indigo-200 transition-colors">Google AI Studio</a> and enter it in the settings.
            </span>
          </p>
        </div>
        
        {/* Input form */}
        <div className="p-6">
          <form className="relative" onSubmit={onSubmit}>
            <Textarea
              className="w-full p-4 pr-14 text-base text-white bg-slate-900/80 border border-slate-700 rounded-lg resize-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none shadow-inner shadow-black/20"
              rows={3}
              value={value}
              onKeyDown={handleKeyDown}
              onChange={onChange}
              placeholder="Describe your presentation topic..."
            />
            {value && 
            <Button 
              type="submit"
              variant="secondary" 
              size="icon" 
              className='absolute right-3 top-3 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full shadow-md transition-all duration-300 hover:scale-110'
            >
              <Wand2 className="h-5 w-5 text-white" />
            </Button>}
            <div className="absolute left-4 bottom-2 text-xs text-slate-400">
              <span className="font-medium">Powered by AI</span>
            </div>
          </form>
        </div>
        
        {/* Examples section */}
        <div className="px-6 pb-6">
          <p className="text-sm text-slate-300 mb-3 font-medium flex items-center">
            <span className="inline-block w-4 h-px bg-indigo-400 mr-2"></span>
            Try one of these examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {Examples.map((example, index) => (
              <button 
                key={index} 
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300 hover:bg-indigo-600/20 hover:border-indigo-500 hover:text-white transition-all duration-300 text-left"
                onClick={() => handleClick(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Theme selector */}
        {themes && setTheme && theme && (
          <div className="px-6 pb-6 border-t border-slate-700/50 pt-6">
            <p className="text-sm text-slate-300 mb-3 font-medium flex items-center">
              <span className="inline-block w-4 h-px bg-indigo-400 mr-2"></span>
              Select a presentation theme:
            </p>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-300 focus:ring-indigo-500">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {themes.map((themeName) => (
                  <SelectItem key={themeName} value={themeName} className="text-slate-300 hover:bg-indigo-600/20 hover:text-white">
                    {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Theme preview */}
            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
              <div className="text-center text-xs text-slate-400 py-2 border-b border-slate-700/50">Theme Preview: {theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
              <div className="relative h-[150px] w-full overflow-hidden">
                {themePreviewImages[theme] ? (
                  <Image 
                    src={themePreviewImages[theme]} 
                    alt={`${theme} theme preview`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-400 text-xs">
                    Preview not available
                  </div>
                )}
              </div>
            </div>
            
            <p className="mt-2 text-xs text-slate-400">
              The theme will be applied to your presentation when generated.
            </p>
          </div>
        )}
      </div>
      
      {/* Credits section */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400">
          <span>Built by <a href="https://josepht.in" target="_blank" className="text-indigo-400 hover:text-indigo-300 hover:underline">Joseph Thekkekara</a></span>
          <span className="mx-2">•</span>
          <span>Based on <a href="#" className="text-indigo-400 hover:text-indigo-300 hover:underline">RevealJS AI</a> by YOYZHANG</span>
        </p>
      </div>
    </div>
  );
}