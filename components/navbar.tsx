import Link from 'next/link'
import Image from 'next/image'
import { Button } from './ui/button'
import { LucidePresentation, Settings } from 'lucide-react'

interface NavBarProps {
  onReset: () => void
  onOpenSettings: () => void
}

export default function NavBar({ onReset, onOpenSettings }: NavBarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white z-10">
      <div className="flex px-6 py-3 items-center">
        <div className="flex flex-1 items-center">
          <button onClick={onReset} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <LucidePresentation className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">SlideMagic AI</h1>
          </button>
        </div>
        <div className="flex justify-end items-center">
          <button 
            onClick={onOpenSettings}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all p-2"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}
