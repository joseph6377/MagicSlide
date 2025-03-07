export type MessageText = {
  type: 'text'
  text: string
}

export type MessageCode = {
  type: 'code'
  text: string
}

export type MessageImage = {
  type: 'image'
  image: string
}

export type ChatMessage = {
  role: 'assistant' | 'user'
  content: Array<MessageText | MessageCode | MessageImage>
  meta?: {
    title?: string
    description?: string
  }
}

export function toAISDKMessages(messages: ChatMessage[]) {
  return messages.map(message => ({
    role: message.role,
    content: message.content.map(content => {
      if (content.type === 'code') {
        return {
          type: 'text',
          text: content.text
        }
      }

      return content
    })
  }))
}

export async function toMessageImage(files: FileList | null) {
  if (!files || files.length === 0) {
    return []
  }

  return Promise.all(Array.from(files).map(async file => {
    // Validate that the file is an image
    if (!file.type.startsWith('image/')) {
      console.warn(`File "${file.name}" is not an image (type: ${file.type}). Skipping.`);
      return null;
    }
    
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
    return `data:${file.type};base64,${base64}`
  })).then(results => results.filter(Boolean) as string[]) // Filter out null values
}
