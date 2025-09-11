'use client';

import { LinkPageContext } from '@/context/link-page-context';
import { useUpdateLinkOrder } from '@/hooks/mutations';
import { useLinks } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
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
import { GripVertical, PencilIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useContext } from 'react';
import { HiOutlineChartBar } from 'react-icons/hi';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { DeleteLinkButton } from './delete-link-button';
import ToggleLinkActive from './toggle-link-active';

function DragHandle(props) {
  return (
    <div className="flex justify-center pr-3 pl-1 cursor-grab" {...props}>
      <GripVertical size={16} />
    </div>
  );
}

function ListLinkSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex h-[102px] items-center pl-0 pr-4 py-2 border rounded-md shadow bg-muted/75"
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
      ))}
    </div>
  );
}

function ListLinks() {
  const { user } = useAuth();

  const linkPageState = useContext(LinkPageContext);
  const searchParams = useSearchParams();
  const pageIndex = +(searchParams.get('_page') ?? 1);
  const search = searchParams.get('_search') ?? '';
  const { data, isLoading } = useLinks({
    page: pageIndex,
    search,
    pageId: linkPageState?.selectedPage?.id,
  });
  const { trigger: updateLinkOrder } = useUpdateLinkOrder({
    page: pageIndex,
    search,
    pageId: linkPageState?.selectedPage?.id,
  });

  const links = React.useMemo(() => data?.data || [], [data]);
  const [dndLinks, setDndLinks] = React.useState(links);
  const pagination = data?.pagination;

  React.useEffect(() => {
    setDndLinks(links);
  }, [links]);

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

    if (!over) {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    const oldIndex = dndLinks.findIndex((item) => item.id === active.id);
    const newIndex = dndLinks.findIndex((item) => item.id === over.id);
    const newOrderedLinks = arrayMove(dndLinks, oldIndex, newIndex);
    const payload = newOrderedLinks.map((item, index) => ({
      id: item.id,
      displayOrder: index,
    }));
    setDndLinks(newOrderedLinks);
    updateLinkOrder(payload, {
      optimisticData: newOrderedLinks,
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
        <div className="flex justify-between items-center pl-0 pr-4 py-2 border rounded-md shadow bg-muted/75">
          <DragHandle {...listeners} />
          <div className="w-full flex flex-col gap-2">
            <div className="w-full flex items-center">
              <div className="w-full flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{link.title}</h3>
                  <p className="text-sm text-muted-foreground mr-4">
                    {link.url}
                  </p>
                </div>
                <div className="flex items-center">
                  <ToggleLinkActive linkId={link.id} isActive={link.isActive} />
                </div>
              </div>
            </div>
            {user && (
              <div className="w-full flex justify-between">
                <div className="flex items-center gap-2 text-muted-foreground/75">
                  <Button type="button" variant="ghost" className="size-8">
                    <PencilIcon />
                  </Button>
                  <Button type="button" variant="ghost" className="h-8">
                    <HiOutlineChartBar />
                    <span>{link.clickCount} clicks</span>
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

  const showSkeleton =
    !linkPageState.selectedPage?.id ||
    isLoading ||
    (data && dndLinks.length !== links.length);

  return (
    <div>
      <div className="min-h-[342px] mb-3">
        {!showSkeleton && dndLinks.length === 0 && (
          <p className="text-sm text-muted-foreground">No Links found.</p>
        )}
        {!showSkeleton && dndLinks.length > 0 && (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <ul className="space-y-3">
              <SortableContext
                items={dataIds}
                strategy={verticalListSortingStrategy}
              >
                {dndLinks.map((link) => (
                  <DraggableDiv key={link.id} link={link} />
                ))}
              </SortableContext>
            </ul>
          </DndContext>
        )}
        {showSkeleton && <ListLinkSkeleton />}
      </div>
    </div>
  );
}

export default ListLinks;
