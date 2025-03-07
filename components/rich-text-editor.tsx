'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import ResizableImage from './rich-text-editor-extension'
import TextStyle from './text-style-extension'
import FontSize from './font-size-extension'
import { 
  Bold, Italic, List, ListOrdered, Image as ImageIcon, 
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Link as LinkIcon,
  Trash2, Undo, Redo, Type, ChevronUp, ChevronDown
} from 'lucide-react'
import { Button } from './ui/button'
import { useCallback, useEffect } from 'react'

// Helper function to check if an image exists
const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true; // If we get here without an error, assume the image exists
  } catch (error) {
    console.error("Error checking image:", error);
    return false;
  }
};

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the built-in heading to avoid duplication
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      ResizableImage, // Use our custom resizable image extension
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],  // Don't include 'resizableImage' here to avoid attribute conflicts
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      FontSize.configure({
        types: ['textStyle'],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
    // Fix SSR warning by explicitly setting immediatelyRender to false
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Use a safe approach to update content without triggering flushSync warnings
      setTimeout(() => {
        onChange(editor.getHTML())
      }, 0)
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Use queueMicrotask to safely update content
      queueMicrotask(() => {
        // Force a rerender to ensure all images are handled correctly
        editor.commands.setContent(content)
        
        // Allow time for images to be processed
        setTimeout(() => {
          // Force refresh of editor view
          editor.commands.focus('end')
        }, 100)
      })
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return

    const url = window.prompt('Enter image URL', 'https://')
    if (!url) return
    
    // Basic URL validation
    if (!url.match(/^(http|https):\/\/[^ "]+$/)) {
      alert('Please enter a valid image URL starting with http:// or https://')
      return
    }

    // Check if the image exists
    checkImageExists(url)
      .then(exists => {
        // Even if the check fails, we'll still try to load the image
        // but we'll log the result for debugging
        console.log(`Image check for ${url}: ${exists ? 'success' : 'failed'}`);
        
        try {
          // Show a loading state by inserting a placeholder image first
          editor.chain().focus().setNode('resizableImage', { 
            src: url,
            alt: 'Loading image...',
            width: '300', 
            height: '200'
          }).run()
          
          // Create a temporary image to get natural dimensions
          const img = new Image()
          
          img.onload = () => {
            try {
              // Successfully loaded the image, now update it with natural dimensions
              console.log("Image successfully preloaded:", url, img.naturalWidth, img.naturalHeight)
              
              // Use natural dimensions or defaults if they're not available
              const width = img.naturalWidth || 300
              const height = img.naturalHeight || 200
              
              // Insert the image directly without trying to select it first
              try {
                editor.chain().focus().insertContent({
                  type: 'resizableImage',
                  attrs: {
                    src: url,
                    alt: 'Image',
                    width: String(width),
                    height: String(height)
                  }
                }).run()
              } catch (error) {
                console.error("Error inserting image:", error)
              }
            } catch (updateError) {
              console.error("Error updating image attributes:", updateError)
            }
          }
          
          img.onerror = () => {
            try {
              console.error("Failed to preload image:", url)
              
              // Insert the image with an error state
              editor.chain().focus().insertContent({
                type: 'resizableImage',
                attrs: {
                  src: url, // Keep the original URL so error can show in component
                  alt: 'Error loading image',
                  width: '300',
                  height: '200'
                }
              }).run()
            } catch (errorStateError) {
              console.error("Error setting image error state:", errorStateError)
            }
          }
          
          // Set crossOrigin to anonymous to handle CORS issues
          img.crossOrigin = "anonymous"
          
          // Start loading the image
          img.src = url
        } catch (imageInsertError) {
          console.error("Error inserting image:", imageInsertError)
          alert("Failed to insert image. Please try again.")
        }
      });
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-slate-700 rounded-md overflow-hidden bg-slate-900">
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-700 bg-slate-800">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 h-8 ${editor.isActive('bold') ? 'bg-slate-700' : ''}`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 h-8 ${editor.isActive('italic') ? 'bg-slate-700' : ''}`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-slate-700 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 h-8 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-700' : ''}`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 h-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-700' : ''}`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-slate-700 mx-1" />
        <div className="flex items-center">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().decreaseFontSize().run()}
            className="px-2 h-8"
            title="Decrease Font Size"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-1">
            <Type className="h-4 w-4 mr-1" />
            <span className="text-xs">
              {editor?.getAttributes('textStyle').fontSize || '16px'}
            </span>
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().increaseFontSize().run()}
            className="px-2 h-8"
            title="Increase Font Size"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-px h-8 bg-slate-700 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 h-8 ${editor.isActive('bulletList') ? 'bg-slate-700' : ''}`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 h-8 ${editor.isActive('orderedList') ? 'bg-slate-700' : ''}`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-slate-700 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-2 h-8 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-700' : ''}`}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-2 h-8 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-700' : ''}`}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-2 h-8 ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-700' : ''}`}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-slate-700 mx-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={setLink}
          className={`px-2 h-8 ${editor.isActive('link') ? 'bg-slate-700' : ''}`}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={addImage}
          className="px-2 h-8"
          title="Add Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <div className="flex-1"></div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-2 h-8"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-2 h-8"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().clearContent().run()}
          className="px-2 h-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          title="Clear Content"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="min-h-[250px] max-h-[500px] overflow-y-auto" />
    </div>
  )
} 