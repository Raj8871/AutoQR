
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeStyling, { type Options as QRCodeStylingOptions, type FileExtension, type DotType, type CornerSquareType, type CornerDotType, Extension } from 'qr-code-styling';
import { Button } from '@/components/ui/button';
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
import { Download, Image as ImageIcon, Link as LinkIcon, Phone, Mail, MessageSquare, MapPin, Calendar as CalendarIcon, User, Settings2, Palette, Clock, Wifi, Upload, Check, Trash2, Info, Eye, EyeOff, QrCode as QrCodeIcon, History as HistoryIcon, RefreshCcw, Star, Sparkles, Shapes, CreditCard } from 'lucide-react'; // Added CreditCard for UPI
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // Import AlertDialog

// --- Types ---

// Define allowed QR types
type QrType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'sms' | 'location' | 'event' | 'vcard' | 'wifi' | 'upi'; // Added 'upi'

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
  { value: 'upi', label: 'UPI Payment', icon: CreditCard, description: 'Generate a QR for UPI payments with a specific amount and note.' }, // Added UPI option
];

// Define style types
const dotTypes: DotType[] = ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'];
const cornerSquareTypes: CornerSquareType[] = ['square', 'extra-rounded', 'dot'];
const cornerDotTypes: CornerDotType[] = ['square', 'dot'];
const wifiEncryptionTypes = ['WPA/WPA2', 'WEP', 'None'];

// Define History Item structure
interface HistoryItem {
  id: string;
  timestamp: number;
  qrType: QrType;
  inputData: Record<string, any>;
  options: Partial<QRCodeStylingOptions>; // Store only relevant customizable options
  label: string;
  previewSvgDataUrl: string | null; // Store the preview URL for quick display
}

const LOCAL_STORAGE_KEY = 'qrCodeHistory';
const MAX_HISTORY_ITEMS = 15;

// --- Default Options ---
const defaultOptions: QRCodeStylingOptions = {
  width: 256, // Default size for preview, will adapt responsively
  height: 256,
  type: 'svg',
  data: '',
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
const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error);
     toast({ variant: "destructive", title: "Storage Error", description: "Could not save history. Local storage might be full or disabled." });
  }
};


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
  if (!data.firstName && !data.lastName && !data.organization && !data.phone && !data.mobile && !data.email && !data.website) return ''; // Return empty if only name/org etc. not provided
  return vCardString;
};

// Format ICS data
const formatICS = (data: Record<string, any>): string => {
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    if (!data.summary || !data.startDate) return '';
    let icsString = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LinkSpark//QR Event Generator//EN\nBEGIN:VEVENT\n';
    icsString += `SUMMARY:${data.summary}\n`;
    if (data.location) icsString += `LOCATION:${data.location}\n`;
    if (data.description) icsString += `DESCRIPTION:${data.description.replace(/\n/g, '\\n')}\n`;
    icsString += `DTSTART:${formatDate(data.startDate)}\n`;
    if (data.endDate) {
      icsString += `DTEND:${formatDate(data.endDate)}\n`;
    } else {
        // If no end date, make it a 1-hour event by default
        const endDate = new Date(data.startDate.getTime() + 60 * 60 * 1000);
        icsString += `DTEND:${formatDate(endDate)}\n`;
    }
    icsString += 'UID:' + Date.now() + '@linkspark.com\n';
    icsString += 'END:VEVENT\nEND:VCALENDAR';
    return icsString;
}

// Format Wi-Fi data
const formatWifi = (data: Record<string, any>): string => {
    const escapeValue = (value: string = '') => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');
    const ssid = escapeValue(data.wifi_ssid);
    const password = escapeValue(data.wifi_password);
    const encryption = data.wifi_encryption === 'None' ? 'nopass' : (data.wifi_encryption || 'WPA');
    const hidden = data.wifi_hidden ? 'true' : 'false';
    if (!ssid) return '';
    // Password is required unless encryption is 'nopass'
    if (encryption !== 'nopass' && !password) return '';
    return `WIFI:T:${encryption};S:${ssid};${encryption !== 'nopass' ? `P:${password};` : ''}H:${hidden};;`;
};

