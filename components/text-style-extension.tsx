'use client'

import { Mark } from '@tiptap/react'

export interface TextStyleOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    textStyle: {
      /**
       * Set text style
       */
      setTextStyle: (attributes: Record<string, any>) => ReturnType
      /**
       * Remove empty text style
       */
      removeEmptyTextStyle: () => ReturnType
    }
  }
}

export const TextStyle = Mark.create<TextStyleOptions>({
  name: 'textStyle',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: element => {
          const hasStyles = element.hasAttribute('style')
          
          if (!hasStyles) {
            return false
          }

          return {}
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },

  addCommands() {
    return {
      setTextStyle: attributes => ({ chain }) => {
        return chain()
          .setMark(this.name, attributes)
          .run()
      },
      removeEmptyTextStyle: () => ({ chain }) => {
        return chain()
          .run()
      },
    }
  },
})

export default TextStyle 