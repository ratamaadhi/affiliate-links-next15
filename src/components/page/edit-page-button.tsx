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
import { Input } from '../ui/input';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUpdatePage } from '@/hooks/mutations';
import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

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

export const EditPageButton = ({ data }) => {
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';

  const [isOpen, setIsOpen] = useState(false);

  const { trigger, isMutating } = useUpdatePage({ page: pageIndex, search });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: data?.title || '',
      description: data?.description || '',
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        title: data.title,
        description: data.description || '',
      });
    }
  }, [data, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userId = (await authClient.getSession()).data?.user.id;
    if (!userId) {
      toast.error('You must be logged in to create a notebook');
      return;
    }
    const response = await trigger({
      id: data.id,
      values: {
        ...values,
        userId: +userId,
      },
    });
    if (response.success) {
      form.reset();
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="size-8"
            onClick={() => setIsOpen(true)}
            disabled={isMutating}
          >
            <HiOutlinePencilAlt />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Edit page</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit page</DialogTitle>
          <DialogDescription>
            Make changes to your page here. Click continue when you&apos;re
            done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          disabled={isMutating}
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
                          disabled={isMutating}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={isMutating} variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isMutating} type="submit">
                {isMutating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Continue'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
