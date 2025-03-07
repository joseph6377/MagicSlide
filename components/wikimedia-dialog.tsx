'use client';

import { useState } from 'react';
import { Search, Globe, Loader2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WikimediaImage, WikimediaSearchResponse } from '@/lib/wikimedia';
import { toast } from 'react-toastify';
import { Badge } from '@/components/ui/badge';

interface WikimediaDialogProps {
  onSelectImage: (imageUrl: string, attribution: string) => void;
  onSelectMultipleImages?: (images: Array<{url: string, attribution: string}>) => void;
  allowMultiple?: boolean;
  trigger: React.ReactNode;
  width?: number;
  height?: number;
}

export default function WikimediaDialog({ 
  onSelectImage, 
  onSelectMultipleImages,
  allowMultiple = false,
  trigger, 
  width = 800, 
  height = 600 
}: WikimediaDialogProps) {
  const [query, setQuery] = useState('');
  const [imageType, setImageType] = useState<string>('photo');
  const [orientation, setOrientation] = useState<string>('horizontal');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<WikimediaImage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<WikimediaImage[]>([]);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  // Search for images
  const searchImages = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setIsLoading(true);
      
      // Build search URL with parameters matching the WikimediaSearchParams interface
      const searchParams = new URLSearchParams({
        keyword: query,
        imageType: imageType,
        orientation: orientation,
        limit: '20',
      });
      
      // Fetch images from our API endpoint
      const response = await fetch(`/api/wikimedia?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data: WikimediaSearchResponse = await response.json();
      
      // Update state with the images from the response
      setResults(data.images || []);
      
      // Check if there are more results
      setHasMore(data.total ? data.total > 20 : false);
      
      // Show message if no results
      if (!data.images || data.images.length === 0) {
        toast.info('No images found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching Wikimedia:', error);
      toast.error('Failed to search for images');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop the event from propagating to parent forms
    searchImages();
  };

  // Handle image selection/toggle
  const handleToggleImage = (image: WikimediaImage) => {
    if (!allowMultiple) {
      // Single image selection mode
      handleSelectSingleImage(image);
      return;
    }
    
    // Check if image is already selected
    const isSelected = selectedImages.some(img => img.url === image.url);
    
    if (isSelected) {
      // Remove from selection
      setSelectedImages(prev => prev.filter(img => img.url !== image.url));
    } else {
      // Add to selection
      setSelectedImages(prev => [...prev, image]);
    }
  };

  // Handle single image selection (original behavior)
  const handleSelectSingleImage = (image: WikimediaImage) => {
    // Get the image URL
    const imageUrl = image.url;
    
    // Create attribution text with author and license if available
    let attribution = `Image from Wikimedia Commons`;
    if (image.author) {
      attribution += ` by ${image.author}`;
    }
    if (image.license) {
      attribution += ` (${image.license})`;
    }
    
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
      // Get image URL
      const imageUrl = image.url;
      
      // Create attribution with author and license if available
      let attribution = `Image from Wikimedia Commons`;
      if (image.author) {
        attribution += ` by ${image.author}`;
      }
      if (image.license) {
        attribution += ` (${image.license})`;
      }
      
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
  const isImageSelected = (imageUrl: string) => {
    return selectedImages.some(img => img.url === imageUrl);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedImages([]);
  };

  // Function to handle image loading
  const handleImageLoad = (imageUrl: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
  };

  // Function to handle image loading start
  const handleImageLoadStart = (imageUrl: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.add(imageUrl);
      return newSet;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Wikimedia Commons Images</DialogTitle>
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
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((image, index) => (
                <div 
                  key={index} 
                  className={`relative group cursor-pointer overflow-hidden rounded-md border transition-colors ${
                    isImageSelected(image.url) 
                      ? 'border-indigo-500 ring-2 ring-indigo-200' 
                      : 'border-slate-200 hover:border-indigo-500'
                  }`}
                  onClick={() => handleToggleImage(image)}
                >
                  {/* Loading indicator */}
                  {loadingImages.has(image.url) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/30 z-10">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  
                  {/* Use thumbUrl if available, otherwise append size constraints to URL */}
                  <img 
                    src={
                      image.thumbUrl || 
                      (image.url.includes('?') 
                        ? `${image.url}&width=200` 
                        : `${image.url}?width=200`)
                    } 
                    alt={image.title} 
                    className="w-full h-32 object-cover"
                    loading="lazy"
                    width="200"
                    height="150"
                    onLoad={() => handleImageLoad(image.url)}
                    onError={() => handleImageLoad(image.url)}
                    onLoadStart={() => handleImageLoadStart(image.url)}
                  />
                  <div className={`absolute inset-0 ${
                    isImageSelected(image.url) 
                      ? 'bg-black bg-opacity-20' 
                      : 'bg-black bg-opacity-0 group-hover:bg-opacity-30'
                  } flex items-center justify-center transition-all`}>
                    {isImageSelected(image.url) ? (
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
              <Globe className="h-12 w-12 mb-4 opacity-30" />
              <p>No images found. Try searching for something.</p>
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
            Images provided by <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Wikimedia Commons</a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 