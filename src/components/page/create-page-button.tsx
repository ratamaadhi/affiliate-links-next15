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
import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
});

export const CreatePageButton = ({}) => {
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const [isOpen, setIsOpen] = useState(false);

  const { trigger, isMutating } = useCreatePage({ page: pageIndex });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userId = (await authClient.getSession()).data?.user.id;
    if (!userId) {
      toast.error('You must be logged in to create a notebook');
      return;
    }

    const response = await trigger({ ...values, userId: +userId });
    if (response.success) {
      form.reset();
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <TbLibraryPlus /> {` Page`}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new page</DialogTitle>
          <DialogDescription>
            Create a new page to start collecting links.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            role="form"
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
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
