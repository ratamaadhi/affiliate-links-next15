'use client';

import slugify from 'slug';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
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
import { useUpdatePage } from '@/hooks/mutations';
import { useDebounce } from '@/hooks/useDebounce';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/hooks/useAuth';
import { PageSelect } from '@/lib/db/schema/page';
import { useCallback, useEffect, useState } from 'react';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { EditPageForm, EditPageFormContent } from './edit-page-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  title: z
    .string()
    .min(2, {
      message: 'Title must be at least 2 characters long',
    })
    .max(50)
    .nonempty('Title is required'),
  description: z.string().max(160).optional(),
  slug: z
    .string()
    .min(2, {
      message: 'Slug must be at least 2 characters long',
    })
    .max(100)
    .regex(/^[a-z0-9-]+$/, {
      message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    })
    .nonempty('Slug is required'),
});

interface EditPageButtonProps {
  data: PageSelect;
}

export const EditPageButton = ({ data }: EditPageButtonProps) => {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [hasResetForm, setHasResetForm] = useState(false);
  const [slugHighlight, setSlugHighlight] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { trigger, isMutating } = useUpdatePage();
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      title: data.title || '',
      description: data.description || '',
      slug: data.slug || '',
    },
  });

  const slugValue = form.watch('slug');
  const titleValue = form.watch('title');
  const debouncedTitle = useDebounce(titleValue, 300);

  useEffect(() => {
    const isDefault = user?.username === data.slug;
    if (autoGenerateSlug && !isDefault && debouncedTitle) {
      const generatedSlug = slugify(debouncedTitle || '');
      form.setValue('slug', generatedSlug, {
        shouldValidate: false,
      });
    }
  }, [autoGenerateSlug, debouncedTitle, form, user, data.slug]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && form.formState.isDirty) {
        if (
          confirm('You have unsaved changes. Are you sure you want to close?')
        ) {
          setIsOpen(false);
          form.reset();
        }
      } else {
        setIsOpen(open);
        if (open && !hasResetForm) {
          form.reset({
            title: data.title || '',
            description: data.description || '',
            slug: data.slug || '',
          });
          setAutoGenerateSlug(true);
          setHasResetForm(true);
        }
      }
    },
    [form, hasResetForm, data.title, data.description, data.slug]
  );

  const handleSubmit = useCallback(
    async (
      values: z.infer<typeof formSchema>
    ): Promise<{
      success: boolean;
      message?: string;
    }> => {
      const userId = user?.id;
      if (!userId) {
        toast.error('You must be logged in to edit page');
        return {
          success: false,
          message: 'You must be logged in to edit page',
        };
      }

      try {
        const response = await trigger({
          id: data.id,
          values: {
            ...values,
            userId: typeof userId === 'string' ? Number(userId) : userId,
          },
        });

        if (response.success) {
          form.reset({
            title: values.title,
            description: values.description || '',
            slug: values.slug,
          });
          setAutoGenerateSlug(true);
          setIsOpen(false);
          toast.success('Page updated successfully');
          return { success: true };
        } else {
          if (response.message?.toLowerCase().includes('slug')) {
            try {
              const res = await fetch('/api/pages/generate-slug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: values.title,
                  excludePageId: data.id,
                }),
              });
              const slugResponse = await res.json();

              if (slugResponse.slug) {
                form.setValue('slug', slugResponse.slug);
                setSlugHighlight(true);
                setTimeout(() => setSlugHighlight(false), 2000);

                toast.error(
                  `Slug '${values.slug}' already exists. Auto-updated to '${slugResponse.slug}'. Please submit again.`,
                  { duration: 5000 }
                );
              }
              return {
                success: false,
                message: `Slug '${values.slug}' already exists. Auto-updated to '${slugResponse.slug}'. Please submit again.`,
              };
            } catch {
              return {
                success: false,
                message: response.message || 'Failed to update page',
              };
            }
          }
          return {
            success: false,
            message: response.message || 'Failed to update page',
          };
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
        console.error('Update page error:', error);
        return {
          success: false,
          message: 'An unexpected error occurred',
        };
      }
    },
    [user, trigger, data.id, form]
  );

  const handleCancel = useCallback(() => {
    form.reset();
    setAutoGenerateSlug(true);
    setHasResetForm(false);
  }, [form]);

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="size-8"
              onClick={() => setIsOpen(true)}
              disabled={isMutating}
              aria-label="Edit page"
            >
              <HiOutlinePencilAlt />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Edit page</p>
          </TooltipContent>
        </Tooltip>
        <EditPageForm
          form={form}
          isMutating={isMutating}
          onSubmitAction={handleSubmit}
          onCancelAction={handleCancel}
          isDefaultPage={user?.username === data.slug}
          autoGenerateSlug={autoGenerateSlug}
          onAutoGenerateSlugChange={setAutoGenerateSlug}
          user={user}
          slugHighlight={slugHighlight}
        />
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="size-8"
          onClick={() => setIsOpen(true)}
          disabled={isMutating}
          aria-label="Edit page"
        >
          <HiOutlinePencilAlt />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] h-full flex flex-col">
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit page</DrawerTitle>
          <DrawerDescription>
            Make changes to your page here. Click continue when you&apos;re
            done.
          </DrawerDescription>
          {user && user.username && (
            <div className="bg-muted p-3 rounded-md space-y-1 mt-3">
              <p className="text-sm font-medium">Your page URL:</p>
              <p className="text-sm text-muted-foreground break-all">
                {process.env.NEXT_PUBLIC_BASE_URL}/{user.username}/
                <span className="font-medium">{slugValue || 'your-slug'}</span>
              </p>
            </div>
          )}
          {user?.username === data.slug && (
            <p className="text-sm text-muted-foreground mt-2">
              Note: Your default page slug is locked to your username and cannot
              be changed.
            </p>
          )}
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
          <EditPageFormContent
            form={form}
            isMutating={isMutating}
            onSubmitAction={handleSubmit}
            isDefaultPage={user?.username === data.slug}
            autoGenerateSlug={autoGenerateSlug}
            onAutoGenerateSlugChange={setAutoGenerateSlug}
            slugHighlight={slugHighlight}
          />
        </div>
        <DrawerFooter className="pt-2 gap-2">
          <Button
            disabled={isMutating}
            type="submit"
            form="edit-page-form"
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
            <Button variant="outline" disabled={isMutating}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
