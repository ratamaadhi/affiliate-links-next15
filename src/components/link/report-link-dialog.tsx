'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const reportLinkSchema = z.object({
  reason: z.enum(['broken', 'inappropriate', 'spam', 'other']),
  description: z.string().optional(),
  reporterName: z.string().min(1, 'Name is required'),
  reporterEmail: z.string().email('Invalid email address'),
});

type ReportLinkFormValues = z.infer<typeof reportLinkSchema>;

interface ReportLinkDialogProps {
  linkId: number;
  linkTitle: string;
  trigger?: React.ReactNode;
}

export function ReportLinkDialog({
  linkId,
  linkTitle,
  trigger,
}: ReportLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportLinkFormValues>({
    resolver: zodResolver(reportLinkSchema),
    defaultValues: {
      reason: 'broken',
      description: '',
      reporterName: '',
      reporterEmail: '',
    },
  });

  const onSubmit = async (values: ReportLinkFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/link-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkId,
          ...values,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(
            `Too many reports. Please try again in ${Math.ceil(data.retryAfter / 60)} minutes.`
          );
        } else {
          toast.error(data.message || 'Failed to submit report');
        }
        return;
      }

      toast.success('Report submitted successfully. Thank you!');
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <AlertTriangle className="w-4 h-4 mr-2" />
      Report Issue
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] z-50">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
            <DialogHeader>
              <DialogTitle>Report Link Issue</DialogTitle>
              <DialogDescription>
                Report an issue with &quot;{linkTitle}&quot;. Your report will
                be sent to the page owner.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="broken">Broken Link</SelectItem>
                        <SelectItem value="inappropriate">
                          Inappropriate Content
                        </SelectItem>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea
                        placeholder="Please provide more details about the issue..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reporterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
