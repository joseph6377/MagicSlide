'use client';

import { useState } from 'react';
import { Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PixabayDialog from './pixabay-dialog';

interface PixabayButtonProps {
  onInsertImage: (html: string) => void;
  onInsertMultipleImages?: (htmlArray: string[]) => void;
  allowMultiple?: boolean;
  width?: number;
  height?: number;
}

export default function PixabayButton({ 
  onInsertImage, 
  onInsertMultipleImages,
  allowMultiple = false,
  width = 800, 
  height = 600 
}: PixabayButtonProps) {
  // Function to create a more readable URL format
  const formatUrl = (url: string) => {
    // Extract just the file ID from the URL to make it more compact
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    
    // Return a more compact representation
    return `${url.substring(0, 30)}...${lastPart.substring(lastPart.length - 10)}`;
  };

  // Handle single image selection
  const handleSelectImage = (imageUrl: string, attribution: string) => {
    // Create a formatted representation with smaller text for URLs without attribution
    const compactHtml = `<div class="pixabay-reference">![Pixabay Image](${imageUrl})</div>`;
    
    // Call the callback with the generated HTML
    onInsertImage(compactHtml);
  };

  // Handle multiple images selection
  const handleSelectMultipleImages = (images: Array<{url: string, attribution: string}>) => {
    if (!onInsertMultipleImages) return;
    
    // Generate compact markdown for each image without attribution comments
    const htmlArray = images.map(({ url }) => 
      `<div class="pixabay-reference">![Pixabay Image](${url})</div>`
    );
    
    // Call the callback with the array of generated HTML
    onInsertMultipleImages(htmlArray);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <PixabayDialog
              onSelectImage={handleSelectImage}
              onSelectMultipleImages={handleSelectMultipleImages}
              allowMultiple={allowMultiple}
              width={width}
              height={height}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Image className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{allowMultiple ? 'Insert Multiple Pixabay Images' : 'Insert Pixabay Image'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 