'use client';

import { useState, useCallback } from 'react';
import { SlideWithImages } from '@/lib/slide-image-matcher';
import { PixabayImageHit } from '@/lib/pixabay';

interface UseImageMatcherOptions {
  maxQueriesPerSlide?: number;
  maxImagesPerSlide?: number;
}

interface UseImageMatcherResult {
  isLoading: boolean;
  error: string | null;
  slidesWithImages: SlideWithImages[];
  matchImagesToSlides: (html: string) => Promise<void>;
  generateImageQueries: (topic: string) => Promise<string[]>;
  insertImageIntoSlide: (slideIndex: number, image: PixabayImageHit) => string;
  stats: {
    totalSlides: number;
    totalQueries: number;
    totalImages: number;
  };
}

/**
 * Hook for matching images to slides
 */
export function useImageMatcher(options: UseImageMatcherOptions = {}): UseImageMatcherResult {
  const { maxQueriesPerSlide = 3, maxImagesPerSlide = 5 } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slidesWithImages, setSlidesWithImages] = useState<SlideWithImages[]>([]);
  const [stats, setStats] = useState({
    totalSlides: 0,
    totalQueries: 0,
    totalImages: 0
  });
  
  /**
   * Match images to slides
   */
  const matchImagesToSlides = useCallback(async (html: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/match-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html,
          maxQueriesPerSlide,
          maxImagesPerSlide
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to match images to slides');
      }
      
      const data = await response.json();
      setSlidesWithImages(data.slides);
      setStats({
        totalSlides: data.totalSlides,
        totalQueries: data.totalQueries,
        totalImages: data.totalImages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setSlidesWithImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [maxQueriesPerSlide, maxImagesPerSlide]);
  
  /**
   * Generate image search queries for a topic
   */
  const generateImageQueries = useCallback(async (topic: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/generate-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image search queries');
      }
      
      const data = await response.json();
      return data.map((item: any) => item.queries).flat();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Insert an image into a slide
   */
  const insertImageIntoSlide = useCallback((slideIndex: number, image: PixabayImageHit) => {
    // Find the slide
    const slide = slidesWithImages.find(s => s.index === slideIndex);
    if (!slide) {
      return '';
    }
    
    // Generate HTML for the image based on slide type
    let imageHtml = '';
    
    if (slide.type === 'cover') {
      // For cover slides, use the image as a background
      imageHtml = `
<section data-background="${image.largeImageURL}" data-background-opacity="0.7">
  <div style="background-color: rgba(0,0,0,0.6); padding: 20px; border-radius: 10px;">
    <h1>${slide.title}</h1>
  </div>
  <div style="position: absolute; bottom: 10px; right: 10px; font-size: 10px; color: white; opacity: 0.7;">
    Image by ${image.user} on Pixabay
  </div>
</section>`;
    } else {
      // For content slides, insert the image with attribution
      imageHtml = `
<div style="display: flex; flex-direction: column; align-items: center; margin: 20px 0;">
  <img src="${image.largeImageURL}" alt="${slide.title}" style="max-width: 100%; max-height: 70vh; object-fit: contain;" />
  <div style="font-size: 12px; margin-top: 10px; opacity: 0.7; align-self: flex-end;">
    Image by ${image.user} on Pixabay
  </div>
</div>`;
    }
    
    return imageHtml;
  }, [slidesWithImages]);
  
  return {
    isLoading,
    error,
    slidesWithImages,
    matchImagesToSlides,
    generateImageQueries,
    insertImageIntoSlide,
    stats
  };
} 