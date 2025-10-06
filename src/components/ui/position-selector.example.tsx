'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PositionSelector,
  generatePositionOptions,
  generateExistingPositionOptions,
} from './position-selector';
import { Button } from './button';
import { Form } from './form';

// Example 1: Create form with position selector
const createFormSchema = z.object({
  title: z.string().min(2),
  displayOrder: z.number().min(1),
});

export const CreateLinkExample = () => {
  const existingLinksCount = 5; // This would come from your data

  const form = useForm({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      title: '',
      displayOrder: existingLinksCount + 1,
    },
  });

  const positionOptions = generatePositionOptions(existingLinksCount);

  return (
    <Form {...form}>
      <form className="space-y-4">
        <PositionSelector
          control={form.control}
          name="displayOrder"
          label="Position"
          placeholder="Select a position"
          options={positionOptions}
        />
        <Button type="submit">Create Link</Button>
      </form>
    </Form>
  );
};

// Example 2: Edit form with position selector
const editFormSchema = z.object({
  title: z.string().min(2),
  displayOrder: z.number().min(1),
});

export const EditLinkExample = () => {
  const existingLinksCount = 5; // This would come from your data
  const currentLinkPosition = 3; // This would come from the link data

  const form = useForm({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: 'Existing Link',
      displayOrder: currentLinkPosition,
    },
  });

  const positionOptions = generateExistingPositionOptions(existingLinksCount);

  return (
    <Form {...form}>
      <form className="space-y-4">
        <PositionSelector
          control={form.control}
          name="displayOrder"
          label="Position"
          placeholder="Select a position"
          options={positionOptions}
        />
        <Button type="submit">Update Link</Button>
      </form>
    </Form>
  );
};

// Example 3: Custom position options
export const CustomPositionExample = () => {
  const form = useForm({
    defaultValues: {
      displayOrder: 1,
    },
  });

  const customOptions = [
    { value: 1, label: 'First Position' },
    { value: 2, label: 'Second Position' },
    { value: 3, label: 'Third Position' },
    { value: 99, label: 'Last Position' },
  ];

  return (
    <Form {...form}>
      <form className="space-y-4">
        <PositionSelector
          control={form.control}
          name="displayOrder"
          label="Custom Position"
          placeholder="Select a custom position"
          options={customOptions}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};
