'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Eye, Download } from 'lucide-react'
import { toast } from 'react-toastify'
import { Input } from '@/components/ui/input'
import RichTextEditor from '@/components/rich-text-editor'

export default function EditPresentation() {
  const router = useRouter()
  const [presentationHTML, setPresentationHTML] = useState<string>('')
  const [slides, setSlides] = useState<{ title: string; content: string }[]>([])
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0)
  const [selectedTab, setSelectedTab] = useState<string>('edit')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      // Retrieve the presentation HTML from localStorage
      const storedPresentation = localStorage.getItem('presentationToEdit')
      
      if (!storedPresentation) {
        toast.error('No presentation found to edit')
        router.push('/')
        return
      }
      
      setPresentationHTML(storedPresentation)
      
      // Parse the HTML to extract slides
      const slideData = parseHTMLToSlides(storedPresentation)
      setSlides(slideData)
      setIsLoading(false)
    }
  }, [router])

  // Function to parse HTML and extract slides
  const parseHTMLToSlides = (html: string) => {
    try {
      // Create a document to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Find all slide sections
      const slideElements = doc.querySelectorAll('.slides section');
      const extractedSlides: { title: string; content: string }[] = [];
      
      slideElements.forEach((slide) => {
        // Make a clone of the slide to work with
        const slideClone = slide.cloneNode(true) as HTMLElement;
        
        // Extract heading (if any)
        const headingElement = slideClone.querySelector('h1, h2, h3, h4, h5, h6');
        const title = headingElement ? headingElement.textContent || '' : 'Untitled Slide';
        
        // Remove the heading from the content
        if (headingElement) {
          headingElement.remove();
        }
        
        // Process any images to ensure they display correctly
        const images = slideClone.querySelectorAll('img');
        images.forEach(img => {
          // Convert inline styles to attributes if needed
          if (img.style.width) {
            const widthValue = img.style.width.replace('px', '').trim();
            if (widthValue) {
              img.setAttribute('width', widthValue);
            }
          }
          if (img.style.height) {
            const heightValue = img.style.height.replace('px', '').trim();
            if (heightValue) {
              img.setAttribute('height', heightValue);
            }
          }
        });
        
        // Process text elements with font-size styles
        const styledSpans = slideClone.querySelectorAll('span[style*="font-size"]');
        styledSpans.forEach(span => {
          // Ensure the font size is preserved
          if (span instanceof HTMLElement && span.style && span.style.fontSize) {
            span.setAttribute('style', `font-size: ${span.style.fontSize};${span.getAttribute('style') ? ' ' + span.getAttribute('style') : ''}`);
          }
        });
        
        // Get the content HTML
        const content = slideClone.innerHTML.trim();
        
        extractedSlides.push({ title, content });
      });
      
      return extractedSlides;
    } catch (error) {
      console.error("Error parsing HTML:", error);
      return [];
    }
  }

  // Function to update slide content in the editor
  const updateSlideTitle = (index: number, title: string) => {
    const updatedSlides = [...slides]
    updatedSlides[index] = { ...updatedSlides[index], title }
    setSlides(updatedSlides)
  }

  // Function to update slide content in the editor
  const updateSlideContent = (index: number, content: string) => {
    const updatedSlides = [...slides]
    updatedSlides[index] = { ...updatedSlides[index], content }
    setSlides(updatedSlides)
  }

  // Function to generate the updated HTML presentation
  const generateUpdatedHTML = () => {
    // Create a copy of the original HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(presentationHTML, 'text/html')
    
    // Find the slides container
    const slidesContainer = doc.querySelector('.slides')
    if (!slidesContainer) {
      toast.error('Could not find slides container in the presentation')
      return presentationHTML
    }
    
    // Clear existing slides
    slidesContainer.innerHTML = ''
    
    // Add the updated slides
    slides.forEach((slide) => {
      const slideElement = doc.createElement('section')
      
      // Add the title
      if (slide.title) {
        const titleElement = doc.createElement('h2')
        titleElement.textContent = slide.title
        slideElement.appendChild(titleElement)
      }
      
      // Create a temporary div to parse the HTML content
      const tempDiv = doc.createElement('div')
      tempDiv.innerHTML = slide.content
      
      // Process all images to ensure dimensions are preserved
      const images = tempDiv.querySelectorAll('img')
      images.forEach(img => {
        // Ensure width and height attributes are preserved
        if (img.style.width) {
          // Strip 'px' and convert to string to avoid type errors
          const widthValue = img.style.width.replace('px', '').trim();
          if (widthValue) {
            img.setAttribute('width', widthValue);
          }
        }
        if (img.style.height) {
          // Strip 'px' and convert to string to avoid type errors
          const heightValue = img.style.height.replace('px', '').trim();
          if (heightValue) {
            img.setAttribute('height', heightValue);
          }
        }
        
        // Remove any wrapper divs that TipTap might have added
        if (img.parentElement && 
            (img.parentElement.classList.contains('image-wrapper') || 
             img.parentElement.classList.contains('image-container'))) {
          const wrapper = img.parentElement;
          wrapper.parentNode?.insertBefore(img, wrapper);
          wrapper.parentNode?.removeChild(wrapper);
        }
      })
      
      // Process text elements with font-size styles
      const styledSpans = tempDiv.querySelectorAll('span[style*="font-size"]')
      styledSpans.forEach(span => {
        // Ensure the font size is preserved in the presentation
        if (span instanceof HTMLElement && span.style && span.style.fontSize) {
          // Make the font-size attribute inline for RevealJS to render correctly
          span.setAttribute('style', `font-size: ${span.style.fontSize};${span.getAttribute('style') ? ' ' + span.getAttribute('style') : ''}`);
        }
      })
      
      // Append the processed content
      slideElement.innerHTML += tempDiv.innerHTML
      
      slidesContainer.appendChild(slideElement)
    })
    
    return doc.documentElement.outerHTML
  }

  // Function to save the edited presentation
  const savePresentation = () => {
    try {
      const updatedHTML = generateUpdatedHTML()
      
      // Save to localStorage
      localStorage.setItem('presentationToEdit', updatedHTML)
      
      // Update state
      setPresentationHTML(updatedHTML)
      
      toast.success('Presentation saved successfully')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save presentation')
    }
  }

  // Function to download the edited presentation
  const downloadPresentation = () => {
    try {
      const updatedHTML = generateUpdatedHTML()
      const blob = new Blob([updatedHTML], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = "slidemagic-edited.html"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Presentation downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download presentation')
    }
  }

  // Function to go back to the home page
  const goBack = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300">Loading presentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={goBack}
            className="text-slate-300 hover:text-white hover:bg-slate-800 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Generator
          </Button>
          <h1 className="text-2xl font-bold">Presentation Editor</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={downloadPresentation}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            onClick={savePresentation}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Slide Navigation */}
        <div className="col-span-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Slides</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[70vh] overflow-y-auto">
                {slides.map((slide, index) => (
                  <div 
                    key={index}
                    onClick={() => setSelectedSlideIndex(index)}
                    className={`px-4 py-3 border-b border-slate-700 hover:bg-slate-700 cursor-pointer ${
                      selectedSlideIndex === index ? 'bg-indigo-600/20 border-l-4 border-l-indigo-500' : ''
                    }`}
                  >
                    <p className="font-medium truncate">{slide.title || 'Untitled Slide'}</p>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      Slide {index + 1}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor / Preview */}
        <div className="col-span-9">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <div className="border-b border-slate-700 mb-4">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="edit" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="edit" className="mt-0">
              {slides.length > 0 && selectedSlideIndex >= 0 && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <span>Editing Slide {selectedSlideIndex + 1}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label htmlFor="slide-title" className="block text-sm font-medium mb-2">
                        Slide Title
                      </label>
                      <Input
                        id="slide-title"
                        value={slides[selectedSlideIndex].title}
                        onChange={(e) => updateSlideTitle(selectedSlideIndex, e.target.value)}
                        className="bg-slate-900 border-slate-700 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="slide-content" className="block text-sm font-medium mb-2">
                        Slide Content
                      </label>
                      <RichTextEditor
                        content={slides[selectedSlideIndex].content}
                        onChange={(html) => updateSlideContent(selectedSlideIndex, html)}
                        placeholder="Add slide content here..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <Card className="bg-slate-800 border-slate-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video bg-black">
                    <iframe
                      srcDoc={generateUpdatedHTML()}
                      className="w-full h-full"
                      title="Presentation Preview"
                      sandbox="allow-scripts"
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end p-3 border-t border-slate-700">
                  <Button 
                    variant="outline" 
                    className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={() => {
                      const updatedHTML = generateUpdatedHTML();
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        newWindow.document.write(updatedHTML);
                        newWindow.document.close();
                      } else {
                        toast.error('Failed to open preview. Please allow popups.');
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Full Preview
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 