// Format UPI data
const formatUpi = (data: Record<string, any>): string => {
    const upiId = (data.upi_id || '').trim();
    const payeeName = (data.upi_name || '').trim(); // Optional payee name
    const amount = parseFloat(data.upi_amount || '0');
    const note = (data.upi_note || '').trim();

    // Basic validation
    if (!upiId || !upiId.includes('@')) {
         // Show a toast warning, but allow generation? Maybe better to prevent invalid QR.
         toast({ variant: "destructive", title: "Invalid UPI ID", description: "Please enter a valid UPI ID (e.g., name@bank)." });
         return ''; // Stop generation if invalid
    }
     // Amount validation: Must be positive. Allow 0 for "Pay Any Amount"? No, standard requires amount.
    if (isNaN(amount) || amount <= 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "UPI amount must be a positive number." });
        return ''; // Stop generation if invalid
    }

    let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;
    if (payeeName) {
        upiString += `&pn=${encodeURIComponent(payeeName)}`; // Add Payee Name
    }
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
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            // Restore context if clipped
            if (shape === 'circle') ctx.restore();

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
          case 'url': targetData = data.url?.trim() || ''; break;
          case 'text': targetData = data.text?.trim() || ''; break;
          case 'email':
            const emailTo = data.email?.trim();
            if (emailTo) targetData = `mailto:${emailTo}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
            break;
          case 'phone': targetData = data.phone?.trim() ? `tel:${data.phone.trim()}` : ''; break;
          case 'whatsapp':
            // Ensure only digits, and remove leading '+' if present
            const phoneNum = (data.whatsapp_phone || '').replace(/[^0-9]/g, '');
            targetData = phoneNum ? `https://wa.me/${phoneNum}?text=${encodeURIComponent(data.whatsapp_message || '')}` : '';
            break;
          case 'sms':
            const smsPhoneNum = (data.sms_phone || '').trim();
            targetData = smsPhoneNum ? `sms:${smsPhoneNum}?body=${encodeURIComponent(data.sms_message || '')}` : '';
            break;
          case 'location':
             // Requires both latitude and longitude
             if (data.latitude && data.longitude) targetData = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
             break;
          case 'event':
              targetData = formatICS({ summary: data.event_summary, location: data.event_location, description: data.event_description, startDate: data.event_start, endDate: data.event_end });
              break;
          case 'vcard':
               targetData = formatVCard({ firstName: data.vcard_firstName, lastName: data.vcard_lastName, organization: data.vcard_organization, title: data.vcard_title, phone: data.vcard_phone, mobile: data.vcard_mobile, email: data.vcard_email, website: data.vcard_website, address: data.vcard_address });
               break;
          case 'wifi':
               targetData = formatWifi({ wifi_ssid: data.wifi_ssid, wifi_password: data.wifi_password, wifi_encryption: data.wifi_encryption || 'WPA/WPA2', wifi_hidden: data.wifi_hidden || false });
               break;
          case 'upi': // Added UPI case
               targetData = formatUpi({ upi_id: data.upi_id, upi_name: data.upi_name, upi_amount: data.upi_amount, upi_note: data.upi_note });
               break;
          default: targetData = '';
        }
    } catch (error) {
        console.error(`Error generating QR data string for type ${type}:`, error);
        toast({ variant: "destructive", title: "Data Error", description: `Could not format data for ${type}. Please check your inputs.` });
        return '';
    }
    return targetData;
};


