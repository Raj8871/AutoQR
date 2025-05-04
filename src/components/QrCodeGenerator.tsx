
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeStyling, { type Options as QRCodeStylingOptions, type FileExtension, type DotType, type CornerSquareType, type CornerDotType, Extension } from 'qr-code-styling';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from "@/components/ui/slider";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Import Accordion
import { Download, Image as ImageIcon, Link as LinkIcon, Phone, Mail, MessageSquare, MapPin, Calendar as CalendarIcon, Settings2, Palette, Clock, Wifi, Upload, Check, Trash2, Info, Eye, EyeOff, QrCode as QrCodeIcon, RefreshCcw, Star, Sparkles, Shapes, CreditCard, Copy, Pencil, StarIcon, Share2, X, QrCode } from 'lucide-react'; // Removed HistoryIcon
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Toast } from '@/hooks/use-toast'; // Import Toast type
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { logFirebaseEvent } from '@/lib/firebase'; // Import logFirebaseEvent

// --- Types ---

// Define allowed QR types
type QrType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'sms' | 'location' | 'event' | 'wifi' | 'upi'; // Removed 'vcard', 'voice', 'password'

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
  { value: 'wifi', label: 'Wi-Fi Network', icon: Wifi, description: 'Connect to a Wi-Fi network automatically.' },
  { value: 'upi', label: 'UPI Payment', icon: CreditCard, description: 'Generate a QR for UPI payments with a specific amount and note.' },
];

// Define style types
const dotTypes: DotType[] = ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'];
const cornerSquareTypes: CornerSquareType[] = ['square', 'extra-rounded', 'dot'];
const cornerDotTypes: CornerDotType[] = ['square', 'dot'];
const wifiEncryptionTypes = ['WPA/WPA2', 'WEP', 'None'];


// --- Default Options ---
const defaultOptions: QRCodeStylingOptions = {
  width: 256, // Default size for preview, will adapt responsively
  height: 256,
  type: 'svg',
  data: '', // Default data is empty
  image: '',
  dotsOptions: {
    color: '#008080', // Teal accent
    type: 'rounded',
  },
  backgroundOptions: {
    color: '#FFFFFF',
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

// Get item from local storage
const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

// Set item in local storage
const setLocalStorageItem = <T>(key: string, value: T, toast?: (options: Omit<Toast, 'id'>) => void): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error);
     toast?.({ variant: "destructive", title: "Storage Error", description: "Could not save. Local storage might be full or disabled." });
  }
};


// Format ICS data
const formatICS = (data: Record<string, any>, toast: (options: Omit<Toast, 'id'>) => void): string => {
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      // Format: YYYYMMDDTHHMMSSZ (UTC time)
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    if (!data.event_summary || !data.event_start) return ''; // Summary and start date are mandatory
    let icsString = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LinkSpark//QR Event Generator//EN\nBEGIN:VEVENT\n';
    icsString += `SUMMARY:${data.event_summary}\n`;
    if (data.event_location) icsString += `LOCATION:${data.event_location}\n`;
    if (data.event_description) icsString += `DESCRIPTION:${data.event_description.replace(/\n/g, '\\n')}\n`; // Escape newlines

    const startDate = new Date(data.event_start); // Ensure it's a Date object
    if (isNaN(startDate.getTime())) { // Validate start date
        toast({ variant: "destructive", title: "Invalid Start Date", description: "Please select a valid start date and time." });
        return '';
    }
    icsString += `DTSTART:${formatDate(startDate)}\n`;

    if (data.event_end) {
      const endDate = new Date(data.event_end);
       // Ensure end date is after start date
       if (endDate <= startDate) {
           toast({ variant: "destructive", title: "Invalid End Date", description: "End date must be after the start date." });
           return ''; // Prevent generation
       }
      icsString += `DTEND:${formatDate(endDate)}\n`;
    } else {
        // If no end date, make it a 1-hour event by default, but check validity
         const endDateDefault = new Date(startDate.getTime() + 60 * 60 * 1000);
         if (!isNaN(endDateDefault.getTime())) { // Check if calculation resulted in valid date
             icsString += `DTEND:${formatDate(endDateDefault)}\n`;
         } else {
              // This should be unreachable if start date validation passed, but kept for safety
              toast({ variant: "destructive", title: "Invalid Start Date", description: "Could not calculate default end date." });
              return ''; // Prevent generation if start date was bad
         }
    }
    icsString += 'UID:' + Date.now() + '@linkspark.com\n'; // Unique ID for the event
    icsString += 'END:VEVENT\nEND:VCALENDAR';
    return icsString;
}

// Format Wi-Fi data
const formatWifi = (data: Record<string, any>, toast: (options: Omit<Toast, 'id'>) => void): string => {
    // Escape special characters: \, ;, ,, ", :
    const escapeValue = (value: string = '') => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');

    const ssid = escapeValue(data.wifi_ssid);
    const password = escapeValue(data.wifi_password);
    const encryption = data.wifi_encryption === 'None' ? 'nopass' : (data.wifi_encryption || 'WPA'); // Default to WPA if not None
    const hidden = data.wifi_hidden ? 'true' : 'false';

    if (!ssid) {
        toast({ variant: "destructive", title: "SSID Required", description: "Network Name (SSID) cannot be empty." });
        return ''; // SSID is mandatory
    }

    // Password is required unless encryption is 'nopass'
    if (encryption !== 'nopass' && !password) {
         toast({ variant: "destructive", title: "Password Required", description: "Password is required for WPA/WEP encryption." });
         return '';
    }

    // Construct the string: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
    return `WIFI:T:${encryption};S:${ssid};${encryption !== 'nopass' ? `P:${password};` : ''}H:${hidden};;`;
};


