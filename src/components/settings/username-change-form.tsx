'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useUsernameAvailability,
  useUsernameHistory,
  useUsernamePreview,
} from '@/hooks/queries';
import { useUpdateUsername } from '@/hooks/mutations';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function UsernameChangeForm({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const debouncedUsername = useDebounce(username, 500);

  const { data: availability, isLoading: checkingAvailability } =
    useUsernameAvailability(debouncedUsername);

  const { data: preview } = useUsernamePreview(debouncedUsername);
  const { data: history } = useUsernameHistory();

  const updateUsername = useUpdateUsername();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    if (username === currentUsername) {
      toast.error('New username cannot be the same as current username');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(username)) {
      toast.error(
        'Username can only contain lowercase letters, numbers, and hyphens'
      );
      return;
    }

    setIsLoading(true);
    try {
      await updateUsername.trigger({ username });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getAvailabilityStatus = () => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      return null;
    }

    if (checkingAvailability) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }

    if (availability?.available) {
      if (availability.isOwnOldUsername) {
        return (
          <div className="flex items-center gap-1">
            <RotateCcw className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-blue-500">Your old username</span>
          </div>
        );
      }
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }

    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const canSubmit = () => {
    return (
      username.trim() !== currentUsername &&
      username.length >= 3 &&
      /^[a-z0-9-]+$/.test(username) &&
      availability?.available &&
      !isLoading
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Username</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-username">Current Username</Label>
            <div className="flex items-center gap-2">
              <Input
                id="current-username"
                value={currentUsername}
                disabled
                className="bg-muted"
              />
              <Badge variant="secondary" className="">
                Current
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-username">New Username</Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-username"
                placeholder="Enter new username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="flex-1"
              />
              {getAvailabilityStatus()}
            </div>
            <p className="text-xs text-muted-foreground">
              Username can only contain lowercase letters, numbers, and hyphens.
              Minimum 3 characters.
            </p>
            {availability?.message && !availability.isOwnOldUsername && (
              <p className="text-xs text-red-500 break-words">
                {availability.message}
              </p>
            )}

            {availability?.isOwnOldUsername && (
              <p className="text-xs text-blue-500 break-words">
                This is one of your previous usernames. You can reuse it!
              </p>
            )}
          </div>

          {preview && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important Warning</AlertTitle>
                <AlertDescription className="text-sm">
                  {preview.warning}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Preview URLs</Label>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-3 rounded-md border bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium mb-1">Home Page</p>
                      <p className="text-sm text-muted-foreground break-all">
                        {preview.homePageUrl}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        copyToClipboard(preview.homePageUrl, 'Home page URL')
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-md border bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium mb-1">Example Page</p>
                      <p className="text-sm text-muted-foreground break-all">
                        {preview.examplePageUrl}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        copyToClipboard(
                          preview.examplePageUrl,
                          'Example page URL'
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-md border bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium mb-1">Short URL</p>
                      <p className="text-sm text-muted-foreground break-all">
                        {preview.shortUrl}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        copyToClipboard(preview.shortUrl, 'Short URL')
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Change Username'
            )}
          </Button>
        </CardContent>
      </Card>

      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Username Change History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div>
                    <p className="font-medium text-sm">{item.oldUsername}</p>
                    <p className="text-xs text-muted-foreground">
                      Changed on {new Date(item.changedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="">
                    Previous
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
