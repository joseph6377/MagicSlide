import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  apiKey: string
  onApiKeyChange: (key: string) => void
}

export default function SettingsDialog({ open, onClose, apiKey, onApiKeyChange }: SettingsDialogProps) {
  const [key, setKey] = useState(apiKey)

  useEffect(() => {
    setKey(apiKey)
  }, [apiKey])

  const handleSave = () => {
    if (!key.trim()) {
      toast.error('API key cannot be empty')
      return
    }
    
    onApiKeyChange(key)
    toast.success('Settings saved successfully')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-lg max-w-md w-full p-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
              Google Gemini API Key
            </label>
            <input
              id="apiKey"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full p-2 rounded-md bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter your Gemini API key"
            />
            <p className="mt-1 text-xs text-slate-400">
              Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-indigo-400 hover:underline">Google AI Studio</a>
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 