// Format UPI data
const formatUpi = (data: Record<string, any>, toast: (options: Omit<Toast, 'id'>) => void): string => {
    const upiId = (data.upi_id || '').trim();
    const payeeName = (data.upi_name || '').trim(); // Optional payee name
    const amount = parseFloat(data.upi_amount || '0');
    const note = (data.upi_note || '').trim();

    // Basic validation
    if (!upiId || !upiId.includes('@')) {
         toast({ variant: "destructive", title: "Invalid UPI ID", description: "Please enter a valid UPI ID (e.g., name@bank)." });
         return ''; // Stop generation if invalid
    }
     // Amount validation: Must be positive if entered
    if (data.upi_amount && (isNaN(amount) || amount <= 0)) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "UPI amount must be a positive number." });
        return ''; // Stop generation if invalid
    }
     // Amount required for UPI
     if (!data.upi_amount || isNaN(amount) || amount <= 0) {
        toast({ variant: "destructive", title: "Amount Required", description: "A positive amount is required for UPI payments." });
        return ''; // Stop generation if amount is missing or invalid
    }

    // Construct URI: upi://pay?pa=<upi_id>&pn=<payee_name>&am=<amount>&cu=INR&tn=<note>
    let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;
    if (payeeName) {
        upiString += `&pn=${encodeURIComponent(payeeName)}`; // Add Payee Name
    }
    // Include amount (guaranteed positive by validation above)
    upiString += `&am=${amount.toFixed(2)}`; // Amount with 2 decimal places

    upiString += `&cu=INR`; // Currency is INR
    if (note) {
        upiString += `&tn=${encodeURIComponent(note)}`; // Transaction Note
    }

    return upiString;
};

// Process image for shape/opacity
const processImage = (
    imageUrl: string,
    shape: 'square' | 'circle',
    size: number, // Canvas size for processing
    opacity: number = 1
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Could not get canvas context');

            // Apply opacity
            ctx.globalAlpha = opacity;

            // Draw shape mask if circle
            if (shape === 'circle') {
                ctx.save();
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
            }

            // Draw image maintaining aspect ratio within the square/circle
            const aspectRatio = img.width / img.height;
            let drawWidth = size, drawHeight = size, offsetX = 0, offsetY = 0;
            if (aspectRatio > 1) { // Landscape
                drawHeight = size / aspectRatio;
                offsetY = (size - drawHeight) / 2;
            } else { // Portrait or square
                drawWidth = size * aspectRatio;
                offsetX = (size - drawWidth) / 2;
            }
            // Ensure source dimensions are positive before drawing
            if (img.width > 0 && img.height > 0 && drawWidth > 0 && drawHeight > 0) {
                 ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            } else {
                 console.warn("Image or draw dimensions are zero or negative, skipping drawImage.");
            }


            // Restore context if clipped
            if (shape === 'circle') ctx.restore();

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (error) => reject(`Image loading error: ${error}`);
        img.src = imageUrl; // Start loading the image
    });
};


// Generate the final data string for the QR code
const generateQrDataString = (type: QrType, data: Record<string, any>, toast: (options: Omit<Toast, 'id'>) => void): string => {
    let targetData = '';
    try {
         switch (type) {
          case 'url':
             const url = data.url?.trim();
             // Basic URL validation (simple check for protocol)
             if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:'))) {
                targetData = url;
             } else if (url) {
                 // Attempt to prepend https:// if missing and seems like a domain
                 if (!url.includes('://') && url.includes('.')) {
                    targetData = `https://${url}`;
                 } else {
                    toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid URL starting with http:// or https://." });
                    return ''; // Invalid URL format
                 }
             } else {
                // toast({ variant: "destructive", title: "URL Required", description: "Website URL cannot be empty." });
                 return ''; // Empty URL
             }
             break;
          case 'text':
                targetData = data.text?.trim() || '';
                if (!targetData) {
                     // toast({ variant: "destructive", title: "Text Required", description: "Text content cannot be empty." });
                     return '';
                }
                break;
          case 'email':
            const emailTo = data.email?.trim();
             // Basic email validation
             if (emailTo && emailTo.includes('@')) {
                 targetData = `mailto:${emailTo}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
             } else if (emailTo) {
                  toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
                  return '';
             } else {
                 // toast({ variant: "destructive", title: "Email Required", description: "Recipient email cannot be empty." });
                  return ''; // Empty email
             }
            break;
          case 'phone':
                targetData = data.phone?.trim() ? `tel:${data.phone.trim()}` : '';
                if (!targetData) {
                    // toast({ variant: "destructive", title: "Phone Required", description: "Phone number cannot be empty." });
                    return '';
                }
                break;
          case 'whatsapp':
            // Basic check for digits only (allow leading '+')
            const phoneNum = (data.whatsapp_phone || '').replace(/[^0-9+]/g, '');
            if (phoneNum && phoneNum.length > 5) { // Very basic length check
                 targetData = `https://wa.me/${phoneNum.replace('+', '')}?text=${encodeURIComponent(data.whatsapp_message || '')}`;
            } else if (data.whatsapp_phone) { // Only show error if user tried to enter something
                toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid WhatsApp number including country code." });
                return '';
            } else {
                 // toast({ variant: "destructive", title: "Phone Required", description: "WhatsApp number cannot be empty." });
                 return '';
            }
            break;
          case 'sms':
            const smsPhoneNum = (data.sms_phone || '').trim();
            if (smsPhoneNum) {
                 targetData = `sms:${smsPhoneNum}?body=${encodeURIComponent(data.sms_message || '')}`;
            } else {
                // toast({ variant: "destructive", title: "Phone Required", description: "SMS recipient number cannot be empty." });
                 return '';
            }
            break;
          case 'location':
             // Requires both latitude and longitude, and they must be valid numbers
             const lat = parseFloat(data.latitude);
             const lon = parseFloat(data.longitude);
             if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                 targetData = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
             } else if (data.latitude || data.longitude) {
                  toast({ variant: "destructive", title: "Invalid Coordinates", description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)." });
                  return '';
             } else {
                 // toast({ variant: "destructive", title: "Coordinates Required", description: "Latitude and Longitude cannot be empty." });
                  return '';
             }
             break;
          case 'event':
              // Validation inside formatICS, pass toast
              targetData = formatICS(data, toast);
              // formatICS handles its own validation and returns '' on failure
              if (!targetData && (data.event_summary || data.event_start)) {
                 // toast({ variant: "destructive", title: "Event Data Required", description: "Event Title and Start Date/Time are required." });
                 // formatICS might have already shown a specific toast, avoid double-toasting
                 // console.warn("ICS data generation failed.");
                 return ''; // Explicitly return empty string if formatICS failed
              }
              if (!targetData && !data.event_summary && !data.event_start) {
                  return ''; // Return empty if mandatory fields are missing initially
              }
              break;
          case 'wifi':
               targetData = formatWifi(data, toast);
                // formatWifi handles its own validation
               if (!targetData && (data.wifi_ssid)) { // Return empty if validation fails but SSID was entered
                    return '';
               }
               if (!targetData && !data.wifi_ssid) { // Return empty if SSID is initially missing
                    return '';
               }
               break;
          case 'upi': // Added UPI case
               targetData = formatUpi(data, toast);
                // formatUpi handles its own validation
               if (!targetData && (data.upi_id || data.upi_amount)) { // Return empty if validation fails but required fields were attempted
                  return '';
               }
                if (!targetData && (!data.upi_id || !data.upi_amount)) { // Return empty if required fields are initially missing
                   return '';
                }
               break;
          default: targetData = '';
        }
    } catch (error) {
        console.error(`Error generating QR data string for type ${type}:`, error);
        toast({ variant: "destructive", title: "Data Error", description: `Could not format data for ${type}. Please check your inputs.` });
        return '';
    }

    // Final check for excessively long data which might cause QR generation errors
    const MAX_DATA_LENGTH_WARN = 2500; // Warn earlier
    const MAX_DATA_LENGTH_FAIL = 4296; // Absolute max for alphanumeric in QR spec (approx)

     if (targetData.length > MAX_DATA_LENGTH_FAIL) {
         console.error(`QR data exceeds maximum length (${targetData.length} > ${MAX_DATA_LENGTH_FAIL}). Cannot generate.`);
         toast({
             variant: "destructive",
             title: "Data Too Long",
             description: `Input data is too long (${targetData.length} characters) and exceeds the QR code limit. Please shorten it significantly. Max ~${MAX_DATA_LENGTH_FAIL} chars.`,
             duration: 10000
         });
         return ''; // Stop generation
     } else if (targetData.length > MAX_DATA_LENGTH_WARN) {
         console.warn(`QR data for type ${type} is very long (${targetData.length} chars). Scanability might be reduced.`);
         toast({
             variant: "default", // Warning, not error yet
             title: "Data Length Warning",
             description: `The input data is quite long (${targetData.length} characters). The generated QR code might be complex and harder to scan, especially on lower-resolution screens or when printed small. Consider shortening it if possible.`,
             duration: 7000
         });
     }

    return targetData;
};

