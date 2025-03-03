import { Dispatch, SetStateAction, useState } from 'react'
import { Download, LoaderCircle, Copy } from 'lucide-react'

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
                <Button variant="ghost" className='h-8 rounded-md px-3 text-slate-300 hover:text-white hover:bg-slate-700' title='Download Presentation' onClick={() => download(artifact.code || '')}>
                  <Download className="h-4 w-4" />
                </Button>
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
