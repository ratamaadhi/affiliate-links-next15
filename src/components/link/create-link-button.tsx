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

import { FileMetadata, FileWithPreview } from '@/hooks/use-file-upload';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth-client';
import {
  compressGif,
  convertImageToWebP,
  createWebpFile,
} from '@/lib/image-compression';
import {
  computeSHA256,
  generateS3Key,
  sanitizeFileName,
} from '@/lib/s3-upload';
import { generatePresignedUrlAction } from '@/lib/s3/actions';
import { convertUrlToFile, validateImageUrl } from '@/lib/url-to-file';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  ExternalLink,
  ImageIcon,
  Loader2,
  PlusIcon,
  RefreshCwIcon,
} from 'lucide-react';
import Link from 'next/link';
import React, { useCallback, useContext, useState } from 'react';
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

export const CreateLinkButton = () => {
  const { user } = useAuth();
  const { selectedPage, keywordLink } = useContext(LinkPageContext);
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [imageFileFromUrl, setImageFIleFromUrl] =
    useState<FileWithPreview | null>();
  const [imageFile, setImageFile] = useState<FileWithPreview | null>(null);
  const [loadCompression, setLoadCompression] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [lastFetchedUrl, setLastFetchedUrl] = useState<string>('');

  const fetchLinkMetadata = async (url: string) => {
    try {
      const response = await fetch(
        `/api/link-meta?url=${encodeURIComponent(url)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
        }
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  };

  const createPreview = useCallback(
    (file: File | FileMetadata): string | undefined => {
      if (file instanceof File) {
        return URL.createObjectURL(file);
      }
      return file.url;
    },
    []
  );

  const generateUniqueId = useCallback((file: File | FileMetadata): string => {
    if (file instanceof File) {
      return `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    return file.id;
  }, []);

  async function imageToWebP(image: File) {
    const imageBlob = await convertImageToWebP(image, 0.8);
    const webpFile = createWebpFile(imageBlob, sanitizeFileName(image.name));

    return webpFile;
  }

  async function imageUrlToPreview(imageUrl: string) {
    const isValid = await validateImageUrl(imageUrl);
    if (!isValid) {
      toast.error('URL does not point to a valid image');
      return null;
    }

    const imageFile = await convertUrlToFile(imageUrl, {
      compressionOptions: {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      },
      onProgress: (progress) => {
        console.log(`Download progress: ${progress}%`);
      },
    });

    const webpFile = await imageToWebP(imageFile);
    const imageWithPreview = {
      file: webpFile,
      id: generateUniqueId(webpFile),
      preview: createPreview(webpFile),
    };

    return imageWithPreview;
  }

  const handleUrlBlur = async (url: string, forceFetch: boolean = false) => {
    if (url && url.trim() !== '') {
      try {
        new URL(url);

        if (lastFetchedUrl === url && !forceFetch) {
          return;
        }

        setIsFetchingMetadata(true);
        setLastFetchedUrl(url);
        try {
          const metadata = await fetchLinkMetadata(url);
          setMetadata(metadata);
          if (metadata) {
            form.setValue('title', metadata.title || '');
            form.setValue('description', metadata.description || '');
            const imageWithPreview = await imageUrlToPreview(metadata.image);
            form.setValue('imageUrl', imageWithPreview?.preview);
            setImageFIleFromUrl(imageWithPreview);
            setImageFile(imageWithPreview);
          }
        } catch (_error) {
          console.error('Error fetching metadata:', _error);
          toast.error('Failed to fetch link metadata. Please try again.');
        } finally {
          setIsFetchingMetadata(false);
        }
      } catch {
        setMetadata(null);
        setLastFetchedUrl('');
      }
    } else {
      setMetadata(null);
      setLastFetchedUrl('');
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      const { data: session } = await authClient.getSession();
      if (!session?.user?.id) {
        toast.error('Authentication required. Please log in again.');
        return;
      }

      let locationUploadedImage = '';
      if (imageFile && imageFile.file) {
        // Check if the file is a File instance (not FileMetadata)
        if (imageFile.file instanceof File) {
          const checksum = await computeSHA256(imageFile.file);
          const key = generateS3Key();
          const singedUrlResult = await generatePresignedUrlAction({
            key,
            expiresIn: 120,
            checksum,
            type: imageFile.file.type,
            size: imageFile.file.size,
          });
          const upload = await axios.put(singedUrlResult, imageFile.file, {
            headers: {
              'Content-Type': imageFile.file.type,
            },
          });

          if (upload.status === 200) {
            locationUploadedImage = singedUrlResult.split('?')[0];
          }
        } else {
          console.error(
            'Cannot upload FileMetadata to S3, only File objects are supported'
          );
        }
      }

      const response = await trigger({
        ...values,
        pageId: selectedPage?.id,
        imageUrl: locationUploadedImage ?? '',
        displayOrder: values.displayOrder,
      });
      if (response.success) {
        form.reset();
        setMetadata(null);
        setIsOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImageChange = useCallback(
    (file?: FileWithPreview[]) => {
      setTimeout(async () => {
        setLoadCompression(true);
        if (file && file[0]?.file instanceof File) {
          let processedFile = file[0].file;

          if (!file[0].file.type.includes('gif')) {
            processedFile = await imageToWebP(file[0].file);
          } else {
            try {
              processedFile = await compressGif(file[0].file, {
                colors: 64,
                lossy: 200,
              });
            } catch (gifError) {
              console.warn(
                'GIF compression failed, using original file:',
                gifError
              );
              processedFile = file[0].file;
            }
          }
          console.log('processedFile', processedFile);

          const fileWithPreview = {
            file: processedFile,
            id: generateUniqueId(processedFile),
            preview: createPreview(processedFile),
          };
          setImageFile(fileWithPreview);
          form.setValue('imageUrl', fileWithPreview.preview);
        } else {
          setImageFile(null);
          form.setValue('imageUrl', '');
        }
        setLoadCompression(false);
      }, 0);
    },
    [createPreview, form, generateUniqueId]
  );

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    form.reset();
    setMetadata(null);
    setLastFetchedUrl('');
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
              disabled={isMutating || isSubmitting}
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
                          disabled={
                            isMutating ||
                            isSubmitting ||
                            isFetchingMetadata ||
                            loadCompression
                          }
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
                            isMutating ||
                            isSubmitting ||
                            !field.value ||
                            isFetchingMetadata ||
                            loadCompression
                          }
                          onClick={() => handleUrlBlur(field.value, true)}
                          className="size-9"
                        >
                          {isFetchingMetadata ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCwIcon />
                          )}
                        </Button>
                      </div>
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
                    Image {imageFile !== imageFileFromUrl && '(Custom)'}
                  </label>
                  <FileUpload
                    parentFiles={imageFile ? [imageFile] : []}
                    onFilesChange={handleImageChange}
                    disabled={isMutating || isSubmitting}
                  />
                  {imageFile !== imageFileFromUrl && imageFileFromUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isMutating || isSubmitting}
                      onClick={() => {
                        setImageFile(imageFileFromUrl);
                        form.setValue('imageUrl', imageFileFromUrl.preview);
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
                      disabled={isMutating || isSubmitting}
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
                      disabled={isMutating || isSubmitting}
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
          <Button
            variant="default"
            size="default"
            className="w-full gap-2"
            data-create-link-button
          >
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
              <Button
                disabled={isMutating || isSubmitting || loadCompression}
                variant="outline"
                type="button"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={
                isMutating || isSubmitting || !metadata || loadCompression
              }
              type="submit"
              form="create-link-form"
              className="min-w-[120px]"
            >
              {isMutating || isSubmitting ? (
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
        <Button
          variant="default"
          size="default"
          className="w-full gap-2"
          data-create-link-button
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Link</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] h-full flex flex-col">
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
            disabled={
              isMutating || isSubmitting || !metadata || loadCompression
            }
            type="submit"
            form="create-link-form"
            className="min-w-[120px]"
          >
            {isMutating || isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Link'
            )}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              disabled={isMutating || isSubmitting || loadCompression}
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
