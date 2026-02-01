'use client';

import z from 'zod';
import slugify from 'slug';
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
import { useCreatePage } from '@/hooks/mutations';
import { useDebounce } from '@/hooks/useDebounce';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { TbLibraryPlus } from 'react-icons/tb';
import { toast } from 'sonner';

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
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive or leading/trailing hyphens)',
    })
    .optional(),
});

interface CreatePageFormContentProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  isMutating: boolean;
  isSubmitting: boolean;
  autoGenerateSlug: boolean;
  setAutoGenerateSlug: (_value: boolean) => void;
  slugHighlight: boolean;
  onSubmit: (_values: z.infer<typeof formSchema>) => Promise<void>;
}

const CreatePageFormContent = ({
  form,
  isMutating,
  isSubmitting,
  autoGenerateSlug,
  setAutoGenerateSlug,
  slugHighlight,
  onSubmit,
}: CreatePageFormContentProps) => {
  return (
    <form
      id="create-page-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="grid gap-4">
        <div className="grid gap-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="My page title"
                    disabled={isMutating || isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-3">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="What page is about?"
                    disabled={isMutating || isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-3">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="my-page-url"
                    disabled={isMutating || isSubmitting || autoGenerateSlug}
                    className={`transition-all duration-300 ${slugHighlight ? 'border-amber-500 ring-2 ring-amber-500/20 animate-pulse' : ''}`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="checkbox"
                    id="auto-slug"
                    checked={autoGenerateSlug}
                    onChange={(e) => setAutoGenerateSlug(e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isMutating || isSubmitting}
                  />
                  <label
                    htmlFor="auto-slug"
                    className="text-sm text-muted-foreground"
                  >
                    Auto-generate slug from title
                  </label>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>
    </form>
  );
};

interface CreatePageDialogContentProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  isMutating: boolean;
  isSubmitting: boolean;
  onSubmit: (_values: z.infer<typeof formSchema>) => Promise<void>;
  user: { username: string };
  autoGenerateSlug: boolean;
  setAutoGenerateSlug: (_value: boolean) => void;
  slugHighlight: boolean;
}

const CreatePageDialogContent = ({
  form,
  isMutating,
  isSubmitting,
  onSubmit,
  user,
  autoGenerateSlug,
  setAutoGenerateSlug,
  slugHighlight,
}: CreatePageDialogContentProps) => {
  const slugValue = form.watch('slug');

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add new page</DialogTitle>
        <DialogDescription>
          Create a new page to start collecting links.
        </DialogDescription>
        <div className="bg-muted p-3 rounded-md space-y-1">
          <p className="text-sm font-medium">Your page URL:</p>
          <p className="text-sm text-muted-foreground break-all">
            {process.env.NEXT_PUBLIC_BASE_URL}/{user.username}/
            <span className="font-medium">{slugValue || 'your-slug'}</span>
          </p>
        </div>
      </DialogHeader>
      <Form {...form}>
        <CreatePageFormContent
          form={form}
          isMutating={isMutating}
          isSubmitting={isSubmitting}
          autoGenerateSlug={autoGenerateSlug}
          setAutoGenerateSlug={setAutoGenerateSlug}
          slugHighlight={slugHighlight}
          onSubmit={onSubmit}
        />
      </Form>
      <DialogFooter>
        <DialogClose asChild>
          <Button disabled={isMutating || isSubmitting} variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button disabled={isMutating || isSubmitting} type="submit" form="create-page-form">
          {isMutating || isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Create'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

interface CreatePageDrawerContentProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  isMutating: boolean;
  isSubmitting: boolean;
  onSubmit: (_values: z.infer<typeof formSchema>) => Promise<void>;
  user: { username: string };
  autoGenerateSlug: boolean;
  setAutoGenerateSlug: (_value: boolean) => void;
  slugHighlight: boolean;
}

const CreatePageDrawerContent = ({
  form,
  isMutating,
  isSubmitting,
  onSubmit,
  user,
  autoGenerateSlug,
  setAutoGenerateSlug,
  slugHighlight,
}: CreatePageDrawerContentProps) => {
  const slugValue = form.watch('slug');

  return (
    <DrawerContent className="max-h-[85vh] h-full flex flex-col">
      <DrawerHeader className="text-left">
        <DrawerTitle>Add new page</DrawerTitle>
        <DrawerDescription>
          Create a new page to start collecting links.
        </DrawerDescription>
        <div className="bg-muted p-3 rounded-md space-y-1 mt-3">
          <p className="text-sm font-medium">Your page URL:</p>
          <p className="text-sm text-muted-foreground break-all">
            {process.env.NEXT_PUBLIC_BASE_URL}/{user.username}/
            <span className="font-medium">{slugValue || 'your-slug'}</span>
          </p>
        </div>
      </DrawerHeader>
      <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
        <Form {...form}>
          <CreatePageFormContent
            form={form}
            isMutating={isMutating}
            isSubmitting={isSubmitting}
            autoGenerateSlug={autoGenerateSlug}
            setAutoGenerateSlug={setAutoGenerateSlug}
            slugHighlight={slugHighlight}
            onSubmit={onSubmit}
          />
        </Form>
      </div>
      <DrawerFooter className="pt-2 gap-2">
        <Button
          disabled={isMutating || isSubmitting}
          type="submit"
          form="create-page-form"
          className="min-w-[120px]"
        >
          {isMutating || isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            'Create Page'
          )}
        </Button>
        <DrawerClose asChild>
          <Button variant="outline" disabled={isMutating || isSubmitting}>
            Cancel
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );
};

export const CreatePageButton = ({}) => {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [slugHighlight, setSlugHighlight] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { trigger, isMutating } = useCreatePage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      slug: '',
    },
  });

  const titleValue = form.watch('title');
  const debouncedTitle = useDebounce(titleValue, 500);

  useEffect(() => {
    if (autoGenerateSlug && debouncedTitle) {
      const generatedSlug = slugify(debouncedTitle || '');
      form.setValue('slug', generatedSlug, {
        shouldValidate: false,
      });
    }
  }, [autoGenerateSlug, debouncedTitle, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      const userId = (await authClient.getSession()).data?.user.id;
      if (!userId) {
        toast.error('You must be logged in to create a page');
        return;
      }

      const response = await trigger({ ...values });
      if (response.success) {
        form.reset();
        setAutoGenerateSlug(true);
        setIsOpen(false);
      } else {
        if (response.message?.toLowerCase().includes('slug')) {
        try {
          const res = await fetch('/api/pages/generate-slug', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: values.title }),
          });
          const data = await res.json();

          if (data.slug) {
            form.setValue('slug', data.slug);
            form.trigger('slug'); // Re-validate with the new slug value
            setSlugHighlight(true);
            setTimeout(() => setSlugHighlight(false), 2000);

            toast.error(
              `Slug '${values.slug}' already exists. Auto-updated to '${data.slug}'. Please submit again.`,
              { duration: 5000 }
            );
          }
        } catch {
          toast.error(response.message || 'Failed to create page');
        }
        } else {
          toast.error(response.message || 'Failed to create page');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setAutoGenerateSlug(true);
    }
  };

  if (!user || !user.username) {
    return null;
  }

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogTrigger asChild>
          <Button
            variant="default"
            size="default"
            className="w-9 md:w-auto"
            data-create-page-button
          >
            <TbLibraryPlus /> <span className="hidden md:block">{` Page`}</span>
          </Button>
        </DialogTrigger>
        <CreatePageDialogContent
          form={form}
          isMutating={isMutating}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          user={user}
          autoGenerateSlug={autoGenerateSlug}
          setAutoGenerateSlug={setAutoGenerateSlug}
          slugHighlight={slugHighlight}
        />
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleDialogClose}>
      <DrawerTrigger asChild>
        <Button
          variant="default"
          size="default"
          className="w-9 md:w-auto"
          data-create-page-button
        >
          <TbLibraryPlus /> <span className="hidden md:block">{` Page`}</span>
        </Button>
      </DrawerTrigger>
      <CreatePageDrawerContent
        form={form}
        isMutating={isMutating}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        user={user}
        autoGenerateSlug={autoGenerateSlug}
        setAutoGenerateSlug={setAutoGenerateSlug}
        slugHighlight={slugHighlight}
      />
    </Drawer>
  );
};
