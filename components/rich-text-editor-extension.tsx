'use client'

import { Node, mergeAttributes } from '@tiptap/react'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ImageResize from './rich-text-editor-image'

export interface ImageOptions {
  HTMLAttributes: Record<string, any>
}

// Create the extension
export const ResizableImage = Node.create({
  name: 'resizableImage',
  
  group: 'block',
  
  inline: false,
  
  draggable: true,
  
  // Add stronger prioritization for parsing
  priority: 100,
  
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (value: any) => {
          // Sanitize and validate the URL
          if (typeof value === 'string' && value.trim()) {
            // Return cleaned URL
            return value.trim()
          }
          return null
        }
      },
      alt: {
        default: '',
        parseHTML: (value: any) => value ? String(value) : '',
      },
      title: {
        default: null,
        parseHTML: (value: any) => value ? String(value) : null,
      },
      width: {
        default: '300',
        parseHTML: (value: any) => {
          if (value && !isNaN(parseInt(value, 10))) {
            return String(parseInt(value, 10))
          }
          return '300'
        },
        renderHTML: (value: any) => {
          if (value !== null && value !== undefined) {
            // Check that value is a primitive type that can be converted to string
            if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
              return String(value)
            }
          }
          return '300'
        }
      },
      height: {
        default: '200',
        parseHTML: (value: any) => {
          if (value && !isNaN(parseInt(value, 10))) {
            return String(parseInt(value, 10))
          }
          return '200'
        },
        renderHTML: (value: any) => {
          if (value !== null && value !== undefined) {
            // Check that value is a primitive type that can be converted to string
            if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
              return String(value)
            }
          }
          return '200'
        }
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: node => {
          if (typeof node === 'object' && node instanceof HTMLElement) {
            // Get attributes
            const src = node.getAttribute('src')
            
            // Only parse valid images
            if (src && src.trim()) {
              return {
                src: src.trim(),
                alt: node.getAttribute('alt') || '',
                title: node.getAttribute('title') || null,
                width: node.getAttribute('width') || node.style.width || '300',
                height: node.getAttribute('height') || node.style.height || '200',
              }
            }
          }
          return false
        }
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    const safeAttrs: Record<string, string> = {}
    
    // Explicitly define the attributes we want to keep
    const allowedAttrs = ['src', 'alt', 'title', 'width', 'height']
    
    // Only copy the attributes we expect
    allowedAttrs.forEach(attr => {
      if (HTMLAttributes[attr] !== undefined && HTMLAttributes[attr] !== null) {
        safeAttrs[attr] = String(HTMLAttributes[attr])
      }
    })
    
    // Ensure required attributes are present
    if (!safeAttrs.src) {
      console.warn('Image rendering without src attribute')
      // Provide a transparent 1x1 pixel data URI as fallback
      safeAttrs.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      // Add alt text to indicate placeholder
      safeAttrs.alt = safeAttrs.alt || 'Image Placeholder'
    }
    
    if (!safeAttrs.width) safeAttrs.width = '300'
    if (!safeAttrs.height) safeAttrs.height = '200'
    
    // Instead of directly returning our attributes object, use mergeAttributes 
    // which properly handles attribute serialization
    return ['img', mergeAttributes({}, safeAttrs)]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer((props) => {
      // Extract the necessary props from the node view props
      const nodeProps = {
        src: props.node.attrs.src || '',
        alt: props.node.attrs.alt || '',
        title: props.node.attrs.title || '',
        width: props.node.attrs.width || '300',
        height: props.node.attrs.height || '200',
        selected: props.selected,
        updateAttributes: props.updateAttributes,
      };
      
      // Pass the extracted props to the ImageResize component
      return <ImageResize {...nodeProps} />;
    })
  },
})

export default ResizableImage 