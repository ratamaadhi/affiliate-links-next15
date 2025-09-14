'use client';

import { LinkPageContext } from '@/context/link-page-context';
import { useUpdateLinkOrder } from '@/hooks/mutations';
import { useLinkInfinite } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import { LinkSelect } from '@/lib/db/schema';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useContext } from 'react';
import { HiOutlineChartBar } from 'react-icons/hi';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { DeleteLinkButton } from './delete-link-button';
import { EditLinkButton } from './edit-link-button';
import ToggleLinkActive from './toggle-link-active';

function DragHandle(props) {
  return (
    <div className="flex justify-center pr-3 pl-1 cursor-grab" {...props}>
      <GripVertical size={16} />
    </div>
  );
}

function LinkSkeleton(props) {
  return (
    <div
      className="flex h-[102px] items-center pl-0 pr-4 pb-2 pt-3 border rounded-md shadow bg-muted/75"
      {...props}
    >
      {/* Drag Handle Skeleton */}
      <div className="flex justify-center pr-3 pl-1">
        <Skeleton className="h-4 w-4" />
      </div>

      {/* Content Skeleton */}
      <div className="w-full flex flex-col gap-2">
        {/* Top Row Skeleton */}
        <div className="w-full flex items-center">
          <div className="w-full flex items-center justify-between">
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-1/3" /> {/* Title */}
              <Skeleton className="h-3 w-4/5" /> {/* URL */}
            </div>
            <div className="flex items-center">
              <Skeleton className="h-6 w-10 rounded-full" />
              {/* Switch */}
            </div>
          </div>
        </div>
        {/* Bottom Row Skeleton */}
        <div className="w-full flex justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" /> {/* Edit Button */}
            <Skeleton className="h-8 w-24" /> {/* Clicks Button */}
          </div>
          <div>
            <Skeleton className="h-8 w-8" /> {/* Delete Button */}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListLinkSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <LinkSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Calculates the new display order for an item using fractional indexing.
 * @param items The array of items after the move.
 * @param newIndex The new index of the moved item.
 * @returns The new display order value.
 */
function calculateNewDisplayOrder<T extends { displayOrder: number | string }>(
  items: T[],
  newIndex: number
): number {
  const prevItem = items[newIndex - 1];
  const nextItem = items[newIndex + 1];

  const prevOrder = prevItem ? parseFloat(`${prevItem.displayOrder}`) : 0;
  const nextOrder = nextItem
    ? parseFloat(`${nextItem.displayOrder}`)
    : prevOrder + 1;

  return (prevOrder + nextOrder) / 2.0;
}

function ListLinks() {
  const { user } = useAuth();

  const linkPageState = useContext(LinkPageContext);
  const searchParams = useSearchParams();
  const search = searchParams.get('_search') ?? '';
  const { data, isLoading, size, setSize } = useLinkInfinite({
    pageId: linkPageState?.selectedPage?.id,
  });
  const { trigger: updateLinkOrder } = useUpdateLinkOrder({
    page: 1,
    search,
    pageId: linkPageState?.selectedPage?.id,
  });

  const links = React.useMemo(
    () => (data ? data.flatMap((page) => page?.data?.data || []) : []),
    [data]
  );
  const [dndLinks, setDndLinks] = React.useState(links);

  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0]?.data.data.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.data.data.length < 5);

  React.useEffect(() => {
    setDndLinks(links);
  }, [links]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [isLoadingMore, isReachingEnd, size]);

  const loaderRef = useInfiniteScroll(!isReachingEnd, loadMore, isLoadingMore);

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo(() => {
    return dndLinks?.map(({ id }) => id) || [];
  }, [dndLinks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = dndLinks.findIndex((item) => item.id === active.id);
    const newIndex = dndLinks.findIndex((item) => item.id === over.id);

    const newOrderedLinksForUI = arrayMove(dndLinks, oldIndex, newIndex);
    setDndLinks(newOrderedLinksForUI); // Update UI immediately

    const newDisplayOrder = calculateNewDisplayOrder(
      newOrderedLinksForUI,
      newIndex
    );

    const payload = {
      id: Number(active.id),
      displayOrder: newDisplayOrder,
    };

    updateLinkOrder(payload, {
      rollbackOnError: true,
    });
  }

  function DraggableDiv({ link }: { link: LinkSelect }) {
    const {
      transform,
      transition,
      setNodeRef,
      isDragging,
      listeners,
      attributes,
    } = useSortable({
      id: link.id,
    });

    return (
      <li
        draggable={true}
        data-dragging={isDragging}
        ref={setNodeRef}
        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition,
        }}
        {...attributes}
      >
        <div className="flex justify-between items-center pl-0 pr-4 pb-2 pt-3 border rounded-md shadow bg-muted/75">
          <DragHandle {...listeners} />
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="w-full flex items-center">
              <div className="w-full flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate mb-1">
                    {link.title}
                  </h3>
                  <p className="text-sm font- text-muted-foreground truncate">
                    {link.url}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ToggleLinkActive linkId={link.id} isActive={link.isActive} />
                </div>
              </div>
            </div>
            {user && (
              <div className="w-full flex justify-between">
                <div className="flex items-center gap-2 text-muted-foreground/75">
                  <EditLinkButton data={link} />
                  <Button type="button" variant="ghost" className="h-8">
                    <HiOutlineChartBar />
                    <span className="text-xs">{link.clickCount} clicks</span>
                  </Button>
                </div>

                <div>
                  <DeleteLinkButton pageId={link.pageId} linkId={link.id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </li>
    );
  }

  return (
    <div>
      <div className="min-h-[342px] mb-3">
        {dndLinks.length > 0 && (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <ul className="space-y-3 h-[558px] overflow-y-scroll">
              <SortableContext
                items={dataIds}
                strategy={verticalListSortingStrategy}
              >
                {dndLinks.map((link) => (
                  <DraggableDiv key={link.id} link={link} />
                ))}
              </SortableContext>
              {!isReachingEnd && !isLoadingMore && (
                <LinkSkeleton ref={loaderRef} />
              )}
              {isLoadingMore && <LinkSkeleton />}
            </ul>
          </DndContext>
        )}
        {isLoadingMore && dndLinks.length === 0 && <ListLinkSkeleton />}
        {isEmpty && (
          <p className="text-sm text-muted-foreground">No Links found.</p>
        )}
      </div>
    </div>
  );
}

export default ListLinks;
