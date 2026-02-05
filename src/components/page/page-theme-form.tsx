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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Loader2 } from 'lucide-react';
import {
  RiLayoutGridLine,
  RiLayoutHorizontalLine,
  RiLayoutMasonryLine,
} from 'react-icons/ri';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { themeSettingsSchema } from '@/lib/page-theme';

const formSchema = themeSettingsSchema;

interface PageThemeFormContentProps {
  isMutating: boolean;
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onSubmitAction: (
    _values: z.infer<typeof formSchema>
  ) => Promise<{ success: boolean; message?: string }>;
}

const layoutOptions = [
  {
    value: 'masonry' as const,
    label: 'Masonry',
    description: 'Pinterest-style grid with varying card heights',
    icon: RiLayoutMasonryLine,
  },
  {
    value: 'list' as const,
    label: 'List',
    description: 'Compact grid with minimal cards',
    icon: RiLayoutHorizontalLine,
  },
  {
    value: 'grid' as const,
    label: 'Grid',
    description: 'Uniform cards in a regular grid',
    icon: RiLayoutGridLine,
  },
];

export const PageThemeFormContent = ({
  isMutating,
  form,
  onSubmitAction,
}: PageThemeFormContentProps) => {
  return (
    <Form {...form}>
      <form
        id="page-theme-form"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmitAction(values);
        })}
        className="space-y-6"
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="layout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Layout Style</FormLabel>
                <FormControl>
                  <div
                    className={cn(
                      'grid grid-cols-3 gap-3',
                      isMutating ? 'opacity-50 pointer-events-none' : ''
                    )}
                  >
                    {layoutOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = field.value === option.value;

                      return (
                        <Tooltip key={option.value} delayDuration={300}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              autoFocus={isSelected}
                              className={cn(
                                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                                'hover:bg-accent hover:border-accent',
                                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border'
                              )}
                            >
                              <Icon
                                className={cn(
                                  'w-6 h-6 transition-colors',
                                  isSelected
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  isSelected
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {option.label}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p>{option.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

interface PageThemeFormProps extends PageThemeFormContentProps {
  onCancelAction: () => void;
}

export const PageThemeForm = ({
  isMutating,
  form,
  onSubmitAction,
  onCancelAction,
}: PageThemeFormProps) => {
  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Page Theme Settings</DialogTitle>
        <DialogDescription>
          Customize the appearance and layout of your page. Changes apply
          immediately.
        </DialogDescription>
      </DialogHeader>
      <PageThemeFormContent
        isMutating={isMutating}
        form={form}
        onSubmitAction={onSubmitAction}
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button
            disabled={isMutating}
            variant="outline"
            type="button"
            onClick={onCancelAction}
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          disabled={isMutating}
          type="submit"
          form="page-theme-form"
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
      </DialogFooter>
    </DialogContent>
  );
};
