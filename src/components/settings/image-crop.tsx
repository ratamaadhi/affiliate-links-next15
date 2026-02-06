'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Area, Point } from 'react-easy-crop';
import Cropper from 'react-easy-crop';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageCropProps {
  imageSrc: string;
  onCropComplete: (_croppedBlob: Blob) => void;
  onCancel: () => void;
  isOpen?: boolean;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Maximum dimension for canvas operations to prevent performance issues
  // with very large images. 1000px is a reasonable balance between quality
  // and performance for profile avatars.
  const maxSize = 1000;
  let { width, height } = image;

  // Scale down if image is too large
  if (width > maxSize || height > maxSize) {
    const scale = Math.min(maxSize / width, maxSize / height);
    width *= scale;
    height *= scale;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const rotRad = getRadianAngle(rotation);

  // Calculate rotated bounding box
  const { width: bBoxWidth, height: bBoxHeight } = rotatedSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  const canvasToDrawOn = document.createElement('canvas');
  canvasToDrawOn.width = bBoxWidth;
  canvasToDrawOn.height = bBoxHeight;
  const ctxToDrawOn = canvasToDrawOn.getContext('2d');

  if (!ctxToDrawOn) {
    throw new Error('Could not get canvas context');
  }

  // Translate to center of canvas
  ctxToDrawOn.translate(bBoxWidth / 2, bBoxHeight / 2);
  // Rotate
  ctxToDrawOn.rotate(rotRad);
  // Draw image
  ctxToDrawOn.drawImage(image, -image.width / 2, -image.height / 2);

  // Crop the rotated image
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Could not get canvas context');
  }

  croppedCtx.drawImage(
    canvasToDrawOn,
    (bBoxWidth -
      image.width * Math.abs(Math.cos(rotRad)) -
      image.height * Math.abs(Math.sin(rotRad))) /
      2 -
      pixelCrop.x,
    (bBoxHeight -
      image.width * Math.abs(Math.sin(rotRad)) -
      image.height * Math.abs(Math.cos(rotRad))) /
      2 -
      pixelCrop.y
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        throw new Error('Canvas toBlob failed');
      }
    }, 'image/png');
  });
}

function rotatedSize(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export function ImageCrop({
  imageSrc,
  onCropComplete,
  onCancel,
  isOpen = true,
}: ImageCropProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropCompleteHandler = (
    _croppedArea: Area,
    croppedAreaPixels: Area
  ) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    setIsCropping(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsCropping(false);
    }
  };

  const handleDrawerClose = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  const content = (
    <div className="flex flex-col gap-4 py-4">
      <div
        className="relative h-[400px] w-full bg-muted/30 rounded-lg overflow-hidden"
        style={{ touchAction: 'none' }}
        // onPointerDownCapture={(e) => e.stopPropagation()}
        // onTouchStartCapture={(e) => e.stopPropagation()}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1 / 1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropCompleteHandler}
          cropShape="round"
          showGrid={false}
          style={{
            containerStyle: {
              backgroundColor: 'transparent',
            },
            cropAreaStyle: {
              border: '2px solid hsl(var(--primary))',
            },
          }}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Zoom</label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleDrawerClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>Crop Profile Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the square portion of your image to
              use as your profile picture.
            </DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>
            <Button
              disabled={isCropping}
              variant="outline"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              disabled={isCropping || !croppedAreaPixels}
              type="button"
              onClick={handleCrop}
              className="min-w-[120px]"
            >
              {isCropping ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Cropping...
                </>
              ) : (
                'Apply Crop'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleDrawerClose} dismissible={false}>
      <DrawerContent className="h-full max-h-[85vh] flex flex-col">
        <DrawerHeader className="text-left">
          <DrawerTitle>Crop Profile Image</DrawerTitle>
          <DrawerDescription>
            Adjust the crop area to select the square portion of your image to
            use as your profile picture.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
          {content}
        </div>
        <DrawerFooter className="pt-2 gap-2">
          <Button
            disabled={isCropping || !croppedAreaPixels}
            type="button"
            onClick={handleCrop}
            className="min-w-[120px]"
          >
            {isCropping ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Cropping...
              </>
            ) : (
              'Apply Crop'
            )}
          </Button>
          <Button
            variant="outline"
            disabled={isCropping}
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
