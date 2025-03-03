'use client'

import Chat from '@/components/chat'
import SideView from '@/components/side-view'
import NavBar from '@/components/navbar'
import SettingsDialog from '@/components/settings-dialog'
import { useState, useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { ChatMessage, toAISDKMessages } from '@/lib/messages'
import { experimental_useObject as useObject } from 'ai/react'
import { ArtifactSchema, artifactSchema } from '@/lib/schema'
import { toast } from 'react-toastify'

// The default API key from the .env.local file
const DEFAULT_API_KEY = 'AIzaSyBMTHjzUL2CmwS3z4aEFcR_9yz2beTBB_w';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<'code' | 'artifact'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [artifact, setArtifact] = useState<Partial<ArtifactSchema> | undefined>()
  const [isSettingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useLocalStorage('slidemagic-api-key', DEFAULT_API_KEY)

  // Reset the UI to initial state
  const resetUI = () => {
    setMessages([])
    setChatInput('')
    setArtifact(undefined)
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
  }, [object])

  const [chatInput, setChatInput] = useLocalStorage('slidemagic-chat', '')
  const handleSaveInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setChatInput(e.target.value)
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const addMessage = (message: ChatMessage) => {
    setMessages(previousMessages => [...previousMessages, message])
    return [...messages, message]
  }

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

    const content: ChatMessage['content'] = [{ type: 'text', text: chatInput }]

    // Include the API key in the request metadata
    submit({
      messages: toAISDKMessages(addMessage({role: 'user', content})),
      apiKey: apiKey
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
      />
      <div className="flex-1 flex space-x-6 w-full pt-16 pb-6 px-6">
        <Chat
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          input={chatInput}
          setChatInput={setChatInput}
          handleInputChange={handleSaveInputChange}
          messages={messages}
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
