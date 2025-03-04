import { Dispatch, SetStateAction, useState } from 'react'
import { Download, LoaderCircle, Copy, FileType } from 'lucide-react'
import html2pdf from 'html2pdf.js'

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
  function copy (content: string) {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast('Copied to clipboard')
      })
      .catch(err => {
        toast.error('Failed to copy: ' + content)
      })
  }

  function download (content: string) {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = "slidemagic.html"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  function downloadAsPDF() {
    if (!artifact?.code) {
      toast.error('No presentation to download')
      return
    }

    toast.info('Preparing PDF download...')
    
    // Create a temporary iframe to render the HTML
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.visibility = 'hidden'
    iframe.style.width = '1024px'
    iframe.style.height = '768px'
    document.body.appendChild(iframe)
    
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document
    
    if (iframeDocument) {
      iframeDocument.open()
      iframeDocument.write(artifact.code)
      iframeDocument.close()
      
      // Wait for the iframe content to load
      setTimeout(() => {
        try {
          // Try to access the Reveal object in the iframe
          const iframeWindow = iframe.contentWindow
          
          if (iframeWindow && iframeWindow.Reveal) {
            // If Reveal.js is being used, use its PDF export functionality
            iframeWindow.Reveal.configure({ 
              pdf: { 
                format: 'letter',
                landscape: true,
                margin: 0.5
              }
            });
            
            // Trigger Reveal's PDF export
            iframeWindow.location.href = iframeWindow.location.href.replace(/#.*$/, '') + '?print-pdf';
            
            // Wait for print mode to be ready then generate PDF
            setTimeout(() => {
              const element = iframeDocument.documentElement;
              const options = {
                margin: 0.5,
                filename: 'slidemagic.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
              };
              
              html2pdf().set(options).from(element).save().then(() => {
                document.body.removeChild(iframe);
                toast.success('PDF downloaded successfully');
              }).catch(error => {
                console.error('PDF generation error:', error);
                toast.error('Failed to generate PDF');
                document.body.removeChild(iframe);
              });
            }, 1500);
          } else {
            // If not using Reveal.js, try a different approach to make all slides visible
            
            // Add a style tag to make all slides visible
            const styleElement = iframeDocument.createElement('style');
            styleElement.textContent = `
              .slides > section, .slides > section > section {
                display: block !important;
                position: relative !important;
                margin: 20px 0 !important;
                opacity: 1 !important;
                visibility: visible !important;
                transform: none !important;
                page-break-after: always;
              }
              .reveal .slides {
                display: block !important;
                height: auto !important;
                position: static !important;
                transform: none !important;
              }
            `;
            iframeDocument.head.appendChild(styleElement);
            
            // Process for PDF
            setTimeout(() => {
              const element = iframeDocument.documentElement;
              const options = {
                margin: 0.5,
                filename: 'slidemagic.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
              };
              
              html2pdf().set(options).from(element).save().then(() => {
                document.body.removeChild(iframe);
                toast.success('PDF downloaded successfully');
              }).catch(error => {
                console.error('PDF generation error:', error);
                toast.error('Failed to generate PDF');
                document.body.removeChild(iframe);
              });
            }, 1000);
          }
        } catch (error) {
          console.error('Error preparing PDF:', error);
          toast.error('Failed to prepare PDF');
          document.body.removeChild(iframe);
        }
      }, 1000);
    } else {
      toast.error('Failed to generate PDF');
      document.body.removeChild(iframe);
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => download(artifact.code || '')}>
                      Download as HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadAsPDF}>
                      Download as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" className='h-8 rounded-md px-3 text-slate-300 hover:text-white hover:bg-slate-700' title='Copy Code' onClick={() => copy(artifact.code || '')}>
                  <Copy className="h-4 w-4" />
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
