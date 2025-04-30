
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeStyling, { type Options as QRCodeStylingOptions, type FileExtension, type DotType, type CornerSquareType, type CornerDotType, type Gradient } from 'qr-code-styling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from "@/components/ui/slider"
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Image as ImageIcon, Link as LinkIcon, Phone, Mail, MessageSquare, MapPin, Calendar as CalendarIcon, User, Settings2, Palette, Shapes, Clock, Wifi } from 'lucide-react';
import { format } from "date-fns"
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Define allowed QR types
type QrType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'sms' | 'location' | 'event' | 'vcard' | 'wifi';

// QR type options
const qrTypeOptions: { value: QrType; label: string; icon: React.ElementType }[] = [
  { value: 'url', label: 'Website URL', icon: LinkIcon },
  { value: 'text', label: 'Plain Text', icon: MessageSquare },
  { value: 'email', label: 'Email Address', icon: Mail },
  { value: 'phone', label: 'Phone Number', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp Message', icon: MessageSquare }, // Using MessageSquare as placeholder
  { value: 'sms', label: 'SMS Message', icon: MessageSquare }, // Using MessageSquare for SMS too
  { value: 'location', label: 'Google Maps Location', icon: MapPin },
  { value: 'event', label: 'Calendar Event', icon: CalendarIcon },
  { value: 'vcard', label: 'Contact Card (vCard)', icon: User },
  { value: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
];

const dotTypes: DotType[] = ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'];
const cornerSquareTypes: CornerSquareType[] = ['square', 'extra-rounded', 'dot'];
const cornerDotTypes: CornerDotType[] = ['square', 'dot'];
const wifiEncryptionTypes = ['WPA/WPA2', 'WEP', 'None'];


const defaultOptions: QRCodeStylingOptions = {
  width: 256,
  height: 256,
  type: 'svg',
  data: 'https://linkspark.com', // Default data
  image: '',
  dotsOptions: {
    color: '#008080', // Teal accent color
    type: 'rounded',
    // gradient: undefined, // Example gradient structure if used
  },
  backgroundOptions: {
    color: '#FFFFFF',
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 5,
    imageSize: 0.4, // Default relative size
    hideBackgroundDots: true,
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
    color: '#008080',
    // gradient: undefined,
  },
  cornersDotOptions: {
    type: 'dot',
    color: '#008080',
    // gradient: undefined,
  },
  qrOptions: {
    errorCorrectionLevel: 'H', // High error correction for embedded images/complex data
  },
};

// Helper function to format vCard data
const formatVCard = (data: Record<string, string>): string => {
  let vCardString = 'BEGIN:VCARD\nVERSION:3.0\n';
  if (data.firstName || data.lastName) vCardString += `N:${data.lastName || ''};${data.firstName || ''}\n`;
  if (data.firstName || data.lastName) vCardString += `FN:${data.firstName || ''} ${data.lastName || ''}\n`;
  if (data.organization) vCardString += `ORG:${data.organization}\n`;
  if (data.title) vCardString += `TITLE:${data.title}\n`;
  if (data.phone) vCardString += `TEL;TYPE=WORK,VOICE:${data.phone}\n`;
  if (data.mobile) vCardString += `TEL;TYPE=CELL,VOICE:${data.mobile}\n`;
  if (data.email) vCardString += `EMAIL:${data.email}\n`;
  if (data.website) vCardString += `URL:${data.website}\n`;
  if (data.address) vCardString += `ADR;TYPE=WORK:;;${data.address}\n`; // Basic address format
  vCardString += 'END:VCARD';
  return vCardString;
};

// Helper function to format ICS data
const formatICS = (data: Record<string, any>): string => {
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      // Format date as YYYYMMDDTHHmmssZ (UTC time)
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let icsString = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LinkSpark//QR Event Generator//EN\nBEGIN:VEVENT\n';
    if (data.summary) icsString += `SUMMARY:${data.summary}\n`;
    if (data.location) icsString += `LOCATION:${data.location}\n`;
    if (data.description) icsString += `DESCRIPTION:${data.description.replace(/\n/g, '\\n')}\n`; // Escape newlines
    if (data.startDate) icsString += `DTSTART:${formatDate(data.startDate)}\n`;
    if (data.endDate) {
      icsString += `DTEND:${formatDate(data.endDate)}\n`;
    } else if (data.startDate) { // Default to 1 hour duration if no end date
        const endDate = new Date(data.startDate.getTime() + 60 * 60 * 1000);
        icsString += `DTEND:${formatDate(endDate)}\n`;
    }
    icsString += 'END:VEVENT\nEND:VCALENDAR';
    return icsString;
}

// Helper function to format Wi-Fi data
const formatWifi = (data: Record<string, any>): string => {
    const escapeValue = (value: string = '') => {
        // Escape special characters: \, ;, ,, ", :
        return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');
    };
    const ssid = escapeValue(data.wifi_ssid);
    const password = escapeValue(data.wifi_password);
    const encryption = data.wifi_encryption === 'None' ? 'nopass' : data.wifi_encryption;
    const hidden = data.wifi_hidden ? 'true' : 'false';

    return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`;
};


// Helper to process image for shape/opacity (using Canvas)
const processImage = (
    imageUrl: string,
    shape: 'square' | 'circle',
    size: number, // Target size for the canvas
    opacity: number = 1 // Opacity (0 to 1)
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject('Could not get canvas context');
                return;
            }

            ctx.globalAlpha = opacity; // Apply opacity

            if (shape === 'circle') {
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
            }

            // Draw the image centered and covering the canvas
            const aspectRatio = img.width / img.height;
            let drawWidth = size;
            let drawHeight = size;
            let offsetX = 0;
            let offsetY = 0;

            if (aspectRatio > 1) { // Wider than tall
                drawHeight = size / aspectRatio;
                offsetY = (size - drawHeight) / 2;
            } else { // Taller than wide or square
                drawWidth = size * aspectRatio;
                offsetX = (size - drawWidth) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (error) => reject(`Image loading error: ${error}`);
        img.src = imageUrl;
    });
};


export function QrCodeGenerator() {
  const [qrType, setQrType] = useState<QrType>('url');
  const [inputData, setInputData] = useState<Record<string, any>>({ url: 'https://linkspark.com' }); // Store data for each type
  const [options, setOptions] = useState<QRCodeStylingOptions>(defaultOptions);
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);
  const [fileExtension, setFileExtension] = useState<FileExtension>('png');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null); // Store the original uploaded logo URL
  const [logoSize, setLogoSize] = useState<number>(defaultOptions.imageOptions?.imageSize ? defaultOptions.imageOptions.imageSize * 100 : 40); // Percentage
  const [logoShape, setLogoShape] = useState<'square' | 'circle'>('square');
  const [logoOpacity, setLogoOpacity] = useState<number>(100); // Percentage (0-100)
  const [qrLabel, setQrLabel] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [expiryTime, setExpiryTime] = useState<string>("00:00"); // HH:mm format
  const [wifiPasswordVisible, setWifiPasswordVisible] = useState<boolean>(true); // State for Wi-Fi password visibility


  const qrPreviewRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter(); // Initialize router

  // Generate QR Data String based on type and inputData
  // Note: This function generates the *direct* data for the QR code.
  // The expiry setting is purely cosmetic in the UI and does not affect this data.
  // A backend system would be needed to handle expiry by using an intermediate URL.
  const generateQrData = useCallback((): string => {
    switch (qrType) {
      case 'url':
        return inputData.url || '';
      case 'text':
        return inputData.text || '';
      case 'email':
        return `mailto:${inputData.email || ''}?subject=${encodeURIComponent(inputData.subject || '')}&body=${encodeURIComponent(inputData.body || '')}`;
      case 'phone':
        return `tel:${inputData.phone || ''}`;
      case 'whatsapp':
        const phoneNum = (inputData.whatsapp_phone || '').replace(/[^0-9]/g, ''); // Clean phone number
        return `https://wa.me/${phoneNum}?text=${encodeURIComponent(inputData.whatsapp_message || '')}`;
      case 'sms':
        const smsPhoneNum = (inputData.sms_phone || '').replace(/[^0-9]/g, '');
        return `sms:${smsPhoneNum}?body=${encodeURIComponent(inputData.sms_message || '')}`;
      case 'location':
        return `https://www.google.com/maps/search/?api=1&query=${inputData.latitude || 0},${inputData.longitude || 0}`;
      case 'event':
        return formatICS({
            summary: inputData.event_summary,
            location: inputData.event_location,
            description: inputData.event_description,
            startDate: inputData.event_start,
            endDate: inputData.event_end,
        });
      case 'vcard':
        return formatVCard({
            firstName: inputData.vcard_firstName,
            lastName: inputData.vcard_lastName,
            organization: inputData.vcard_organization,
            title: inputData.vcard_title,
            phone: inputData.vcard_phone,
            mobile: inputData.vcard_mobile,
            email: inputData.vcard_email,
            website: inputData.vcard_website,
            address: inputData.vcard_address,
        });
      case 'wifi':
        return formatWifi({
            wifi_ssid: inputData.wifi_ssid,
            wifi_password: inputData.wifi_password,
            wifi_encryption: inputData.wifi_encryption || 'WPA/WPA2',
            wifi_hidden: inputData.wifi_hidden || false,
        });
      default:
        return '';
    }
  }, [qrType, inputData]); // inputData is crucial here

  // Initialize QR Code instance
  useEffect(() => {
    if (!qrCodeInstance && qrPreviewRef.current) {
        const instance = new QRCodeStyling({
            ...options,
            data: generateQrData(), // Use the generated data
            width: options.width || 256,
            height: options.height || 256,
        });
        setQrCodeInstance(instance);
    } else if (qrCodeInstance) {
         qrCodeInstance.update({
            ...options,
            data: generateQrData(), // Update with potentially new data
            width: options.width || 256,
            height: options.height || 256,
         });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, generateQrData]); // Only re-run when options or generated data changes

  // Append QR Code to the DOM - only when instance changes or ref becomes available
  useEffect(() => {
    if (qrPreviewRef.current && qrCodeInstance) {
      qrPreviewRef.current.innerHTML = ''; // Clear previous QR code
      qrCodeInstance.append(qrPreviewRef.current);
    }
  }, [qrCodeInstance, qrPreviewRef]);


  // --- Input Handlers ---
  const handleInputChange = (key: string, value: any) => {
    setInputData(prev => ({ ...prev, [key]: value }));
  };

  // Handle checkbox changes (for Wi-Fi hidden)
  const handleCheckboxChange = (key: string, checked: boolean) => {
    setInputData(prev => ({ ...prev, [key]: checked }));
  };


  const handleDateChange = (key: string, date: Date | undefined) => {
    setInputData(prev => ({ ...prev, [key]: date }));
     if (key === 'event_start' && date && !inputData.event_end) {
         // Auto-set end date if start date is set and end date is empty (e.g., +1 hour)
         const endDate = new Date(date.getTime() + 60 * 60 * 1000);
         setInputData(prev => ({...prev, event_end: endDate }));
     }
  };


  // --- Customization Handlers ---
  const handleColorChange = (target: 'dots' | 'background' | 'cornersSquare' | 'cornersDot', color: string) => {
     setOptions(prev => ({
        ...prev,
        ...(target === 'dots' && { dotsOptions: { ...prev.dotsOptions, color } }),
        ...(target === 'background' && { backgroundOptions: { ...prev.backgroundOptions, color } }),
        ...(target === 'cornersSquare' && { cornersSquareOptions: { ...prev.cornersSquareOptions, color } }),
        ...(target === 'cornersDot' && { cornersDotOptions: { ...prev.cornersDotOptions, color } }),
    }));
  };

 const handleDotStyleChange = (value: DotType) => {
    setOptions(prev => ({ ...prev, dotsOptions: { ...prev.dotsOptions, type: value } }));
  };

  const handleCornerStyleChange = (target: 'cornersSquare' | 'cornersDot', value: CornerSquareType | CornerDotType) => {
     setOptions(prev => ({
        ...prev,
        ...(target === 'cornersSquare' && { cornersSquareOptions: { ...prev.cornersSquareOptions, type: value as CornerSquareType } }),
        ...(target === 'cornersDot' && { cornersDotOptions: { ...prev.cornersDotOptions, type: value as CornerDotType } }),
    }));
  };

  const handleQrSizeChange = (value: number[]) => {
      const size = value[0];
       setOptions(prev => ({ ...prev, width: size, height: size }));
  }

  const handleLogoSizeChange = (value: number[]) => {
     const sizePercent = value[0];
     setLogoSize(sizePercent);
     setOptions(prev => ({
         ...prev,
         imageOptions: { ...(prev.imageOptions ?? {}), imageSize: sizePercent / 100 }
     }));
     // Re-process image if one exists
     if (originalLogoUrl) {
          applyLogoShapeAndOpacity(originalLogoUrl, logoShape, logoOpacity / 100); // Size applied via options
     }
  }

 const handleLogoShapeChange = (value: 'square' | 'circle') => {
     setLogoShape(value);
     if (originalLogoUrl) {
         applyLogoShapeAndOpacity(originalLogoUrl, value, logoOpacity / 100);
     }
 };

 const handleLogoOpacityChange = (value: number[]) => {
     const opacityPercent = value[0];
     setLogoOpacity(opacityPercent);
      if (originalLogoUrl) {
         applyLogoShapeAndOpacity(originalLogoUrl, logoShape, opacityPercent / 100);
     }
 }


  // --- Logo Handling ---
 const applyLogoShapeAndOpacity = useCallback(async (imageUrl: string, shape: 'square' | 'circle', opacity: number) => {
    try {
      // Ensure imageOptions exists
      const currentImageOptions = options.imageOptions ?? {
        crossOrigin: 'anonymous',
        margin: 5,
        imageSize: logoSize / 100, // Use current state
        hideBackgroundDots: true,
      };

      const processedImageUrl = await processImage(imageUrl, shape, 200, opacity);
      setLogoPreviewUrl(processedImageUrl);
       setOptions(prev => ({
           ...prev,
           image: processedImageUrl,
           imageOptions: { // Update image options safely
             ...currentImageOptions,
             // imageSize is updated separately via handleLogoSizeChange
           }
       }));
    } catch (error) {
        console.error("Error processing logo image:", error);
        toast({ variant: "destructive", title: "Logo Error", description: "Could not process the logo image." });
        setLogoPreviewUrl(imageUrl); // Fallback to original if processing fails
         setOptions(prev => ({ ...prev, image: imageUrl })); // Use original URL as image
    }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [logoShape, logoOpacity, options.imageOptions]); // Add options.imageOptions dependency


 const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setOriginalLogoUrl(imageUrl);
        applyLogoShapeAndOpacity(imageUrl, logoShape, logoOpacity / 100);
      };
      reader.readAsDataURL(file);
    } else {
        setOriginalLogoUrl(null);
        setLogoPreviewUrl(null);
        setOptions(prev => ({ ...prev, image: '' }));
    }
 }, [logoShape, logoOpacity, applyLogoShapeAndOpacity]);

 const triggerLogoUpload = () => {
    logoInputRef.current?.click();
  };

 const removeLogo = () => {
     setOriginalLogoUrl(null);
     setLogoPreviewUrl(null);
     setOptions(prev => ({ ...prev, image: '' }));
     if (logoInputRef.current) logoInputRef.current.value = '';
 };


 // --- Expiry Handling (UI Only) ---
  const handleSetExpiryPreset = (duration: '1h' | '24h' | '7d' | null) => {
      let expiry: Date | undefined = undefined;
      if (duration !== null) {
          const now = new Date();
          expiry = new Date(now);
          switch (duration) {
              case '1h': expiry.setHours(now.getHours() + 1); break;
              case '24h': expiry.setDate(now.getDate() + 1); break;
              case '7d': expiry.setDate(now.getDate() + 7); break;
          }
          setExpiryTime(format(expiry, "HH:mm"));
      } else {
          setExpiryTime("00:00");
      }
       setExpiryDate(expiry);
       // Clarify that this is UI only
       toast({ title: "Expiry Set (UI Only)", description: "This setting is visual. QR code expiry requires a backend redirect service to function." });
  };

 const handleManualExpiryChange = (date: Date | undefined) => {
     setExpiryDate(date);
     if (date) {
         const [hours, minutes] = expiryTime.split(':').map(Number);
         const combinedDate = new Date(date);
         combinedDate.setHours(hours, minutes, 0, 0);
         setExpiryDate(new Date(combinedDate)); // Ensure state update
     }
      // Clarify that this is UI only
      toast({ title: "Expiry Set (UI Only)", description: "This setting is visual. QR code expiry requires a backend redirect service to function." });
 };

 const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const timeValue = e.target.value;
     setExpiryTime(timeValue);
     if (expiryDate) {
         const [hours, minutes] = timeValue.split(':').map(Number);
         const updatedDate = new Date(expiryDate); // Create a new Date object to avoid mutation issues
         updatedDate.setHours(hours, minutes, 0, 0);
         setExpiryDate(updatedDate);
          // Clarify that this is UI only
          toast({ title: "Expiry Set (UI Only)", description: "This setting is visual. QR code expiry requires a backend redirect service to function." });
     }
 }

 // --- Download ---
  const onDownloadClick = useCallback(() => {
    if (!qrCodeInstance) return;

    // Add a reminder that expiry is not included in the direct QR download
    if (expiryDate) {
        toast({ title: "Downloading Direct QR", description: "The downloaded QR contains the direct data. The expiry setting is visual and requires a backend service.", duration: 5000 });
    }

    if (qrLabel) {
         // Label functionality is complex and not implemented for direct download
         toast({ title: "Label Not Included", description: "Downloading the QR code only. Labels require advanced canvas drawing not implemented here.", duration: 5000 });
    }

    qrCodeInstance.download({ name: `linkspark-qr-${qrType}`, extension: fileExtension });
  }, [qrCodeInstance, fileExtension, qrType, qrLabel, expiryDate]);


  // --- Render Dynamic Inputs ---
  const renderInputs = () => {
    switch (qrType) {
      case 'url':
        return (
          <div className="space-y-2">
            <Label htmlFor="qr-url">Website URL</Label>
            <Input id="qr-url" type="url" value={inputData.url || ''} onChange={(e) => handleInputChange('url', e.target.value)} placeholder="https://example.com" required/>
          </div>
        );
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor="qr-text">Text Content</Label>
            <Textarea id="qr-text" value={inputData.text || ''} onChange={(e) => handleInputChange('text', e.target.value)} placeholder="Enter your text here..." rows={4} required />
          </div>
        );
       case 'email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="qr-email-to">Recipient Email</Label>
                <Input id="qr-email-to" type="email" value={inputData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="recipient@example.com" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="qr-email-subject">Subject (Optional)</Label>
                <Input id="qr-email-subject" type="text" value={inputData.subject || ''} onChange={(e) => handleInputChange('subject', e.target.value)} placeholder="Email Subject" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="qr-email-body">Body (Optional)</Label>
                <Textarea id="qr-email-body" value={inputData.body || ''} onChange={(e) => handleInputChange('body', e.target.value)} placeholder="Email message..." rows={3} />
            </div>
          </div>
        );
      case 'phone':
         return (
          <div className="space-y-2">
            <Label htmlFor="qr-phone">Phone Number</Label>
            <Input id="qr-phone" type="tel" value={inputData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+1234567890" required />
          </div>
        );
       case 'whatsapp':
           return (
            <div className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="qr-whatsapp-phone">WhatsApp Number (with country code)</Label>
                 <Input id="qr-whatsapp-phone" type="tel" value={inputData.whatsapp_phone || ''} onChange={(e) => handleInputChange('whatsapp_phone', e.target.value)} placeholder="14155552671 (no + or spaces)" required />
               </div>
                <div className="space-y-2">
                 <Label htmlFor="qr-whatsapp-message">Prefilled Message (Optional)</Label>
                 <Textarea id="qr-whatsapp-message" value={inputData.whatsapp_message || ''} onChange={(e) => handleInputChange('whatsapp_message', e.target.value)} placeholder="Hello!" rows={3} />
               </div>
            </div>
           )
        case 'sms':
            return (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="qr-sms-phone">SMS Recipient Number</Label>
                        <Input id="qr-sms-phone" type="tel" value={inputData.sms_phone || ''} onChange={(e) => handleInputChange('sms_phone', e.target.value)} placeholder="+1234567890" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="qr-sms-message">SMS Message (Optional)</Label>
                        <Textarea id="qr-sms-message" value={inputData.sms_message || ''} onChange={(e) => handleInputChange('sms_message', e.target.value)} placeholder="Enter message..." rows={3} />
                    </div>
                </div>
            );
       case 'location':
            return (
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="qr-latitude">Latitude</Label>
                     <Input id="qr-latitude" type="number" step="any" value={inputData.latitude || ''} onChange={(e) => handleInputChange('latitude', e.target.value)} placeholder="e.g., 40.7128" required />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="qr-longitude">Longitude</Label>
                     <Input id="qr-longitude" type="number" step="any" value={inputData.longitude || ''} onChange={(e) => handleInputChange('longitude', e.target.value)} placeholder="e.g., -74.0060" required />
                   </div>
                </div>
            )
       case 'event':
           return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="qr-event-summary">Event Title</Label>
                    <Input id="qr-event-summary" type="text" value={inputData.event_summary || ''} onChange={(e) => handleInputChange('event_summary', e.target.value)} placeholder="Meeting, Birthday Party..." required />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <div className="space-y-2">
                         <Label>Start Date & Time</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !inputData.event_start && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {inputData.event_start ? format(inputData.event_start, "PPP HH:mm") : <span>Pick start date/time</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={inputData.event_start} onSelect={(date) => handleDateChange('event_start', date)} initialFocus />
                                <div className="p-3 border-t">
                                     <Input type="time" defaultValue={inputData.event_start ? format(inputData.event_start, "HH:mm") : "09:00"} onChange={(e) => {
                                         const timeVal = e.target.value;
                                         if (inputData.event_start) {
                                            const [hours, minutes] = timeVal.split(':').map(Number);
                                            const newDate = new Date(inputData.event_start);
                                            newDate.setHours(hours, minutes);
                                            handleDateChange('event_start', newDate);
                                         }
                                     }} />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                         <Label>End Date & Time</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !inputData.event_end && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {inputData.event_end ? format(inputData.event_end, "PPP HH:mm") : <span>Pick end date/time</span>}
                                </Button>
                            </PopoverTrigger>
                             <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={inputData.event_end} onSelect={(date) => handleDateChange('event_end', date)} initialFocus />
                                 <div className="p-3 border-t">
                                     <Input type="time" defaultValue={inputData.event_end ? format(inputData.event_end, "HH:mm") : "10:00"} onChange={(e) => {
                                         const timeVal = e.target.value;
                                         if (inputData.event_end) {
                                            const [hours, minutes] = timeVal.split(':').map(Number);
                                            const newDate = new Date(inputData.event_end);
                                            newDate.setHours(hours, minutes);
                                            handleDateChange('event_end', newDate);
                                         } else if (inputData.event_start) { // Set end based on start if end not yet picked
                                            const [hours, minutes] = timeVal.split(':').map(Number);
                                            const newDate = new Date(inputData.event_start); // Use start date as base
                                            newDate.setHours(hours, minutes);
                                             handleDateChange('event_end', newDate);
                                         }
                                     }} />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="qr-event-location">Location (Optional)</Label>
                    <Input id="qr-event-location" type="text" value={inputData.event_location || ''} onChange={(e) => handleInputChange('event_location', e.target.value)} placeholder="Conference Room A, Online..." />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="qr-event-description">Description (Optional)</Label>
                    <Textarea id="qr-event-description" value={inputData.event_description || ''} onChange={(e) => handleInputChange('event_description', e.target.value)} placeholder="Event details..." rows={3} />
                </div>
            </div>
           );
       case 'vcard':
           return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                    <Label htmlFor="vcard-firstName">First Name</Label>
                    <Input id="vcard-firstName" value={inputData.vcard_firstName || ''} onChange={(e) => handleInputChange('vcard_firstName', e.target.value)} placeholder="John" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="vcard-lastName">Last Name</Label>
                    <Input id="vcard-lastName" value={inputData.vcard_lastName || ''} onChange={(e) => handleInputChange('vcard_lastName', e.target.value)} placeholder="Doe" />
                </div>
                 <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vcard-organization">Organization (Optional)</Label>
                    <Input id="vcard-organization" value={inputData.vcard_organization || ''} onChange={(e) => handleInputChange('vcard_organization', e.target.value)} placeholder="Acme Inc." />
                </div>
                 <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vcard-title">Job Title (Optional)</Label>
                    <Input id="vcard-title" value={inputData.vcard_title || ''} onChange={(e) => handleInputChange('vcard_title', e.target.value)} placeholder="Software Engineer" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="vcard-phone">Work Phone (Optional)</Label>
                    <Input id="vcard-phone" type="tel" value={inputData.vcard_phone || ''} onChange={(e) => handleInputChange('vcard_phone', e.target.value)} placeholder="+1-555-1234" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="vcard-mobile">Mobile Phone (Optional)</Label>
                    <Input id="vcard-mobile" type="tel" value={inputData.vcard_mobile || ''} onChange={(e) => handleInputChange('vcard_mobile', e.target.value)} placeholder="+1-555-5678" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vcard-email">Email (Optional)</Label>
                    <Input id="vcard-email" type="email" value={inputData.vcard_email || ''} onChange={(e) => handleInputChange('vcard_email', e.target.value)} placeholder="john.doe@example.com" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="vcard-website">Website (Optional)</Label>
                    <Input id="vcard-website" type="url" value={inputData.vcard_website || ''} onChange={(e) => handleInputChange('vcard_website', e.target.value)} placeholder="https://johndoe.com" />
                </div>
                 <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vcard-address">Address (Optional)</Label>
                    <Textarea id="vcard-address" value={inputData.vcard_address || ''} onChange={(e) => handleInputChange('vcard_address', e.target.value)} placeholder="123 Main St, Anytown, USA" rows={2} />
                </div>
            </div>
           );
        case 'wifi':
            return (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
                        <Input id="wifi-ssid" value={inputData.wifi_ssid || ''} onChange={(e) => handleInputChange('wifi_ssid', e.target.value)} placeholder="MyHomeNetwork" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wifi-password">Password</Label>
                        <div className="flex items-center gap-2">
                           <Input id="wifi-password" type={wifiPasswordVisible ? 'text' : 'password'} value={inputData.wifi_password || ''} onChange={(e) => handleInputChange('wifi_password', e.target.value)} placeholder="Your password" />
                           {/* Removed visibility toggle for simplicity, can be re-added if needed */}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wifi-encryption">Encryption</Label>
                        <Select onValueChange={(value) => handleInputChange('wifi_encryption', value)} defaultValue={inputData.wifi_encryption || 'WPA/WPA2'}>
                            <SelectTrigger id="wifi-encryption"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {wifiEncryptionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                       {/* Assuming Checkbox is imported if needed, using native input for now */}
                       <input type="checkbox" id="wifi-hidden" checked={!!inputData.wifi_hidden} onChange={(e) => handleCheckboxChange('wifi_hidden', e.target.checked)} className="h-4 w-4 rounded border-primary text-primary focus:ring-primary" />
                        <Label htmlFor="wifi-hidden" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Hidden Network
                        </Label>
                    </div>
                </div>
            );
      default:
        return null;
    }
  };


  // --- Main Render ---
  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Options Panel */}
        <Card className="md:col-span-2 order-2 md:order-1 animate-fade-in">
          <CardHeader>
            <CardTitle>QR Code Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* QR Type Selection */}
             <div className="space-y-2">
                <Label htmlFor="qr-type">QR Code Type</Label>
                <Select onValueChange={(value: QrType) => setQrType(value)} defaultValue={qrType}>
                    <SelectTrigger id="qr-type">
                        <SelectValue placeholder="Select QR code type" />
                    </SelectTrigger>
                    <SelectContent>
                        {qrTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                    <option.icon className="h-4 w-4 text-muted-foreground" />
                                    {option.label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>

             {/* Dynamic Inputs */}
             <div className="border p-4 rounded-md bg-muted/20">
                {renderInputs()}
             </div>

             {/* Customization Tabs */}
              <Tabs defaultValue="styling" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="styling"><Palette className="inline-block mr-1 h-4 w-4" /> Styling</TabsTrigger>
                    <TabsTrigger value="logo"><ImageIcon className="inline-block mr-1 h-4 w-4" /> Logo</TabsTrigger>
                    <TabsTrigger value="expiry"><Clock className="inline-block mr-1 h-4 w-4" /> Expiry (UI)</TabsTrigger>
                  </TabsList>

                  {/* Styling Tab */}
                  <TabsContent value="styling" className="pt-4 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label htmlFor="dot-color">Dot Color</Label>
                             <Input id="dot-color" type="color" value={options.dotsOptions?.color || '#000000'} onChange={(e) => handleColorChange('dots', e.target.value)} className="h-10 p-1" />
                          </div>
                           <div className="space-y-2">
                             <Label htmlFor="bg-color">Background Color</Label>
                             <Input id="bg-color" type="color" value={options.backgroundOptions?.color || '#ffffff'} onChange={(e) => handleColorChange('background', e.target.value)} className="h-10 p-1" />
                          </div>
                           <div className="space-y-2">
                             <Label htmlFor="corner-square-color">Corner Square Color</Label>
                             <Input id="corner-square-color" type="color" value={options.cornersSquareOptions?.color || '#000000'} onChange={(e) => handleColorChange('cornersSquare', e.target.value)} className="h-10 p-1" />
                          </div>
                           <div className="space-y-2">
                             <Label htmlFor="corner-dot-color">Corner Dot Color</Label>
                             <Input id="corner-dot-color" type="color" value={options.cornersDotOptions?.color || '#000000'} onChange={(e) => handleColorChange('cornersDot', e.target.value)} className="h-10 p-1" />
                          </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="dot-style">Dot Style</Label>
                            <Select onValueChange={(value: DotType) => handleDotStyleChange(value)} defaultValue={options.dotsOptions?.type}>
                                <SelectTrigger id="dot-style"><SelectValue /></SelectTrigger>
                                <SelectContent>{dotTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="corner-square-style">Corner Square Style</Label>
                             <Select onValueChange={(value: CornerSquareType) => handleCornerStyleChange('cornersSquare', value)} defaultValue={options.cornersSquareOptions?.type ?? cornerSquareTypes[0]}>
                                <SelectTrigger id="corner-square-style"><SelectValue /></SelectTrigger>
                                <SelectContent>{cornerSquareTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-2">
                            <Label htmlFor="corner-dot-style">Corner Dot Style</Label>
                            <Select onValueChange={(value: CornerDotType) => handleCornerStyleChange('cornersDot', value)} defaultValue={options.cornersDotOptions?.type ?? cornerDotTypes[0]}>
                                <SelectTrigger id="corner-dot-style"><SelectValue /></SelectTrigger>
                                <SelectContent>{cornerDotTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                      </div>
                      <div className="space-y-3">
                          <Label htmlFor="qr-size">QR Size ({options.width}px)</Label>
                          <Slider id="qr-size" defaultValue={[options.width ?? 256]} min={100} max={1000} step={4} onValueChange={handleQrSizeChange} />
                      </div>
                       <div className="space-y-2">
                           <Label htmlFor="qr-label">Label Text (Optional, Visual Only)</Label>
                           <Input id="qr-label" type="text" value={qrLabel} onChange={(e) => setQrLabel(e.target.value)} placeholder="e.g., Scan Me!" maxLength={30} />
                       </div>
                  </TabsContent>

                  {/* Logo Tab */}
                  <TabsContent value="logo" className="pt-4 space-y-6">
                     <div className="space-y-2">
                         <Label htmlFor="logo-upload">Center Logo/Image</Label>
                         <div className="flex items-center gap-4">
                             <Button variant="outline" onClick={triggerLogoUpload} className="flex-grow justify-start text-left font-normal">
                                <ImageIcon className="mr-2 h-4 w-4" />
                                {logoPreviewUrl ? "Change Image" : "Upload Image"}
                            </Button>
                            <Input ref={logoInputRef} id="logo-upload" type="file" accept="image/png, image/jpeg, image/gif, image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                            {logoPreviewUrl && (
                                <Button variant="destructive" size="sm" onClick={removeLogo}>Remove</Button>
                            )}
                         </div>
                         {logoPreviewUrl && (
                             <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                                <img src={logoPreviewUrl} alt="Preview" className="h-10 w-10 rounded object-contain border" style={{ backgroundColor: options.backgroundOptions?.color }} />
                                <span>Logo selected</span>
                             </div>
                         )}
                     </div>

                    {logoPreviewUrl && (
                        <>
                            <div className="space-y-3">
                                <Label htmlFor="logo-size">Logo Size ({logoSize}%)</Label>
                                <Slider id="logo-size" defaultValue={[logoSize]} min={10} max={40} step={1} onValueChange={handleLogoSizeChange} />
                            </div>
                             <div className="space-y-3">
                                <Label htmlFor="logo-opacity">Logo Opacity ({logoOpacity}%)</Label>
                                <Slider id="logo-opacity" defaultValue={[logoOpacity]} min={0} max={100} step={5} onValueChange={handleLogoOpacityChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logo-shape">Logo Shape</Label>
                                <Select onValueChange={handleLogoShapeChange} defaultValue={logoShape}>
                                    <SelectTrigger id="logo-shape"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="square">Square</SelectItem>
                                        <SelectItem value="circle">Circle</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                  </TabsContent>

                    {/* Expiry Tab (UI Only) */}
                   <TabsContent value="expiry" className="pt-4 space-y-6">
                        <p className="text-sm text-muted-foreground">Set an optional expiration date/time. <strong className='text-foreground/80'>(Note: This is a UI feature only. True expiry requires a backend service).</strong></p>
                        <div className="flex flex-wrap gap-2">
                            <Button variant={!expiryDate ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset(null)}>No Expiry</Button>
                            <Button variant={expiryDate && Math.abs(new Date().getTime() + 1*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('1h')}>1 Hour</Button>
                            <Button variant={expiryDate && Math.abs(new Date().getTime() + 24*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('24h')}>24 Hours</Button>
                            <Button variant={expiryDate && Math.abs(new Date().getTime() + 7*24*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('7d')}>7 Days</Button>
                        </div>
                         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                             <div className="space-y-2">
                                 <Label>Manual Expiry Date & Time</Label>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {expiryDate ? format(expiryDate, "PPP HH:mm") : <span>Pick expiry date/time</span>}
                                        </Button>
                                    </PopoverTrigger>
                                     <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={expiryDate} onSelect={handleManualExpiryChange} initialFocus disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} />
                                        <div className="p-3 border-t">
                                            <Label htmlFor="expiry-time" className="text-xs">Time</Label>
                                            <Input id="expiry-time" type="time" value={expiryTime} onChange={handleTimeChange} />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                         </div>
                   </TabsContent>
              </Tabs>


          </CardContent>
        </Card>

        {/* QR Preview Panel */}
        <Card className="md:col-span-1 order-1 md:order-2 sticky top-20 self-start"> {/* Sticky preview */}
          <CardHeader>
            <CardTitle>QR Code Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
             {/* QR Code Preview Area */}
            <div ref={qrPreviewRef} className="border rounded-md overflow-hidden shadow-inner flex items-center justify-center bg-white" style={{ width: options.width ?? 256, height: options.height ?? 256 }}>
                {/* QR code gets appended here */}
                {!qrCodeInstance && <p className="text-muted-foreground text-sm p-4">Generating QR...</p>}
            </div>
             {qrLabel && (
                <p className="font-medium text-center mt-1">{qrLabel}</p>
            )}
             {/* File Type Selector */}
             <div className="w-full space-y-1 pt-4">
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
          </CardContent>
           <CardFooter>
              <Button onClick={onDownloadClick} className="w-full" disabled={!qrCodeInstance}>
                <Download className="mr-2 h-4 w-4" /> Download QR Code ({fileExtension.toUpperCase()})
              </Button>
           </CardFooter>
        </Card>
    </div>
  );
}
