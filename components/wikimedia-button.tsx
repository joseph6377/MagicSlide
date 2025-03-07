'use client';

import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import WikimediaDialog from './wikimedia-dialog';

interface WikimediaButtonProps {
  onInsertImage: (html: string) => void;
  onInsertMultipleImages?: (htmlArray: string[]) => void;
  allowMultiple?: boolean;
}

export default function WikimediaButton({
  onInsertImage,
  onInsertMultipleImages,
  allowMultiple = false
}: WikimediaButtonProps) {
  
  // Handle single image selection
  const handleSelectImage = (imageUrl: string, attribution: string) => {
    // Generate HTML for the image
    const html = generateImageHtml(imageUrl, attribution);
    
    // Pass it to the parent component
    onInsertImage(html);
  };
  
  // Handle multiple image selection
  const handleSelectMultipleImages = (images: Array<{ url: string, attribution: string }>) => {
    if (!onInsertMultipleImages) return;
    
    // Generate HTML for each image
    const htmlArray = images.map(image => 
      generateImageHtml(image.url, image.attribution)
    );
    
    // Pass them to the parent component
    onInsertMultipleImages(htmlArray);
  };
  
  // Generate HTML for an image with attribution
  const generateImageHtml = (imageUrl: string, attribution: string) => {
    // Create HTML with image and attribution
    return `<img src="${imageUrl}" alt="Wikimedia Commons Image" />\n<p class="wikimedia-reference">${attribution}</p>`;
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <WikimediaDialog
              onSelectImage={handleSelectImage}
              onSelectMultipleImages={allowMultiple ? handleSelectMultipleImages : undefined}
              allowMultiple={allowMultiple}
              trigger={
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-slate-300 border-slate-700 bg-slate-800/60 hover:bg-slate-700 hover:text-white"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Wikimedia Commons
                </Button>
              }
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Search and insert images from Wikimedia Commons</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 