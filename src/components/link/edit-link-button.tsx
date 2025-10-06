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
import { useUpdateLink } from '@/hooks/mutations';
import { useLinkInfinite } from '@/hooks/queries';

import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ExternalLink,
  ImageIcon,
  Info,
  Loader2,
  PencilIcon,
} from 'lucide-react';
import Link from 'next/link';
import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import FileUpload from '../file-upload';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface NewLinkMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters long',
  }),
  url: z.string().url('Please enter a valid URL'),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().min(1, 'Please select a position'),
});

interface EditLinkButtonProps {
  data: {
    id: number;
    title?: string;
    url?: string;
    description?: string;
    imageUrl?: string;
    displayOrder?: number;
  };
}

const useEditLinkMetadata = (
  originalUrl?: string,
  originalData?: EditLinkButtonProps['data']
) => {
  const [newMetadata, setNewMetadata] = useState<NewLinkMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [showNewMetadataPreview, setShowNewMetadataPreview] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const fetchLinkMetadata = async (
    url: string
  ): Promise<NewLinkMetadata | null> => {
    try {
      const response = await fetch(
        `/api/link-meta?url=${encodeURIComponent(url)}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }

      const metadata = await response.json();

      if (metadata.error) {
        throw new Error(metadata.error);
      }

      return {
        title: metadata.title || '',
        description: metadata.description || '',
        image: metadata.image || '',
        url: url,
      };
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  };

  const handleUrlChange = async (newUrl: string) => {
    if (newUrl && newUrl !== originalUrl) {
      setIsFetchingMetadata(true);
      try {
        const metadata = await fetchLinkMetadata(newUrl);
        if (
          metadata &&
          (metadata.title !== originalData?.title ||
            metadata.description !== originalData?.description ||
            metadata.image !== originalData?.imageUrl)
        ) {
          setNewMetadata(metadata);
          setShowNewMetadataPreview(true);
          setIsAccordionOpen(true);
        } else {
          setNewMetadata(null);
          setShowNewMetadataPreview(false);
          setIsAccordionOpen(false);
        }
      } catch (error) {
        console.error('Error in handleUrlChange:', error);
        setNewMetadata(null);
        setShowNewMetadataPreview(false);
      } finally {
        setIsFetchingMetadata(false);
      }
    } else {
      setNewMetadata(null);
      setShowNewMetadataPreview(false);
      setIsAccordionOpen(false);
    }
  };

  const resetMetadata = () => {
    setNewMetadata(null);
    setShowNewMetadataPreview(false);
    setIsAccordionOpen(false);
  };

  return {
    newMetadata,
    isFetchingMetadata,
    showNewMetadataPreview,
    isAccordionOpen,
    setIsAccordionOpen,
    handleUrlChange,
    resetMetadata,
  };
};

const useEditLinkForm = (
  data: EditLinkButtonProps['data'],
  currentLinkOrder: number
) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: data?.title || '',
      url: data?.url || '',
      imageUrl: data?.imageUrl || '',
      description: data?.description || '',
      displayOrder: currentLinkOrder || 1,
    },
  });

  return form;
};

const CurrentLinkPreview = ({
  data,
}: {
  data: EditLinkButtonProps['data'];
}) => (
  <div className="border rounded-lg p-4 bg-muted/30">
    <h3 className="text-sm font-medium mb-3 text-muted-foreground">
      Current Link
    </h3>
    <Link
      href={data?.url || '#'}
      target="_blank"
      className="w-full flex items-start gap-3"
    >
      {data?.imageUrl && (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={data.imageUrl}
            alt={data.title || 'Link preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/fallback-image.png';
              e.currentTarget.onerror = null;
            }}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h4 className="font-medium text-sm truncate">
          {data?.title || 'No title'}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {data?.description || 'No description'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <ExternalLink className="h-3 w-3" />
          <span className="text-xs text-muted-foreground truncate">
            {data?.url ? new URL(data.url).hostname : 'No domain'}
          </span>
        </div>
      </div>
    </Link>
  </div>
);

const NewMetadataAccordion = ({
  newMetadata,
  isFetchingMetadata,
  isAccordionOpen,
  setIsAccordionOpen,
  onUseNewData,
}: {
  newMetadata: NewLinkMetadata | null;
  isFetchingMetadata: boolean;
  isAccordionOpen: boolean;
  setIsAccordionOpen: (open: boolean) => void;
  onUseNewData: () => void;
}) => (
  <Accordion
    type="single"
    collapsible
    value={isAccordionOpen ? 'metadata' : ''}
    onValueChange={(value) => setIsAccordionOpen(value === 'metadata')}
    className="border rounded-md"
  >
    <AccordionItem value="metadata">
      <AccordionTrigger className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>New Metadata Available</span>
          {isFetchingMetadata && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 px-4">
          <div>
            {newMetadata?.image && (
              <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                <img
                  src={newMetadata.image}
                  alt={newMetadata.title || 'Link preview'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/fallback-image.png';
                    e.currentTarget.onerror = null;
                  }}
                />
              </div>
            )}
            <h4 className="font-semibold text-sm">
              {newMetadata?.title || 'No title'}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
              {newMetadata?.description || 'No description'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs text-muted-foreground truncate">
                {newMetadata?.url
                  ? new URL(newMetadata.url).hostname
                  : 'No domain'}
              </span>
            </div>
          </div>
          <Button
            type="button"
            onClick={onUseNewData}
            size="sm"
            className="w-full"
            disabled={isFetchingMetadata}
          >
            Use This Data
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export const EditLinkButton = ({ data }: EditLinkButtonProps) => {
  const { user } = useAuth();
  const { selectedPage, keywordLink } = useContext(LinkPageContext);

  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(
    data?.imageUrl || ''
  );
  const [hasUsedNewData, setHasUsedNewData] = useState(false);

  const { trigger, isMutating } = useUpdateLink({
    search: keywordLink || '',
    pageId: selectedPage?.id,
  });

  const { data: linksData } = useLinkInfinite({
    pageId: selectedPage?.id,
    search: '',
  });

  const existingLinks = React.useMemo(() => {
    if (!linksData) return [];
    return linksData.flatMap((page) => page?.data?.data || []);
  }, [linksData]);

  const currentLinkOrder = React.useMemo(() => {
    const sortedLinks = [...existingLinks].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    return sortedLinks.findIndex((link) => link.id === data?.id) + 1;
  }, [existingLinks, data?.id]);

  const totalCount = React.useMemo(() => {
    const lastPage = linksData?.[linksData.length - 1];
    return lastPage?.data?.pagination?.totalItems || existingLinks.length;
  }, [linksData, existingLinks]);

  const form = useEditLinkForm(data, currentLinkOrder);
  const {
    newMetadata,
    isFetchingMetadata,
    showNewMetadataPreview,
    isAccordionOpen,
    setIsAccordionOpen,
    handleUrlChange,
    resetMetadata,
  } = useEditLinkMetadata(data?.url, data);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userId = (await authClient.getSession()).data?.user.id;
    if (!userId) {
      toast.error('You must be logged in to edit a link');
      return;
    }

    const response = await trigger({
      id: data.id,
      values: {
        ...values,
        imageUrl: currentImageUrl || values.imageUrl,
        displayOrder: values.displayOrder,
      },
    });
    if (response.success) {
      form.reset();
      setCurrentImageUrl('');
      setIsOpen(false);
    }
  }

  const handleUseNewData = () => {
    if (newMetadata) {
      form.setValue('title', newMetadata.title);
      form.setValue('description', newMetadata.description);
      if (newMetadata.image) {
        handleImageChange(newMetadata.image, undefined);
      }
      resetMetadata();
      setHasUsedNewData(true);
      toast.success('Link data updated from new URL');
    }
  };

  const handleResetToOriginal = () => {
    form.reset({
      url: data?.url || '',
      title: data?.title || '',
      description: data?.description || '',
      imageUrl: data?.imageUrl || '',
      displayOrder: currentLinkOrder || 1,
    });
    setCurrentImageUrl(data?.imageUrl || '');
    resetMetadata();
    setHasUsedNewData(false);
    toast.success('Reset to original data');
  };

  const handleImageChange = (imageUrl: string | null, file?: File) => {
    if (imageUrl && file) {
      setCurrentImageUrl(imageUrl);
      form.setValue('imageUrl', imageUrl);
    } else if (imageUrl && !file) {
      setCurrentImageUrl(imageUrl);
      form.setValue('imageUrl', imageUrl);
    } else {
      setCurrentImageUrl('');
      form.setValue('imageUrl', '');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setCurrentImageUrl(data?.imageUrl || '');
      resetMetadata();
      setHasUsedNewData(false);
    }
  };

  function EditLinkForm({ className }: React.ComponentProps<'form'>) {
    return (
      <form
        id="edit-link-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        <CurrentLinkPreview data={data} />

        <div className="space-y-4">
          <div className="flex sm:flex-row flex-col gap-4">
            <PositionSelector
              control={form.control}
              name="displayOrder"
              totalCount={totalCount}
            />
            <div className="flex-1">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        disabled={isMutating}
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          handleUrlChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {showNewMetadataPreview && (
            <NewMetadataAccordion
              newMetadata={newMetadata}
              isFetchingMetadata={isFetchingMetadata}
              isAccordionOpen={isAccordionOpen}
              setIsAccordionOpen={setIsAccordionOpen}
              onUseNewData={handleUseNewData}
            />
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Image {currentImageUrl !== data?.imageUrl && '(Custom)'}
            </label>
            <FileUpload
              fileUrl={currentImageUrl}
              onImageChange={handleImageChange}
            />
            {currentImageUrl !== data?.imageUrl && data?.imageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentImageUrl(data?.imageUrl || '');
                  form.setValue('imageUrl', data?.imageUrl || '');
                }}
              >
                Reset to Original
              </Button>
            )}
          </div>

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

          {hasUsedNewData && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    You have applied new link data
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetToOriginal}
                    size="sm"
                    disabled={isFetchingMetadata}
                  >
                    Reset to Original
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    );
  }

  if ((!user || !user.username) && !selectedPage?.id) {
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="size-8"
              onClick={() => setIsOpen(true)}
              disabled={isMutating}
            >
              <PencilIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Edit Link</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>
              View current link details and make changes as needed.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <EditLinkForm />
          </Form>

          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isMutating} variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleDialogClose}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="size-8"
          onClick={() => setIsOpen(true)}
          disabled={isMutating}
        >
          <PencilIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit Link</DrawerTitle>
          <DrawerDescription>
            View current link details and make changes as needed.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto max-h-[60vh]">
          <Form {...form}>
            <EditLinkForm />
          </Form>
        </div>
        <DrawerFooter className="pt-2 gap-2">
          <Button
            disabled={isMutating}
            type="submit"
            form="edit-link-form"
            className="min-w-[120px]"
          >
            {isMutating ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
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
