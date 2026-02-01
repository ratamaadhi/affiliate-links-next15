'use client';

import { UseFormReturn } from 'react-hook-form';
import { Button } from '../ui/button';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from 'lucide-react';
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

interface EditPageFormContentProps {
  isMutating: boolean;
  isSubmitting: boolean;
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onSubmitAction: (
    _values: z.infer<typeof formSchema>
  ) => Promise<{ success: boolean; message?: string }>;
  isDefaultPage?: boolean;
  autoGenerateSlug?: boolean;
  onAutoGenerateSlugChange?: (_value: boolean) => void;
  slugHighlight?: boolean;
}

export const EditPageFormContent = ({
  isMutating,
  isSubmitting,
  form,
  onSubmitAction,
  isDefaultPage,
  autoGenerateSlug,
  onAutoGenerateSlugChange,
  slugHighlight,
}: EditPageFormContentProps) => {
  return (
    <Form {...form}>
      <form
        id="edit-page-form"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmitAction(values);
        })}
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
          {!isDefaultPage && (
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
                        disabled={
                          isMutating || isSubmitting || autoGenerateSlug
                        }
                        className={`transition-all duration-300 ${slugHighlight ? 'border-amber-500 ring-2 ring-amber-500/20 animate-pulse' : ''}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="checkbox"
                        id="auto-slug-edit"
                        checked={autoGenerateSlug}
                        onChange={(e) =>
                          onAutoGenerateSlugChange?.(e.target.checked)
                        }
                        className="rounded border-gray-300"
                        disabled={isMutating || isSubmitting}
                      />
                      <label
                        htmlFor="auto-slug-edit"
                        className="text-sm text-muted-foreground"
                      >
                        Auto-generate slug from title
                      </label>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      </form>
    </Form>
  );
};

interface EditPageFormProps
  extends Omit<EditPageFormContentProps, 'onSubmitAction'> {
  onSubmitAction: (
    _values: z.infer<typeof formSchema>
  ) => Promise<{ success: boolean; message?: string }>;
  onCancelAction: () => void;
  user?: { username?: string } | null;
  onAutoGenerateSlugChange?: (_value: boolean) => void;
}

export const EditPageForm = ({
  isMutating,
  isSubmitting,
  form,
  onSubmitAction,
  onCancelAction,
  isDefaultPage,
  autoGenerateSlug,
  onAutoGenerateSlugChange,
  user,
  slugHighlight,
}: EditPageFormProps) => {
  const slugValue = form.watch('slug');

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit page</DialogTitle>
        <DialogDescription>
          Make changes to your page here. Click continue when you&apos;re done.
        </DialogDescription>
        {user && user.username && (
          <div className="bg-muted p-3 rounded-md space-y-1 mt-3">
            <p className="text-sm font-medium">Your page URL:</p>
            <p className="text-sm text-muted-foreground break-all">
              {process.env.NEXT_PUBLIC_BASE_URL}/{user.username}/
              <span className="font-medium">{slugValue || 'your-slug'}</span>
            </p>
          </div>
        )}
        {isDefaultPage && (
          <p className="text-sm text-muted-foreground mt-2">
            Note: Your default page slug is locked to your username and cannot
            be changed.
          </p>
        )}
      </DialogHeader>
      <EditPageFormContent
        isMutating={isMutating}
        isSubmitting={isSubmitting}
        form={form}
        onSubmitAction={onSubmitAction}
        isDefaultPage={isDefaultPage}
        autoGenerateSlug={autoGenerateSlug}
        onAutoGenerateSlugChange={onAutoGenerateSlugChange}
        slugHighlight={slugHighlight}
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button
            disabled={isMutating || isSubmitting}
            variant="outline"
            type="button"
            onClick={onCancelAction}
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          disabled={isMutating || isSubmitting}
          type="submit"
          form="edit-page-form"
          className="min-w-[120px]"
        >
          {isMutating || isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
