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
import { LinkPageContext } from '@/context/link-page-context';
import { useCreateLink } from '@/hooks/mutations';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PlusIcon } from 'lucide-react';
import { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  title: z
    .string()
    .min(2, {
      message: 'Title must be at least 2 characters long',
    })
    .max(50)
    .nonempty('Title is required'),
  url: z.url().nonempty(),
});

export const CreateLinkButton = ({}) => {
  const { user } = useAuth();
  const { selectedPage, keywordLink } = useContext(LinkPageContext);

  const [isOpen, setIsOpen] = useState(false);

  const { trigger, isMutating } = useCreateLink({
    search: keywordLink || '',
    pageId: selectedPage?.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userId = (await authClient.getSession()).data?.user.id;
    if (!userId) {
      toast.error('You must be logged in to create a link');
      return;
    }

    const response = await trigger({ ...values, pageId: selectedPage?.id });
    if (response.success) {
      form.reset();
      setIsOpen(false);
    }
  }

  if ((!user || !user.username) && !selectedPage?.id) {
    return <Skeleton className="h-9 w-full rounded-lg" />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="default" className="w-full">
          <PlusIcon /> <span>Add Link</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add new Link</DialogTitle>
          <DialogDescription>Create a new link.</DialogDescription>
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
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Url</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your.link"
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