export function QrCodeGenerator() {
  const { toast } = useToast(); // Get toast instance

  // Core QR State
  const [qrType, setQrType] = useState<QrType>('url');
  const [inputData, setInputData] = useState<Record<string, any>>({ url: '' }); // Default with empty url
  const [options, setOptions] = useState<QRCodeStylingOptions>(defaultOptions);
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);
  const [qrCodeSvgDataUrl, setQrCodeSvgDataUrl] = useState<string | null>(null);
  const [isQrGenerated, setIsQrGenerated] = useState<boolean>(false);
  const [qrPreviewKey, setQrPreviewKey] = useState<number>(Date.now()); // Use timestamp for key

  // Customization State
  const [fileExtension, setFileExtension] = useState<FileExtension>('png');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null); // Keep original for re-processing
  const [logoSize, setLogoSize] = useState<number>(defaultOptions.imageOptions?.imageSize ? defaultOptions.imageOptions.imageSize * 100 : 40);
  const [logoShape, setLogoShape] = useState<'square' | 'circle'>('square');
  const [logoOpacity, setLogoOpacity] = useState<number>(100);
  const [qrLabel, setQrLabel] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [expiryTime, setExpiryTime] = useState<string>("00:00"); // Default time
  const [wifiPasswordVisible, setWifiPasswordVisible] = useState<boolean>(false);


  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null); // Ref for the container div

   // --- Logo Handling ---
  const removeLogo = useCallback(() => {
     setOriginalLogoUrl(null);
     setLogoPreviewUrl(null);
     // Reset options related to image
     setOptions(prev => ({
         ...prev,
         image: '',
         imageOptions: {
             ...(prev.imageOptions ?? defaultOptions.imageOptions),
             margin: 5,
             imageSize: 0.4 // Reset size in options as well
         },
     }));
     // Reset UI state
     setLogoSize(40);
     setLogoShape('square');
     setLogoOpacity(100);
     if (logoInputRef.current) logoInputRef.current.value = ''; // Clear file input
  }, []);


  // --- QR Data Generation ---
  const generateQrData = useCallback((): string => {
      return generateQrDataString(qrType, inputData, toast); // Pass toast
  }, [qrType, inputData, toast]); // Added toast dependency


  // --- QR Code Instance & Preview Update ---
  useEffect(() => {
      const qrData = generateQrData();
      const hasData = !!qrData;
      setIsQrGenerated(hasData); // Update generated status

      const container = qrCodeRef.current;
      if (!container) return;

      let instance = qrCodeInstance;
      let didAppend = false; // Flag to track if append was called

      // Ensure width/height are numbers before passing to library
      const width = typeof options.width === 'number' ? options.width : defaultOptions.width;
      const height = typeof options.height === 'number' ? options.height : defaultOptions.height;

      const qrOptions = { ...options, data: qrData, width, height };


      const updateQrCode = async () => {
           try {
                // Clear previous content *before* creating/updating
                // This helps prevent the "removeChild" error
                while (container.firstChild) {
                   container.removeChild(container.firstChild);
                }

                if (!hasData) { // Don't create if no data
                    setQrCodeSvgDataUrl(null);
                    setQrCodeInstance(null); // Clear instance if no data
                    return;
                }

                // Create or update instance only if there's data
                if (!instance) {
                    instance = new QRCodeStyling(qrOptions);
                    instance.append(container);
                    didAppend = true; // Mark that we appended
                    setQrCodeInstance(instance);

                } else {
                    // Update existing instance only if the container has children (it should after clearing and appending)
                     // Check if update method exists before calling
                     if (typeof instance.update === 'function') {
                        instance.update(qrOptions);
                     } else {
                         // Fallback: create new instance if update is not available (should not happen with current library version)
                          while (container.firstChild) { // Clear again just in case
                             container.removeChild(container.firstChild);
                          }
                          instance = new QRCodeStyling(qrOptions);
                          instance.append(container);
                          didAppend = true;
                          setQrCodeInstance(instance);
                     }
                }

                // Generate SVG preview for history *after* successful generation/update
                if (instance) {
                    // Log event to firebase
                    logFirebaseEvent('qr_code_generated', { qrType: qrType });

                   // Delay slightly to ensure DOM update completes before getting data
                   await new Promise(resolve => setTimeout(resolve, 50));
                   const blob = await instance.getRawData('svg');
                    if (blob) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const svgDataUrl = reader.result as string;
                            setQrCodeSvgDataUrl(svgDataUrl); // Keep for potential future manual save
                        };
                        reader.onerror = () => setQrCodeSvgDataUrl(null);
                        reader.readAsDataURL(blob);
                    } else {
                        console.warn("Failed to get raw SVG data from QR instance.");
                        setQrCodeSvgDataUrl(null);
                    }
                } else {
                     setQrCodeSvgDataUrl(null); // Clear preview if no instance
                }

           } catch (error: any) { // Catch specific errors if possible
               console.error("Error creating/updating QR code instance:", error);
               // Check for specific overflow error
               if (error?.message?.includes("overflow")) {
                  toast({ variant: "destructive", title: "QR Generation Error", description: `Data is too long for the QR code standard. Please shorten your input. (${error.message})`, duration: 7000 });
               } else {
                  toast({ variant: "destructive", title: "QR Generation Error", description: `Could not create/update QR code: ${(error as Error).message}` });
               }
               setQrCodeSvgDataUrl(null);
               setQrCodeInstance(null); // Clear instance on error
               setIsQrGenerated(false); // Mark as not generated on error
               // Ensure container is clear on error
               if (container) {
                   while (container.firstChild) {
                       container.removeChild(container.firstChild);
                   }
               }
           }
      };

      // Debounce the update to prevent rapid re-renders on input change
      const debounceTimeout = setTimeout(updateQrCode, 300);

      return () => {
           clearTimeout(debounceTimeout);
       };
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, qrType, inputData, toast]); // Removed qrLabel, addToHistory dependencies


  // --- Input Handlers ---
  const handleInputChange = (key: string, value: any) => {
    // Validation for numeric fields
    if ((key === 'latitude' || key === 'longitude' || key === 'upi_amount') && value && isNaN(Number(value))) {
         toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid number." });
         return;
    }
     if (key === 'upi_amount' && value && Number(value) < 0) {
         toast({ variant: "destructive", title: "Invalid Amount", description: "Amount cannot be negative." });
         // Optionally reset or clamp the value: setInputData(prev => ({ ...prev, [key]: '0.01' }));
         return;
     }
     // Latitude/Longitude validation
     if (key === 'latitude' && value && (Number(value) < -90 || Number(value) > 90)) {
         toast({ variant: "destructive", title: "Invalid Latitude", description: "Latitude must be between -90 and 90." });
         return;
     }
      if (key === 'longitude' && value && (Number(value) < -180 || Number(value) > 180)) {
         toast({ variant: "destructive", title: "Invalid Longitude", description: "Longitude must be between -180 and 180." });
         return;
     }

    setInputData(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key: string, checked: boolean | 'indeterminate') => {
     setInputData(prev => ({ ...prev, [key]: checked === true })); // Treat indeterminate as false
   };

  // Consolidate date/time updates for events
  const handleEventDateTimeChange = (key: 'event_start' | 'event_end', value: string) => {
      setInputData(prev => {
          const currentStartDate = prev.event_start ? new Date(prev.event_start) : null;
          const currentEndDate = prev.event_end ? new Date(prev.event_end) : null;
          let newDate: Date | null = null;
          try {
             newDate = new Date(value); // Parse the datetime-local input
             if (isNaN(newDate.getTime())) newDate = null; // Invalid date string
          } catch { newDate = null; }

          if (!newDate) {
              toast({ variant: "destructive", title: "Invalid Date/Time", description: "Please select a valid date and time." });
              return prev; // Keep previous state if input is invalid
          }

          if (key === 'event_start') {
              // If end date exists and is before new start date, adjust end date
              if (currentEndDate && currentEndDate < newDate) {
                  const adjustedEndDate = new Date(newDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
                  return { ...prev, event_start: newDate, event_end: adjustedEndDate };
              }
              return { ...prev, event_start: newDate };
          } else { // key === 'event_end'
              // If start date exists and new end date is before start date, show error
              if (currentStartDate && newDate < currentStartDate) {
                  toast({ variant: "destructive", title: "Invalid End Date", description: "End date cannot be before start date." });
                  return prev; // Keep previous state
              }
              return { ...prev, event_end: newDate };
          }
      });
  };


  // --- Customization Handlers ---
  const handleColorChange = (target: 'dots' | 'background' | 'cornersSquare' | 'cornersDot', color: string) => {
     setOptions(prev => ({
        ...prev,
        ...(target === 'dots' && { dotsOptions: { ...(prev.dotsOptions ?? defaultOptions.dotsOptions), color } }),
        ...(target === 'background' && { backgroundOptions: { ...(prev.backgroundOptions ?? defaultOptions.backgroundOptions), color } }),
        ...(target === 'cornersSquare' && { cornersSquareOptions: { ...(prev.cornersSquareOptions ?? defaultOptions.cornersSquareOptions), color } }),
        ...(target === 'cornersDot' && { cornersDotOptions: { ...(prev.cornersDotOptions ?? defaultOptions.cornersDotOptions), color } }),
    }));
  };

 const handleDotStyleChange = (value: DotType) => {
    setOptions(prev => ({ ...prev, dotsOptions: { ...(prev.dotsOptions ?? defaultOptions.dotsOptions), type: value } }));
  };

  const handleCornerStyleChange = (target: 'cornersSquare' | 'cornersDot', value: CornerSquareType | CornerDotType) => {
     setOptions(prev => ({
        ...prev,
        ...(target === 'cornersSquare' && { cornersSquareOptions: { ...(prev.cornersSquareOptions ?? defaultOptions.cornersSquareOptions), type: value as CornerSquareType } }),
        ...(target === 'cornersDot' && { cornersDotOptions: { ...(prev.cornersDotOptions ?? defaultOptions.cornersDotOptions), type: value as CornerDotType } }),
    }));
  };

  const handleQrSizeChange = (value: number[]) => {
      const size = value[0];
       if (size >= 50 && size <= 1000) { // Ensure size is within bounds
            setOptions(prev => ({ ...prev, width: size, height: size }));
       }
  }

  const handleLogoSizeChange = (value: number[]) => {
     const sizePercent = value[0];
     setLogoSize(sizePercent); // Update slider state
     const imageSizeValue = Math.max(0.1, Math.min(0.5, sizePercent / 100)); // Clamp value for library
     setOptions(prev => ({
         ...prev,
         imageOptions: { ...(prev.imageOptions ?? defaultOptions.imageOptions), imageSize: imageSizeValue }
     }));
     // Re-process logo if it exists
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

 const handleHideDotsChange = (checked: boolean | 'indeterminate') => {
      setOptions(prev => ({
          ...prev,
          imageOptions: { ...(prev.imageOptions ?? defaultOptions.imageOptions), hideBackgroundDots: checked === true }
      }));
 }


  // --- Logo Handling ---
 const applyLogoShapeAndOpacity = useCallback(async (imageUrl: string, shape: 'square' | 'circle', opacity: number) => {
    try {
      const currentImageOptions = options.imageOptions ?? defaultOptions.imageOptions;
      const imageSize = Math.max(0.1, Math.min(0.5, logoSize / 100)); // Get current size from state
      const hideDots = currentImageOptions.hideBackgroundDots ?? true;
      const margin = currentImageOptions.margin ?? 5;

      // Use a fixed reasonable size for the canvas processing to avoid performance issues
      const processingCanvasSize = 200;
      const processedImageUrl = await processImage(imageUrl, shape, processingCanvasSize, opacity);

      setLogoPreviewUrl(processedImageUrl); // Update UI preview
       setOptions(prev => ({
           ...prev,
           image: processedImageUrl, // Use processed image for QR generation
           imageOptions: {
               ...currentImageOptions, // Keep other settings like crossOrigin
               imageSize: imageSize, // Ensure size is correctly applied
               hideBackgroundDots: hideDots, // Ensure hide dots setting is kept
               margin: margin, // Ensure margin is kept
            }
       }));
    } catch (error) {
        console.error("Error processing logo image:", error);
        toast({ variant: "destructive", title: "Logo Error", description: "Could not process the logo image. Using original." });
        setLogoPreviewUrl(imageUrl); // Fallback to original URL on error
         setOptions(prev => ({
             ...prev,
             image: imageUrl, // Use original image in options
              imageOptions: {
                ...(options.imageOptions ?? defaultOptions.imageOptions),
                imageSize: Math.max(0.1, Math.min(0.5, logoSize / 100)), // Still apply size
             }
         }));
    }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [logoSize, options.imageOptions, toast]); // Added toast dependency


 const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'].includes(file.type)) {
           toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload a PNG, JPEG, GIF, WEBP or SVG image." });
           return;
      }
       if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({ variant: "destructive", title: "File Too Large", description: "Logo image should be less than 2MB." });
            return;
       }
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setOriginalLogoUrl(imageUrl); // Store the original
        applyLogoShapeAndOpacity(imageUrl, logoShape, logoOpacity / 100); // Apply current shape/opacity
      };
      reader.onerror = () => toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected file." });
      reader.readAsDataURL(file);
    }
 }, [logoShape, logoOpacity, applyLogoShapeAndOpacity, toast]); // Added toast dependency

 const triggerLogoUpload = () => logoInputRef.current?.click();




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

 // Handles selection from the Calendar popover
 const handleManualExpiryDateChange = (date: Date | undefined) => {
     handleManualExpiryChange(date, expiryTime);
 };

 // Handles change from the Time input
 const handleManualExpiryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const timeValue = e.target.value;
     setExpiryTime(timeValue); // Update time state immediately for input responsiveness
     handleManualExpiryChange(expiryDate, timeValue);
 };

 // Combined logic for setting expiry from Date and Time inputs
 const handleManualExpiryChange = (date: Date | undefined, time: string) => {
     let combinedDate: Date | undefined = undefined;
     if (date && time) {
         try {
             const [hours, minutes] = time.split(':').map(Number);
             combinedDate = new Date(date);
             combinedDate.setHours(hours, minutes, 0, 0); // Set H, M, S, MS

             if (combinedDate < new Date()) {
                 toast({ variant: "destructive", title: "Invalid Date/Time", description: "Expiry cannot be in the past." });
                 // Optionally reset date/time or keep previous valid state
                 // For now, just show error and don't update expiryDate
                 return;
             }
              setExpiryDate(combinedDate);
              toast({ title: "Expiry Reminder Set", description: `QR code visually marked to expire on ${format(combinedDate, "PPP 'at' HH:mm")}. (Backend needed for real expiry)` });

         } catch {
              toast({ variant: "destructive", title: "Invalid Time", description: "Please enter a valid time." });
              return; // Don't update if time parsing fails
         }
     } else {
         // If either date or time is missing, clear the expiry
         const hadExpiry = !!expiryDate; // Check if expiry was previously set
         setExpiryDate(undefined);
         // Optionally reset time input if date is cleared
         if (!date) setExpiryTime("00:00");
         if (hadExpiry) { // Only log removal if it was actually set before
             toast({ title: "Expiry Removed", description: "QR code expiry marker removed." });
         }
     }
 };


 // --- Download ---
  const onDownloadClick = useCallback(async () => {
      const qrData = generateQrData();
       if (!qrCodeInstance || !qrData || !isQrGenerated) {
          toast({ variant: "destructive", title: "Cannot Download", description: "Please generate a valid QR code first." });
          return;
      }

      // Log the download event to Firebase Analytics
       logFirebaseEvent('qr_code_downloaded', {
           qrType: qrType,
           fileExtension: fileExtension,
           hasLogo: !!originalLogoUrl,
           dataLength: qrData.length
       });


      // Note: Real expiry needs backend logic. This is just a visual marker.
      if (expiryDate) toast({ title: "Download Info", description: "Note: Expiry is a visual marker only.", duration: 5000 });

       // Ensure width/height are valid numbers
       const downloadWidth = typeof options.width === 'number' && options.width > 0 ? options.width : 512; // Default to 512 for download if invalid
       const downloadHeight = typeof options.height === 'number' && options.height > 0 ? options.height : 512;

      // Recreate options object for download to ensure fresh data and correct type
      const downloadOptions: QRCodeStylingOptions = {
          ...options,
          data: qrData, // Use currently generated data
          type: fileExtension === 'svg' ? 'svg' : 'canvas', // Set type based on extension
          width: downloadWidth,
          height: downloadHeight,
      };

      // Create a temporary instance specifically for download
      const downloadInstance = new QRCodeStyling(downloadOptions);


      try {
            const filename = qrLabel ? qrLabel.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `linkspark-qr-${qrType}`;
            await downloadInstance.download({ name: filename, extension: fileExtension as Extension });
            toast({ title: "Download Started", description: `QR code downloading as ${fileExtension.toUpperCase()}.` });
      } catch (error) {
          console.error("Error downloading QR code:", error);
          toast({ variant: "destructive", title: "Download Failed", description: "Could not download the QR code. Please try again." });
      }
  }, [qrCodeInstance, options, fileExtension, qrType, generateQrData, isQrGenerated, expiryDate, qrLabel, toast]); // Added toast dependency



  // --- Render Dynamic Inputs ---
  const renderInputs = () => {
    const currentTypeInfo = qrTypeOptions.find(opt => opt.value === qrType);
    const commonWrapperClass = "space-y-4 border p-4 rounded-md bg-muted/10 shadow-inner";

    return (
        <div className="space-y-4">
             {currentTypeInfo && (
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                   <Info className="h-4 w-4 mt-0.5 shrink-0"/>
                   <span>{currentTypeInfo.description}</span>
                </p>
             )}
            <div className={commonWrapperClass}>
                {(() => {
                    switch (qrType) {
                        case 'url':
                            return (
                                <div className="space-y-2">
                                <Label htmlFor="qr-url">Website URL *</Label>
                                <Input id="qr-url" type="url" value={inputData.url ?? ''} onChange={(e) => handleInputChange('url', e.target.value)} placeholder="https://example.com" required/>
                                </div>
                            );
                        case 'text':
                            return (
                                <div className="space-y-2">
                                <Label htmlFor="qr-text">Text Content *</Label>
                                <Textarea id="qr-text" value={inputData.text || ''} onChange={(e) => handleInputChange('text', e.target.value)} placeholder="Enter your text here..." rows={4} required />
                                </div>
                            );
                        case 'email':
                            return (
                                <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="qr-email-to">Recipient Email *</Label>
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
                                <Label htmlFor="qr-phone">Phone Number *</Label>
                                <Input id="qr-phone" type="tel" value={inputData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+1234567890" required />
                                </div>
                            );
                        case 'whatsapp':
                            return (
                                <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="qr-whatsapp-phone">WhatsApp Number (incl. country code) *</Label>
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
                                        <Label htmlFor="qr-sms-phone">SMS Recipient Number *</Label>
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
                                const eventStartValue = inputData.event_start ? format(new Date(inputData.event_start), "yyyy-MM-dd'T'HH:mm") : '';
                                const eventEndValue = inputData.event_end ? format(new Date(inputData.event_end), "yyyy-MM-dd'T'HH:mm") : '';
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-event-summary">Event Title *</Label>
                                        <Input id="qr-event-summary" type="text" value={inputData.event_summary || ''} onChange={(e) => handleInputChange('event_summary', e.target.value)} placeholder="Meeting, Birthday Party..." required />
                                    </div>
                                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="event-start-datetime">Start Date & Time *</Label>
                                             <Input
                                                id="event-start-datetime"
                                                type="datetime-local"
                                                value={eventStartValue}
                                                onChange={(e) => handleEventDateTimeChange('event_start', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="event-end-datetime">End Date & Time (Optional)</Label>
                                            <Input
                                                id="event-end-datetime"
                                                type="datetime-local"
                                                value={eventEndValue}
                                                min={eventStartValue} // Prevent end before start
                                                onChange={(e) => handleEventDateTimeChange('event_end', e.target.value)}
                                            />
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
                                    <p className="text-xs text-muted-foreground">* Event Title and Start Date/Time are required.</p>
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
                                        <Label htmlFor="wifi-encryption">Encryption</Label>
                                        <Select onValueChange={(value) => handleInputChange('wifi_encryption', value)} value={inputData.wifi_encryption || 'WPA/WPA2'}>
                                            <SelectTrigger id="wifi-encryption"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {wifiEncryptionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Conditionally render password based on encryption */}
                                     {inputData.wifi_encryption !== 'None' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="wifi-password">Password *</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="wifi-password"
                                                    type={wifiPasswordVisible ? 'text' : 'password'}
                                                    value={inputData.wifi_password || ''}
                                                    onChange={(e) => handleInputChange('wifi_password', e.target.value)}
                                                    placeholder="Your password"
                                                    required
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => setWifiPasswordVisible(!wifiPasswordVisible)} type="button" aria-label={wifiPasswordVisible ? "Hide password" : "Show password"}>
                                                    {wifiPasswordVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="wifi-hidden" checked={!!inputData.wifi_hidden} onCheckedChange={(checked) => handleCheckboxChange('wifi_hidden', checked)} />
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
                                     <p className="text-xs text-muted-foreground">* Network Name (SSID) is required. Password required unless encryption is 'None'.</p>
                                </div>
                            );
                         case 'upi': // Added UPI inputs
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="upi-id">UPI ID (Payee VPA) *</Label>
                                        <Input id="upi-id" type="text" value={inputData.upi_id || ''} onChange={(e) => handleInputChange('upi_id', e.target.value)} placeholder="yourname@bank" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="upi-name">Payee Name (Optional)</Label>
                                        <Input id="upi-name" type="text" value={inputData.upi_name || ''} onChange={(e) => handleInputChange('upi_name', e.target.value)} placeholder="e.g., John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="upi-amount">Amount (INR) *</Label>
                                        <Input id="upi-amount" type="number" step="0.01" min="0.01" value={inputData.upi_amount || ''} onChange={(e) => handleInputChange('upi_amount', e.target.value)} placeholder="e.g., 500.00" required />
                                        <p className="text-xs text-muted-foreground">Enter the amount in Indian Rupees (INR). Must be positive.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="upi-note">Note/Message (Optional)</Label>
                                        <Input id="upi-note" type="text" value={inputData.upi_note || ''} onChange={(e) => handleInputChange('upi_note', e.target.value)} placeholder="e.g., Payment for order #123" />
                                    </div>
                                     {/* Preset Amount Buttons */}
                                    <div className="space-y-2">
                                        <Label>Preset Amounts</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {[100, 200, 500, 1000].map(amount => (
                                                <Button key={amount} variant="outline" size="sm" onClick={() => handleInputChange('upi_amount', amount.toFixed(2))}>
                                                    ₹{amount}
                                                </Button>
                                            ))}
                                             <Button variant="outline" size="sm" onClick={() => handleInputChange('upi_amount', '')}>
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">* UPI ID and Amount are required.</p>
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
            <CardDescription>Select type, enter content, and personalize the style.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* Tabs for Content & History (History tab removed) */}
             <Tabs defaultValue="content" className="w-full">
                 {/* Use full width tabs on small screens */}
                <TabsList className="grid w-full grid-cols-1 mb-4"> {/* Only one tab now */}
                    <TabsTrigger value="content"><Settings2 className="inline-block mr-1 h-4 w-4" /> Options</TabsTrigger>
                    {/* Removed History Trigger */}
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="pt-6 space-y-6">
                    {/* Accordion for Content, Styling, Logo, Extras */}
                    <Accordion type="multiple" collapsible="true" className="w-full" defaultValue={["content-item", "styling-item"]}>
                         {/* Step 1: Content */}
                        <AccordionItem value="content-item">
                             <AccordionTrigger className="text-lg font-semibold">
                                <span className="flex items-center gap-2"><QrCode className="h-5 w-5"/> 1. Content</span>
                             </AccordionTrigger>
                             <AccordionContent className="pt-4 space-y-6">
                                {/* QR Type Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="qr-type">Select QR Code Type</Label>
                                    <Select
                                        onValueChange={(value: QrType) => {
                                            setQrType(value);
                                            setInputData({}); // Clear input data on type change
                                            setExpiryDate(undefined);
                                            setQrLabel('');
                                         }}
                                         value={qrType}
                                     >
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
                                    <Label>Enter Content Details</Label>
                                    {renderInputs()}
                                </div>
                             </AccordionContent>
                        </AccordionItem>

                         {/* Step 2: Styling */}
                        <AccordionItem value="styling-item">
                             <AccordionTrigger className="text-lg font-semibold">
                                <span className="flex items-center gap-2"><Palette className="h-5 w-5"/> 2. Styling</span>
                             </AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-6">
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
                                        <Select onValueChange={(value: DotType) => handleDotStyleChange(value)} value={options.dotsOptions?.type ?? dotTypes[0]}>
                                            <SelectTrigger id="dot-style"><SelectValue /></SelectTrigger>
                                            <SelectContent>{dotTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="corner-square-style">Corner Style</Label>
                                        <Select onValueChange={(value: CornerSquareType) => handleCornerStyleChange('cornersSquare', value)} value={options.cornersSquareOptions?.type ?? cornerSquareTypes[0]}>
                                            <SelectTrigger id="corner-square-style"><SelectValue /></SelectTrigger>
                                            <SelectContent>{cornerSquareTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="corner-dot-style">Corner Dot Style</Label>
                                        <Select onValueChange={(value: CornerDotType) => handleCornerStyleChange('cornersDot', value)} value={options.cornersDotOptions?.type ?? cornerDotTypes[0]}>
                                            <SelectTrigger id="corner-dot-style"><SelectValue /></SelectTrigger>
                                            <SelectContent>{cornerDotTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {/* QR Size Slider */}
                                <div className="space-y-3 pt-4 border-t">
                                     <Label htmlFor="qr-size">QR Code Size ({options.width ?? defaultOptions.width}px)</Label>
                                     <div className="flex items-center gap-2">
                                        <Slider id="qr-size" value={[options.width ?? defaultOptions.width!]} min={100} max={1000} step={4} onValueChange={handleQrSizeChange} aria-label="QR Code Size Slider"/>
                                        <span className='text-sm w-14 text-right'>{options.width ?? defaultOptions.width} px</span>
                                     </div>
                                     <p className="text-xs text-muted-foreground">Adjusts the preview size. Download size depends on format.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                         {/* Step 3: Logo */}
                         <AccordionItem value="logo-item">
                            <AccordionTrigger className="text-lg font-semibold">
                                <span className="flex items-center gap-2"><ImageIcon className="h-5 w-5"/> 3. Logo (Optional)</span>
                            </AccordionTrigger>
                             <AccordionContent className="pt-4 space-y-6">
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
                                                <Button variant="ghost" size="icon" onClick={removeLogo} aria-label="Remove logo">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
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
                                                    <Slider id="logo-size" value={[logoSize]} min={10} max={50} step={1} onValueChange={handleLogoSizeChange} aria-label="Logo Size Slider"/>
                                                    <span className='text-sm w-10 text-right'>{logoSize}%</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Relative to QR code size. Default: 40%.</p>
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="logo-opacity">Logo Opacity ({logoOpacity}%)</Label>
                                                 <div className="flex items-center gap-2">
                                                    <Slider id="logo-opacity" value={[logoOpacity]} min={10} max={100} step={5} onValueChange={handleLogoOpacityChange} aria-label="Logo Opacity Slider" />
                                                     <span className='text-sm w-10 text-right'>{logoOpacity}%</span>
                                                 </div>
                                                <p className="text-xs text-muted-foreground">Lower opacity might improve scanability.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="logo-shape">Logo Shape</Label>
                                            <Select onValueChange={handleLogoShapeChange} value={logoShape}>
                                                <SelectTrigger id="logo-shape" className="w-full sm:w-1/2"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="square">Square</SelectItem>
                                                    <SelectItem value="circle">Circle</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">Applies a circular mask if selected.</p>
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Checkbox id="hide-dots" checked={options.imageOptions?.hideBackgroundDots} onCheckedChange={handleHideDotsChange}/>
                                            <Label htmlFor="hide-dots" className="text-sm font-medium leading-none">Hide Dots Behind Logo</Label>
                                             <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                                                    <TooltipContent><p>Removes QR dots behind the logo. May affect scanability.</p></TooltipContent>
                                                </Tooltip>
                                             </TooltipProvider>
                                        </div>
                                    </>
                                )}
                             </AccordionContent>
                        </AccordionItem>

                        {/* Step 4: Extras */}
                         <AccordionItem value="extras-item">
                             <AccordionTrigger className="text-lg font-semibold">
                                <span className="flex items-center gap-2"><Sparkles className="h-5 w-5"/> 4. Extras</span>
                            </AccordionTrigger>
                             <AccordionContent className="pt-4 space-y-6">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                     {/* Label (Removed, as history is removed) */}
                                     {/* <div className="space-y-2">
                                         <Label htmlFor="qr-label">Label Text (For History)</Label>
                                         <Input id="qr-label" type="text" value={qrLabel} onChange={(e) => setQrLabel(e.target.value)} placeholder="e.g., My Website QR" maxLength={50} />
                                         <p className="text-xs text-muted-foreground">Helps identify this QR in your history.</p>
                                     </div> */}

                                      {/* Expiry Reminder */}
                                     <div className='space-y-2'>
                                        <Label>Expiry Reminder (Visual Only)</Label>
                                        <p className="text-xs text-muted-foreground pb-1">Mark the QR code with an intended expiry. <strong className='text-foreground/80'>Actual expiration requires a backend service.</strong></p>
                                        <div className="flex flex-wrap gap-2 pb-2">
                                            <Button variant={!expiryDate ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset(null)}>No Expiry</Button>
                                            <Button variant={expiryDate && Math.abs(new Date().getTime() + 1*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('1h')}>1 Hour</Button>
                                            <Button variant={expiryDate && Math.abs(new Date().getTime() + 24*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('24h')}>24 Hours</Button>
                                            <Button variant={expiryDate && Math.abs(new Date().getTime() + 7*24*60*60*1000 - expiryDate.getTime()) < 1000 ? "secondary" : "outline"} size="sm" onClick={() => handleSetExpiryPreset('7d')}>7 Days</Button>
                                        </div>
                                         <div className="grid grid-cols-2 gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {expiryDate ? format(expiryDate, "PPP") : <span>Pick date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar mode="single" selected={expiryDate} onSelect={handleManualExpiryDateChange} initialFocus disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} />
                                                </PopoverContent>
                                            </Popover>
                                            <Input id="expiry-time" type="time" value={expiryTime} onChange={handleManualExpiryTimeChange} disabled={!expiryDate} />
                                        </div>
                                    </div>
                                 </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                </TabsContent>

                 {/* History Tab Removed */}

             </Tabs>

          </CardContent>
        </Card>

        {/* QR Preview Panel */}
        <Card key={qrPreviewKey} className="lg:col-span-1 order-1 lg:order-2 sticky top-6 self-start animate-fade-in [animation-delay:0.2s]">
          <CardHeader>
            <CardTitle>Preview & Download</CardTitle>
            <CardDescription>Review your QR code and download it.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
             {/* Responsive container for QR code */}
             <div className="border rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-white p-2 relative w-full max-w-[256px] sm:max-w-[300px] lg:max-w-full aspect-square mx-auto" style={{ minHeight: '150px' /* Ensure a minimum height */ }}>
                 <div ref={qrCodeRef} className="absolute inset-0 flex items-center justify-center">
                     {/* QR code will be appended here by the library */}
                 </div>
                {!isQrGenerated && (
                     <div className="text-muted-foreground text-center p-4 flex flex-col items-center justify-center h-full absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10">
                         <QrCodeIcon className="h-12 w-12 mb-2 text-muted-foreground/50"/>
                         <span>Enter data to generate QR code.</span>
                     </div>
                 )}
            </div>
             {expiryDate && (
                <p className="text-xs text-center text-orange-500 flex items-center gap-1">
                    <Clock className="h-3 w-3"/> Marked to expire: {format(expiryDate, "PPp HH:mm")}
                </p>
            )}
             <div className="w-full space-y-1 pt-4">
                <Label htmlFor="file-type">Download Format</Label>
                <Select onValueChange={(value: FileExtension) => setFileExtension(value)} value={fileExtension}>
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
             <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                    const data = generateQrData();
                    if (data && isQrGenerated) {
                        navigator.clipboard.writeText(data)
                            .then(() => toast({ title: "Content Copied", description: "QR code data copied to clipboard." }))
                            .catch(() => toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy data." }));
                    } else {
                         toast({ variant: "destructive", title: "Cannot Copy", description: "Generate a valid QR code first." });
                    }
                }}
                disabled={!isQrGenerated}
            >
                <Copy className="mr-2 h-4 w-4" /> Copy QR Data
            </Button>
             {/* Removed Save to History Button */}
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
