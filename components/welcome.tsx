'use client'

import React, { FormEvent, ChangeEvent, useState, useEffect, useRef } from 'react';
import { Wand2, Image as ImageIcon, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';
import Image from 'next/image';
import WikimediaButton from './wikimedia-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Add custom styles for Wikimedia references
const referenceStyles = `
  .wikimedia-reference {
    font-size: 0.5rem !important;
    line-height: 0.9 !important;
    color: #71717a !important;
    opacity: 0.7;
    max-width: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    text-overflow: ellipsis;
    white-space: normal !important;
    display: inline-block;
    margin-bottom: 0.15rem;
  }
  .wikimedia-reference a {
    color: #71717a !important;
    text-decoration: none;
  }
`;

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
  autoSearchImages?: boolean
  onAutoSearchImagesChange?: (enabled: boolean) => void
  imageSource?: string
  onImageSourceChange?: (source: string) => void
}

export default function Welcome({
  onSubmit, 
  onChange, 
  value, 
  setChatInput, 
  theme, 
  setTheme, 
  themes, 
  autoSearchImages = false,
  onAutoSearchImagesChange,
  imageSource = 'wikimedia',
  onImageSourceChange
}: Props) {
  // New state for advanced options visibility
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [showThemes, setShowThemes] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Function to format the display value with better URL wrapping
  useEffect(() => {
    // This will just use the raw value for now, but we could enhance it later
    // to show shortened URLs while preserving the full URLs in the actual value
    setDisplayValue(value);
  }, [value]);

  // Apply custom styles for Wikimedia references
  useEffect(() => {
    // Add styles to head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = referenceStyles;
    document.head.appendChild(styleElement);

    // Cleanup on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const handleClick = (example: string) => {
    setChatInput(example)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  // Handle inserting image HTML into the input
  const handleInsertImage = (html: string) => {
    // Add the Markdown image syntax to the current input
    const newInput = value + (value ? '\n\n' : '') + 'Include this image in the presentation:\n' + html;
    setChatInput(newInput);
  };

  // Handle inserting multiple images into the input
  const handleInsertMultipleImages = (htmlArray: string[]) => {
    if (htmlArray.length === 0) return;
    
    // Create a more compact representation of images
    let newInput = value + (value ? '\n\n' : '') + 'Include these images in the presentation:';
    htmlArray.forEach((html, index) => {
      newInput += `\n\n${html}`;
    });
    
    setChatInput(newInput);
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
        {/* Description section - simplified and more focused */}
        <div className="p-6 border-b border-slate-700/50">
          <p className="text-center text-slate-300 leading-relaxed">
            Create beautiful presentations with AI. Just describe what you want.
          </p>
        </div>
        
        {/* Input form - Made more prominent */}
        <div className="p-6">
          <form className="relative" onSubmit={onSubmit}>
            <Textarea
              ref={textAreaRef}
              className="w-full p-4 pr-14 text-sm text-white bg-slate-900/80 border border-slate-700 rounded-lg resize-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none shadow-inner shadow-black/20 overflow-wrap-break-word break-words whitespace-pre-wrap"
              rows={4} // Increased size for prominence
              value={value}
              onKeyDown={handleKeyDown}
              onChange={onChange}
              placeholder="Describe your presentation topic..."
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: '0.875rem', lineHeight: '1.25rem' }}
            />
            <div className="absolute right-3 top-3 flex space-x-2">
              {value && 
              <Button 
                type="submit"
                variant="secondary" 
                size="icon" 
                className='bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full shadow-md transition-all duration-300 hover:scale-110'
              >
                <Wand2 className="h-5 w-5 text-white" />
              </Button>}
            </div>
            
            {/* Helper text */}
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs text-slate-400">
                <span className="font-medium">Powered by AI</span>
                <span className="ml-2 text-slate-500">• Press Enter to generate</span>
              </div>
              
              {/* Get API key help */}
              <div className="text-xs text-indigo-300">
                <a href="https://makersuite.google.com/app/apikey" target="_blank" className="hover:text-indigo-200 transition-colors">
                  Get Gemini API Key
                </a>
              </div>
            </div>
          </form>
          
          {/* Examples toggle */}
          <div className="mt-4">
            <button 
              onClick={() => setShowExamples(!showExamples)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-800 transition-all"
            >
              <span className="text-sm font-medium flex items-center">
                <span className="inline-block w-4 h-px bg-indigo-400 mr-2"></span>
                Example topics
              </span>
              {showExamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {/* Examples content - collapsed by default */}
            {showExamples && (
              <div className="mt-2 flex flex-wrap gap-2">
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
            )}
          </div>
        </div>
        
        {/* Advanced Options Toggle */}
        <div className="px-6 pb-3 border-t border-slate-700/50 pt-3">
          <button 
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-md text-slate-300 hover:bg-slate-800 transition-all"
          >
            <span className="text-sm font-medium flex items-center">
              <Settings size={14} className="mr-2" />
              Advanced Options
            </span>
            {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Advanced Options Content - Hidden by default */}
        {showAdvancedOptions && (
          <div className="px-6 pb-6">
            {/* Auto Image Search Setting */}
            <div className="mb-4 pt-2 bg-slate-800/40 p-3 rounded-md border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ImageIcon size={16} className="text-indigo-400 mr-2" />
                  <span className="text-sm text-slate-300">Auto Image Search</span>
                </div>
                <div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoSearchImages} 
                      onChange={e => onAutoSearchImagesChange && onAutoSearchImagesChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 after:peer-checked:bg-slate-200 after:peer-checked:border-slate-200"></div>
                  </label>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {autoSearchImages 
                  ? "AI will automatically search for relevant images based on your presentation topic." 
                  : "Auto image search is disabled. Images will only be included when explicitly requested."}
              </p>
              
              {/* Image Source info - now just shows Wikimedia as the only option */}
              {autoSearchImages && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <span className="text-xs text-slate-300 mb-2 block">Image Source: Wikimedia Commons</span>
                  <p className="text-xs text-slate-400 mt-2">
                    Wikimedia Commons provides freely usable media files that can be used in your presentations.
                  </p>
                </div>
              )}
            </div>
            
            {/* Image insertion option */}
            <div className="mb-4 pt-2">
              <p className="text-sm text-slate-300 mb-2">Search and add images to your presentation:</p>
              <div className="flex justify-start space-x-2">
                <div className="bg-slate-800 rounded-md p-2 inline-block">
                  <WikimediaButton 
                    onInsertImage={handleInsertImage} 
                    onInsertMultipleImages={handleInsertMultipleImages}
                    allowMultiple={true}
                  />
                </div>
              </div>
            </div>

            {/* Theme selector */}
            {themes && setTheme && theme && (
              <div className="mb-2">
                <p className="text-sm text-slate-300 mb-2">Presentation theme:</p>
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
                <div className="mt-2 rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
                  <div className="text-center text-xs text-slate-400 py-2 border-b border-slate-700/50">Theme Preview: {theme.charAt(0).toUpperCase() + theme.slice(1)}</div>
                  <div className="relative h-[120px] w-full overflow-hidden">
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