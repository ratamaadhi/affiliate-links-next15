'use client';

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
import { useUpdatePageTheme } from '@/hooks/mutations';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useCallback, useState, useMemo } from 'react';
import { RiPaletteLine } from 'react-icons/ri';
import { Loader2 } from 'lucide-react';
import { PageThemeForm, PageThemeFormContent } from './page-theme-form';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { themeSettingsSchema, parseThemeSettings, type ThemeSettings } from '@/lib/page-theme';
import type { PageSelect } from '@/lib/db/schema/page';

const formSchema = themeSettingsSchema;

interface EditPageThemeButtonProps {
  data: PageSelect;
}

export const EditPageThemeButton = ({ data }: EditPageThemeButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentThemeSettings, setCurrentThemeSettings] = useState<ThemeSettings>(() =>
    parseThemeSettings(data.themeSettings)
  );
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { trigger, isMutating } = useUpdatePageTheme();

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: currentThemeSettings,
  });

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
        if (open) {
          form.reset(currentThemeSettings);
        }
      }
    },
    [form, currentThemeSettings]
  );

  const handleSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const response = await trigger({
        pageId: data.id,
        themeSettings: values,
      });

      if (response.success) {
        setCurrentThemeSettings(values);
        form.reset(values);
        setIsOpen(false);
      }
    },
    [trigger, data.id, form]
  );

  const handleCancel = useCallback(() => {
    form.reset();
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
              aria-label="Edit theme"
            >
              <RiPaletteLine />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Edit theme</p>
          </TooltipContent>
        </Tooltip>
        <PageThemeForm
          form={form}
          isMutating={isMutating}
          onSubmitAction={handleSubmit}
          onCancelAction={handleCancel}
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
          aria-label="Edit theme"
        >
          <RiPaletteLine />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] h-full flex flex-col">
        <DrawerHeader className="text-left">
          <DrawerTitle>Page Theme Settings</DrawerTitle>
          <DrawerDescription>
            Customize the appearance and layout of your page. Changes apply
            immediately.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
          <PageThemeFormContent
            form={form}
            isMutating={isMutating}
            onSubmitAction={handleSubmit}
          />
        </div>
        <DrawerFooter className="pt-2 gap-2">
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