export function QrCodeGenerator() {
  // Core QR State
  const [qrType, setQrType] = useState<QrType>('url');
  const [inputData, setInputData] = useState<Record<string, any>>({ url: '' }); // Initialize with empty url
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

   // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null); // Ref for the container div

  // --- History Management ---

  // Load history from local storage on mount
  useEffect(() => {
    const loadedHistory = getLocalStorageItem<HistoryItem[]>(LOCAL_STORAGE_KEY, []);
    setHistory(loadedHistory);
  }, []);

  // Add item to history
  const addToHistory = useCallback((newItem: Omit<HistoryItem, 'id' | 'timestamp'>) => {
     // Basic validation before adding: Ensure there's data
     if (!generateQrDataString(newItem.qrType, newItem.inputData)) {
         // console.warn("Attempted to save empty or invalid QR code to history.");
         return;
     }

     const fullItem: HistoryItem = {
          ...newItem,
          id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, // More unique ID
          timestamp: Date.now(),
      };

    setHistory(prevHistory => {
      // Avoid adding duplicates (simple check based on data and type, could be more robust)
      const existingIndex = prevHistory.findIndex(item =>
          item.qrType === fullItem.qrType && JSON.stringify(item.inputData) === JSON.stringify(fullItem.inputData)
      );
      let newHistory: HistoryItem[];
      if (existingIndex > -1) {
          // Move existing item to the top instead of adding a duplicate
          const updatedHistory = [...prevHistory];
          const [existingItem] = updatedHistory.splice(existingIndex, 1);
          existingItem.timestamp = fullItem.timestamp; // Update timestamp
          existingItem.previewSvgDataUrl = fullItem.previewSvgDataUrl; // Update preview
          newHistory = [existingItem, ...updatedHistory].slice(0, MAX_HISTORY_ITEMS);
      } else {
          // Add new item
          newHistory = [fullItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
      }
      setLocalStorageItem(LOCAL_STORAGE_KEY, newHistory); // Save updated history
      return newHistory;
    });
  }, []);


   // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setLocalStorageItem(LOCAL_STORAGE_KEY, []);
    toast({ title: "History Cleared", description: "Your QR code generation history has been removed." });
  }, []);

  // Moved removeLogo definition higher
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
  }, []); // Ensure no missing dependencies if any are added later


  // --- QR Data Generation ---
  const generateQrData = useCallback((): string => {
      return generateQrDataString(qrType, inputData);
  }, [qrType, inputData]);


  // --- QR Code Instance & Preview Update ---
  useEffect(() => {
      const qrData = generateQrData();
      const hasData = !!qrData;
      setIsQrGenerated(hasData); // Update generated status

      const container = qrCodeRef.current;
      if (!container) return;

      let instance = qrCodeInstance;

      if (hasData) {
          const qrOptions = { ...options, data: qrData };
          try {
              if (!instance) {
                  // Create instance only if it doesn't exist
                  instance = new QRCodeStyling(qrOptions);
                  instance.append(container); // Append to the container div
                  setQrCodeInstance(instance);
              } else {
                  // Update existing instance - ensure update happens
                  instance.update(qrOptions);
              }

               // Generate SVG preview for history
                instance.getRawData('svg').then((blob) => {
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const svgDataUrl = reader.result as string;
                            setQrCodeSvgDataUrl(svgDataUrl); // Keep for history

                            // Save to history AFTER successful generation and preview update
                            addToHistory({
                                qrType: qrType,
                                inputData: { ...inputData },
                                options: {
                                    dotsOptions: options.dotsOptions,
                                    backgroundOptions: options.backgroundOptions,
                                    cornersSquareOptions: options.cornersSquareOptions,
                                    cornersDotOptions: options.cornersDotOptions,
                                    image: options.image,
                                    imageOptions: options.imageOptions,
                                    width: options.width,
                                    height: options.height,
                                },
                                label: qrLabel,
                                previewSvgDataUrl: svgDataUrl,
                            });
                        };
                        reader.readAsDataURL(blob);
                    } else {
                        setQrCodeSvgDataUrl(null);
                    }
                }).catch(error => {
                    console.error("Error getting SVG data for history:", error);
                    setQrCodeSvgDataUrl(null);
                });

          } catch (error) {
              console.error("Error creating/updating QR code instance:", error);
              setQrCodeSvgDataUrl(null);
              setQrCodeInstance(null);
              setIsQrGenerated(false);
              // Attempt to clear the container if error occurs
               if (container) container.innerHTML = '';
              toast({ variant: "destructive", title: "QR Generation Error", description: "Could not create the QR code. Check data or try again." });
          }

      } else {
          // No data or invalid data, clear preview and instance
          setQrCodeSvgDataUrl(null);
          if (instance && container) {
               // Attempt to safely remove the QR code element
               try {
                   // Find the canvas or svg child added by the library
                   const qrElement = container.querySelector('canvas') || container.querySelector('svg');
                   if (qrElement && container.contains(qrElement)) {
                       container.removeChild(qrElement);
                   } else {
                        // Fallback if direct child not found (less likely but safe)
                        container.innerHTML = '';
                   }
               } catch (removeError) {
                   console.warn("Error removing QR code from container:", removeError);
                   // Aggressive fallback: clear innerHTML
                   container.innerHTML = '';
               }
          }
          setQrCodeInstance(null); // Ensure instance is nullified
      }
       // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, qrType, inputData, qrLabel, addToHistory]); // Added addToHistory


   // Reload settings from a history item
  const loadFromHistory = useCallback((item: HistoryItem) => {
    setQrType(item.qrType);
    setInputData(item.inputData);
    // Reconstruct full options from stored partial options + defaults
    setOptions(prev => ({
        ...defaultOptions, // Start with defaults
        ...prev,          // Keep existing non-customizable options (like 'type: svg')
        ...item.options,  // Apply stored customizable options
        data: generateQrDataString(item.qrType, item.inputData) // Regenerate data string
    }));
    setQrLabel(item.label);
    // No need to set svg data url here, the main useEffect will handle it
    // setQrCodeSvgDataUrl(item.previewSvgDataUrl);

    // Attempt to reconstruct logo state
    if (item.options?.image) {
        setLogoPreviewUrl(item.options.image);
        setOriginalLogoUrl(null); // Assume we don't have the original when loading history
        setLogoSize(item.options.imageOptions?.imageSize ? item.options.imageOptions.imageSize * 100 : 40);
        setLogoShape('square'); // Default assumption
        setLogoOpacity(100); // Default assumption
    } else {
        removeLogo(); // Clear logo if none in history item
    }

    // Reset expiry state
    setExpiryDate(undefined);
    setExpiryTime("00:00");

    setQrPreviewKey(Date.now()); // Force re-render of related components if needed
    toast({ title: "Loaded from History", description: `Restored QR code configuration from ${format(item.timestamp, 'PP pp')}.` });
  }, [removeLogo]); // Use removeLogo from outer scope


  // --- Input Handlers ---
  const handleInputChange = (key: string, value: any) => {
    // Validation for numeric fields
    if ((key === 'latitude' || key === 'longitude' || key === 'upi_amount') && value && isNaN(Number(value))) {
         toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid number." });
         return;
    }
     if (key === 'upi_amount' && Number(value) < 0) {
         toast({ variant: "destructive", title: "Invalid Amount", description: "Amount cannot be negative." });
         // Optionally reset or clamp the value: setInputData(prev => ({ ...prev, [key]: '0.01' }));
         return;
     }

    setInputData(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    setInputData(prev => ({ ...prev, [key]: checked }));
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

 const handleHideDotsChange = (checked: boolean) => {
     setOptions(prev => ({
         ...prev,
         imageOptions: { ...(prev.imageOptions ?? defaultOptions.imageOptions), hideBackgroundDots: checked }
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
 }, [logoSize, logoShape, logoOpacity, options.imageOptions]); // Include dependencies


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
 }, [logoShape, logoOpacity, applyLogoShapeAndOpacity]);

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
         setExpiryDate(undefined);
         // Optionally reset time input if date is cleared
         if (!date) setExpiryTime("00:00");
         toast({ title: "Expiry Removed", description: "QR code expiry marker removed." });
     }
 };


 // --- Download ---
  const onDownloadClick = useCallback(async () => {
      const qrData = generateQrData();
       if (!qrCodeInstance || !qrData || !isQrGenerated) {
          toast({ variant: "destructive", title: "Cannot Download", description: "Please generate a valid QR code first." });
          return;
      }
      // Note: Real expiry needs backend logic. This is just a visual marker.
      if (expiryDate) toast({ title: "Download Info", description: "Note: Expiry is a visual marker only.", duration: 5000 });

      // Recreate options object for download to ensure fresh data and correct type
      const downloadOptions: QRCodeStylingOptions = {
          ...options,
          data: qrData, // Use currently generated data
          type: fileExtension === 'svg' ? 'svg' : 'canvas', // Set type based on extension
          width: options.width ?? defaultOptions.width, // Use current size or default
          height: options.height ?? defaultOptions.height,
      };

      // Create a temporary instance specifically for download
      // This prevents potential issues if the main instance is modified during download
      const downloadInstance = new QRCodeStyling(downloadOptions);


      try {
            await downloadInstance.download({ name: `linkspark-qr-${qrType}`, extension: fileExtension as Extension });
            toast({ title: "Download Started", description: `QR code downloading as ${fileExtension.toUpperCase()}.` });
      } catch (error) {
          console.error("Error downloading QR code:", error);
          toast({ variant: "destructive", title: "Download Failed", description: "Could not download the QR code. Please try again." });
      }
  }, [qrCodeInstance, options, fileExtension, qrType, generateQrData, isQrGenerated, expiryDate]); // Added expiryDate dependency


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
                        case 'vcard':
                            return (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Required fields grouped */}
                                    <fieldset className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                                         <legend className="text-sm font-medium px-1">Name (Required*)</legend>
                                        <div className="space-y-2">
                                            <Label htmlFor="vcard-firstName">First Name *</Label>
                                            <Input id="vcard-firstName" value={inputData.vcard_firstName || ''} onChange={(e) => handleInputChange('vcard_firstName', e.target.value)} placeholder="John" required/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vcard-lastName">Last Name *</Label>
                                            <Input id="vcard-lastName" value={inputData.vcard_lastName || ''} onChange={(e) => handleInputChange('vcard_lastName', e.target.value)} placeholder="Doe" required/>
                                        </div>
                                         <p className="text-xs text-muted-foreground md:col-span-2">* At least First or Last Name is required.</p>
                                    </fieldset>

                                    {/* Optional fields grouped */}
                                     <fieldset className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                                         <legend className="text-sm font-medium px-1">Contact Info (Optional)</legend>
                                        <div className="space-y-2">
                                            <Label htmlFor="vcard-phone">Work Phone</Label>
                                            <Input id="vcard-phone" type="tel" value={inputData.vcard_phone || ''} onChange={(e) => handleInputChange('vcard_phone', e.target.value)} placeholder="+1-555-1234" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vcard-mobile">Mobile Phone</Label>
                                            <Input id="vcard-mobile" type="tel" value={inputData.vcard_mobile || ''} onChange={(e) => handleInputChange('vcard_mobile', e.target.value)} placeholder="+1-555-5678" />
                                        </div>
                                         <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="vcard-email">Email</Label>
                                            <Input id="vcard-email" type="email" value={inputData.vcard_email || ''} onChange={(e) => handleInputChange('vcard_email', e.target.value)} placeholder="john.doe@example.com" />
                                        </div>
                                    </fieldset>

                                    <fieldset className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                                         <legend className="text-sm font-medium px-1">Work Details (Optional)</legend>
                                        <div className="space-y-2">
                                            <Label htmlFor="vcard-organization">Organization</Label>
                                            <Input id="vcard-organization" value={inputData.vcard_organization || ''} onChange={(e) => handleInputChange('vcard_organization', e.target.value)} placeholder="Acme Inc." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vcard-title">Job Title</Label>
                                            <Input id="vcard-title" value={inputData.vcard_title || ''} onChange={(e) => handleInputChange('vcard_title', e.target.value)} placeholder="Software Engineer" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vcard-website">Website</Label>
                                            <Input id="vcard-website" type="url" value={inputData.vcard_website || ''} onChange={(e) => handleInputChange('vcard_website', e.target.value)} placeholder="https://johndoe.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vcard-address">Address</Label>
                                            <Textarea id="vcard-address" value={inputData.vcard_address || ''} onChange={(e) => handleInputChange('vcard_address', e.target.value)} placeholder="123 Main St, Anytown, USA" rows={2} />
                                        </div>
                                    </fieldset>
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


  // --- Render History Items ---
 const renderHistoryItem = (item: HistoryItem) => {
    const Icon = qrTypeOptions.find(opt => opt.value === item.qrType)?.icon || QrCodeIcon;
    const description = item.label || `${item.qrType.toUpperCase()} QR`;
    return (
      <div key={item.id} className="flex items-center justify-between gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => loadFromHistory(item)}>
        <div className="flex items-center gap-3 overflow-hidden">
          {item.previewSvgDataUrl ? (
            <img src={item.previewSvgDataUrl} alt="QR Preview" className="h-10 w-10 rounded border object-contain bg-white shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-grow overflow-hidden">
            <p className="text-sm font-medium truncate" title={description}>{description}</p>
            <p className="text-xs text-muted-foreground">{format(item.timestamp, 'MMM d, HH:mm')}</p>
          </div>
        </div>
        {/* Reload button is now redundant as the whole item is clickable */}
        {/* <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); loadFromHistory(item); }} aria-label="Reload this QR code">
          <RefreshCcw className="h-4 w-4" />
        </Button> */}
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
             {/* Tabs for Content & History */}
             <Tabs defaultValue="content" className="w-full">
                 {/* Use full width tabs on small screens */}
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="content"><QrCodeIcon className="inline-block mr-1 h-4 w-4" /> Content</TabsTrigger>
                    <TabsTrigger value="history"><HistoryIcon className="inline-block mr-1 h-4 w-4" /> History</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="pt-6 space-y-6">
                    {/* Accordion for Content, Styling, Logo, Extras */}
                    <Accordion type="single" collapsible className="w-full" defaultValue="content-item">
                         {/* Step 1: Content */}
                        <AccordionItem value="content-item">
                             <AccordionTrigger className="text-lg font-semibold">
                                <span className="flex items-center gap-2"><QrCodeIcon className="h-5 w-5"/> 1. Content</span>
                             </AccordionTrigger>
                             <AccordionContent className="pt-4 space-y-6">
                                {/* QR Type Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="qr-type">Select QR Code Type</Label>
                                    <Select onValueChange={(value: QrType) => { setQrType(value); setInputData({}); setExpiryDate(undefined); setQrLabel(''); }} value={qrType}>
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
                                     <Label htmlFor="qr-size">QR Code Size ({options.width}px)</Label>
                                     <div className="flex items-center gap-2">
                                        <Slider id="qr-size" value={[options.width ?? 256]} min={100} max={1000} step={4} onValueChange={handleQrSizeChange} aria-label="QR Code Size Slider"/>
                                        <span className='text-sm w-14 text-right'>{options.width} px</span>
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
                                            <Checkbox id="hide-dots" checked={options.imageOptions?.hideBackgroundDots} onCheckedChange={(checked) => handleHideDotsChange(Boolean(checked))}/>
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
                                <span className="flex items-center gap-2"><Settings2 className="h-5 w-5"/> 4. Extras</span>
                            </AccordionTrigger>
                             <AccordionContent className="pt-4 space-y-6">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                     {/* Label */}
                                     <div className="space-y-2">
                                         <Label htmlFor="qr-label">Label Text (Visual Only)</Label>
                                         <Input id="qr-label" type="text" value={qrLabel} onChange={(e) => setQrLabel(e.target.value)} placeholder="e.g., Scan Me!" maxLength={30} />
                                         <p className="text-xs text-muted-foreground">Appears below the preview, not in the QR code.</p>
                                     </div>

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

                 {/* History Tab */}
                <TabsContent value="history" className="pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Generation History</Label>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={history.length === 0}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Clear History
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete your QR code generation history from this browser. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={clearHistory}>Yes, Clear History</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <ScrollArea className="h-[450px] w-full border rounded-md">
                        {history.length > 0 ? (
                            history.map(renderHistoryItem)
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <HistoryIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground">No history yet.</p>
                                <p className="text-xs text-muted-foreground">Generated QR codes will appear here.</p>
                            </div>
                        )}
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground">History is saved locally in your browser.</p>
                </TabsContent>

             </Tabs>

          </CardContent>
        </Card>

        {/* QR Preview Panel */}
        <Card key={qrPreviewKey} className="lg:col-span-1 order-1 lg:order-2 sticky top-6 self-start animate-fade-in [animation-delay:0.2s]">
          <CardHeader>
            <CardTitle>4. Preview & Download</CardTitle>
            <CardDescription>Review your QR code and download it.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
             {/* Responsive container for QR code */}
             <div ref={qrCodeRef} className="border rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-white p-2 relative w-full max-w-[256px] sm:max-w-[300px] lg:max-w-full aspect-square mx-auto" style={{ minHeight: '150px' /* Ensure a minimum height */ }}>
                 {/* QR code will be appended here by the library */}
                {!isQrGenerated && (
                     <div className="text-muted-foreground text-center p-4 flex flex-col items-center justify-center h-full absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg">
                         <QrCodeIcon className="h-12 w-12 mb-2 text-muted-foreground/50"/>
                         <span>Enter data to generate QR code.</span>
                     </div>
                 )}
            </div>
             {qrLabel && (
                <p className="font-medium text-center mt-1 text-sm">{qrLabel}</p>
            )}
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

