export const htmlTemplate = `
  <!doctype html>
  <html>
    <head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/theme/black.min.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
      <style>
        .chart-container {
          width: 80%;
          max-width: 800px;
          height: 400px;
          margin: 0 auto;
          position: relative;
        }
        .mermaid {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          font-size: 18px;
          display: flex;
          justify-content: center;
        }
        .mermaid svg {
          max-width: 100%;
          max-height: 450px;
          height: auto !important;
          width: auto !important;
        }
        /* Ensure text is readable in diagrams */
        .mermaid .label {
          font-family: 'Arial', sans-serif;
          font-size: 16px;
        }
        /* Ensure flowchart fits in slide */
        .reveal .slides section {
          height: 700px;
          overflow: hidden;
        }
        .reveal .slides section .mermaid-slide {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: center;
        }
        /* Font Awesome icon styling */
        .fa-icon {
          font-size: 2em;
          margin: 0.2em;
          vertical-align: middle;
        }
        .icon-large {
          font-size: 4em;
        }
        .icon-medium {
          font-size: 2.5em;
        }
        .icon-small {
          font-size: 1.5em;
        }
        .icon-list {
          list-style-type: none;
          padding-left: 0;
        }
        .icon-list li {
          margin: 0.5em 0;
        }
        .icon-list li i {
          margin-right: 0.5em;
        }
        .icon-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1em;
        }
        .icon-grid i {
          font-size: 2.5em;
          margin: 0.5em;
        }
        /* Improved image styling */
        .reveal .slides section img {
          max-width: 80% !important;
          max-height: 60vh !important;
          height: auto !important;
          width: auto !important;
          margin: 0 auto;
          display: block;
          object-fit: contain !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Image caption styling */
        .image-caption {
          font-size: 12px;
          text-align: right;
          opacity: 0.7;
          margin-top: 5px;
          margin-bottom: 15px;
        }
        /* Image container styling */
        .image-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 20px 0;
          width: 100%;
        }
      </style>
    </head>
    <body>
      <div class="reveal">
        <div class="slides">
          // generate slides here
        </div>
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.3.1/reveal.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
      <script>
        // Initialize Reveal.js
        Reveal.initialize({
          // Add configuration to better handle slides with diagrams
          width: 1200,
          height: 700,
          margin: 0.1,
          minScale: 0.2,
          maxScale: 2.0
        });
        
        // Initialize Mermaid with better configuration
        mermaid.initialize({ 
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            useMaxWidth: false
          },
          fontSize: 18
        });
        
        // Setup Chart.js
        Reveal.addEventListener('ready', function() {
          // Find all chart canvas elements and initialize
          document.querySelectorAll('canvas.chart').forEach(function(canvas) {
            if (canvas.dataset.chart) {
              try {
                const chartConfig = JSON.parse(canvas.dataset.chart);
                new Chart(canvas, chartConfig);
              } catch (e) {
                console.error('Failed to initialize chart:', e);
              }
            }
          });
          
          // Re-render mermaid diagrams
          try {
            mermaid.init(undefined, document.querySelectorAll('.mermaid'));
          } catch (e) {
            console.error('Failed to initialize mermaid diagrams:', e);
          }
        });
        
        // Handle slide changes to properly resize charts and diagrams
        Reveal.addEventListener('slidechanged', function(event) {
          // Resize charts
          setTimeout(function() {
            window.dispatchEvent(new Event('resize'));
          }, 100);
          
          // Re-render mermaid diagrams on the current slide
          try {
            const currentSlide = event.currentSlide;
            if (currentSlide) {
              const diagrams = currentSlide.querySelectorAll('.mermaid');
              if (diagrams.length > 0) {
                mermaid.init(undefined, diagrams);
              }
            }
          } catch (e) {
            console.error('Failed to re-render mermaid diagrams:', e);
          }
        });
      </script>
    </body>
  </html>
`;
