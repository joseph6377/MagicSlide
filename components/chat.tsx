import { ChangeEvent, FormEvent, useEffect } from 'react'
import { SendHorizonal, Square, Wand2, Terminal, Image as ImageIcon } from 'lucide-react'
import { ChatMessage } from '@/lib/messages'
import { Button } from '@/components/ui/button'
import Welcome from './welcome'
import { Input } from './ui/input'
import Image from 'next/image'
import WikimediaButton from './wikimedia-button'

interface ChatProps {
  isLoading: boolean,
  handleSubmit: (e?: FormEvent<HTMLFormElement>) => void,
  setChatInput: (input: string) => void
  input: string
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void,
  messages: ChatMessage[]
  theme?: string
  setTheme?: (theme: string) => void
  themes?: string[]
  autoSearchImages?: boolean
  onAutoSearchImagesChange?: (enabled: boolean) => void
  imageSource?: string
  onImageSourceChange?: (source: string) => void
}

export default function Chat({
  isLoading,
  input,
  setChatInput,
  messages,
  handleInputChange,
  handleSubmit,
  theme,
  setTheme,
  themes,
  autoSearchImages = false,
  onAutoSearchImagesChange,
  imageSource = 'wikimedia',
  onImageSourceChange
}: ChatProps) {
  // Extract the complex expression to a separate variable for dependency tracking
  const messagesLength = messages.length;
  
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messagesLength])

  // Handle inserting image HTML into the chat input
  const handleInsertImage = (html: string) => {
    // Add the HTML to the current input
    const newInput = input + '\n\nInclude this image in the presentation:\n' + html;
    setChatInput(newInput);
  };

  // Handle inserting multiple images into the chat input
  const handleInsertMultipleImages = (htmlArray: string[]) => {
    if (htmlArray.length === 0) return;
    
    // Create a message with all images to include
    let newInput = input + '\n\nInclude these images in the presentation:\n';
    htmlArray.forEach((html, index) => {
      newInput += `\nImage ${index + 1}:\n${html}`;
    });
    
    setChatInput(newInput);
  };

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
                    return <Image 
                      key={id} 
                      src={content.image} 
                      alt="artifact" 
                      width={50}
                      height={50}
                      className="mr-2 inline-block w-[50px] h-[50px] object-contain border rounded-lg bg-white mt-2" 
                    />
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-600/20 border border-slate-500/30 rounded-md text-xs text-slate-200">
              <ImageIcon size={14} className="text-slate-300" />
              <span>Use the image button to manually add images to your presentation.</span>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-row gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  className="focus:outline-none border-slate-700 bg-slate-800/80 text-white py-6 px-4 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg pr-10"
                  required={true}
                  placeholder="Describe your presentation..."
                  value={input}
                  onChange={handleInputChange}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <WikimediaButton 
                    onInsertImage={handleInsertImage} 
                    onInsertMultipleImages={handleInsertMultipleImages}
                    allowMultiple={true}
                  />
                </div>
              </div>
              { !isLoading ? (
                  <Button type="submit" variant="secondary" size="icon" className='rounded-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 w-12'>
                    <SendHorizonal className="h-5 w-5 text-white" />
                  </Button>
              ) : (
                  <Button variant="secondary" size="icon" className='rounded-full bg-slate-700 hover:bg-slate-600 text-white h-12 w-12' onClick={(e) => { e.preventDefault(); handleSubmit() }}>
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
          theme={theme}
          setTheme={setTheme}
          themes={themes}
          autoSearchImages={autoSearchImages}
          onAutoSearchImagesChange={onAutoSearchImagesChange}
          imageSource={imageSource}
          onImageSourceChange={onImageSourceChange}
        />}
    </div>
  )
}
