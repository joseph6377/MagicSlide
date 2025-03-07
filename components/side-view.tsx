import { Dispatch, SetStateAction } from 'react'
import { Download, LoaderCircle, Copy, Maximize, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from "@/components/ui/button"
import { CodeView } from './code-view'
import { ArtifactView } from './artifact-view'
import { ArtifactSchema } from '@/lib/schema'
import { toast } from 'react-toastify'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SideViewProps {
  isLoading:boolean,
  selectedTab: 'code' | 'artifact'
  onSelectedTabChange: Dispatch<SetStateAction<"code" | "artifact">>
  artifact?: Partial<ArtifactSchema>
}

export default function SideView({
  isLoading,
  selectedTab,
  onSelectedTabChange,
  artifact

}: SideViewProps) {
  const router = useRouter();

  function copy (content: string) {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast('Copied to clipboard')
      })
      .catch(err => {
        toast.error('Failed to copy')
      })
  }

  function download (content: string) {
    try {
      const blob = new Blob([content], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = "slidemagic.html"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Presentation downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download presentation')
    }
  }

  function downloadAsPDF() {
    // Currently disabled - PDF export is not available
    toast.error('PDF download is currently unavailable')
    return
  }

  function openFullscreenPreview() {
    if (!artifact?.code) {
      toast.error('No presentation to preview')
      return
    }

    try {
      // Create a new window with the presentation in fullscreen mode
      const newWindow = window.open('', '_blank')
      if (!newWindow) {
        toast.error('Fullscreen preview blocked by browser. Please allow popups.')
        return
      }

      // Add title and favicon to new window
      const title = artifact.code.match(/<title>(.*?)<\/title>/i)?.[1] || 'SlideMagic Presentation'
      
      // Write the presentation HTML to the new window
      newWindow.document.write(artifact.code)
      
      // Add a script to auto-initialize Reveal.js in fullscreen
      const fullscreenScript = document.createElement('script')
      fullscreenScript.textContent = `
        document.addEventListener('DOMContentLoaded', function() {
          // Set window title
          document.title = "${title}";
          
          if (typeof Reveal !== 'undefined') {
            Reveal.initialize({
              controls: true,
              progress: true,
              history: true,
              center: true,
              width: '100%',
              height: '100%',
              margin: 0.1,
              minScale: 0.2,
              maxScale: 2.0,
              transition: 'slide',
              transitionSpeed: 'default',
              backgroundTransition: 'fade'
            });
            
            // Enter fullscreen automatically after a short delay
            setTimeout(function() {
              try {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                  document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                  document.documentElement.msRequestFullscreen();
                }
              } catch (error) {
                console.warn('Fullscreen request failed:', error);
              }
            }, 1000);
          } else {
            console.warn('Reveal.js not found in the presentation');
          }
        });
      `
      newWindow.document.head.appendChild(fullscreenScript)
      
      // Close the document to finish loading
      newWindow.document.close()
      
      toast.info('Opening fullscreen preview...')
    } catch (error) {
      console.error('Fullscreen preview error:', error)
      toast.error('Failed to open fullscreen preview')
    }
  }

  function openEditPage() {
    if (!artifact?.code) {
      toast.error('No presentation to edit')
      return
    }

    try {
      // Store the presentation code in localStorage
      localStorage.setItem('presentationToEdit', artifact.code);
      
      // Navigate to the edit page
      router.push('/edit-presentation');
      
      toast.info('Opening presentation editor...')
    } catch (error) {
      console.error('Edit navigation error:', error)
      toast.error('Failed to open presentation editor')
    }
  }

  if (!artifact) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col shadow-xl rounded-lg border border-slate-700 max-w-[800px] bg-slate-800/60">
      <Tabs
        value={selectedTab}
        onValueChange={(value) => onSelectedTabChange(value as 'code' | 'artifact')}
        className="h-full max-h-full overflow-hidden flex flex-col items-start justify-start"
      >
        <div className="w-full p-3 grid grid-cols-3 items-center justify-end rounded-t-lg border-b border-slate-700 bg-slate-900/70">
          <div className='flex justify-start'>
            {isLoading && <LoaderCircle className="h-4 w-4 text-indigo-400 animate-spin" />}
          </div>

          <div className='flex justify-center'>
            <TabsList className="px-1 py-0 border border-slate-700 bg-slate-800 h-9">
              <TabsTrigger className="font-medium text-xs py-1 px-3 data-[state=active]:bg-indigo-600 data-[state=active]:text-white" value="code">Code</TabsTrigger>
              <TabsTrigger disabled={!artifact} className="font-medium text-xs py-1 px-3 data-[state=active]:bg-indigo-600 data-[state=active]:text-white" value="artifact">Preview</TabsTrigger>
            </TabsList>
          </div>
          <div className='flex items-center justify-end space-x-2'>
          {
            artifact && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className='h-8 rounded-md px-3 text-slate-300 hover:text-white hover:bg-slate-700' title='Download Presentation'>
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem 
                      onClick={() => download(artifact.code || '')} 
                      className="text-slate-300 hover:bg-indigo-600/20 hover:text-white focus:bg-indigo-600/20 focus:text-white"
                    >
                      Download as HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-slate-500 cursor-not-allowed" 
                      onClick={(e) => {
                        e.preventDefault();
                        downloadAsPDF();
                      }}
                    >
                      Download as PDF (unavailable)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="ghost" 
                  className='h-8 rounded-md px-3 text-slate-300 hover:text-white hover:bg-slate-700' 
                  title='Copy Code' 
                  onClick={() => copy(artifact.code || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  className='h-8 rounded-md px-3 text-slate-300 hover:text-amber-300 hover:bg-amber-700/50' 
                  title='Edit Presentation' 
                  onClick={openEditPage}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  className='h-8 rounded-md px-3 text-slate-300 hover:text-indigo-300 hover:bg-indigo-700/50' 
                  title='Fullscreen Preview' 
                  onClick={openFullscreenPreview}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </>
            )
          }
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col items-start justify-start overflow-y-auto">
          {artifact && (
            <>
              <TabsContent value="code" className="flex-1 w-full">
                {artifact.code &&
                  <CodeView content={artifact.code}/>
                }
              </TabsContent>
              <TabsContent value="artifact" className="flex-1 w-full flex flex-col items-start justify-start">
                {artifact &&
                  <ArtifactView
                    result={artifact?.code || ''}
                  />
                }
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  )
}
