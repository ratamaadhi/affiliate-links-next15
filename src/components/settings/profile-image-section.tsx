'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AvatarUpload } from '@/components/settings/avatar-upload';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

interface ProfileImageSectionProps {
  currentImage: string | null;
  userName: string;
}

export function ProfileImageSection({
  currentImage,
  userName,
}: ProfileImageSectionProps) {
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const [displayedImage, setDisplayedImage] = useState(currentImage);
  const avatarFallback = userName?.substring(0, 2).toUpperCase() || '??';

  const handleImageSuccess = (newImageUrl: string | null) => {
    setDisplayedImage(newImageUrl);
  };

  return (
    <>
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-lg">
              <AvatarImage src={displayedImage} alt={userName} />
              <AvatarFallback className="rounded-lg text-2xl">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium mb-1">Profile Image</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This image will be displayed on your profile and in the sidebar.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAvatarUploadOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Change Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AvatarUpload
        currentImageUrl={displayedImage}
        userName={userName}
        isOpen={avatarUploadOpen}
        onOpenChange={setAvatarUploadOpen}
        onSuccess={handleImageSuccess}
      />
    </>
  );
}
