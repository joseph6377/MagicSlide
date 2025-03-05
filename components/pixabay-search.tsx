'use client';

import { useState, useEffect } from 'react';
import { Search, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PixabayImageHit, PixabaySearchResponse } from '@/lib/pixabay';
import { toast } from 'react-toastify';

interface PixabaySearchProps {
  onSelectImage: (image: PixabayImageHit) => void;
  width?: number;
  height?: number;
}

export default function PixabaySearch({ onSelectImage, width = 800, height = 600 }: PixabaySearchProps) {
  const [query, setQuery] = useState('');
  const [imageType, setImageType] = useState<string>('all');
  const [orientation, setOrientation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PixabayImageHit[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

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
    searchImages(true);
  };

  // Handle image selection
  const handleSelectImage = (image: PixabayImageHit) => {
    onSelectImage(image);
  };

  // Load more results
  const loadMore = () => {
    searchImages(false);
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
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
          <Button type="submit" disabled={isLoading}>
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
      
      {isLoading && results.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((image) => (
            <div 
              key={image.id} 
              className="relative group cursor-pointer overflow-hidden rounded-md border border-slate-200 hover:border-indigo-500 transition-colors"
              onClick={() => handleSelectImage(image)}
            >
              <img 
                src={image.previewURL} 
                alt={image.tags} 
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 text-white"
                >
                  Select
                </Button>
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
      
      <div className="text-xs text-slate-500 text-center mt-4">
        Images provided by <a href="https://pixabay.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Pixabay</a>
      </div>
    </div>
  );
} 