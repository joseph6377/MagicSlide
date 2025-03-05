import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'
import { Textarea } from './ui/textarea'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  apiKey: string
  onApiKeyChange: (key: string) => void
  systemPrompt: string
  onSystemPromptChange: (prompt: string) => void
  htmlTemplate: string
  onHtmlTemplateChange: (template: string) => void
  pixabayApiKey?: string
  onPixabayApiKeyChange?: (key: string) => void
  autoSearchImages?: boolean
  onAutoSearchImagesChange?: (enabled: boolean) => void
}

export default function SettingsDialog({ 
  open, 
  onClose, 
  apiKey, 
  onApiKeyChange,
  systemPrompt,
  onSystemPromptChange,
  htmlTemplate,
  onHtmlTemplateChange,
  pixabayApiKey = '',
  onPixabayApiKeyChange = () => {},
  autoSearchImages = true,
  onAutoSearchImagesChange = () => {}
}: SettingsDialogProps) {
  const [key, setKey] = useState(apiKey)
  const [prompt, setPrompt] = useState(systemPrompt)
  const [template, setTemplate] = useState(htmlTemplate)
  const [pixabayKey, setPixabayKey] = useState(pixabayApiKey)
  const [autoSearch, setAutoSearch] = useState(autoSearchImages)

  useEffect(() => {
    setKey(apiKey)
    setPrompt(systemPrompt)
    setTemplate(htmlTemplate)
    setPixabayKey(pixabayApiKey)
    setAutoSearch(autoSearchImages)
  }, [apiKey, systemPrompt, htmlTemplate, pixabayApiKey, autoSearchImages])

  const handleSave = () => {
    if (!key.trim()) {
      toast.error('API key cannot be empty')
      return
    }
    
    onApiKeyChange(key)
    onSystemPromptChange(prompt)
    onHtmlTemplateChange(template)
    onPixabayApiKeyChange(pixabayKey)
    onAutoSearchImagesChange(autoSearch)
    toast.success('Settings saved successfully')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-lg max-w-xl w-full p-6 animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
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
          
          <div>
            <label htmlFor="pixabayApiKey" className="block text-sm font-medium text-slate-300 mb-2">
              Pixabay API Key (Optional)
            </label>
            <input
              id="pixabayApiKey"
              type="text"
              value={pixabayKey}
              onChange={(e) => setPixabayKey(e.target.value)}
              className="w-full p-2 rounded-md bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Enter your Pixabay API key"
            />
            <p className="mt-1 text-xs text-slate-400">
              Get your API key from <a href="https://pixabay.com/api/docs/" target="_blank" className="text-indigo-400 hover:underline">Pixabay API</a>. Default key is provided but has limited usage.
            </p>
          </div>
          
          <div className="p-4 bg-slate-700/30 rounded-md border border-slate-600">
            <div className="flex items-center mb-2">
              <input
                id="autoSearchImages"
                type="checkbox"
                checked={false}
                disabled={true}
                className="h-5 w-5 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 opacity-50"
              />
              <label htmlFor="autoSearchImages" className="ml-2 block text-sm font-medium text-white opacity-50">
                Automatically search for images (disabled)
              </label>
            </div>
            <p className="text-xs text-slate-300 ml-7">
              This feature has been disabled. To add images to your presentation:
            </p>
            <ol className="text-xs text-slate-300 ml-7 mt-2 list-decimal pl-4">
              <li className="mb-1">Click &quot;Advanced Options&quot; in the input area</li>
              <li className="mb-1">Use the &quot;Search Images&quot; button to find and select images</li>
              <li className="mb-1">Selected images will be added to your input text</li>
            </ol>
            <div className="mt-3 ml-7 px-3 py-2 bg-amber-800/20 border border-amber-700/30 rounded text-xs text-amber-200">
              <strong>Note:</strong> Even with this feature disabled, the AI may still try to add images. 
              If you want a completely image-free presentation, include &quot;no images please&quot; in your prompt.
            </div>
          </div>
          
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-slate-300 mb-2">
              Content Instructions
            </label>
            <Textarea
              id="systemPrompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 rounded-md bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px]"
              placeholder="Enter presentation content instructions (no HTML or technical details)"
            />
            <p className="mt-1 text-xs text-slate-400">
              Focus on the content structure, not the technical implementation. Describe what slides you want, their content, and overall flow.
            </p>
          </div>
          
          <div>
            <label htmlFor="htmlTemplate" className="block text-sm font-medium text-slate-300 mb-2">
              HTML Template Structure
            </label>
            <Textarea
              id="htmlTemplate"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full p-2 rounded-md bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[200px] font-mono text-sm"
              placeholder="Enter the HTML template structure for reveal.js presentations"
            />
            <p className="mt-1 text-xs text-slate-400">
              Technical implementation template using reveal.js framework. This defines how the slides will be generated in HTML.
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