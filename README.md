# AI Presentation Generator

This application uses AI to generate beautiful presentations with relevant images. It leverages Gemini's function calling capability to streamline the image search process.

## How It Works

The application uses a multi-step process to generate presentations with relevant images:

1. **Function Calling for Structured Data Generation**
   - We define a function schema that specifies exactly what data we need for image searches
   - The function generates an array of slides, each with:
     - A title/topic
     - A description
     - Multiple search queries with image type and orientation preferences
   - This structured approach eliminates the need for complex prompt engineering or text parsing

2. **Image Search**
   - The structured queries are used to search for images via the Wikimedia API
   - Each query includes specific parameters like image type (photo, illustration, vector) and orientation

3. **Presentation Generation**
   - The AI model generates a complete HTML presentation using reveal.js
   - Images are automatically integrated into the presentation
   - The presentation includes proper attribution for all images

4. **Presentation Editing**
   - Visual WYSIWYG editor for modifying presentations (no HTML knowledge required)
   - Rich text formatting with intuitive toolbar (bold, italic, headings, lists, alignment)
   - Add images and links directly through the editor
   - Resize images by dragging the handle in the corner
   - Modify slide titles and content easily
   - Preview changes in real-time with side-by-side editing and preview
   - Download or save edited presentations

## Implementation Details

### Function Definition

The function definition serves as a structured schema that the AI will fill in with appropriate content:

```typescript
export const generatePresentationSlidesFunction = {
  name: "generatePresentationSlides",
  description: "Generate slides for a presentation with relevant image search queries for each slide",
  parameters: {
    type: "object",
    properties: {
      slides: {
        type: "array",
        description: "Array of slides for the presentation",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the slide"
            },
            description: {
              type: "string",
              description: "Brief description of the slide content"
            },
            searchQueries: {
              type: "array",
              description: "Image search queries relevant to this slide",
              items: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Specific image search query"
                  },
                  imageType: {
                    type: "string",
                    description: "Preferred image type",
                    enum: ["photo", "illustration", "vector"]
                  },
                  orientation: {
                    type: "string",
                    description: "Preferred image orientation",
                    enum: ["horizontal", "vertical", "square"]
                  }
                },
                required: ["query", "imageType", "orientation"]
              }
            }
          },
          required: ["title", "description", "searchQueries"]
        }
      }
    },
    required: ["slides"]
  }
};
```

### API Endpoints

1. **`/api/generate-slides`**
   - Uses Gemini's function calling to generate structured slide data with image search queries
   - Returns a structured JSON response with slide titles, descriptions, and search queries

2. **`/api/wikimedia/batch`**
   - Accepts batch queries for image searches
   - Returns image results from Wikimedia

3. **`/api/chat`**
   - Main endpoint for generating the presentation
   - Uses the structured data to enhance the prompt with relevant images

## Benefits of Function Calling

1. **Structured Data**: The AI generates exactly the data structure we need, eliminating parsing complexity
2. **Improved Efficiency**: Reduces the number of API calls needed
3. **Better Quality**: More specific image search queries lead to more relevant images
4. **Maintainability**: Easier to update and extend the functionality

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up your Gemini API key in the settings
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Requirements

- Node.js 18+
- Google Gemini API key

## ✨ Features

- **AI-Powered Presentations**: Generate professional-looking presentations from text descriptions
- **Modern UI**: Clean, intuitive interface with a beautiful dark theme
- **Local Operation**: Runs completely on your machine with no data sent to external services (except to Gemini API)
- **Custom API Key**: Use your own Google Gemini API key or the provided default
- **Instant Previews**: See your generated presentation code and preview in real-time
- **One-Click Download**: Export your presentations as HTML files
- **Fullscreen Preview**: View your presentations in fullscreen mode with one click
- **Theme Selection**: Choose from various presentation themes
- **Manual Image Selection**: Add images to your presentations from Wikimedia
- **Function Calling**: Uses Gemini's function calling capability for structured data generation and improved image search
- **Visual Presentation Editor**: Edit your presentations with a user-friendly WYSIWYG interface - no HTML knowledge required
- **Image Resizing**: Easily resize images in the editor by dragging the corner handle

## 🚀 Getting Started

### Installation

```sh
# Clone the repository
git clone https://github.com/josephti/slidemagic-ai.git
cd slidemagic-ai

# Install dependencies
pnpm install
```

### Configuration

Create a `.env.local` file in the root directory with your Gemini API key:

```sh
# Only Gemini API key is needed
GEMINI_API_KEY=your_gemini_api_key_here
```

You can also set your API key directly from the settings menu in the application.

### Usage

```sh
# Start the development server
pnpm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 How to Use

1. Click the settings gear icon in the top right to configure your Gemini API key (optional)
2. Type your presentation description in the main input field
3. Select a presentation theme from the dropdown
4. To add images:
   - Click "Advanced Options" below the input field
   - Use the "Search Images" button to find and select images from Wikimedia
   - Selected images will be added to your prompt automatically
5. Press Enter or click the magic wand icon to generate your presentation
6. Switch between Code and Preview tabs to see and interact with your presentation
7. Use the fullscreen button to view your presentation in presentation mode
8. Use the edit button to open the presentation editor for making changes
9. Download the HTML file to save your presentation
10. Click on the SlideMagic AI logo any time to reset and start over

> **Note**: If you want a completely image-free presentation, include "no images please" in your prompt.

## 💻 Tech Stack
- [Next.js](https://nextjs.org/docs) - React Framework
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Google Gemini API](https://ai.google.dev/) - AI Text Generation
- [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling) - Structured Data Generation
- [Reveal.js](https://revealjs.com/) - Presentation Framework
- [Wikimedia API](https://www.mediawiki.org/wiki/API:Main_page) - Image Search

## 💗 Credits
- **Built by**: [Joseph Thekkekara](https://josepht.in)
- **Original Project**: Based on [RevealJS AI](https://github.com/YOYZHANG/ai-ppt) by [YOYZHANG](https://github.com/YOYZHANG)
- [Gemini API](https://ai.google.dev/) - AI Engine

## 🚀 Deploying to Vercel

This project is ready to be deployed to Vercel:

1. Fork or clone this repository
2. Connect your GitHub repository to Vercel
3. Configure the following environment variables in the Vercel dashboard:
   - `GEMINI_API_KEY`: Your Google Gemini API key (required)
4. Deploy!

Vercel will automatically detect the Next.js framework and set up the build configuration.

## 📝 License
MIT License © 2024

---

If you find this project helpful, please consider giving it a star! ⭐️
