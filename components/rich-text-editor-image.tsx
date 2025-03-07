'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { NodeViewWrapper } from '@tiptap/react'

// Add cache utilities
const IMAGE_CACHE_PREFIX = 'image_cache_';

// Function to normalize image URLs
const normalizeImageUrl = (src: string): string => {
  if (!src) return '';
  
  // Add https:// if URL doesn't have a protocol
  if (src && !src.match(/^https?:\/\//i) && !src.startsWith('data:')) {
    return `https://${src}`;
  }
  
  return src;
};

// Function to validate image URL
const isValidImageUrl = (src: string): boolean => {
  if (!src) return false;
  
  // Check if it's a data URL
  if (src.startsWith('data:image/')) return true;
  
  // Basic URL validation
  try {
    const url = new URL(normalizeImageUrl(src));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    console.error('Invalid URL:', src);
    return false;
  }
};

// Function to cache an image
const cacheImage = async (src: string, blob: Blob): Promise<void> => {
  try {
    // Use a normalized key for storage
    const normalizedSrc = normalizeImageUrl(src);
    localStorage.setItem(`${IMAGE_CACHE_PREFIX}${normalizedSrc}`, URL.createObjectURL(blob));
    console.log(`Image cached: ${normalizedSrc}`);
  } catch (error) {
    console.error('Error caching image:', error);
  }
};

// Function to get cached image
const getCachedImage = (src: string): string | null => {
  try {
    // Use a normalized key for retrieval
    const normalizedSrc = normalizeImageUrl(src);
    return localStorage.getItem(`${IMAGE_CACHE_PREFIX}${normalizedSrc}`);
  } catch (error) {
    console.error('Error retrieving cached image:', error);
    return null;
  }
};

export interface ImageResizeProps {
  src: string
  alt?: string
  title?: string
  width?: string | number
  height?: string | number
  selected?: boolean
  updateAttributes: (attrs: Record<string, any>) => void
}

// Helper to sanitize attribute values for security and compatibility
const sanitizeAttributes = (attrs: Record<string, any>): Record<string, string> => {
  const safeAttrs: Record<string, string> = {}
  
  Object.entries(attrs).forEach(([key, value]) => {
    // Ensure all attributes are strings
    safeAttrs[key] = String(value || '')
  })
  
  return safeAttrs
}

const ImageResize = (props: ImageResizeProps) => {
  const [isResizing, setIsResizing] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [width, setWidth] = useState<number>(props.width ? Number(props.width) : 300)
  const [height, setHeight] = useState<number>(props.height ? Number(props.height) : 200)
  const [aspectRatio, setAspectRatio] = useState(1.5)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isUsingCache, setIsUsingCache] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Initialize image source with validation
  useEffect(() => {
    if (props.src) {
      const normalizedSrc = normalizeImageUrl(props.src);
      setImageSrc(normalizedSrc);
      
      if (!isValidImageUrl(normalizedSrc)) {
        console.error('Invalid image URL format:', normalizedSrc);
        setHasError(true);
      }
    } else {
      setHasError(true);
    }
  }, []);

  const safeUpdateAttributes = (attrs: Record<string, any>) => {
    const safeAttrs = sanitizeAttributes(attrs)
    
    // Ensure we save normalized URLs
    if (attrs.src && !attrs.src.startsWith('data:')) {
      safeAttrs.src = normalizeImageUrl(attrs.src);
    }
    
    props.updateAttributes(safeAttrs)
  }

  // Try to load from cache if original source fails
  const tryLoadFromCache = useCallback(() => {
    const cachedSrc = getCachedImage(props.src);
    if (cachedSrc) {
      console.log('Using cached image:', props.src);
      setImageSrc(cachedSrc);
      setIsUsingCache(true);
      return true;
    }
    return false;
  }, [props.src]);

  // Handle fetch and cache of the image
  const fetchAndCacheImage = useCallback(async (src: string) => {
    if (!isValidImageUrl(src)) {
      console.error('Cannot fetch invalid URL:', src);
      return false;
    }
    
    try {
      const normalizedSrc = normalizeImageUrl(src);
      const response = await fetch(normalizedSrc, { 
        mode: 'cors',
        headers: {
          // Add referer and origin headers to help with CORS
          'Referer': window.location.origin,
        }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      
      const blob = await response.blob();
      await cacheImage(src, blob);
      
      return true;
    } catch (error) {
      console.error('Error fetching or caching image:', error);
      return false;
    }
  }, []);

  // Update source and dimensions when props change
  useEffect(() => {
    // Handle source change
    if (props.src && !isUsingCache) {
      const normalizedSrc = normalizeImageUrl(props.src);
      
      if (normalizedSrc !== imageSrc) {
        setImageSrc(normalizedSrc);
        setIsUsingCache(false);
        setIsImageLoaded(false);
        setHasError(false);
      }
    }
    
    // Update dimensions
    if (props.width) setWidth(Number(props.width));
    if (props.height) setHeight(Number(props.height));
  }, [props.src, props.width, props.height, imageSrc, isUsingCache]);

  // Handle image load success
  const onImageLoad = useCallback(() => {
    if (imageRef.current) {
      console.log('Image loaded successfully:', imageSrc);
      
      // Cache the image if it's not already from cache
      if (!isUsingCache && props.src) {
        fetchAndCacheImage(props.src);
      }
      
      // Calculate aspect ratio and set dimensions
      const imgNaturalWidth = imageRef.current.naturalWidth || width;
      const imgNaturalHeight = imageRef.current.naturalHeight || height;
      
      setAspectRatio(imgNaturalWidth / imgNaturalHeight || 1.5);
      setIsImageLoaded(true);
      setHasError(false);
    }
  }, [imageSrc, isUsingCache, props.src, fetchAndCacheImage, width, height]);

  // Handle image load error
  const onImageError = useCallback(() => {
    console.error('Error loading image:', imageSrc);
    
    // If using original source and it failed, try loading from cache
    if (!isUsingCache && props.src) {
      const hasCachedVersion = tryLoadFromCache();
      
      if (!hasCachedVersion) {
        setHasError(true);
        setIsImageLoaded(false);
      }
    } else {
      // If cache also failed, show error state
      setHasError(true);
      setIsImageLoaded(false);
    }
  }, [imageSrc, isUsingCache, props.src, tryLoadFromCache]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new dimensions
      const dx = e.clientX - (resizeRef.current?.getBoundingClientRect().right || 0);
      const newWidth = Math.max(50, Math.min(800, width + dx));
      const newHeight = Math.round(newWidth / aspectRatio);

      setWidth(newWidth);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      
      // Update dimensions in the editor
      safeUpdateAttributes({
        src: props.src || '',
        alt: props.alt || '',
        title: props.title || '',
        width: String(width),
        height: String(height)
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width, height, aspectRatio, props, safeUpdateAttributes]);

  return (
    <NodeViewWrapper className="image-wrapper relative inline-block my-4">
      <div 
        className="image-container relative border border-slate-700 rounded overflow-hidden bg-slate-800" 
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-sm p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Image failed to load</span>
            <span className="text-xs mt-1 text-slate-500 break-all text-center max-w-full">
              {props.src ? 
                props.src.length > 40 ? 
                  props.src.substring(0, 40) + '...' 
                : props.src
              : 'No source provided'}
            </span>
            <button 
              onClick={() => {
                // Reset error state and try loading again
                setHasError(false);
                setIsImageLoaded(false);
                setIsUsingCache(false);
                
                // Try with normalized URL
                const normalizedSrc = normalizeImageUrl(props.src || '');
                setImageSrc(normalizedSrc);
              }}
              className="mt-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs rounded"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {!isImageLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400 text-sm absolute top-0 left-0 z-10">
                <span>Loading image...</span>
              </div>
            )}
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt={props.alt || ''}
                title={props.title || ''}
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                style={{ 
                  maxWidth: '100%', 
                  display: 'block',
                  visibility: isImageLoaded ? 'visible' : 'hidden'
                }}
                onLoad={onImageLoad}
                onError={onImageError}
              />
            )}
          </>
        )}
        
        {/* Resize handle */}
        <div 
          ref={resizeRef}
          className="resize-handle absolute w-4 h-4 bg-indigo-500 rounded-full right-0 bottom-0 cursor-se-resize border-2 border-white shadow-md"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

export default ImageResize 