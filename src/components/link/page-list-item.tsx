import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExternalLink, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageListItemProps {
  page: {
    id: number;
    title: string;
    description: string | null;
    slug: string;
    createdAt: number;
    updatedAt: number;
  };
  username: string;
  isCurrentPage?: boolean;
}

export function PageListItem({
  page,
  username,
  isCurrentPage = false,
}: PageListItemProps) {
  const router = useRouter();

  const handleNavigate = () => {
    router.push(`/${username}/${page.slug}`);
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer',
        isCurrentPage && 'border-primary bg-primary/5'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <FileText className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold truncate">
                {page.title}
              </CardTitle>
              {page.description && (
                <CardDescription className="text-sm line-clamp-2 mt-1">
                  {page.description}
                </CardDescription>
              )}
            </div>
          </div>
          {isCurrentPage && (
            <Badge variant="default" className="flex-shrink-0">
              Current
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigate}
            className="gap-1 hover:bg-primary/10"
          >
            <ExternalLink className="w-3 h-3" />
            Visit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
