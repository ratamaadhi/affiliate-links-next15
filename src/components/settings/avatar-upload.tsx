'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import FileUpload from '@/components/file-upload';
import { ImageCrop } from '@/components/settings/image-crop';
import {
  deleteFileFromS3ByUrlAction,
  generatePresignedUrlAction,
} from '@/lib/s3/actions';
import { computeSHA256, generateS3Key } from '@/lib/s3-upload';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useUpdateUserImage } from '@/hooks/mutations';
import { FileWithPreview } from '@/hooks/use-file-upload';
import { Loader2, Trash2 } from 'lucide-react';
import { useState, useTransition, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

interface AvatarUploadProps {
  currentImageUrl: string | null;
  userName: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (newImageUrl: string | null) => void;
}

export function AvatarUpload({
  currentImageUrl,
  userName,
  isOpen,
  onOpenChange,
  onSuccess,
}: AvatarUploadProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadCompression, setLoadCompression] = useState(false);

  const isControlled = isOpen !== undefined && onOpenChange !== undefined;
  const _open = isControlled ? isOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const updateUserImage = useUpdateUserImage();

  // Cropping state
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Initialize with current image if exists
  const initialFiles = useMemo(
    () =>
      currentImageUrl
        ? [
            {
              id: 'current',
              name: `${userName}-avatar`,
              size: 0,
              type: 'image/*',
              url: currentImageUrl,
            },
          ]
        : [],
    [currentImageUrl, userName]
  );

  const [imageFile, setImageFile] = useState<FileWithPreview | null>(
    initialFiles.length > 0
      ? {
          file: initialFiles[0],
          id: initialFiles[0].id,
          preview: initialFiles[0].url,
        }
      : null
  );

  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      setImageFile(
        initialFiles.length > 0
          ? {
              file: initialFiles[0],
              id: initialFiles[0].id,
              preview: initialFiles[0].url,
            }
          : null
      );
      setShowCropDialog(false);
      setOriginalFile(null);
    }
    setOpen(newOpen);
  };

  const handleFilesChange = (files: FileWithPreview[]) => {
    if (files.length > 0) {
      const file = files[0];
      // Check if this is a new file (not the existing image)
      if (file.file instanceof File && file.preview !== currentImageUrl) {
        // Store the original file and close parent dialog
        setOriginalFile(file.file);
        // Close parent dialog first - crop dialog will show after it closes
        setOpen(false);
      } else {
        // This is the existing image, set it directly
        setImageFile(file);
      }
    } else {
      setImageFile(null);
    }
  };

  // Show crop dialog after parent dialog has closed
  useEffect(() => {
    if (originalFile && !_open) {
      const timer = setTimeout(() => {
        setShowCropDialog(true);
      }, 300); // Wait for parent drawer animation to complete (matches vaul drawer transition duration)
      return () => clearTimeout(timer);
    }
  }, [originalFile, _open]);

  // Clean up blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      // Revoke any blob URLs created during cropping
      if (imageFile?.preview && imageFile.file instanceof File) {
        URL.revokeObjectURL(imageFile.preview);
      }
    };
  }, [imageFile]);

  const handleCropComplete = (croppedBlob: Blob) => {
    // Create a new File from the cropped blob
    const croppedFile = new File(
      [croppedBlob],
      `cropped-${originalFile?.name || 'avatar'}.png`,
      { type: 'image/png' }
    );

    // Create a FileWithPreview from the cropped file
    const previewUrl = URL.createObjectURL(croppedBlob);
    const croppedImageFile: FileWithPreview = {
      file: croppedFile,
      id: `cropped-${Date.now()}`,
      preview: previewUrl,
    };

    setImageFile(croppedImageFile);
    setShowCropDialog(false);
    setOriginalFile(null);
    // Reopen parent dialog to show cropped image
    setOpen(true);
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setOriginalFile(null);
    // Reopen parent dialog so user can try again
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      let locationUploadedImage = currentImageUrl || null;

      // Check if we're removing the image
      if (!imageFile) {
        // Delete old image from S3
        if (currentImageUrl) {
          try {
            await deleteFileFromS3ByUrlAction(currentImageUrl);
          } catch (error) {
            console.error('Failed to delete old image:', error);
          }
        }
        locationUploadedImage = null;
      }
      // Check if we're uploading a new image
      else if (
        imageFile.preview !== currentImageUrl &&
        imageFile.file instanceof File
      ) {
        try {
          setLoadCompression(true);
          const checksum = await computeSHA256(imageFile.file);
          const key = generateS3Key('avatars');
          const singedUrlResult = await generatePresignedUrlAction({
            key,
            expiresIn: 120,
            checksum,
            type: imageFile.file.type,
            size: imageFile.file.size,
          });
          const upload = await axios.put(singedUrlResult, imageFile.file, {
            headers: {
              'Content-Type': imageFile.file.type,
            },
          });

          if (upload.status === 200) {
            // Extract the clean URL without query parameters
            locationUploadedImage =
              new URL(singedUrlResult).origin +
              new URL(singedUrlResult).pathname;
            // Delete old image from S3
            if (currentImageUrl) {
              await deleteFileFromS3ByUrlAction(currentImageUrl);
            }
          }
        } catch (uploadError) {
          console.error('Failed to upload new image:', uploadError);
          toast.error('Failed to upload new image');
          setLoadCompression(false);
          return;
        } finally {
          setLoadCompression(false);
        }
      }

      // Update user image in database
      await updateUserImage.trigger({ imageUrl: locationUploadedImage });
      // Notify parent of successful update
      onSuccess?.(locationUploadedImage);
      setOpen(false);
    });
  };

  const handleRemoveImage = () => {
    setImageFile(null);
  };

  const content = (
    <form onSubmit={handleSubmit} id="avatar-upload-form">
      <div className="flex flex-col gap-4 py-4">
        <FileUpload
          key={imageFile?.id || 'empty'}
          parentFiles={imageFile ? [imageFile] : []}
          onFilesChange={handleFilesChange}
          isMultiple={false}
          maxSizeMB={1}
          disabled={isPending || loadCompression}
        />
      </div>

      {imageFile && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isPending || loadCompression}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Avatar
          </Button>
        </div>
      )}
      {!imageFile && currentImageUrl && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Your current avatar will be removed when you save changes.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setImageFile(
                  initialFiles.length > 0
                    ? {
                        file: initialFiles[0],
                        id: initialFiles[0].id,
                        preview: initialFiles[0].url,
                      }
                    : null
                )
              }
              disabled={isPending || loadCompression}
              className="w-full"
            >
              Keep Current Avatar
            </Button>
          </div>
        </div>
      )}
    </form>
  );

  // Crop dialog (shown separately, not inside Dialog/Drawer above)
  return (
    <>
      {isDesktop ? (
        <Dialog open={_open} onOpenChange={handleDialogClose}>
          <DialogContent className="max-h-[90vh] overflow-y-auto flex flex-col">
            <DialogHeader>
              <DialogTitle>Change Profile Image</DialogTitle>
              <DialogDescription>
                Upload a new profile image or remove your current one.
              </DialogDescription>
            </DialogHeader>
            {content}
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  disabled={isPending || loadCompression}
                  variant="outline"
                  type="button"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                disabled={isPending || loadCompression}
                type="submit"
                form="avatar-upload-form"
                className="min-w-[120px]"
              >
                {isPending || loadCompression ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={_open} onOpenChange={handleDialogClose}>
          <DrawerContent className="h-full max-h-[85vh] flex flex-col">
            <DrawerHeader className="text-left">
              <DrawerTitle>Change Profile Image</DrawerTitle>
              <DrawerDescription>
                Upload a new profile image or remove your current one.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
              {content}
            </div>
            <DrawerFooter className="pt-2 gap-2">
              <Button
                disabled={isPending || loadCompression}
                type="submit"
                form="avatar-upload-form"
                className="min-w-[120px]"
              >
                {isPending || loadCompression ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  disabled={isPending || loadCompression}
                >
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Crop dialog - shown when user selects a new image */}
      {showCropDialog && originalFile && (
        <ImageCrop
          imageSrc={URL.createObjectURL(originalFile)}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          isOpen={showCropDialog}
        />
      )}
    </>
  );
}
