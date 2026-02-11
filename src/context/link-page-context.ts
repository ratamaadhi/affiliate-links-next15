'use client';
import { createContext, type Dispatch } from 'react';
import type { PageSelect } from '@/lib/db/schema';

export interface PageWithLabel extends PageSelect {
  label: string;
  value: number;
}

export type SelectedPage = PageWithLabel | null;

export interface LinkPageState {
  selectedPage: SelectedPage;
  keywordLink: string;
  reloadSignal: number;
}

export type LinkPageAction =
  | { type: 'changed'; payload: SelectedPage }
  | { type: 'search-link'; payload: string }
  | { type: 'trigger-reload' };

export const LinkPageContext = createContext<LinkPageState | null>(null);
export const LinkPageDispatchContext =
  createContext<Dispatch<LinkPageAction> | null>(null);
