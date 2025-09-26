'use client';

import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { useUpdatePage } from '@/hooks/mutations';
import { useAuth } from '@/hooks/useAuth';
import { PageSelect } from '@/lib/db/schema/page';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { EditPageForm } from './edit-page-form';
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
});

interface EditPageButtonProps {
  data: PageSelect;
}

export const EditPageButton = ({ data }: EditPageButtonProps) => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';

  const [isOpen, setIsOpen] = useState(false);
  const { trigger, isMutating } = useUpdatePage({ page: pageIndex, search });
  const form = useForm<z.infer<typeof formSchema>>();

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
      }
    },
    [form]
  );

  const handleSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      const userId = user?.id;
      if (!userId) {
        toast.error('You must be logged in to edit page');
        return;
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
            title: data.title,
            description: data.description || '',
          });
          setIsOpen(false);
          toast.success('Page updated successfully');
        } else {
          toast.error(response.message || 'Failed to update page');
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
        console.error('Update page error:', error);
      }
    },
    [user, trigger, data.id, data.title, data.description, form]
  );

  const handleCancel = useCallback(() => {
    form.reset();
  }, [form]);

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
        initialData={{
          title: data.title,
          description: data.description,
        }}
        isMutating={isMutating}
        onSubmitAction={handleSubmit}
        onCancelAction={handleCancel}
      />
    </Dialog>
  );
};
