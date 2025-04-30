
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeStyling, { type Options as QRCodeStylingOptions, type FileExtension, type DotType, type CornerSquareType, type CornerDotType, Extension } from 'qr-code-styling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from "@/components/ui/slider";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Image as ImageIcon, Link as LinkIcon, Phone, Mail, MessageSquare, MapPin, Calendar as CalendarIcon, User, Settings2, Palette, Clock, Wifi, Upload, Check, Trash2, Info, Eye, EyeOff, QrCode as QrCodeIcon } from 'lucide-react'; // Added QrCodeIcon, removed Shapes
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components


// Define allowed QR types
type QrType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'sms' | 'location' | 'event' | 'vcard' | 'wifi';

// QR type options
const qrTypeOptions: { value: QrType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'url', label: 'Website URL', icon: LinkIcon, description: 'Link to any website or online resource.' },
  { value: 'text', label: 'Plain Text', icon: MessageSquare, description: 'Display any text content when scanned.' },
  { value: 'email', label: 'Email Address', icon: Mail, description: 'Pre-fill recipient, subject, and body for an email.' },
  { value: 'phone', label: 'Phone Number', icon: Phone, description: 'Initiate a phone call to the specified number.' },
  { value: 'whatsapp', label: 'WhatsApp Message', icon: MessageSquare, description: 'Open WhatsApp with a pre-filled message to a number.' },
  { value: 'sms', label: 'SMS Message', icon: MessageSquare, description: 'Open the SMS app with a pre-filled number and message.' },
  { value: 'location', label: 'Google Maps Location', icon: MapPin, description: 'Open Google Maps at the specified coordinates.' },
  { value: 'event', label: 'Calendar Event', icon: CalendarIcon, description: 'Add an event to the user\'s calendar (ICS format).' },
  { value: 'vcard', label: 'Contact Card (vCard)', icon: User, description: 'Share contact details easily.' },
  { value: 'wifi', label: 'Wi-Fi Network', icon: Wifi, description: 'Connect to a Wi-Fi network automatically.' },
];

const dotTypes: DotType[] = ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'];
const cornerSquareTypes: CornerSquareType[] = ['square', 'extra-rounded', 'dot'];
const cornerDotTypes: CornerDotType[] = ['square', 'dot'];
const wifiEncryptionTypes = ['WPA/WPA2', 'WEP', 'None'];


const defaultOptions: QRCodeStylingOptions = {
  width: 256,
  height: 256,
  type: 'svg', // Default to SVG for better scalability
  data: '', // Start with empty data
  image: '',
  dotsOptions: {
    color: '#008080', // Teal accent color from theme
    type: 'rounded',
  },
  backgroundOptions: {
    color: '#FFFFFF', // Default to white background for better contrast
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 5,
    imageSize: 0.4,
    hideBackgroundDots: true,
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
    color: '#008080',
  },
  cornersDotOptions: {
    type: 'dot',
    color: '#008080',
  },
  qrOptions: {
    errorCorrectionLevel: 'H',
  },
};

// --- Helper Functions ---

// Format vCard data
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
  // vCard requires at least first or last name to be somewhat valid for many readers
  if (!data.firstName && !data.lastName) return '';
  return vCardString;
};

// Format ICS data
const formatICS = (data: Record<string, any>): string => {
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      // Format date as YYYYMMDDTHHmmssZ (UTC time)
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Event requires a summary and start date
    if (!data.summary || !data.startDate) return '';

    let icsString = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LinkSpark//QR Event Generator//EN\nBEGIN:VEVENT\n';
    icsString += `SUMMARY:${data.summary}\n`;
    if (data.location) icsString += `LOCATION:${data.location}\n`;
    if (data.description) icsString += `DESCRIPTION:${data.description.replace(/\n/g, '\\n')}\n`; // Escape newlines
    icsString += `DTSTART:${formatDate(data.startDate)}\n`;
    if (data.endDate) {
      icsString += `DTEND:${formatDate(data.endDate)}\n`;
    } else { // Default to 1 hour duration if no end date
        const endDate = new Date(data.startDate.getTime() + 60 * 60 * 1000);
        icsString += `DTEND:${formatDate(endDate)}\n`;
    }
    icsString += 'UID:' + Date.now() + '@linkspark.com\n'; // Add a unique ID for better compatibility
    icsString += 'END:VEVENT\nEND:VCALENDAR';
    return icsString;
}

