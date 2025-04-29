
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeStyling, { type Options as QRCodeStylingOptions, type FileExtension } from 'qr-code-styling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Image as ImageIcon } from 'lucide-react';

interface QrCodeGeneratorProps {
  initialUrl: string;
}

type DotType = QRCodeStylingOptions['dotsOptions']['type'];

const defaultOptions: QRCodeStylingOptions = {
  width: 256,
  height: 256,
  type: 'svg',
  image: '',
  dotsOptions: {
    color: '#008080', // Teal accent color
    type: 'rounded',
  },
  backgroundOptions: {
    color: '#FFFFFF', // Default to white background for better scanability initially
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 5,
    imageSize: 0.4,
  },
  qrOptions: {
    errorCorrectionLevel: 'H', // High error correction for embedded images
  },
};

export function QrCodeGenerator({ initialUrl }: QrCodeGeneratorProps) {
  const [url, setUrl] = useState<string>(initialUrl);
  const [options, setOptions] = useState<QRCodeStylingOptions>(defaultOptions);
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);
  const [fileExtension, setFileExtension] = useState<FileExtension>('png');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize QR Code instance
  useEffect(() => {
    if (!qrCodeInstance) {
      const instance = new QRCodeStyling({...options, data: url});
      setQrCodeInstance(instance);
    }
  }, [options, url, qrCodeInstance]); // Re-init if options/url change before instance created

   // Append QR Code to the DOM
   useEffect(() => {
    if (ref.current && qrCodeInstance) {
        ref.current.innerHTML = ''; // Clear previous QR code
        qrCodeInstance.append(ref.current);
    }
  }, [qrCodeInstance]);

  // Update QR Code when options or URL change
  useEffect(() => {
    if (qrCodeInstance) {
      qrCodeInstance.update({...options, data: url });
    }
  }, [options, url, qrCodeInstance]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleColorChange = (key: 'dots' | 'background', color: string) => {
    setOptions(prevOptions => ({
      ...prevOptions,
      ...(key === 'dots' ? { dotsOptions: { ...prevOptions.dotsOptions, color } } : {}),
      ...(key === 'background' ? { backgroundOptions: { ...prevOptions.backgroundOptions, color } } : {}),
    }));
  };

 const handleDotStyleChange = (value: DotType) => {
    setOptions(prevOptions => ({
      ...prevOptions,
      dotsOptions: {
        ...(prevOptions.dotsOptions),
        type: value,
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setOptions(prevOptions => ({
          ...prevOptions,
          image: imageUrl,
        }));
         setImagePreviewUrl(imageUrl); // Set preview URL
      };
      reader.readAsDataURL(file);
    } else {
      // Clear image if no file selected
       setOptions(prevOptions => ({
          ...prevOptions,
          image: '',
        }));
       setImagePreviewUrl(null);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const onDownloadClick = useCallback(() => {
    if (!qrCodeInstance) return;
    qrCodeInstance.download({ extension: fileExtension });
  }, [qrCodeInstance, fileExtension]);


  return (
    <Card className="w-full max-w-md mx-auto mt-8 animate-fade-in">
      <CardHeader>
        <CardTitle>Customize Your QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Preview */}
        <div ref={ref} className="mx-auto w-[256px] h-[256px] border rounded-md overflow-hidden shadow-inner" />

        {/* Customization Controls */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* URL Input - Maybe not needed if always using initialUrl, but good for flexibility */}
           {/* <div className="space-y-1 md:col-span-2">
            <Label htmlFor="qr-url">URL</Label>
            <Input id="qr-url" type="url" value={url} onChange={handleUrlChange} placeholder="https://example.com" />
          </div> */}

          <div className="space-y-1">
            <Label htmlFor="dot-color">Dot Color</Label>
             <Input
                id="dot-color"
                type="color"
                value={options.dotsOptions?.color || '#000000'}
                onChange={(e) => handleColorChange('dots', e.target.value)}
                className="h-10 p-1" // Adjust padding for color input
              />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bg-color">Background Color</Label>
             <Input
                id="bg-color"
                type="color"
                value={options.backgroundOptions?.color || '#ffffff'}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="h-10 p-1"
              />
          </div>

           <div className="space-y-1">
            <Label htmlFor="dot-style">Dot Style</Label>
            <Select onValueChange={(value: DotType) => handleDotStyleChange(value)} defaultValue={options.dotsOptions.type}>
              <SelectTrigger id="dot-style">
                <SelectValue placeholder="Select dot style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="dots">Dots</SelectItem>
                <SelectItem value="rounded">Rounded</SelectItem>
                <SelectItem value="classy">Classy</SelectItem>
                <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
                <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
              </SelectContent>
            </Select>
          </div>

           <div className="space-y-1">
             <Label htmlFor="image-upload">Center Image (Logo)</Label>
              <Button variant="outline" onClick={triggerImageUpload} className="w-full justify-start text-left font-normal">
                <ImageIcon className="mr-2 h-4 w-4" />
                {imagePreviewUrl ? "Change Image" : "Upload Image"}
              </Button>
              <Input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/gif, image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden" // Hide the default input, use button instead
                />
               {imagePreviewUrl && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                       <img src={imagePreviewUrl} alt="Preview" className="h-6 w-6 rounded object-cover" />
                       <span>Image selected</span>
                        <Button variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={() => {
                             setOptions(prev => ({...prev, image: ''}));
                             setImagePreviewUrl(null);
                             if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
                         }}>Remove</Button>
                     </div>
                )}
          </div>


          <div className="space-y-1 md:col-span-2">
             <Label htmlFor="file-type">Download Format</Label>
             <Select onValueChange={(value: FileExtension) => setFileExtension(value)} defaultValue={fileExtension}>
                <SelectTrigger id="file-type">
                    <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WEBP</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                </SelectContent>
                </Select>
           </div>
        </div>
      </CardContent>
       <CardFooter>
          <Button onClick={onDownloadClick} className="w-full" disabled={!qrCodeInstance}>
            <Download className="mr-2 h-4 w-4" /> Download QR Code
          </Button>
       </CardFooter>
    </Card>
  );
}
