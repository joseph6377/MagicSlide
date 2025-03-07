'use client'

import { Extension } from '@tiptap/react'

type FontSizeOptions = {
  types: string[]
  defaultSize: string
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font size
       */
      setFontSize: (size: string) => ReturnType
      /**
       * Unset the font size
       */
      unsetFontSize: () => ReturnType
      /**
       * Increase the font size
       */
      increaseFontSize: () => ReturnType
      /**
       * Decrease the font size
       */
      decreaseFontSize: () => ReturnType
    }
  }
}

const SIZE_STEPS = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '60px', '72px']

export const FontSize = Extension.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
      defaultSize: '16px',
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: this.options.defaultSize,
            parseHTML: element => element.style.fontSize || this.options.defaultSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).run()
      },
      increaseFontSize: () => ({ chain, editor }) => {
        // Get current font size from selection
        const currentAttrs = editor.getAttributes('textStyle')
        const currentFontSize = currentAttrs.fontSize || this.options.defaultSize
        
        // Find current size in the size steps
        const currentIndex = SIZE_STEPS.indexOf(currentFontSize)
        
        // If not found or already at max, use the next size or stay at max
        const nextIndex = currentIndex === -1 
          ? SIZE_STEPS.findIndex(size => parseInt(size) > parseInt(currentFontSize)) 
          : Math.min(currentIndex + 1, SIZE_STEPS.length - 1)
        
        // Use the next size or the default if not found
        const newSize = nextIndex === -1 ? SIZE_STEPS[0] : SIZE_STEPS[nextIndex]
        
        return chain().setMark('textStyle', { fontSize: newSize }).run()
      },
      decreaseFontSize: () => ({ chain, editor }) => {
        // Get current font size from selection
        const currentAttrs = editor.getAttributes('textStyle')
        const currentFontSize = currentAttrs.fontSize || this.options.defaultSize
        
        // Find current size in the size steps
        const currentIndex = SIZE_STEPS.indexOf(currentFontSize)
        
        // If not found or already at min, use the previous size or stay at min
        const prevIndex = currentIndex === -1 
          ? SIZE_STEPS.findIndex(size => parseInt(size) < parseInt(currentFontSize)) - 1
          : Math.max(currentIndex - 1, 0)
        
        // Use the previous size or the default if not found
        const newSize = prevIndex === -1 ? SIZE_STEPS[0] : SIZE_STEPS[prevIndex]
        
        return chain().setMark('textStyle', { fontSize: newSize }).run()
      },
    }
  },
})

export default FontSize 