// Format Wi-Fi data
const formatWifi = (data: Record<string, any>): string => {
    const escapeValue = (value: string = '') => {
        // Escape special characters: \, ;, ,, ", :
        return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');
    };
    const ssid = escapeValue(data.wifi_ssid);
    const password = escapeValue(data.wifi_password);
    const encryption = data.wifi_encryption === 'None' ? 'nopass' : (data.wifi_encryption || 'WPA'); // Default to WPA if undefined
    const hidden = data.wifi_hidden ? 'true' : 'false';

    // Ensure required fields have values
    if (!ssid) return ''; // SSID is mandatory

    // Password is required if encryption is not 'None'
    if (encryption !== 'nopass' && !password) return '';

    return `WIFI:T:${encryption};S:${ssid};${encryption !== 'nopass' ? `P:${password};` : ''}H:${hidden};;`;
};


// Process image for shape/opacity (using Canvas)
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
                ctx.save(); // Save context state
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

            if (shape === 'circle') {
                ctx.restore(); // Restore context state (removes clipping path)
            }

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (error) => reject(`Image loading error: ${error}`);
        img.src = imageUrl;
    });
};


// Generate the final data string for the QR code
const generateQrDataString = (type: QrType, data: Record<string, any>): string => {
    let targetData = '';

    try {
         switch (type) {
          case 'url': targetData = data.url?.trim() || ''; break; // Trim whitespace
          case 'text': targetData = data.text?.trim() || ''; break; // Trim whitespace
          case 'email':
            const emailTo = data.email?.trim();
            if (emailTo) {
                 targetData = `mailto:${emailTo}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
            }
            break;
          case 'phone': targetData = data.phone?.trim() ? `tel:${data.phone.trim()}` : ''; break;
          case 'whatsapp':
            const phoneNum = (data.whatsapp_phone || '').replace(/[^0-9]/g, ''); // Keep only digits
            targetData = phoneNum ? `https://wa.me/${phoneNum}?text=${encodeURIComponent(data.whatsapp_message || '')}` : '';
            break;
          case 'sms':
            const smsPhoneNum = (data.sms_phone || '').trim(); // Allow + and digits
            targetData = smsPhoneNum ? `sms:${smsPhoneNum}?body=${encodeURIComponent(data.sms_message || '')}` : '';
            break;
          case 'location':
             if (data.latitude && data.longitude) {
                targetData = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
                // Could also use geo:lat,lng
             }
             break;
          case 'event':
              targetData = formatICS({
                  summary: data.event_summary, location: data.event_location, description: data.event_description,
                  startDate: data.event_start, endDate: data.event_end
              });
              break;
          case 'vcard':
               targetData = formatVCard({
                  firstName: data.vcard_firstName, lastName: data.vcard_lastName, organization: data.vcard_organization,
                  title: data.vcard_title, phone: data.vcard_phone, mobile: data.vcard_mobile,
                  email: data.vcard_email, website: data.vcard_website, address: data.vcard_address
              });
               break;
          case 'wifi':
               targetData = formatWifi({
                  wifi_ssid: data.wifi_ssid, wifi_password: data.wifi_password,
                  wifi_encryption: data.wifi_encryption || 'WPA/WPA2', wifi_hidden: data.wifi_hidden || false,
              });
               break;
          default: targetData = '';
        }
    } catch (error) {
        console.error(`Error generating QR data string for type ${type}:`, error);
        toast({ variant: "destructive", title: "Data Error", description: `Could not format data for ${type}. Please check your inputs.` });
        return ''; // Return empty string on error
    }

    return targetData;
};


export function QrCodeGenerator() {
  const [qrType, setQrType] = useState<QrType>('url');
  const [inputData, setInputData] = useState<Record<string, any>>({});
  const [options, setOptions] = useState<QRCodeStylingOptions>(defaultOptions);
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);
  const [qrCodeSvgDataUrl, setQrCodeSvgDataUrl] = useState<string | null>(null); // State for SVG data URL
  const [fileExtension, setFileExtension] = useState<FileExtension>('png');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<number>(defaultOptions.imageOptions?.imageSize ? defaultOptions.imageOptions.imageSize * 100 : 40); // Percentage
  const [logoShape, setLogoShape] = useState<'square' | 'circle'>('square');
  const [logoOpacity, setLogoOpacity] = useState<number>(100); // Percentage (0-100)
  const [qrLabel, setQrLabel] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [expiryTime, setExpiryTime] = useState<string>("00:00"); // HH:mm format
  const [wifiPasswordVisible, setWifiPasswordVisible] = useState<boolean>(false); // Start with password hidden for Wi-Fi
  const [isQrGenerated, setIsQrGenerated] = useState<boolean>(false); // Track if a QR code is currently displayed
  const [qrPreviewKey, setQrPreviewKey] = useState<number>(0); // Key to force re-render preview


  const logoInputRef = useRef<HTMLInputElement>(null);

  // Generate QR Data String based on type and inputData
  const generateQrData = useCallback((): string => {
      return generateQrDataString(qrType, inputData);
  }, [qrType, inputData]);


  // Initialize and update QR Code instance, generate SVG data URL
  useEffect(() => {
    const qrData = generateQrData();
    setIsQrGenerated(!!qrData); // Update generated status based on data presence

    if (!qrData) {
      setQrCodeSvgDataUrl(null); // Clear SVG if no data
      setQrCodeInstance(null);
      setQrPreviewKey(prev => prev + 1); // Force re-render placeholder
      return;
    }

    const qrOptions = { ...options, data: qrData };

    try {
      const instance = new QRCodeStyling(qrOptions);
      setQrCodeInstance(instance); // Keep instance for download

      // Generate SVG data URL for preview
      instance.getRawData('svg').then((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            setQrCodeSvgDataUrl(reader.result as string);
            setQrPreviewKey(prev => prev + 1); // Update key to re-render preview
          };
          reader.readAsDataURL(blob);
        } else {
             setQrCodeSvgDataUrl(null);
             toast({ variant: "destructive", title: "QR Preview Error", description: "Could not generate SVG preview." });
        }
      }).catch(error => {
          console.error("Error getting SVG data:", error);
          setQrCodeSvgDataUrl(null);
          toast({ variant: "destructive", title: "QR Preview Error", description: "Could not generate SVG preview." });
      });

    } catch (error) {
      console.error("Error creating QR code instance:", error);
      setQrCodeSvgDataUrl(null); // Clear SVG on error
      setQrCodeInstance(null);
      setIsQrGenerated(false);
      toast({ variant: "destructive", title: "QR Generation Error", description: "Could not create the QR code. Please try again." });
       setQrPreviewKey(prev => prev + 1); // Force re-render error state/placeholder
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, qrType, inputData]); // Re-run when options, type, or data changes


  // --- Input Handlers ---
  const handleInputChange = (key: string, value: any) => {
    // Basic validation within handler if needed (e.g., number fields)
    if ((key === 'latitude' || key === 'longitude') && value && isNaN(Number(value))) {
        return; // Prevent non-numeric input for coordinates
    }
    setInputData(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setInputData(prev => ({ ...prev, [key]: checked }));
  };

  const handleDateChange = (key: string, date: Date | undefined) => {
    let newData = { ...inputData, [key]: date };

     // Auto-set end date if start date is set and end date is empty or earlier
     if (key === 'event_start' && date) {
         const currentEndDate = inputData.event_end;
         if (!currentEndDate || currentEndDate < date) {
             const defaultEndDate = new Date(date.getTime() + 60 * 60 * 1000); // Default 1 hour later
             newData = { ...newData, event_end: defaultEndDate };
         }
     }
     // Ensure end date is not before start date
      if (key === 'event_end' && date && inputData.event_start && date < inputData.event_start) {
          toast({ variant: "destructive", title: "Invalid Date", description: "End date cannot be before start date." });
          // Keep previous valid end date or reset
          // For simplicity, we prevent setting the invalid date but don't automatically correct it here
          return; // Stop update if invalid
      }

    setInputData(newData);
  };

  const handleTimeInputChange = (key: 'event_start' | 'event_end', timeValue: string) => {
     const currentDate = inputData[key];
     if (currentDate instanceof Date) {
         const [hours, minutes] = timeValue.split(':').map(Number);
         const newDate = new Date(currentDate);
         newDate.setHours(hours, minutes, 0, 0);

         // Ensure end time is not before start time on the same day
         if (key === 'event_end' && inputData.event_start && newDate < inputData.event_start) {
             toast({ variant: "destructive", title: "Invalid Time", description: "End time cannot be before start time." });
             return; // Stop update
         }
           if (key === 'event_start' && inputData.event_end && newDate > inputData.event_end) {
             // If changing start time makes it after end time, adjust end time (e.g., +1 hour)
              const newEndDate = new Date(newDate.getTime() + 60 * 60 * 1000);
              handleDateChange('event_end', newEndDate); // Use existing handler to update end date
          }

         handleDateChange(key, newDate);
     } else {
         // If date is not set yet, just store the time? This might be complex.
         // Better to require date first or handle this case specifically.
         toast({ title: "Set Date First", description: "Please select a date before setting the time." });
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
       // Add constraints if needed (e.g., min/max practical size)
       if (size >= 50 && size <= 2000) {
            setOptions(prev => ({ ...prev, width: size, height: size }));
       }
  }

  const handleLogoSizeChange = (value: number[]) => {
     const sizePercent = value[0];
     setLogoSize(sizePercent);
     const imageSizeValue = Math.max(0.1, Math.min(0.5, sizePercent / 100)); // Ensure range 0.1 to 0.5 for library
     setOptions(prev => ({
         ...prev,
         imageOptions: { ...(prev.imageOptions ?? defaultOptions.imageOptions), imageSize: imageSizeValue }
     }));
     // Re-process image if one exists
     if (originalLogoUrl) {
          applyLogoShapeAndOpacity(originalLogoUrl, logoShape, logoOpacity / 100);
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
      // Get current image options or use defaults, ensuring imageSize is updated from state
      const currentImageOptions = {
        ...(options.imageOptions ?? defaultOptions.imageOptions),
        imageSize: Math.max(0.1, Math.min(0.5, logoSize / 100)), // Use state value, clamped
      };

      // Process image with current shape and opacity
      const processedImageUrl = await processImage(imageUrl, shape, 200, opacity); // 200px canvas size for processing
      setLogoPreviewUrl(processedImageUrl); // Update visual preview in options panel
       setOptions(prev => ({
           ...prev,
           image: processedImageUrl, // Set processed image for QR instance
           imageOptions: currentImageOptions // Ensure options are up-to-date
       }));
    } catch (error) {
        console.error("Error processing logo image:", error);
        toast({ variant: "destructive", title: "Logo Error", description: "Could not process the logo image. Using original." });
        setLogoPreviewUrl(imageUrl); // Fallback to original for preview
         setOptions(prev => ({
             ...prev,
             image: imageUrl, // Use original URL for QR instance on error
              imageOptions: {
                ...(options.imageOptions ?? defaultOptions.imageOptions),
                imageSize: Math.max(0.1, Math.min(0.5, logoSize / 100)), // Keep size option
             }
         }));
    }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [logoSize, setOptions]); // Dependencies updated


 const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic file type validation
      if (!['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'].includes(file.type)) {
           toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload a PNG, JPEG, GIF, WEBP or SVG image." });
           return;
      }
       // Basic file size validation (e.g., 2MB limit)
       if (file.size > 2 * 1024 * 1024) {
            toast({ variant: "destructive", title: "File Too Large", description: "Logo image should be less than 2MB." });
            return;
       }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setOriginalLogoUrl(imageUrl);
        // Apply current shape/opacity settings to the new logo
        applyLogoShapeAndOpacity(imageUrl, logoShape, logoOpacity / 100);
      };
      reader.onerror = () => {
          toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected file." });
      };
      reader.readAsDataURL(file);
    }
 }, [logoShape, logoOpacity, applyLogoShapeAndOpacity]);

 const triggerLogoUpload = () => {
    logoInputRef.current?.click();
  };

 const removeLogo = () => {
     setOriginalLogoUrl(null);
     setLogoPreviewUrl(null);
     // Reset options related to image
     setOptions(prev => ({
         ...prev,
         image: '',
         imageOptions: { ...(prev.imageOptions ?? defaultOptions.imageOptions), margin: 5, imageSize: 0.4 }, // Reset some image options
     }));
     setLogoSize(40); // Reset slider state
     setLogoShape('square');
     setLogoOpacity(100);
     if (logoInputRef.current) logoInputRef.current.value = ''; // Clear file input
 };


 // --- Expiry Handling ---
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
           toast({ title: "Expiry Reminder Set", description: `QR code visually marked to expire on ${format(expiry, "PPP 'at' HH:mm")}. (Backend needed for real expiry)` });
      } else {
          setExpiryTime("00:00");
           toast({ title: "Expiry Removed", description: "QR code expiry marker removed." });
      }
       setExpiryDate(expiry);
 };

 const handleManualExpiryChange = (date: Date | undefined) => {
     let combinedDate: Date | undefined = undefined;
     if (date) {
         const [hours, minutes] = expiryTime.split(':').map(Number);
         combinedDate = new Date(date);
         combinedDate.setHours(hours, minutes, 0, 0);

         if (combinedDate < new Date()) {
             toast({ variant: "destructive", title: "Invalid Date", description: "Expiry date cannot be in the past." });
             // Option 1: Reset everything
             // setExpiryDate(undefined);
             // setExpiryTime("00:00");
             // Option 2: Keep the date but reset time to now + 1 min (or similar)
             const nowPlus1Min = new Date(Date.now() + 60000);
             if (date.toDateString() === new Date().toDateString()) { // If today's date was picked
                 combinedDate = nowPlus1Min;
                 setExpiryTime(format(combinedDate, "HH:mm"));
                 toast({ title: "Time Adjusted", description: "Expiry time set to the near future as selected time was in the past." });
             } else {
                 // If a future date was picked with past time, just reset time part?
                  setExpiryTime("00:00"); // Reset time input
                  toast({ title: "Time Reset", description: "Expiry time was in the past for the selected date, please set a future time." });
                  combinedDate = undefined; // Don't set invalid date state
             }
              setExpiryDate(combinedDate); // Update state only if valid or adjusted

         } else {
             setExpiryDate(combinedDate);
             toast({ title: "Expiry Reminder Set", description: `QR code visually marked to expire on ${format(combinedDate, "PPP 'at' HH:mm")}. (Backend needed for real expiry)` });
         }
     } else {
         // Clear expiry
         setExpiryDate(undefined);
         setExpiryTime("00:00");
         toast({ title: "Expiry Removed", description: "QR code expiry marker removed." });
     }
 };

 const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const timeValue = e.target.value;
     setExpiryTime(timeValue); // Update time state immediately

     if (expiryDate) {
         const [hours, minutes] = timeValue.split(':').map(Number);
         const updatedDate = new Date(expiryDate); // Use existing date
         updatedDate.setHours(hours, minutes, 0, 0);

         // Prevent setting expiry in the past
         if (updatedDate < new Date()) {
             toast({ variant: "destructive", title: "Invalid Time", description: "Expiry time cannot be in the past for the selected date." });
             // Revert time state to previous valid time from expiryDate
             setExpiryTime(format(expiryDate, "HH:mm"));
         } else {
             setExpiryDate(updatedDate); // Update the full expiry date state
             // Optional: Quieter toast on time-only update if date already set
             // toast({ title: "Expiry Time Updated", description: `Expiry set for ${format(updatedDate, "PPP 'at' HH:mm")}.`, duration: 3000 });
         }
     }
     // If no date is set, the time will be applied when a date is picked via handleManualExpiryChange
 };


 // --- Download ---
  const onDownloadClick = useCallback(async () => {
      const qrData = generateQrData();
       if (!qrCodeInstance || !qrData || !isQrGenerated) {
          toast({ variant: "destructive", title: "Cannot Download", description: "Please generate a valid QR code first." });
          return;
      }

      // Reminder about expiry feature limitation
      if (expiryDate) {
          toast({ title: "Download Info", description: "Note: Expiry is a visual marker. Real expiry needs a backend service.", duration: 5000 });
      }

       // Note: Labels are not part of the QR code data itself and won't be in the downloaded file.
      if (qrLabel) {
          // This feature is visual only, label is not embedded in QR
          // toast({ title: "Label Info", description: "The label text is for display only and not part of the downloaded QR code.", duration: 5000 });
      }

      // Update instance options before download (especially if options changed but instance wasn't recreated yet)
      qrCodeInstance.update({ ...options, data: qrData });

      try {
            await qrCodeInstance.download({ name: `linkspark-qr-${qrType}`, extension: fileExtension as Extension });
            toast({ title: "Download Started", description: `QR code downloading as ${fileExtension.toUpperCase()}.` });
      } catch (error) {
          console.error("Error downloading QR code:", error);
          toast({ variant: "destructive", title: "Download Failed", description: "Could not download the QR code. Please try again." });
      }
  }, [qrCodeInstance, options, fileExtension, qrType, qrLabel, expiryDate, generateQrData, isQrGenerated]); // Added options to dependencies


  // --- Render Dynamic Inputs ---
  const renderInputs = () => {
     // Find the description for the current QR type
    const currentTypeDescription = qrTypeOptions.find(opt => opt.value === qrType)?.description || '';

    const commonWrapperClass = "space-y-4 border p-4 rounded-md bg-muted/30 shadow-inner";

    return (
        <div className="space-y-4">
             {currentTypeDescription && (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                   <Info className="h-4 w-4 mt-0.5 shrink-0"/>
                   <span>{currentTypeDescription}</span>
                </p>
             )}
            <div className={commonWrapperClass}>
                {(() => {
                    switch (qrType) {
                        case 'url':
                            return (
                                <div className="space-y-2">
                                <Label htmlFor="qr-url">Website URL</Label>
                                <Input id="qr-url" type="url" value={inputData.url ?? ''} onChange={(e) => handleInputChange('url', e.target.value)} placeholder="https://example.com" required/>
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
                                    <p className="text-xs text-muted-foreground">Enter number without '+', spaces, or dashes.</p>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-latitude">Latitude *</Label>
                                        <Input id="qr-latitude" type="number" step="any" value={inputData.latitude || ''} onChange={(e) => handleInputChange('latitude', e.target.value)} placeholder="e.g., 40.7128" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-longitude">Longitude *</Label>
                                        <Input id="qr-longitude" type="number" step="any" value={inputData.longitude || ''} onChange={(e) => handleInputChange('longitude', e.target.value)} placeholder="e.g., -74.0060" required />
                                    </div>
                                    </div>
                                )
                        case 'event':
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-event-summary">Event Title *</Label>
                                        <Input id="qr-event-summary" type="text" value={inputData.event_summary || ''} onChange={(e) => handleInputChange('event_summary', e.target.value)} placeholder="Meeting, Birthday Party..." required />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Start Date & Time *</Label>
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
                                                         <Label htmlFor="event-start-time" className="text-xs">Time</Label>
                                                         <Input id="event-start-time" type="time" defaultValue={inputData.event_start ? format(inputData.event_start, "HH:mm") : "09:00"} onChange={(e) => handleTimeInputChange('event_start', e.target.value)} />
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date & Time (Optional)</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !inputData.event_end && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {inputData.event_end ? format(inputData.event_end, "PPP HH:mm") : <span>Pick end date/time</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar mode="single" selected={inputData.event_end} onSelect={(date) => handleDateChange('event_end', date)} initialFocus disabled={(date) => inputData.event_start && date < new Date(inputData.event_start.setHours(0,0,0,0))} />
                                                    <div className="p-3 border-t">
                                                         <Label htmlFor="event-end-time" className="text-xs">Time</Label>
                                                         <Input id="event-end-time" type="time" defaultValue={inputData.event_end ? format(inputData.event_end, "HH:mm") : "10:00"} onChange={(e) => handleTimeInputChange('event_end', e.target.value)} />
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
                                    <p className="text-xs text-muted-foreground">* Event Title and Start Date are required.</p>
                                </div>
                            );
                        case 'vcard':
                            return (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="vcard-firstName">First Name *</Label>
                                        <Input id="vcard-firstName" value={inputData.vcard_firstName || ''} onChange={(e) => handleInputChange('vcard_firstName', e.target.value)} placeholder="John" required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vcard-lastName">Last Name *</Label>
                                        <Input id="vcard-lastName" value={inputData.vcard_lastName || ''} onChange={(e) => handleInputChange('vcard_lastName', e.target.value)} placeholder="Doe" required/>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="vcard-organization">Organization</Label>
                                        <Input id="vcard-organization" value={inputData.vcard_organization || ''} onChange={(e) => handleInputChange('vcard_organization', e.target.value)} placeholder="Acme Inc." />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="vcard-title">Job Title</Label>
                                        <Input id="vcard-title" value={inputData.vcard_title || ''} onChange={(e) => handleInputChange('vcard_title', e.target.value)} placeholder="Software Engineer" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vcard-phone">Work Phone</Label>
                                        <Input id="vcard-phone" type="tel" value={inputData.vcard_phone || ''} onChange={(e) => handleInputChange('vcard_phone', e.target.value)} placeholder="+1-555-1234" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vcard-mobile">Mobile Phone</Label>
                                        <Input id="vcard-mobile" type="tel" value={inputData.vcard_mobile || ''} onChange={(e) => handleInputChange('vcard_mobile', e.target.value)} placeholder="+1-555-5678" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vcard-email">Email</Label>
                                        <Input id="vcard-email" type="email" value={inputData.vcard_email || ''} onChange={(e) => handleInputChange('vcard_email', e.target.value)} placeholder="john.doe@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vcard-website">Website</Label>
                                        <Input id="vcard-website" type="url" value={inputData.vcard_website || ''} onChange={(e) => handleInputChange('vcard_website', e.target.value)} placeholder="https://johndoe.com" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="vcard-address">Address</Label>
                                        <Textarea id="vcard-address" value={inputData.vcard_address || ''} onChange={(e) => handleInputChange('vcard_address', e.target.value)} placeholder="123 Main St, Anytown, USA" rows={2} />
                                    </div>
                                    <p className="text-xs text-muted-foreground md:col-span-2">* First Name or Last Name is required.</p>
                                </div>
                            );
                        case 'wifi':
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="wifi-ssid">Network Name (SSID) *</Label>
                                        <Input id="wifi-ssid" value={inputData.wifi_ssid || ''} onChange={(e) => handleInputChange('wifi_ssid', e.target.value)} placeholder="MyHomeNetwork" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="wifi-password">Password *</Label>
                                        <div className="flex items-center gap-2">
                                        <Input id="wifi-password" type={wifiPasswordVisible ? 'text' : 'password'} value={inputData.wifi_password || ''} onChange={(e) => handleInputChange('wifi_password', e.target.value)} placeholder="Your password" disabled={inputData.wifi_encryption === 'None'} required={inputData.wifi_encryption !== 'None'}/>
                                        <Button variant="ghost" size="icon" onClick={() => setWifiPasswordVisible(!wifiPasswordVisible)} type="button" aria-label={wifiPasswordVisible ? "Hide password" : "Show password"} disabled={inputData.wifi_encryption === 'None'}>
                                            {wifiPasswordVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                        </Button>
                                        </div>
                                         {inputData.wifi_encryption === 'None' && <p className="text-xs text-muted-foreground">Password not needed for 'None' encryption.</p>}
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
                                    <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="wifi-hidden" checked={!!inputData.wifi_hidden} onCheckedChange={(checked) => handleCheckboxChange('wifi_hidden', Boolean(checked))} />
                                        <Label htmlFor="wifi-hidden" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Hidden Network
                                        </Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Check this if the network SSID is not broadcasted.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                     <p className="text-xs text-muted-foreground">* Network Name (SSID) is required. * Password required unless encryption is 'None'.</p>
                                </div>
                            );

                        default:
                            return <p className="text-center text-muted-foreground">Select a QR code type to begin.</p>;
                    }
                })()}
            </div>
        </div>
    );
  };



  // --- Main Render ---
  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 py-6">
        {/* Options Panel */}
        <Card className="lg:col-span-2 order-2 lg:order-1 animate-fade-in">
          <CardHeader>
            <CardTitle>Customize Your QR Code</CardTitle>
             <p className="text-sm text-muted-foreground">Generate and personalize QR codes for various purposes.</p>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* QR Type Selection */}
             <div className="space-y-2">
                <Label htmlFor="qr-type">1. Select QR Code Type</Label>
                <Select onValueChange={(value: QrType) => { setQrType(value); setInputData({}); setExpiryDate(undefined); setQrLabel(''); }} defaultValue={qrType}> {/* Reset input data, expiry, label on type change */}
                    <SelectTrigger id="qr-type" className="w-full">
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
              <div className="space-y-2">
                <Label>2. Enter Content</Label>
                 {renderInputs()}
              </div>


             {/* Customization Tabs */}
             <div className="space-y-2">
                <Label>3. Customize Appearance (Optional)</Label>
                <Tabs defaultValue="styling" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
                        <TabsTrigger value="styling"><Palette className="inline-block mr-1 h-4 w-4" /> Styling</TabsTrigger>
                        <TabsTrigger value="logo"><ImageIcon className="inline-block mr-1 h-4 w-4" /> Logo</TabsTrigger>
                        {/* Expiry Tab remains optional/visual only */}
                        <TabsTrigger value="extras"><Settings2 className="inline-block mr-1 h-4 w-4" /> Extras</TabsTrigger>
                         {/*<TabsTrigger value="expiry"><Clock className="inline-block mr-1 h-4 w-4" /> Expiry</TabsTrigger>*/}
                    </TabsList>

                    {/* Styling Tab */}
                    <TabsContent value="styling" className="pt-6 space-y-6 border p-4 rounded-b-md bg-muted/10">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dot-color">Dots</Label>
                                <Input id="dot-color" type="color" value={options.dotsOptions?.color || '#000000'} onChange={(e) => handleColorChange('dots', e.target.value)} className="h-10 p-1 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bg-color">Background</Label>
                                <Input id="bg-color" type="color" value={options.backgroundOptions?.color || '#ffffff'} onChange={(e) => handleColorChange('background', e.target.value)} className="h-10 p-1 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="corner-square-color">Corners</Label>
                                <Input id="corner-square-color" type="color" value={options.cornersSquareOptions?.color || '#000000'} onChange={(e) => handleColorChange('cornersSquare', e.target.value)} className="h-10 p-1 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="corner-dot-color">Corner Dots</Label>
                                <Input id="corner-dot-color" type="color" value={options.cornersDotOptions?.color || '#000000'} onChange={(e) => handleColorChange('cornersDot', e.target.value)} className="h-10 p-1 w-full" />
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
                                <Label htmlFor="corner-square-style">Corner Style</Label>
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

                    </TabsContent>

                    {/* Logo Tab */}
                    <TabsContent value="logo" className="pt-6 space-y-6 border p-4 rounded-b-md bg-muted/10">
                        <div className="space-y-2">
                            <Label htmlFor="logo-upload">Center Logo/Image</Label>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <Button variant="outline" onClick={triggerLogoUpload} className="w-full sm:w-auto flex-grow justify-start text-left font-normal">
                                    <Upload className="mr-2 h-4 w-4" />
                                    {logoPreviewUrl ? "Change Image" : "Upload Image (PNG, JPG, SVG...)"}
                                </Button>
                                <Input ref={logoInputRef} id="logo-upload" type="file" accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp" onChange={handleLogoUpload} className="hidden" />
                                {logoPreviewUrl && (
                                    <div className='flex items-center gap-2'>
                                        <img src={logoPreviewUrl} alt="Logo Preview" className="h-10 w-10 rounded object-contain border bg-white" />
                                        <Button variant="destructive" size="sm" onClick={removeLogo} aria-label="Remove logo">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                             <p className="text-xs text-muted-foreground">Max file size: 2MB. Recommended: Square image.</p>
                        </div>

                        {logoPreviewUrl && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="logo-size">Logo Size ({logoSize}%)</Label>
                                        <div className="flex items-center gap-2">
                                            <Slider id="logo-size" value={[logoSize]} min={10} max={50} step={1} onValueChange={handleLogoSizeChange} />
                                            <span className='text-sm w-10 text-right'>{logoSize}%</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Relative to QR code size. Default: 40%.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="logo-opacity">Logo Opacity ({logoOpacity}%)</Label>
                                         <div className="flex items-center gap-2">
                                            <Slider id="logo-opacity" value={[logoOpacity]} min={10} max={100} step={5} onValueChange={handleLogoOpacityChange} />
                                             <span className='text-sm w-10 text-right'>{logoOpacity}%</span>
                                         </div>
                                        <p className="text-xs text-muted-foreground">Lower opacity might improve scanability.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="logo-shape">Logo Shape</Label>
                                    <Select onValueChange={handleLogoShapeChange} defaultValue={logoShape}>
                                        <SelectTrigger id="logo-shape" className="w-full sm:w-1/2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="square">Square</SelectItem>
                                            <SelectItem value="circle">Circle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Applies a circular mask if selected.</p>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="hide-dots" checked={options.imageOptions?.hideBackgroundDots} onCheckedChange={(checked) => setOptions(prev => ({ ...prev, imageOptions: {...(prev.imageOptions ?? defaultOptions.imageOptions), hideBackgroundDots: Boolean(checked)} }))}/>
                                    <Label htmlFor="hide-dots" className="text-sm font-medium leading-none">
                                        Hide Dots Behind Logo
                                    </Label>
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Removes QR dots located behind the logo area.</p>
                                                <p>Can improve logo visibility but may slightly affect scanability.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                     </TooltipProvider>
                                </div>
                            </>
                        )}
                    </TabsContent>

                     {/* Extras Tab */}
                     <TabsContent value="extras" className="pt-6 space-y-6 border p-4 rounded-b-md bg-muted/10">
                         <div className="space-y-3">
                             <Label htmlFor="qr-size">QR Code Size ({options.width}px)</Label>
                             <div className="flex items-center gap-2">
                                <Slider id="qr-size" value={[options.width ?? 256]} min={100} max={1000} step={4} onValueChange={handleQrSizeChange} />
                                <span className='text-sm w-14 text-right'>{options.width} px</span>
                             </div>
                             <p className="text-xs text-muted-foreground">Adjusts the preview size. Download size depends on format.</p>
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="qr-label">Label Text (Visual Only)</Label>
                             <Input id="qr-label" type="text" value={qrLabel} onChange={(e) => setQrLabel(e.target.value)} placeholder="e.g., Scan Me!" maxLength={30} />
                             <p className="text-xs text-muted-foreground">This label appears below the preview but is not part of the downloaded QR code.</p>
                         </div>
                          {/* Expiry section moved here */}
                         <div className='pt-4 border-t'>
                            <Label>Expiry Reminder (Visual Only)</Label>
                            <p className="text-xs text-muted-foreground pb-2">Mark the QR code with an intended expiry. <strong className='text-foreground/80'>Actual expiration requires a backend service.</strong></p>
                            <div className="flex flex-wrap gap-2">
                                <Button variant={!expiryDate ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset(null)}>No Expiry</Button>
                                <Button variant={expiryDate && Math.abs(new Date().getTime() + 1*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('1h')}>1 Hour</Button>
                                <Button variant={expiryDate && Math.abs(new Date().getTime() + 24*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('24h')}>24 Hours</Button>
                                <Button variant={expiryDate && Math.abs(new Date().getTime() + 7*24*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('7d')}>7 Days</Button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4">
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
                        </div>
                     </TabsContent>

                </Tabs>
             </div>


          </CardContent>
        </Card>

        {/* QR Preview Panel */}
        <Card key={qrPreviewKey} className="lg:col-span-1 order-1 lg:order-2 sticky top-6 self-start animate-fade-in [animation-delay:0.2s]"> {/* Sticky preview, added key */}
          <CardHeader>
            <CardTitle>4. Preview & Download</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
             {/* QR Code Preview Area */}
            <div className="border rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-white p-2 relative" style={{ width: (options.width ?? 256) + 16, height: (options.height ?? 256) + 16 }}>
                 {qrCodeSvgDataUrl ? (
                    <img src={qrCodeSvgDataUrl} alt="Generated QR Code" style={{ width: options.width ?? 256, height: options.height ?? 256 }}/>
                 ) : (
                    <div className="text-muted-foreground text-center p-4 flex flex-col items-center justify-center h-full absolute inset-0 bg-white/80 backdrop-blur-sm">
                         <QrCodeIcon className="h-12 w-12 mb-2 text-muted-foreground/50"/>
                         <span>Enter data to generate QR code.</span>
                     </div>
                  )}
            </div>
             {qrLabel && (
                <p className="font-medium text-center mt-1">{qrLabel}</p>
            )}
             {expiryDate && (
                <p className="text-xs text-center text-orange-500 flex items-center gap-1">
                    <Clock className="h-3 w-3"/> Marked to expire: {format(expiryDate, "PPp HH:mm")}
                </p>
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
              <Button onClick={onDownloadClick} className="w-full" disabled={!isQrGenerated}>
                <Download className="mr-2 h-4 w-4" /> Download QR Code ({fileExtension.toUpperCase()})
              </Button>
           </CardFooter>
        </Card>
    </div>
  );
}
