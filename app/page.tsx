'use client'

import { useState, useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { ChatMessage, toAISDKMessages } from '@/lib/messages'
import { experimental_useObject as useObject } from 'ai/react'
import { ArtifactSchema, artifactSchema } from '@/lib/schema'
import { toast } from 'react-toastify'
import { htmlTemplate as defaultHtmlTemplate } from '@/lib/template'
import dynamic from 'next/dynamic'

// Dynamically import components with client-side only dependencies
const Chat = dynamic(() => import('@/components/chat'), { ssr: false })
const SideView = dynamic(() => import('@/components/side-view'), { ssr: false })
const NavBar = dynamic(() => import('@/components/navbar'), { ssr: false })
const SettingsDialog = dynamic(() => import('@/components/settings-dialog'), { ssr: false })

// Available Reveal.js themes
const REVEAL_THEMES = [
  'black',
  'white',
  'league',
  'night',
  'moon',
  'solarized'
]

// The default API key - empty by default
const DEFAULT_API_KEY = '';

// Default system prompt (content instructions only)
const DEFAULT_SYSTEM_PROMPT = `
Create a comprehensive and engaging presentation with the following structure:
1. An appealing cover slide with a clear title and subtitle
2. An introduction slide that sets context
3. Several content slides with well-organized bullet points, relevant data and insights
4. A conclusion slide that summarizes key points
5. A final slide with contact information or call to action

Use professional language and ensure all content is well-structured and easy to follow.
Make the content informative, engaging and visually descriptive.
`;

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'code' | 'artifact'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [artifact, setArtifact] = useState<Partial<ArtifactSchema> | undefined>()
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useLocalStorage('slidemagic-api-key', DEFAULT_API_KEY)
  const [systemPrompt, setSystemPrompt] = useLocalStorage('slidemagic-system-prompt', DEFAULT_SYSTEM_PROMPT)
  const [htmlTemplate, setHtmlTemplate] = useLocalStorage('slidemagic-html-template', defaultHtmlTemplate)
  const [theme, setTheme] = useLocalStorage('slidemagic-theme', 'black')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useLocalStorage('slidemagic-chat', '')

  // Reset the UI to initial state
  const resetUI = () => {
    setMessages([])
    setChatInput('')
    setArtifact(undefined)
  }

  const handleSaveInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setChatInput(e.target.value)
  }

  const addMessage = (message: ChatMessage) => {
    setMessages(previousMessages => [...previousMessages, message])
    return [...messages, message]
  }

  const { object, submit, isLoading, stop } = useObject({
    api: '/api/chat',
    schema: artifactSchema,
    onFinish: async ({ object: artifact, error }) => {
      if (error) {
        return
      }
      setCurrentTab('artifact')
      setIsPreviewLoading(false)
    }
  })

  useEffect(() => {
    if (object) {
      setArtifact(object as ArtifactSchema)
      const lastAssistantMessage = messages.findLast(message => message.role === 'assistant')
      if (lastAssistantMessage) {
        lastAssistantMessage.content = [{ type: 'text', text: object.commentary || '' }, { type: 'code', text: object.code || '' }]
        lastAssistantMessage.meta = {
          title: object.title,
          description: object.description
        }
      }
    }
  }, [object, messages])

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()

    if (isLoading) {
      stop()
      return
    }

    if (!chatInput.trim()) {
      toast.error('Please enter a description for your presentation')
      return
    }

    // Check if API key is provided
    if (!apiKey.trim()) {
      toast.error('API key is required. Please enter your Google Gemini API key in the settings.')
      setSettingsOpen(true)
      return
    }

    const content: ChatMessage['content'] = [{ type: 'text', text: chatInput }]

    // Create a modified HTML template with the selected theme
    const themedHtmlTemplate = htmlTemplate.replace(
      /theme\/[a-z]+\.min\.css/,
      `theme/${theme}.min.css`
    )

    // Include the API key, system prompt and HTML template in the request metadata
    submit({
      messages: toAISDKMessages(addMessage({role: 'user', content})),
      apiKey: apiKey,
      systemPrompt: systemPrompt,
      htmlTemplate: themedHtmlTemplate
    })

    addMessage({
      role: 'assistant',
      content: [{ type: 'text', text: 'Generating your presentation...' }],
    })

    setChatInput('')
    setCurrentTab('code')
    setIsPreviewLoading(true)
    toast.info('Creating your presentation...', { autoClose: 2000 })
  }

  return (
    <main className="flex min-h-screen max-h-screen bg-gradient-to-br">
      <NavBar 
        onReset={resetUI}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsDialog 
        open={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        htmlTemplate={htmlTemplate}
        onHtmlTemplateChange={setHtmlTemplate}
      />
      <div className="flex-1 flex space-x-6 w-full pt-16 pb-6 px-6">
        <Chat
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          input={chatInput}
          setChatInput={setChatInput}
          handleInputChange={handleSaveInputChange}
          messages={messages}
          theme={theme}
          setTheme={setTheme}
          themes={REVEAL_THEMES}
        />
        <SideView
          isLoading={isPreviewLoading}
          selectedTab={currentTab}
          onSelectedTabChange={setCurrentTab}
          artifact={artifact}
        />
      </div>
    </main>
  )
}
