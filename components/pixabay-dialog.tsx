'use client';

import { useState } from 'react';
import { Search, Image, Loader2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PixabayImageHit, PixabaySearchResponse } from '@/lib/pixabay';
import { toast } from 'react-toastify';
import { Badge } from '@/components/ui/badge';

interface PixabayDialogProps {
  onSelectImage: (imageUrl: string, attribution: string) => void;
  onSelectMultipleImages?: (images: Array<{url: string, attribution: string}>) => void;
  allowMultiple?: boolean;
  trigger: React.ReactNode;
  width?: number;
  height?: number;
}

export default function PixabayDialog({ 
  onSelectImage, 
  onSelectMultipleImages,
  allowMultiple = false,
  trigger, 
  width = 800, 
  height = 600 
}: PixabayDialogProps) {
  const [query, setQuery] = useState('');
  const [imageType, setImageType] = useState<string>('all');
  const [orientation, setOrientation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PixabayImageHit[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<PixabayImageHit[]>([]);

  // Search for images
  const searchImages = async (resetPage = true) => {
    if (!query.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setIsLoading(true);
      
      // Build search URL
      const searchParams = new URLSearchParams({
        q: query,
        image_type: imageType,
        orientation: orientation,
        min_width: width.toString(),
        min_height: height.toString(),
        page: resetPage ? '1' : page.toString(),
        per_page: '20',
      });
      
      // Fetch images
      const response = await fetch(`/api/pixabay?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data: PixabaySearchResponse = await response.json();
      
      // Update state
      if (resetPage) {
        setResults(data.hits);
        setPage(1);
      } else {
        setResults(prev => [...prev, ...data.hits]);
        setPage(prev => prev + 1);
      }
      
      // Check if there are more results
      setHasMore(data.totalHits > page * 20);
      
      // Show message if no results
      if (data.hits.length === 0 && resetPage) {
        toast.info('No images found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching Pixabay:', error);
      toast.error('Failed to search for images');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop the event from propagating to parent forms
    searchImages(true);
  };

  // Handle image selection/toggle
  const handleToggleImage = (image: PixabayImageHit) => {
    if (!allowMultiple) {
      // Single image selection mode
      handleSelectSingleImage(image);
      return;
    }
    
    // Check if image is already selected
    const isSelected = selectedImages.some(img => img.id === image.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedImages(prev => prev.filter(img => img.id !== image.id));
    } else {
      // Add to selection
      setSelectedImages(prev => [...prev, image]);
    }
  };

  // Handle single image selection (original behavior)
  const handleSelectSingleImage = (image: PixabayImageHit) => {
    // Get the appropriate image size
    let imageUrl = image.webformatURL;
    
    // For larger presentations, use larger images
    if (width > 800 || height > 600) {
      imageUrl = image.largeImageURL;
    }
    
    // Create attribution text
    const attribution = `Image by ${image.user} on Pixabay`;
    
    // Call the callback
    onSelectImage(imageUrl, attribution);
    
    // Close the dialog
    setOpen(false);
  };

  // Handle inserting multiple images
  const handleInsertMultipleImages = () => {
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    const formattedImages = selectedImages.map(image => {
      // Get appropriate image size
      let imageUrl = image.webformatURL;
      if (width > 800 || height > 600) {
        imageUrl = image.largeImageURL;
      }
      
      // Create attribution
      const attribution = `Image by ${image.user} on Pixabay`;
      
      return { url: imageUrl, attribution };
    });
    
    // Call the callback with all selected images
    if (onSelectMultipleImages) {
      onSelectMultipleImages(formattedImages);
    }
    
    // Reset selection and close dialog
    setSelectedImages([]);
    setOpen(false);
  };

  // Check if an image is selected
  const isImageSelected = (imageId: number) => {
    return selectedImages.some(img => img.id === imageId);
  };

  // Load more results
  const loadMore = () => {
    searchImages(false);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedImages([]);
  };

  // Reset dialog state when closed
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setSelectedImages([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto" 
        onSubmit={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Prevent Enter key from bubbling up and submitting parent forms
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.stopPropagation();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            Search Pixabay Images
            {allowMultiple && (
              <Badge className="ml-2 bg-indigo-100 text-indigo-800">
                Multiple Selection Enabled
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 w-full mt-4">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="search-query" className="sr-only">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="search-query"
                    type="text"
                    placeholder="Search for images..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} onClick={(e) => {
                e.stopPropagation();
              }}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            
            <div className="flex space-x-4">
              <div className="w-1/2">
                <Label htmlFor="image-type">Image Type</Label>
                <Select value={imageType} onValueChange={setImageType}>
                  <SelectTrigger id="image-type">
                    <SelectValue placeholder="Image Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                    <SelectItem value="illustration">Illustration</SelectItem>
                    <SelectItem value="vector">Vector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-1/2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select value={orientation} onValueChange={setOrientation}>
                  <SelectTrigger id="orientation">
                    <SelectValue placeholder="Orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
          
          {allowMultiple && selectedImages.length > 0 && (
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
              <div className="flex items-center">
                <span className="text-sm font-medium">{selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSelections}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          )}
          
          {isLoading && results.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((image) => (
                <div 
                  key={image.id} 
                  className={`relative group cursor-pointer overflow-hidden rounded-md border transition-colors ${
                    isImageSelected(image.id) 
                      ? 'border-indigo-500 ring-2 ring-indigo-200' 
                      : 'border-slate-200 hover:border-indigo-500'
                  }`}
                  onClick={() => handleToggleImage(image)}
                >
                  <img 
                    src={image.previewURL} 
                    alt={image.tags} 
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 ${
                    isImageSelected(image.id) 
                      ? 'bg-black bg-opacity-20' 
                      : 'bg-black bg-opacity-0 group-hover:bg-opacity-30'
                  } flex items-center justify-center transition-all`}>
                    {isImageSelected(image.id) ? (
                      <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 text-white"
                      >
                        {allowMultiple ? 'Select' : 'Use This Image'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Image className="h-12 w-12 mb-4 opacity-30" />
              <p>No images found. Try searching for something.</p>
            </div>
          )}
          
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
          
          {allowMultiple && (
            <DialogFooter className="sm:justify-end">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleInsertMultipleImages}
                disabled={selectedImages.length === 0}
              >
                Insert {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          )}
          
          <div className="text-xs text-slate-500 text-center mt-4">
            Images provided by <a href="https://pixabay.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Pixabay</a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 