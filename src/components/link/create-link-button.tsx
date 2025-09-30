'use client';

import z from 'zod';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LinkPageContext } from '@/context/link-page-context';
import { useCreateLink } from '@/hooks/mutations';
import { type FileWithPreview } from '@/hooks/use-file-upload';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, ImageIcon, Loader2, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FileUpload from '../file-upload';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters long',
  }),
  url: z.string().url('Please enter a valid URL'),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  domain: string;
  favicon?: string;
  siteName?: string;
  type?: string;
}

export const CreateLinkButton = () => {
  const { user } = useAuth();
  const { selectedPage, keywordLink } = useContext(LinkPageContext);

  const [isOpen, setIsOpen] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  const { trigger, isMutating } = useCreateLink({
    search: keywordLink || '',
    pageId: selectedPage?.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
      imageUrl: '',
      description: '',
    },
  });

  const debouncedUrl = useDebounce(urlInput, 500);

  // Fetch metadata when URL changes
  const { setValue } = form;
  useEffect(() => {
    const fetchMetadata = async () => {
      if (debouncedUrl && debouncedUrl.trim() !== '') {
        // Basic URL validation
        try {
          new URL(debouncedUrl);
          setIsFetchingMetadata(true);
          try {
            const metadata = await fetchLinkMetadata(debouncedUrl);
            if (metadata) {
              setMetadata(metadata);
              setValue('title', metadata.title || '');
              setValue('url', debouncedUrl);
              setValue('description', metadata.description || '');

              // Set image from metadata
              const imageUrl = metadata.image || '';
              setValue('imageUrl', imageUrl);
              setCurrentImageUrl(imageUrl);
            }
          } catch (_error) {
            console.error('Error fetching metadata:', _error);
            toast.error('Failed to fetch link metadata. Please try again.');
          } finally {
            setIsFetchingMetadata(false);
          }
        } catch (_error) {
          // Invalid URL
          setMetadata(null);
        }
      } else {
        setMetadata(null);
        setCurrentImageUrl('');
      }
    };

    fetchMetadata();
  }, [debouncedUrl, setValue]);

  async function fetchLinkMetadata(url: string) {
    try {
      const response = await fetch(
        `/api/link-meta?url=${encodeURIComponent(url)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      toast.error('Authentication required. Please log in again.');
      return;
    }

    const response = await trigger({
      ...values,
      pageId: selectedPage?.id,
      imageUrl: currentImageUrl ?? values.imageUrl ?? metadata?.image ?? '',
    });
    if (response.success) {
      form.reset();
      setMetadata(null);
      setCurrentImageUrl('');
      setUrlInput('');
      setIsOpen(false);
    }
  }

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    form.setValue('url', value);
  };

  const handleImageChange = (files: FileWithPreview[]) => {
    if (files.length > 0) {
      const file = files[0];
      if ('file' in file && file.file instanceof File) {
        // New uploaded file
        const imageUrl = file.preview || '';
        setCurrentImageUrl(imageUrl);
        form.setValue('imageUrl', imageUrl);
      } else if ('url' in file.file && typeof file.file.url === 'string') {
        // Existing file
        const imageUrl = file.file.url;
        setCurrentImageUrl(imageUrl);
        form.setValue('imageUrl', imageUrl);
      }
    } else {
      // File removed - revert to metadata image if available
      const fallbackImage = metadata?.image || '';
      setCurrentImageUrl(fallbackImage);
      form.setValue('imageUrl', fallbackImage);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    form.reset();
    setMetadata(null);
    setCurrentImageUrl('');
    setUrlInput('');
  };

  if (!user || !user.username || !selectedPage?.id) {
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="w-full gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Link</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Add new Link</DialogTitle>
          <DialogDescription>
            Enter a URL to fetch metadata and create a new link.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: URL Input */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="https://example.com"
                          value={urlInput}
                          onChange={(e) => {
                            handleUrlChange(e.target.value);
                            field.onChange(e.target.value);
                          }}
                          disabled={isMutating}
                          className="pr-10"
                        />
                        {isFetchingMetadata && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Step 2: Metadata Preview with Image Management */}
            {(metadata || isFetchingMetadata) && (
              <>
                {isFetchingMetadata ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                ) : metadata ? (
                  <div className="w-full relative space-y-4 flex flex-col">
                    {/* Link Preview */}
                    <Link
                      href={metadata.url}
                      target="_blank"
                      className="w-full flex-1 min-w-0 flex items-start gap-3"
                    >
                      {metadata.image && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={metadata.image}
                            alt={metadata.title || 'Link preview'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/fallback-image.png';
                              e.currentTarget.onerror = null;
                            }}
                          />
                        </div>
                      )}
                      <div className="min-w-0 w-full">
                        <h3 className="font-medium text-sm truncate">
                          {metadata.title || 'No title'}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {metadata.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <ExternalLink className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground truncate">
                            {metadata.domain}
                          </span>
                        </div>
                      </div>
                    </Link>
                    {/* Image Upload/Replacement */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Image {currentImageUrl !== metadata.image && '(Custom)'}
                      </label>
                      <FileUpload
                        fileUrl={currentImageUrl}
                        onFilesChange={handleImageChange}
                      />
                      {currentImageUrl !== metadata.image && metadata.image && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentImageUrl(metadata.image);
                            form.setValue('imageUrl', metadata.image);
                          }}
                        >
                          Reset to Original
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* Step 3: Editable Form Fields */}
            {metadata && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Link title"
                          disabled={isMutating}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Link description"
                          disabled={isMutating}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isMutating} variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                disabled={isMutating || !metadata}
                type="submit"
                className="min-w-[120px]"
              >
                {isMutating ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Link'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
