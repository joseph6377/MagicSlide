/**
 * Gemini function definitions for structured data generation
 * This file defines the functions that Gemini can "call" to generate structured data
 */

/**
 * Interface for image search query
 */
export interface ImageSearchQuery {
  query: string;
  imageType: 'photo' | 'illustration' | 'vector';
  orientation: 'horizontal' | 'vertical' | 'square';
}

/**
 * Interface for a slide in the presentation
 */
export interface PresentationSlide {
  title: string;
  description: string;
  searchQueries: ImageSearchQuery[];
}

/**
 * Function definition for generating presentation slides with image search queries
 */
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

/**
 * Type for the response from the generatePresentationSlides function
 */
export interface GeneratePresentationSlidesResponse {
  slides: PresentationSlide[];
} 