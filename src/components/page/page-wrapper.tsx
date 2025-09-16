'use client';

import { cn } from '@/lib/utils';
import { Fragment } from 'react';
import { LogoutButton } from '../logout-button';
import { ModeToggle } from '../mode-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { Separator } from '../ui/separator';
import { SidebarInset, SidebarTrigger } from '../ui/sidebar';

export default function PageWrapper({
  children,
  breadcrumbs,
}: {
  children: React.ReactNode;
  breadcrumbs?: {
    title: string;
    url: string;
  }[];
}) {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 justify-between">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs?.map((breadcrumb, index) => (
                <Fragment key={index}>
                  <BreadcrumbItem
                    className={cn('hidden md:block', {
                      'block ': breadcrumbs.length - 1 === index,
                    })}
                  >
                    {breadcrumbs.length - 1 > index ? (
                      <BreadcrumbLink href={breadcrumb.url}>
                        {breadcrumb.title}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {breadcrumbs.length - 1 > index && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex justify-between items-center gap-2 px-4">
          <ModeToggle />
          <LogoutButton />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 sm:p-4 pt-0">{children}</div>
    </SidebarInset>
  );
}
