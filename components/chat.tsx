import { ChangeEvent, FormEvent, useEffect } from 'react'
import { SendHorizonal, Square, Wand2, Terminal } from 'lucide-react'
import { ChatMessage } from '@/lib/messages'
import { Button } from '@/components/ui/button'
import Welcome from './welcome'
import { Input } from './ui/input'

interface ChatProps {
  isLoading: boolean,
  handleSubmit: (e?: FormEvent<HTMLFormElement>) => void,
  setChatInput: (input: string) => void
  input: string
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void,
  messages: ChatMessage[]
}

export default function Chat({
  isLoading,
  input,
  setChatInput,
  messages,
  handleInputChange,
  handleSubmit,
}: ChatProps) {
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [JSON.stringify(messages)])

  return (
    <div className="flex-1 flex flex-col gap-4 max-h-full max-w-[800px] mx-auto justify-between">
      {!!messages.length && (
        <>
          <div id="chat-container" className="flex flex-col gap-3 overflow-y-auto max-h-full px-4 rounded-lg">
            {messages.map((message: ChatMessage, index: number) => (
              <div 
                className={`py-3 px-5 shadow-sm whitespace-pre-wrap rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-indigo-600/25 to-indigo-700/20 border border-indigo-500/30 text-white' 
                    : 'bg-slate-800/60 border border-slate-700 text-slate-200'
                }`} 
                key={index}
              >
                {message.content.map((content, id) => {
                  if (content.type === 'text') {
                    return <p key={content.text} className="flex-1">{content.text}</p>
                  }

                  if (content.type === 'image') {
                    return <img key={id} src={content.image} alt="artifact" className="mr-2 inline-block w-[50px] h-[50px] object-contain border rounded-lg bg-white mt-2" />
                  }
                })}
                {message.meta &&
                  <div className="mt-4 flex justify-start items-start border border-slate-600 rounded-md bg-slate-900/50">
                    <div className="p-2 self-stretch border-r border-slate-600 w-14 flex items-center justify-center">
                      <Terminal strokeWidth={2} className="text-indigo-400"/>
                    </div>
                    <div className="p-2 flex flex-col space-y-1 justify-start items-start min-w-[100px]">
                      <span className="font-bold font-sans text-sm text-indigo-300">{message.meta.title}</span>
                      <span className="font-sans text-sm text-slate-300">{message.meta.description}</span>
                    </div>
                  </div>
                }
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 mb-2">
            <form onSubmit={handleSubmit} className="flex flex-row gap-2 items-center">
              <Input
                className="focus:outline-none border-slate-700 bg-slate-800/80 text-white py-6 px-4 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
                required={true}
                placeholder="Describe your presentation..."
                value={input}
                onChange={handleInputChange}
              />
              { !isLoading ? (
                  <Button type="submit" variant="secondary" size="icon" className='rounded-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 w-12'>
                    <SendHorizonal className="h-5 w-5 text-white" />
                  </Button>
              ) : (
                  <Button variant="secondary" size="icon" className='rounded-full bg-slate-700 hover:bg-slate-600 text-white h-12 w-12' onClick={(e) => { e.preventDefault(); stop() }}>
                    <Square className="h-5 w-5 text-white" />
                  </Button>
                )
              }
            </form>
          </div>
        </>
      )}
      {!messages.length && 
        <Welcome
          onSubmit={handleSubmit}
          onChange={handleInputChange}
          setChatInput={setChatInput}
          value={input}
        />}
    </div>
  )
}
