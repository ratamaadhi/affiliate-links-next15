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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { Input } from '../ui/input';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PositionSelector } from '@/components/ui/position-selector';
import { LinkPageContext } from '@/context/link-page-context';
import { useCreateLink } from '@/hooks/mutations';
import { useLinkInfinite } from '@/hooks/queries';

import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ExternalLink,
  ImageIcon,
  Loader2,
  PlusIcon,
  RefreshCwIcon,
} from 'lucide-react';
import Link from 'next/link';
import React, { useContext, useEffect, useState } from 'react';
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
  displayOrder: z.number().min(1, 'Please select a position'),
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

const useLinkMetadata = (url: string) => {
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);

  const fetchLinkMetadata = async (url: string) => {
    try {
      const response = await fetch(
        `/api/link-meta?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      if (url && url.trim() !== '') {
        try {
          new URL(url);
          setIsFetchingMetadata(true);
          try {
            const metadata = await fetchLinkMetadata(url);
            setMetadata(metadata);
          } catch (_error) {
            console.error('Error fetching metadata:', _error);
            toast.error('Failed to fetch link metadata. Please try again.');
          } finally {
            setIsFetchingMetadata(false);
          }
        } catch (_error) {
          setMetadata(null);
        }
      } else {
        setMetadata(null);
      }
    };

    fetchMetadata();
  }, [url]);

  return { isFetchingMetadata, metadata };
};

const useLinkForm = (
  metadata: LinkMetadata | null,
  existingLinksCount: number
) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
      imageUrl: '',
      description: '',
      displayOrder: existingLinksCount + 1,
    },
  });

  const { setValue } = form;

  useEffect(() => {
    if (metadata) {
      setValue('title', metadata.title || '');
      setValue('description', metadata.description || '');
      setValue('imageUrl', metadata.image || '');
    }
  }, [metadata, setValue]);

  return form;
};

const LinkMetadataPreview = ({
  metadata,
  currentImageUrl,
  onImageChange,
}: {
  metadata: LinkMetadata;
  currentImageUrl: string;
  onImageChange: (imageUrl: string | null, file?: File) => void;
}) => (
  <div className="w-full relative space-y-4 flex flex-col">
    <Link
      href={metadata.url || '#'}
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
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Image {currentImageUrl !== metadata.image && '(Custom)'}
      </label>
      <FileUpload fileUrl={currentImageUrl} onImageChange={onImageChange} />
      {currentImageUrl !== metadata.image && metadata.image && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onImageChange(metadata.image);
          }}
        >
          Reset to Original
        </Button>
      )}
    </div>
  </div>
);

export const CreateLinkButton = () => {
  const { user } = useAuth();
  const { selectedPage, keywordLink } = useContext(LinkPageContext);
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  const { trigger, isMutating } = useCreateLink({
    search: keywordLink || '',
    pageId: selectedPage?.id,
  });

  const { data: linksData } = useLinkInfinite({
    pageId: selectedPage?.id,
    search: '',
  });

  const existingLinksCount = React.useMemo(() => {
    if (!linksData) return 0;
    return linksData.flatMap((page) => page?.data?.data || []).length;
  }, [linksData]);

  const totalCount = React.useMemo(() => {
    const lastPage = linksData?.[linksData.length - 1];
    return lastPage?.data?.pagination?.totalItems || existingLinksCount;
  }, [linksData, existingLinksCount]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
      imageUrl: '',
      description: '',
      displayOrder: existingLinksCount + 1,
    },
  });

  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  const fetchLinkMetadata = async (url: string) => {
    try {
      const response = await fetch(
        `/api/link-meta?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  };

  const handleUrlBlur = async (url: string) => {
    if (url && url.trim() !== '') {
      try {
        new URL(url);
        setIsFetchingMetadata(true);
        try {
          const metadata = await fetchLinkMetadata(url);
          setMetadata(metadata);
          if (metadata) {
            form.setValue('title', metadata.title || '');
            form.setValue('description', metadata.description || '');
            form.setValue('imageUrl', metadata.image || '');
          }
        } catch (_error) {
          console.error('Error fetching metadata:', _error);
          toast.error('Failed to fetch link metadata. Please try again.');
        } finally {
          setIsFetchingMetadata(false);
        }
      } catch (_error) {
        setMetadata(null);
      }
    } else {
      setMetadata(null);
    }
  };

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
      displayOrder: values.displayOrder,
    });
    if (response.success) {
      form.reset();
      setCurrentImageUrl('');
      setMetadata(null);
      setIsOpen(false);
    }
  }

  const handleImageChange = (imageUrl: string | null, file?: File) => {
    if (imageUrl && file) {
      setCurrentImageUrl(imageUrl);
      form.setValue('imageUrl', imageUrl);
    } else if (imageUrl && !file) {
      setCurrentImageUrl(imageUrl);
      form.setValue('imageUrl', imageUrl);
    } else {
      const fallbackImage = metadata?.image || '';
      setCurrentImageUrl(fallbackImage);
      form.setValue('imageUrl', fallbackImage);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    form.reset();
    setCurrentImageUrl('');
    setMetadata(null);
  };

  function CreateLinkForm({ className }: React.ComponentProps<'form'>) {
    return (
      <form
        id="create-link-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        {/* Step 1: URL Input */}
        <div className="flex sm:flex-row flex-col gap-4">
          {metadata && (
            <PositionSelector
              control={form.control}
              name="displayOrder"
              totalCount={totalCount}
              addNumber={1}
            />
          )}
          <div className="flex-1">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="https://example.com"
                          disabled={isMutating}
                          className="flex-1"
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            handleUrlBlur(e.target.value);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            isMutating || !field.value || isFetchingMetadata
                          }
                          onClick={() => handleUrlBlur(field.value)}
                          className="size-9"
                        >
                          {isFetchingMetadata ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCwIcon />
                          )}
                        </Button>
                      </div>
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
              <LinkMetadataPreview
                metadata={metadata}
                currentImageUrl={currentImageUrl}
                onImageChange={handleImageChange}
              />
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
      </form>
    );
  }

  if (!user || !user.username || !selectedPage?.id) {
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  if (isDesktop) {
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
            <CreateLinkForm />
          </Form>

          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isMutating} variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={isMutating || !metadata}
              type="submit"
              form="create-link-form"
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
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleDialogClose}>
      <DrawerTrigger asChild>
        <Button variant="default" size="default" className="w-full gap-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Link</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Add new Link</DrawerTitle>
          <DrawerDescription>
            Enter a URL to fetch metadata and create a new link.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
          <Form {...form}>
            <CreateLinkForm />
          </Form>
        </div>
        <DrawerFooter className="pt-2 gap-2">
          <Button
            disabled={isMutating || !metadata}
            type="submit"
            form="create-link-form"
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
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
