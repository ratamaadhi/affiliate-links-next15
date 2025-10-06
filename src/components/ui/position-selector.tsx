'use client';

import React from 'react';
import { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface PositionOption {
  value: number;
  label: string | number;
}

interface PositionSelectorProps {
  control: Control<any>;
  name: string;
  label?: string;
  placeholder?: string;
  options?: PositionOption[];
  totalCount?: number;
  disabled?: boolean;
  className?: string;
  addNumber?: number;
}

export const PositionSelector = ({
  control,
  name,
  label = 'Position',
  placeholder = 'Select a position',
  options,
  totalCount,
  disabled = false,
  className,
  addNumber,
}: PositionSelectorProps) => {
  // Generate options from totalCount if provided, otherwise use options prop
  const finalOptions = React.useMemo(() => {
    if (totalCount !== undefined) {
      return generatePositionOptions(totalCount, addNumber);
    }
    return options || [];
  }, [options, totalCount, addNumber]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(parseInt(value))}
            defaultValue={field.value?.toString()}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {finalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Helper function to generate position options
export const generatePositionOptions = (
  count: number,
  addNumber: number = 0
): PositionOption[] => {
  const options = [];
  for (let i = 1; i <= count + addNumber; i++) {
    options.push({
      value: i,
      label: i,
    });
  }
  return options;
};

// Helper function to generate position options for existing links
export const generateExistingPositionOptions = (
  count: number
): PositionOption[] => {
  const options = [];
  for (let i = 1; i <= count; i++) {
    options.push({
      value: i,
      label: i,
    });
  }
  return options;
};
