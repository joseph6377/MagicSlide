<h1 align="center">Welcome to SlideMagic AI 🪄</h1>

A beautiful AI-powered presentation generator that creates stunning slides from simple text prompts. Built with modern technology and designed for local use without requiring external services.

## ✨ Features

- **AI-Powered Presentations**: Generate professional-looking presentations from text descriptions
- **Modern UI**: Clean, intuitive interface with a beautiful dark theme
- **Local Operation**: Runs completely on your machine with no data sent to external services (except to Gemini API)
- **Custom API Key**: Use your own Google Gemini API key or the provided default
- **Instant Previews**: See your generated presentation code and preview in real-time
- **One-Click Download**: Export your presentations as HTML files
- **Fullscreen Preview**: View your presentations in fullscreen mode with one click
- **Theme Selection**: Choose from various presentation themes
- **Manual Image Selection**: Add images to your presentations from Pixabay

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
   - Use the "Search Images" button to find and select images from Pixabay
   - Selected images will be added to your prompt automatically
5. Press Enter or click the magic wand icon to generate your presentation
6. Switch between Code and Preview tabs to see and interact with your presentation
7. Use the fullscreen button to view your presentation in presentation mode
8. Download the HTML file to save your presentation
9. Click on the SlideMagic AI logo any time to reset and start over

> **Note**: If you want a completely image-free presentation, include "no images please" in your prompt.

## 💻 Tech Stack
- [Next.js](https://nextjs.org/docs) - React Framework
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Google Gemini API](https://ai.google.dev/) - AI Text Generation
- [Reveal.js](https://revealjs.com/) - Presentation Framework
- [Pixabay API](https://pixabay.com/api/docs/) - Image Search

## 💗 Credits
- **Built by**: [Joseph Thekkekara](https://josepht.in)
- **Original Project**: Based on [RevealJS AI](https://github.com/YOYZHANG/ai-ppt) by [YOYZHANG](https://github.com/YOYZHANG)
- [Gemini API](https://ai.google.dev/) - AI Engine

## 📝 License
MIT License © 2024

---

If you find this project helpful, please consider giving it a star! ⭐️
