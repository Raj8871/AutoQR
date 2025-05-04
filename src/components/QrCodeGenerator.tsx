'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCodeStyling, { type Options as QRCodeStylingOptions, type FileExtension, type DotType, type CornerSquareType, type CornerDotType, Extension } from 'qr-code-styling';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from "@/components/ui/slider";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Download, Image as ImageIcon, Link as LinkIcon, Phone, Mail, MessageSquare, MapPin, Calendar as CalendarIcon, Settings2, Palette, Clock, Wifi, Upload, Check, Trash2, Info, Eye, EyeOff, QrCode as QrCodeIcon, RefreshCcw, Star, Sparkles, Shapes, CreditCard, Copy, Pencil, StarIcon, Share2, X, QrCode, History, Gift, Music, User, Lock, Mic, PlayCircle, PauseCircle, FileAudio, Save, DownloadCloud, Zap, Paintbrush, ShieldCheck, Contact, FileText, ExternalLink, Search // Added Search icon
} from 'lucide-react';
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { useToast, type Toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { logFirebaseEvent } from '@/lib/firebase'; // Import logFirebaseEvent
import { z } from 'zod';


// --- Types ---

// Define allowed QR types
type QrType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'sms' | 'location' | 'event' | 'wifi' | 'vcard' | 'upi' | 'audio-image';

// Define structure for history items
interface HistoryItem {
  id: string;
  type: QrType;
  data: Record<string, any>; // Original input data
  options: QRCodeStylingOptions;
  timestamp: number;
  label?: string;
  qrCodeSvgDataUrl: string | null; // Store the preview SVG
}

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
  { value: 'vcard', label: 'Contact (vCard)', icon: Contact, description: 'Share contact details in a standard vCard format.' },
  { value: 'upi', label: 'UPI Payment', icon: CreditCard, description: 'Generate a QR for UPI payments with a specific amount and note.' },
   { value: 'audio-image', label: 'Voice Gift Card', icon: Gift, description: 'Combine an image and audio message into a scannable gift card style page.' },
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
  data: '', // Default empty data
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
const setLocalStorageItem = <T>(key: string, value: T, toastFn?: (options: Omit<Toast, 'id'>) => void): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error);
     toastFn?.({ variant: "destructive", title: "Storage Error", description: "Could not save. Local storage might be full or disabled." });
  }
};


// Format ICS data
const formatICS = (data: Record<string, any>, toastFn: (options: Omit<Toast, 'id'>) => void): string => {
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
        toastFn({ variant: "destructive", title: "Invalid Start Date", description: "Please select a valid start date and time." });
        return '';
    }
    icsString += `DTSTART:${formatDate(startDate)}\n`;

    if (data.event_end) {
      const endDate = new Date(data.event_end);
       // Ensure end date is after start date
       if (endDate <= startDate) {
           toastFn({ variant: "destructive", title: "Invalid End Date", description: "End date must be after the start date." });
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
              toastFn({ variant: "destructive", title: "Invalid Start Date", description: "Could not calculate default end date." });
              return ''; // Prevent generation if start date was bad
         }
    }
    icsString += 'UID:' + Date.now() + '@linkspark.com\n'; // Unique ID for the event
    icsString += 'END:VEVENT\nEND:VCALENDAR';
    return icsString;
}

// Format Wi-Fi data
const formatWifi = (data: Record<string, any>, toastFn: (options: Omit<Toast, 'id'>) => void): string => {
    // Escape special characters: \, ;, ,, ", :
    const escapeValue = (value: string = '') => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');

    const ssid = escapeValue(data.wifi_ssid);
    const password = escapeValue(data.wifi_password);
    const encryption = data.wifi_encryption === 'None' ? 'nopass' : (data.wifi_encryption || 'WPA'); // Default to WPA if not None
    const hidden = data.wifi_hidden ? 'true' : 'false';

    if (!ssid) {
        // toastFn({ variant: "destructive", title: "SSID Required", description: "Network Name (SSID) cannot be empty." });
        return ''; // SSID is mandatory, but don't toast immediately for better UX
    }

    // Password is required unless encryption is 'nopass'
    if (encryption !== 'nopass' && !password) {
        // toastFn({ variant: "destructive", title: "Password Required", description: "Password is required for WPA/WEP encryption." });
         return ''; // Password mandatory for secured networks, but don't toast immediately
    }

    // Construct the string: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
    return `WIFI:T:${encryption};S:${ssid};${encryption !== 'nopass' ? `P:${password};` : ''}H:${hidden};;`;
};

// Format vCard data
const formatVCard = (data: Record<string, any>, toastFn: (options: Omit<Toast, 'id'>) => void): string => {
    let vCardString = 'BEGIN:VCARD\nVERSION:3.0\n';

    // Required fields: First Name and Last Name (or Full Name)
    const firstName = (data.vcard_firstName || '').trim();
    const lastName = (data.vcard_lastName || '').trim();
    const fullName = (data.vcard_fullName || '').trim() || `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName) {
        // Don't toast immediately, rely on generateQrDataString feedback
        return '';
    }

    vCardString += `N:${lastName};${firstName};;;\n`; // Last Name; First Name; Middle Name; Prefix; Suffix
    vCardString += `FN:${fullName}\n`;

    // Optional fields
    if (data.vcard_organization) vCardString += `ORG:${data.vcard_organization}\n`;
    if (data.vcard_title) vCardString += `TITLE:${data.vcard_title}\n`;
    if (data.vcard_phone) vCardString += `TEL;TYPE=WORK,VOICE:${data.vcard_phone}\n`;
    if (data.vcard_email) vCardString += `EMAIL:${data.vcard_email}\n`;
    if (data.vcard_website) vCardString += `URL:${data.vcard_website}\n`;
    if (data.vcard_address) vCardString += `ADR;TYPE=WORK:;;${data.vcard_address};;;;\n`; // PO Box; Extended Address; Street Address; Locality (City); Region (State); Postal Code; Country
    if (data.vcard_note) vCardString += `NOTE:${data.vcard_note}\n`;


    vCardString += 'END:VCARD';
    return vCardString;
};


// Format UPI data
const formatUpi = (data: Record<string, any>, toastFn: (options: Omit<Toast, 'id'>) => void): string => {
    const upiId = (data.upi_id || '').trim();
    const payeeName = (data.upi_name || '').trim(); // Optional payee name
    const amount = parseFloat(data.upi_amount || '0');
    const note = (data.upi_note || '').trim();

    // Basic validation
    if (!upiId || !upiId.includes('@')) {
         if (upiId) { // Only toast if the user actually entered something invalid
             toastFn({ variant: "destructive", title: "Invalid UPI ID", description: "Please enter a valid UPI ID (e.g., name@bank)." });
         }
         return ''; // Stop generation if invalid
    }
     // Amount validation: Must be positive if entered
    if (data.upi_amount && (isNaN(amount) || amount <= 0)) {
        toastFn({ variant: "destructive", title: "Invalid Amount", description: "UPI amount must be a positive number." });
        return ''; // Stop generation if invalid
    }
     // Amount required for UPI
     if (!data.upi_amount || isNaN(amount) || amount <= 0) {
        // Don't toast immediately, rely on generateQrDataString for feedback
        return ''; // Stop generation if amount is missing or invalid, don't toast immediately
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
const generateQrDataString = (type: QrType, data: Record<string, any>, toastFn: (options: Omit<Toast, 'id'>) => void): string => {
    let targetData = '';
    const MAX_DATA_LENGTH_WARN = 2000; // Lower warning threshold for complex data like Data URIs or vCards
    const MAX_DATA_LENGTH_FAIL = 2953; // Absolute max for alphanumeric in QR spec (Level L, adjust if using higher EC)

    try {
         switch (type) {
          case 'url':
             const url = data.url?.trim();
             if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:'))) {
                targetData = url;
             } else if (url) {
                 if (!url.includes('://') && url.includes('.')) {
                    targetData = `https://${url}`;
                 } else {
                    toastFn({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid URL starting with http:// or https://." });
                    return '';
                 }
             } else {
                 targetData = ''; // Empty URL is valid for preview, generates no QR
             }
             break;
          case 'text':
                targetData = data.text?.trim() || '';
                if (!targetData) {
                     return ''; // Empty text, don't toast immediately
                }
                break;
          case 'email':
            const emailTo = data.email?.trim();
             if (emailTo && emailTo.includes('@')) {
                 targetData = `mailto:${emailTo}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
             } else if (emailTo) {
                  toastFn({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
                  return '';
             } else {
                  return ''; // Empty email, don't toast immediately
             }
            break;
          case 'phone':
                targetData = data.phone?.trim() ? `tel:${data.phone.trim()}` : '';
                if (!targetData) {
                    return ''; // Empty phone, don't toast immediately
                }
                break;
          case 'whatsapp':
            const phoneNum = (data.whatsapp_phone || '').replace(/[^0-9+]/g, '');
            if (phoneNum && phoneNum.length > 5) {
                 targetData = `https://wa.me/${phoneNum.replace('+', '')}?text=${encodeURIComponent(data.whatsapp_message || '')}`;
            } else if (data.whatsapp_phone) {
                toastFn({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid WhatsApp number including country code." });
                return '';
            } else {
                 return ''; // Empty WhatsApp number, don't toast immediately
            }
            break;
          case 'sms':
            const smsPhoneNum = (data.sms_phone || '').trim();
            if (smsPhoneNum) {
                 targetData = `sms:${smsPhoneNum}?body=${encodeURIComponent(data.sms_message || '')}`;
            } else {
                 return ''; // Empty SMS number, don't toast immediately
            }
            break;
          case 'location':
             const lat = parseFloat(data.latitude);
             const lon = parseFloat(data.longitude);
             if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                 targetData = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
             } else if (data.latitude || data.longitude) {
                  toastFn({ variant: "destructive", title: "Invalid Coordinates", description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)." });
                  return '';
             } else {
                  return ''; // Empty coordinates, don't toast immediately
             }
             break;
          case 'event':
              targetData = formatICS(data, toastFn);
              if (!targetData && (data.event_summary || data.event_start)) {
                 return '';
              }
              if (!targetData && !data.event_summary && !data.event_start) {
                  return '';
              }
              break;
          case 'wifi':
               targetData = formatWifi(data, toastFn);
               if (!targetData && (data.wifi_ssid)) {
                    return '';
               }
               if (!targetData && !data.wifi_ssid) {
                    return '';
               }
               break;
           case 'vcard':
                targetData = formatVCard(data, toastFn);
                if (!targetData && (data.vcard_firstName || data.vcard_lastName)) {
                    return '';
                }
                if (!targetData && !data.vcard_firstName && !data.vcard_lastName) {
                     return '';
                }
                break;
          case 'upi':
               targetData = formatUpi(data, toastFn);
               if (!targetData && (data.upi_id || data.upi_amount)) {
                  return '';
               }
                if (!targetData && (!data.upi_id || !data.upi_amount)) {
                   return '';
                }
               break;
          case 'audio-image':
                const audioUrl = data.audioUrl || '';
                const imageUrl = data.imageUrl || '';
                // Basic validation
                if (!audioUrl || !imageUrl) {
                    // Don't toast immediately if files aren't uploaded yet
                    return '';
                }
                 // Simulate generating a link to a landing page. In a real app, this would be a server endpoint.
                 // For demo purposes, we encode the data URLs directly, which can make the QR huge.
                 // A better approach would be to upload files and link to a page: /play?audio=id&image=id
                 // targetData = `/play?audio=${encodeURIComponent(audioUrl)}&image=${encodeURIComponent(imageUrl)}`;

                 // Simple simulation for client-side only (WILL CREATE VERY LARGE QR)
                 const pageContent = `
                 <!DOCTYPE html><html><head><title>Voice Gift</title>
                 <meta name="viewport" content="width=device-width, initial-scale=1">
                 <style>body{margin:0;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;} .card{background:white;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);padding:20px;text-align:center;max-width:90%;} img{max-width:100%;height:auto;border-radius:5px;margin-bottom:15px;} audio{width:100%;margin-top:10px;}</style>
                 </head><body><div class="card">
                 <img src="${imageUrl}" alt="Gift Image">
                 <audio controls autoplay src="${audioUrl}">Your browser does not support the audio element.</audio>
                 </div></body></html>`;
                 targetData = `data:text/html;charset=utf-8,${encodeURIComponent(pageContent)}`;

                break;
          default: targetData = '';
        }
    } catch (error) {
        console.error(`Error generating QR data string for type ${type}:`, error);
        toastFn({ variant: "destructive", title: "Data Error", description: `Could not format data for ${type}. Please check your inputs.` });
        return '';
    }

    // Final check for excessively long data
     if (targetData.length > MAX_DATA_LENGTH_FAIL) {
         console.error(`QR data exceeds maximum length (${targetData.length} > ${MAX_DATA_LENGTH_FAIL}). Cannot generate.`);
         toastFn({
             variant: "destructive",
             title: "Data Too Long",
             description: `Input data is too long (${targetData.length} characters) and exceeds the QR code limit (~${MAX_DATA_LENGTH_FAIL} chars). Please shorten it, use smaller files, or use a service that generates shorter links. QR Generation might fail.`,
             duration: 10000
         });
     } else if (targetData.length > MAX_DATA_LENGTH_WARN) {
         console.warn(`QR data for type ${type} is very long (${targetData.length} chars). Scanability might be reduced.`);
         toastFn({
             variant: "default", // Warning, not error yet
             title: "Data Length Warning",
             description: `The input data is quite long (${targetData.length} characters). The generated QR code might be complex and harder to scan, especially on lower-resolution screens or when printed small. Consider shortening text or simplifying data if possible.`,
             duration: 8000
         });
     }

    return targetData;
};



// --- QrCodeGenerator Component ---
const QrCodeGenerator = () => { // Changed to default export
  const { toast } = useToast(); // Get toast instance

  // Core QR State
  const [qrType, setQrType] = useState<QrType>('url');
  const [inputDataState, setInputDataState] = useState<Record<string, any>>({ url: '' });
  const [options, setOptions] = useState<QRCodeStylingOptions>(defaultOptions);
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);
  const [qrCodeSvgDataUrl, setQrCodeSvgDataUrl] = useState<string | null>(null);
  const [isQrGenerated, setIsQrGenerated] = useState<boolean>(false);
  const [qrPreviewKey, setQrPreviewKey] = useState<number>(Date.now());

  // Customization State
  const [fileExtension, setFileExtension] = useState<FileExtension>('png');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<number>(defaultOptions.imageOptions?.imageSize ? defaultOptions.imageOptions.imageSize * 100 : 40);
  const [logoShape, setLogoShape] = useState<'square' | 'circle'>('square');
  const [logoOpacity, setLogoOpacity] = useState<number>(100);
  const [qrLabel, setQrLabel] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [expiryTime, setExpiryTime] = useState<string>("00:00");
  const [wifiPasswordVisible, setWifiPasswordVisible] = useState<boolean>(false);

    // Audio/Image Combo State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);


  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);



  // --- Load History ---
  useEffect(() => {
    const loadedHistory = getLocalStorageItem<HistoryItem[]>('qrHistory', []);
    setHistory(loadedHistory.filter(item => item && item.id && item.type && item.data && item.options && item.timestamp));
  }, []);


  // --- Logo Handling ---
   const removeLogo = useCallback(() => {
     setOriginalLogoUrl(null);
     setLogoPreviewUrl(null);
     setOptions(prev => ({
         ...prev,
         image: '',
         imageOptions: {
             ...(prev.imageOptions ?? defaultOptions.imageOptions),
             margin: 5,
             imageSize: 0.4
         },
     }));
     setLogoSize(40);
     setLogoShape('square');
     setLogoOpacity(100);
     if (logoInputRef.current) logoInputRef.current.value = '';
     // Clear logoUrl from inputDataState as well
     setInputDataState(prev => {
         const { logoUrl, ...rest } = prev;
         return rest;
     });
  }, []);


  // --- QR Data Generation ---
  const generateQrData = useCallback((): string => {
      return generateQrDataString(qrType, inputDataState, toast);
  }, [qrType, inputDataState, toast]);


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
      const width = typeof options.width === 'number' ? options.width : defaultOptions.width!;
      const height = typeof options.height === 'number' ? options.height : defaultOptions.height!;

      const qrOptions = { ...options, data: qrData, width, height };


      const updateQrCode = async () => {
           try {
               // Clear previous content only if an instance exists and the container is not empty
                if (instance && container && container.firstChild) {
                    // Check if the first child belongs to the current QR instance before removing
                    // This requires a reliable way to associate the DOM element with the instance,
                    // which qr-code-styling doesn't directly provide.
                    // A safer approach is to always clear and re-append if necessary.
                    while (container.firstChild) {
                        container.removeChild(container.firstChild);
                    }
                    instance = null; // Mark instance as removed from DOM
                    setQrCodeInstance(null);
                }

                if (!hasData) {
                    setQrCodeSvgDataUrl(null);
                    // Instance is already null or cleared above
                    return;
                }

                // Re-create and append instance if data exists
                instance = new QRCodeStyling(qrOptions);
                instance.append(container);
                didAppend = true;
                setQrCodeInstance(instance);


                // Generate SVG preview for history *after* successful generation/update
                if (instance && hasData) {
                   if (qrData) { // Log only if data is valid
                        logFirebaseEvent('qr_code_generated', { qrType: qrType });
                   }

                   await new Promise(resolve => setTimeout(resolve, 50));
                   const blob = await instance.getRawData('svg');
                    if (blob) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const svgDataUrl = reader.result as string;
                            setQrCodeSvgDataUrl(svgDataUrl);
                        };
                        reader.onerror = () => setQrCodeSvgDataUrl(null);
                        reader.readAsDataURL(blob);
                    } else {
                        console.warn("Failed to get raw SVG data from QR instance.");
                        setQrCodeSvgDataUrl(null);
                    }
                } else {
                     setQrCodeSvgDataUrl(null);
                }

           } catch (error: any) {
                console.error("Error creating/updating QR code instance:", error);
                 if (error?.message?.includes("overflow")) {
                    toast({ variant: "destructive", title: "QR Generation Error", description: `Data is too long for the QR code standard. Please shorten input or use smaller files. (${error.message})`, duration: 7000 });
                } else {
                     toast({ variant: "destructive", title: "QR Generation Error", description: `Could not create/update QR code: ${(error as Error).message}` });
                }
               setQrCodeSvgDataUrl(null);
               setQrCodeInstance(null); // Ensure instance state is cleared on error
               setIsQrGenerated(false);
                // Clear container content on error
                if (container) {
                   try {
                       while (container.firstChild) {
                            container.removeChild(container.firstChild);
                       }
                   } catch {
                        // Ignore cleanup errors
                   }
               }
           }
      };

      const debounceTimeout = setTimeout(updateQrCode, 300);

       return () => {
            clearTimeout(debounceTimeout);
            // Clean up instance when component unmounts or dependencies change drastically
            // This might still have race conditions, careful testing needed.
             if (qrCodeInstance && qrCodeRef.current && qrCodeRef.current.contains(qrCodeInstance._canvas?._element)) {
                try {
                     // qrCodeInstance.current?._canvas?._element?.remove(); // Attempt removal
                } catch (e) {
                     console.warn("Ignoring QR instance cleanup error:", e);
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, qrType, inputDataState, toast]); // Re-added qrCodeInstance as dependency, needs careful checking


   // --- History Management ---
 const saveToHistory = useCallback(() => {
     const qrData = generateQrData();
     if (!qrData || !isQrGenerated || !qrCodeSvgDataUrl) {
         toast({ variant: "destructive", title: "Cannot Save", description: "Please ensure a valid QR code is generated and previewed." });
         return;
     }

     const newItem: HistoryItem = {
       id: Date.now().toString(),
       type: qrType,
       data: { ...inputDataState },
       options: { ...options, data: '' }, // Clear data for storage efficiency
       timestamp: Date.now(),
       label: qrLabel || `${qrTypeOptions.find(opt => opt.value === qrType)?.label || qrType} - ${format(new Date(), 'PP p')}`, // Use type label if no custom label
       qrCodeSvgDataUrl: qrCodeSvgDataUrl,
     };

     const isDuplicate = history.some(item =>
         item.type === newItem.type &&
         JSON.stringify(item.data) === JSON.stringify(newItem.data) &&
         JSON.stringify(item.options) === JSON.stringify(newItem.options)
      );

     if (isDuplicate) {
        toast({ title: "Already in History", description: "This exact QR configuration is already saved." });
        return;
     }


     setHistory(prev => {
        const updatedHistory = [newItem, ...prev].slice(0, 50); // Keep max 50 items
        setLocalStorageItem('qrHistory', updatedHistory, toast);
        logFirebaseEvent('qr_history_saved', { qrType: qrType, itemCount: updatedHistory.length });
        toast({ title: "Saved to History", description: `"${newItem.label || 'Item'}" added.` });
        return updatedHistory;
     });
 }, [generateQrData, qrCodeSvgDataUrl, qrType, inputDataState, options, qrLabel, history, toast, isQrGenerated]);


   // --- Logo Shape and Opacity Application ---
   const applyLogoShapeAndOpacity = useCallback(async (imageUrl: string, shape: 'square' | 'circle', opacity: number) => {
     try {
       const currentImageOptions = options.imageOptions ?? defaultOptions.imageOptions!;
       const imageSize = Math.max(0.1, Math.min(0.5, logoSize / 100));
       const hideDots = currentImageOptions.hideBackgroundDots ?? true;
       const margin = currentImageOptions.margin ?? 5;

       const processingCanvasSize = 200; // Internal processing size
       const processedImageUrl = await processImage(imageUrl, shape, processingCanvasSize, opacity);

       setLogoPreviewUrl(processedImageUrl);
        setOptions(prev => ({
            ...prev,
            image: processedImageUrl, // Use processed image for QR library
            imageOptions: {
                ...currentImageOptions,
                imageSize: imageSize,
                hideBackgroundDots: hideDots,
                margin: margin,
             }
        }));
     } catch (error) {
         console.error("Error processing logo image:", error);
         toast({ variant: "destructive", title: "Logo Error", description: "Could not process the logo image. Using original." });
         setLogoPreviewUrl(imageUrl); // Fallback to original if processing fails
          setOptions(prev => ({
              ...prev,
              image: imageUrl,
               imageOptions: {
                 ...(options.imageOptions ?? defaultOptions.imageOptions!),
                 imageSize: Math.max(0.1, Math.min(0.5, logoSize / 100)),
              }
          }));
     }
  }, [logoSize, options.imageOptions, toast]); // Removed 'options' dependency, kept imageOptions


 const loadFromHistory = useCallback((item: HistoryItem) => {
     logFirebaseEvent('qr_history_loaded', { qrType: item.type });

     setQrType(item.type);
     setInputDataState({ ...item.data });

     // Regenerate data string based on loaded type and data FIRST
     const regeneratedQrData = generateQrDataString(item.type, item.data, toast);
     const restoredOptions = { ...item.options, data: regeneratedQrData }; // Use regenerated data

     setOptions(restoredOptions); // Set options AFTER regenerating data

     if (item.options.image && item.data.logoUrl) { // Check for original logo URL in data
         const originalSavedLogo = item.data.logoUrl;
         const currentLogoShape = item.data.logoShape || 'square';
         const currentLogoOpacity = (item.data.logoOpacity || 100); // Use percentage
         const currentLogoSize = (item.options.imageOptions?.imageSize ?? 0.4) * 100;

         setOriginalLogoUrl(originalSavedLogo);
         setLogoSize(currentLogoSize);
         setLogoShape(currentLogoShape);
         setLogoOpacity(currentLogoOpacity);

         // Re-apply shape/opacity using the original logo URL
         applyLogoShapeAndOpacity(originalSavedLogo, currentLogoShape, currentLogoOpacity / 100); // Pass opacity as 0-1

     } else {
          removeLogo(); // Clear logo if none in history item or original URL missing
     }

      // Reset Audio/Image previews if loading a different type
     if (item.type !== 'audio-image') {
         setAudioFile(null);
         setImageFile(null);
         setAudioPreviewUrl(null);
         setImagePreviewUrl(null);
     } else {
         // Restore previews if they exist in the data (might be base64)
         setAudioPreviewUrl(item.data.audioUrl || null);
         setImagePreviewUrl(item.data.imageUrl || null);
     }


     setQrLabel(item.label || '');
     setExpiryDate(item.data.expiryDate ? new Date(item.data.expiryDate) : undefined);
     setExpiryTime(item.data.expiryTime || "00:00");

     setIsQrGenerated(!!regeneratedQrData);
     setQrCodeSvgDataUrl(item.qrCodeSvgDataUrl); // Restore saved preview
     setQrPreviewKey(Date.now()); // Force preview re-render/update

     toast({ title: "Loaded from History", description: `Restored QR code configuration from ${format(item.timestamp, 'PP p')}.` });
     setShowHistory(false);
   }, [removeLogo, toast, applyLogoShapeAndOpacity]); // Only include essential stable dependencies


  const deleteFromHistory = useCallback((id: string) => {
     setHistory(prev => {
       const updatedHistory = prev.filter(item => item.id !== id);
       setLocalStorageItem('qrHistory', updatedHistory, toast);
        logFirebaseEvent('qr_history_deleted', { itemCount: updatedHistory.length });
       toast({ title: "Removed from History", variant: "destructive" });
       return updatedHistory;
     });
   }, [toast]);

   const duplicateHistoryItem = useCallback((itemToDuplicate: HistoryItem) => {
        const newItem: HistoryItem = {
            ...itemToDuplicate, // Copy existing item
            id: Date.now().toString(), // New unique ID
            timestamp: Date.now(), // New timestamp
            label: `${itemToDuplicate.label || 'QR'} (Copy)`, // Append copy indicator
        };

        setHistory(prev => {
            const updatedHistory = [newItem, ...prev].slice(0, 50); // Add copy to the top
            setLocalStorageItem('qrHistory', updatedHistory, toast);
            logFirebaseEvent('qr_history_duplicated', { qrType: newItem.type });
            toast({ title: "Item Duplicated", description: `Created a copy of "${itemToDuplicate.label || 'QR'}".` });
            return updatedHistory;
        });
    }, [toast]);

  const clearHistory = useCallback(() => {
     setHistory([]);
     setLocalStorageItem('qrHistory', [], toast);
      logFirebaseEvent('qr_history_cleared');
     toast({ title: "History Cleared", variant: "destructive" });
     setShowHistory(false);
  }, [toast]);

 const editHistoryLabel = useCallback((id: string, newLabel: string) => {
     setHistory(prev => {
         const updatedHistory = prev.map(item =>
             item.id === id ? { ...item, label: newLabel } : item
         );
         setLocalStorageItem('qrHistory', updatedHistory, toast);
         logFirebaseEvent('qr_history_label_edited');
         toast({ title: "Label Updated" });
         return updatedHistory;
     });
 }, [toast]);


 // --- Search/Filter History ---
 useEffect(() => {
   const lowerCaseSearchTerm = searchTerm.toLowerCase();
   const filtered = history.filter(item =>
       (item.label?.toLowerCase() || '').includes(lowerCaseSearchTerm) ||
       item.type.toLowerCase().includes(lowerCaseSearchTerm) ||
       JSON.stringify(item.data).toLowerCase().includes(lowerCaseSearchTerm)
   );
   setFilteredHistory(filtered);
 }, [searchTerm, history]);


 // --- Input Handlers ---
  const handleInputChange = (key: string, value: any) => {
    if ((key === 'latitude' || key === 'longitude' || key === 'upi_amount') && value && isNaN(Number(value))) {
         toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid number." });
         return;
    }
     if (key === 'upi_amount' && value && Number(value) < 0) {
         toast({ variant: "destructive", title: "Invalid Amount", description: "Amount cannot be negative." });
         return;
     }
     if (key === 'latitude' && value && (Number(value) < -90 || Number(value) > 90)) {
         toast({ variant: "destructive", title: "Invalid Latitude", description: "Latitude must be between -90 and 90." });
         return;
     }
      if (key === 'longitude' && value && (Number(value) < -180 || Number(value) > 180)) {
         toast({ variant: "destructive", title: "Invalid Longitude", description: "Longitude must be between -180 and 180." });
         return;
     }

    setInputDataState(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key: string, checked: boolean | 'indeterminate') => {
     setInputDataState(prev => ({ ...prev, [key]: checked === true }));
   };


  // Consolidate date/time updates for events
  const handleEventDateTimeChange = (key: 'event_start' | 'event_end', value: string) => {
      setInputDataState(prev => {
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
                   toast({ title: "End Date Adjusted", description: "End date automatically set to 1 hour after the new start date." });
                  return { ...prev, event_start: newDate.toISOString(), event_end: adjustedEndDate.toISOString() }; // Store as ISO strings
              }
              return { ...prev, event_start: newDate.toISOString() };
          } else { // key === 'event_end'
              // If start date exists and new end date is before start date, show error
              if (currentStartDate && newDate < currentStartDate) {
                  toast({ variant: "destructive", title: "Invalid End Date", description: "End date cannot be before start date." });
                  return prev; // Keep previous state
              }
              return { ...prev, event_end: newDate.toISOString() };
          }
      });
  };


  // --- Customization Handlers ---
  const handleColorChange = (target: 'dots' | 'background' | 'cornersSquare' | 'cornersDot', color: string) => {
     setOptions(prev => ({
        ...prev,
        ...(target === 'dots' && { dotsOptions: { ...(prev.dotsOptions ?? defaultOptions.dotsOptions!), color } }),
        ...(target === 'background' && { backgroundOptions: { ...(prev.backgroundOptions ?? defaultOptions.backgroundOptions!), color } }),
        ...(target === 'cornersSquare' && { cornersSquareOptions: { ...(prev.cornersSquareOptions ?? defaultOptions.cornersSquareOptions!), color } }),
        ...(target === 'cornersDot' && { cornersDotOptions: { ...(prev.cornersDotOptions ?? defaultOptions.cornersDotOptions!), color } }),
    }));
  };

 const handleDotStyleChange = (value: DotType) => {
    setOptions(prev => ({ ...prev, dotsOptions: { ...(prev.dotsOptions ?? defaultOptions.dotsOptions!), type: value } }));
  };

  const handleCornerStyleChange = (target: 'cornersSquare' | 'cornersDot', value: CornerSquareType | CornerDotType) => {
     setOptions(prev => ({
        ...prev,
        ...(target === 'cornersSquare' && { cornersSquareOptions: { ...(prev.cornersSquareOptions ?? defaultOptions.cornersSquareOptions!), type: value as CornerSquareType } }),
        ...(target === 'cornersDot' && { cornersDotOptions: { ...(prev.cornersDotOptions ?? defaultOptions.cornersDotOptions!), type: value as CornerDotType } }),
    }));
  };

  const handleQrSizeChange = (value: number[]) => {
      const size = value[0];
       if (size >= 50 && size <= 1000) {
            setOptions(prev => ({ ...prev, width: size, height: size }));
       }
  }

  const handleLogoSizeChange = (value: number[]) => {
     const sizePercent = value[0];
     setLogoSize(sizePercent);
     const imageSizeValue = Math.max(0.1, Math.min(0.5, sizePercent / 100));
     setOptions(prev => ({
         ...prev,
         imageOptions: { ...(prev.imageOptions ?? defaultOptions.imageOptions!), imageSize: imageSizeValue }
     }));
     setInputDataState(prev => ({ ...prev, logoSize: sizePercent })); // Store for history

     if (originalLogoUrl) {
          applyLogoShapeAndOpacity(originalLogoUrl, logoShape, logoOpacity / 100);
     }
  }

 const handleLogoShapeChange = (value: 'square' | 'circle') => {
     setLogoShape(value);
     setInputDataState(prev => ({ ...prev, logoShape: value })); // Store for history
     if (originalLogoUrl) {
         applyLogoShapeAndOpacity(originalLogoUrl, value, logoOpacity / 100);
     }
 };

 const handleLogoOpacityChange = (value: number[]) => {
     const opacityPercent = value[0];
      setLogoOpacity(opacityPercent);
     setInputDataState(prev => ({ ...prev, logoOpacity: opacityPercent })); // Store for history
      if (originalLogoUrl) {
         applyLogoShapeAndOpacity(originalLogoUrl, logoShape, opacityPercent / 100);
     }
 }

 const handleHideDotsChange = (checked: boolean | 'indeterminate') => {
      const hide = checked === true;
      setOptions(prev => ({
          ...prev,
          imageOptions: { ...(prev.imageOptions ?? defaultOptions.imageOptions!), hideBackgroundDots: hide }
      }));
      setInputDataState(prev => ({ ...prev, hideBackgroundDots: hide })); // Store for history
 }


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
        setOriginalLogoUrl(imageUrl); // Store the original base64/URL
        applyLogoShapeAndOpacity(imageUrl, logoShape, logoOpacity / 100);
        setInputDataState(prev => ({ ...prev, logoUrl: imageUrl })); // Store original URL in data for history
      };
      reader.onerror = () => toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected file." });
      reader.readAsDataURL(file);
    }
 }, [logoShape, logoOpacity, applyLogoShapeAndOpacity, toast]);

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
       setInputDataState(prev => ({ ...prev, expiryDate: expiry?.toISOString(), expiryTime: expiry ? format(expiry, "HH:mm") : "00:00" }));
 };

 const handleManualExpiryDateChange = (date: Date | undefined) => {
     handleManualExpiryChange(date, expiryTime);
 };

 const handleManualExpiryTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const timeValue = e.target.value;
     setExpiryTime(timeValue);
     handleManualExpiryChange(expiryDate, timeValue);
 };

 const handleManualExpiryChange = (date: Date | undefined, time: string) => {
     let combinedDate: Date | undefined = undefined;
     if (date && time) {
         try {
             const [hours, minutes] = time.split(':').map(Number);
             if (isNaN(hours) || isNaN(minutes)) throw new Error("Invalid time format");
             combinedDate = new Date(date);
             combinedDate.setHours(hours, minutes, 0, 0);

             if (combinedDate < new Date()) {
                 toast({ variant: "destructive", title: "Invalid Date/Time", description: "Expiry cannot be in the past." });
                 return;
             }
              setExpiryDate(combinedDate);
              toast({ title: "Expiry Reminder Set", description: `QR code visually marked to expire on ${format(combinedDate, "PPP 'at' HH:mm")}. (Backend needed for real expiry)` });
             setInputDataState(prev => ({ ...prev, expiryDate: combinedDate?.toISOString(), expiryTime: time }));

         } catch {
              toast({ variant: "destructive", title: "Invalid Time", description: "Please enter a valid time." });
              return;
         }
     } else {
         const hadExpiry = !!expiryDate;
         setExpiryDate(undefined);
         if (!date) setExpiryTime("00:00");
         if (hadExpiry) {
             toast({ title: "Expiry Removed", description: "QR code expiry marker removed." });
         }
         setInputDataState(prev => ({ ...prev, expiryDate: undefined, expiryTime: "00:00" }));
     }
 };


 // --- Download ---
  const onDownloadClick = useCallback(async () => {
      const qrData = generateQrData();
       if (!qrCodeInstance || !qrData || !isQrGenerated) {
          toast({ variant: "destructive", title: "Cannot Download", description: "Please generate a valid QR code first." });
          return;
      }

       logFirebaseEvent('qr_code_downloaded', {
           qrType: qrType,
           fileExtension: fileExtension,
           hasLogo: !!originalLogoUrl,
           dataLength: qrData.length
       });


      if (expiryDate) toast({ title: "Download Info", description: "Note: Expiry is a visual marker only.", duration: 5000 });

       const downloadWidth = typeof options.width === 'number' && options.width > 0 ? options.width : 512;
       const downloadHeight = typeof options.height === 'number' && options.height > 0 ? options.height : 512;

      const downloadOptions: QRCodeStylingOptions = {
          ...options,
          data: qrData,
          type: fileExtension === 'svg' ? 'svg' : 'canvas',
          width: downloadWidth,
          height: downloadHeight,
      };

      const downloadInstance = new QRCodeStyling(downloadOptions);


      try {
            const filename = qrLabel ? qrLabel.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `linkspark-qr-${qrType}`;
            await downloadInstance.download({ name: filename, extension: fileExtension as Extension });
            toast({ title: "Download Started", description: `QR code downloading as ${fileExtension.toUpperCase()}.` });
      } catch (error) {
          console.error("Error downloading QR code:", error);
          toast({ variant: "destructive", title: "Download Failed", description: "Could not download the QR code. Please try again." });
      }
  }, [qrCodeInstance, options, fileExtension, qrType, generateQrData, isQrGenerated, expiryDate, qrLabel, toast, originalLogoUrl]);


// --- Audio/Image Combo Handlers ---
 const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
         if (!['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'].includes(file.type)) {
            toast({ variant: "destructive", title: "Invalid Audio Type", description: "Please upload MP3, WAV, OGG, MP4, or AAC audio." });
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ variant: "destructive", title: "File Too Large", description: "Audio file should be less than 5MB." });
            return;
        }
        setAudioFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            const audioDataUrl = reader.result as string;
            setAudioPreviewUrl(audioDataUrl);
            setInputDataState(prev => ({ ...prev, audioUrl: audioDataUrl }));
        };
        reader.readAsDataURL(file);
    }
 };

 const handleImageUploadForGift = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
            toast({ variant: "destructive", title: "Invalid Image Type", description: "Please upload PNG, JPG, GIF, or WEBP." });
            return;
        }
         if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({ variant: "destructive", title: "File Too Large", description: "Image should be less than 2MB." });
            return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageDataUrl = reader.result as string;
            setImagePreviewUrl(imageDataUrl);
            setInputDataState(prev => ({ ...prev, imageUrl: imageDataUrl }));
        };
        reader.readAsDataURL(file);
    }
 };


const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ variant: "destructive", title: "Unsupported", description: "Audio recording is not supported by your browser." });
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); // Use WAV for broader compatibility
            const audioUrl = URL.createObjectURL(audioBlob);
            setAudioPreviewUrl(audioUrl);
            // Convert Blob to Data URL for storing in inputDataState (can be large!)
            const reader = new FileReader();
            reader.onloadend = () => {
                setInputDataState(prev => ({ ...prev, audioUrl: reader.result as string }));
            }
            reader.readAsDataURL(audioBlob);
            // Clean up stream tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: "Recording Started", description: "Click 'Stop Recording' when finished." });
    } catch (err) {
        console.error("Error starting recording:", err);
        toast({ variant: "destructive", title: "Recording Error", description: "Could not access microphone. Please check permissions." });
    }
};

const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast({ title: "Recording Stopped", description: "Audio captured." });
    }
};

 const triggerAudioUpload = () => audioInputRef.current?.click();
 const triggerImageUploadForGift = () => imageInputRef.current?.click();

 const removeAudio = () => {
     setAudioFile(null);
     setAudioPreviewUrl(null);
     if (audioInputRef.current) audioInputRef.current.value = '';
     setInputDataState(prev => {
         const { audioUrl, ...rest } = prev;
         return rest;
     });
 };

 const removeImageForGift = () => {
     setImageFile(null);
     setImagePreviewUrl(null);
     if (imageInputRef.current) imageInputRef.current.value = '';
     setInputDataState(prev => {
         const { imageUrl, ...rest } = prev;
         return rest;
     });
 };


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
                                <Input id="qr-url" type="url" value={inputDataState.url ?? ''} onChange={(e) => handleInputChange('url', e.target.value)} placeholder="https://example.com" required/>
                                </div>
                            );
                        case 'text':
                            return (
                                <div className="space-y-2">
                                <Label htmlFor="qr-text">Text Content *</Label>
                                <Textarea id="qr-text" value={inputDataState.text || ''} onChange={(e) => handleInputChange('text', e.target.value)} placeholder="Enter your text here..." rows={4} required />
                                </div>
                            );
                        case 'email':
                            return (
                                <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="qr-email-to">Recipient Email *</Label>
                                    <Input id="qr-email-to" type="email" value={inputDataState.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="recipient@example.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="qr-email-subject">Subject (Optional)</Label>
                                    <Input id="qr-email-subject" type="text" value={inputDataState.subject || ''} onChange={(e) => handleInputChange('subject', e.target.value)} placeholder="Email Subject" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="qr-email-body">Body (Optional)</Label>
                                    <Textarea id="qr-email-body" value={inputDataState.body || ''} onChange={(e) => handleInputChange('body', e.target.value)} placeholder="Email message..." rows={3} />
                                </div>
                                </div>
                            );
                        case 'phone':
                            return (
                                <div className="space-y-2">
                                <Label htmlFor="qr-phone">Phone Number *</Label>
                                <Input id="qr-phone" type="tel" value={inputDataState.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+1234567890" required />
                                </div>
                            );
                        case 'whatsapp':
                            return (
                                <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="qr-whatsapp-phone">WhatsApp Number (incl. country code) *</Label>
                                    <Input id="qr-whatsapp-phone" type="tel" value={inputDataState.whatsapp_phone || ''} onChange={(e) => handleInputChange('whatsapp_phone', e.target.value)} placeholder="14155552671 (no + or spaces)" required />
                                    <p className="text-xs text-muted-foreground">Enter number without '+', spaces, or dashes.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="qr-whatsapp-message">Prefilled Message (Optional)</Label>
                                    <Textarea id="qr-whatsapp-message" value={inputDataState.whatsapp_message || ''} onChange={(e) => handleInputChange('whatsapp_message', e.target.value)} placeholder="Hello!" rows={3} />
                                </div>
                                </div>
                            )
                        case 'sms':
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-sms-phone">SMS Recipient Number *</Label>
                                        <Input id="qr-sms-phone" type="tel" value={inputDataState.sms_phone || ''} onChange={(e) => handleInputChange('sms_phone', e.target.value)} placeholder="+1234567890" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-sms-message">SMS Message (Optional)</Label>
                                        <Textarea id="qr-sms-message" value={inputDataState.sms_message || ''} onChange={(e) => handleInputChange('sms_message', e.target.value)} placeholder="Enter message..." rows={3} />
                                    </div>
                                </div>
                            );
                        case 'location':
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-latitude">Latitude *</Label>
                                        <Input id="qr-latitude" type="number" step="any" value={inputDataState.latitude || ''} onChange={(e) => handleInputChange('latitude', e.target.value)} placeholder="e.g., 40.7128" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-longitude">Longitude *</Label>
                                        <Input id="qr-longitude" type="number" step="any" value={inputDataState.longitude || ''} onChange={(e) => handleInputChange('longitude', e.target.value)} placeholder="e.g., -74.0060" required />
                                    </div>
                                    </div>
                                )
                        case 'event':
                                const eventStartValue = inputDataState.event_start ? format(new Date(inputDataState.event_start), "yyyy-MM-dd'T'HH:mm") : '';
                                const eventEndValue = inputDataState.event_end ? format(new Date(inputDataState.event_end), "yyyy-MM-dd'T'HH:mm") : '';
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-event-summary">Event Title *</Label>
                                        <Input id="qr-event-summary" type="text" value={inputDataState.event_summary || ''} onChange={(e) => handleInputChange('event_summary', e.target.value)} placeholder="Meeting, Birthday Party..." required />
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
                                        <Input id="qr-event-location" type="text" value={inputDataState.event_location || ''} onChange={(e) => handleInputChange('event_location', e.target.value)} placeholder="Conference Room A, Online..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="qr-event-description">Description (Optional)</Label>
                                        <Textarea id="qr-event-description" value={inputDataState.event_description || ''} onChange={(e) => handleInputChange('event_description', e.target.value)} placeholder="Event details..." rows={3} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">* Event Title and Start Date/Time are required.</p>
                                </div>
                            );
                        case 'wifi':
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="wifi-ssid">Network Name (SSID) *</Label>
                                        <Input id="wifi-ssid" value={inputDataState.wifi_ssid || ''} onChange={(e) => handleInputChange('wifi_ssid', e.target.value)} placeholder="MyHomeNetwork" required />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="wifi-encryption">Encryption</Label>
                                        <Select onValueChange={(value) => handleInputChange('wifi_encryption', value)} value={inputDataState.wifi_encryption || 'WPA/WPA2'}>
                                            <SelectTrigger id="wifi-encryption"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {wifiEncryptionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                     {inputDataState.wifi_encryption !== 'None' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="wifi-password">Password *</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="wifi-password"
                                                    type={wifiPasswordVisible ? 'text' : 'password'}
                                                    value={inputDataState.wifi_password || ''}
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
                                    <Checkbox id="wifi-hidden" checked={!!inputDataState.wifi_hidden} onCheckedChange={(checked) => handleCheckboxChange('wifi_hidden', checked)} />
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
                         case 'vcard':
                             return (
                                 <div className="space-y-4">
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                             <Label htmlFor="vcard-firstName">First Name *</Label>
                                             <Input id="vcard-firstName" value={inputDataState.vcard_firstName || ''} onChange={(e) => handleInputChange('vcard_firstName', e.target.value)} placeholder="John" required />
                                         </div>
                                         <div className="space-y-2">
                                             <Label htmlFor="vcard-lastName">Last Name *</Label>
                                             <Input id="vcard-lastName" value={inputDataState.vcard_lastName || ''} onChange={(e) => handleInputChange('vcard_lastName', e.target.value)} placeholder="Doe" required />
                                         </div>
                                     </div>
                                     <div className="space-y-2">
                                         <Label htmlFor="vcard-organization">Organization (Optional)</Label>
                                         <Input id="vcard-organization" value={inputDataState.vcard_organization || ''} onChange={(e) => handleInputChange('vcard_organization', e.target.value)} placeholder="Acme Corp" />
                                     </div>
                                      <div className="space-y-2">
                                         <Label htmlFor="vcard-title">Job Title (Optional)</Label>
                                         <Input id="vcard-title" value={inputDataState.vcard_title || ''} onChange={(e) => handleInputChange('vcard_title', e.target.value)} placeholder="Software Engineer" />
                                     </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                         <div className="space-y-2">
                                             <Label htmlFor="vcard-phone">Phone (Optional)</Label>
                                             <Input id="vcard-phone" type="tel" value={inputDataState.vcard_phone || ''} onChange={(e) => handleInputChange('vcard_phone', e.target.value)} placeholder="+15551234567" />
                                         </div>
                                         <div className="space-y-2">
                                             <Label htmlFor="vcard-email">Email (Optional)</Label>
                                             <Input id="vcard-email" type="email" value={inputDataState.vcard_email || ''} onChange={(e) => handleInputChange('vcard_email', e.target.value)} placeholder="john.doe@example.com" />
                                         </div>
                                     </div>
                                     <div className="space-y-2">
                                         <Label htmlFor="vcard-website">Website (Optional)</Label>
                                         <Input id="vcard-website" type="url" value={inputDataState.vcard_website || ''} onChange={(e) => handleInputChange('vcard_website', e.target.value)} placeholder="https://example.com" />
                                     </div>
                                     <div className="space-y-2">
                                         <Label htmlFor="vcard-address">Address (Optional)</Label>
                                         <Textarea id="vcard-address" value={inputDataState.vcard_address || ''} onChange={(e) => handleInputChange('vcard_address', e.target.value)} placeholder="123 Main St, Anytown, USA 12345" rows={2} />
                                     </div>
                                      <div className="space-y-2">
                                         <Label htmlFor="vcard-note">Note (Optional)</Label>
                                         <Textarea id="vcard-note" value={inputDataState.vcard_note || ''} onChange={(e) => handleInputChange('vcard_note', e.target.value)} placeholder="Additional information..." rows={2} />
                                     </div>
                                     <p className="text-xs text-muted-foreground">* First Name and Last Name are required.</p>
                                 </div>
                             );
                         case 'upi':
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="upi-id">UPI ID (Payee VPA) *</Label>
                                        <Input id="upi-id" type="text" value={inputDataState.upi_id || ''} onChange={(e) => handleInputChange('upi_id', e.target.value)} placeholder="yourname@bank" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="upi-name">Payee Name (Optional)</Label>
                                        <Input id="upi-name" type="text" value={inputDataState.upi_name || ''} onChange={(e) => handleInputChange('upi_name', e.target.value)} placeholder="e.g., John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="upi-amount">Amount (INR) *</Label>
                                        <Input id="upi-amount" type="number" step="0.01" min="0.01" value={inputDataState.upi_amount || ''} onChange={(e) => handleInputChange('upi_amount', e.target.value)} placeholder="e.g., 500.00" required />
                                        <p className="text-xs text-muted-foreground">Enter the amount in Indian Rupees (INR). Must be positive.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="upi-note">Note/Message (Optional)</Label>
                                        <Input id="upi-note" type="text" value={inputDataState.upi_note || ''} onChange={(e) => handleInputChange('upi_note', e.target.value)} placeholder="e.g., Payment for order #123" />
                                    </div>
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
                         case 'audio-image':
                            return (
                                <div className="space-y-6">
                                    {/* Image Upload */}
                                    <div className="space-y-2">
                                        <Label htmlFor="gift-image">Upload Image *</Label>
                                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <Button variant="outline" onClick={triggerImageUploadForGift} className="w-full sm:w-auto flex-grow justify-start text-left font-normal">
                                                <Upload className="mr-2 h-4 w-4" />
                                                {imagePreviewUrl ? "Change Image" : "Upload Image (PNG, JPG, WEBP...)"}
                                            </Button>
                                            <Input ref={imageInputRef} id="gift-image" type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageUploadForGift} className="hidden" />
                                            {imagePreviewUrl && (
                                                <div className='flex items-center gap-2'>
                                                    <img src={imagePreviewUrl} alt="Image Preview" className="h-10 w-10 rounded object-contain border bg-white" />
                                                    <Button variant="ghost" size="icon" onClick={removeImageForGift} aria-label="Remove image">
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Image for the gift card page. Max 2MB.</p>
                                    </div>

                                    {/* Audio Section */}
                                    <div className="space-y-2">
                                        <Label htmlFor="gift-audio">Upload or Record Audio *</Label>
                                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <Button variant="outline" onClick={triggerAudioUpload} className="w-full sm:w-auto flex-grow justify-start text-left font-normal">
                                                <FileAudio className="mr-2 h-4 w-4" />
                                                {audioPreviewUrl ? "Change Audio" : "Upload Audio (MP3, WAV...)"}
                                            </Button>
                                             <Input ref={audioInputRef} id="gift-audio" type="file" accept="audio/mpeg, audio/wav, audio/ogg, audio/mp4, audio/aac" onChange={handleAudioUpload} className="hidden" />
                                            {audioPreviewUrl && (
                                                 <Button variant="ghost" size="icon" onClick={removeAudio} aria-label="Remove audio" className='ml-auto'>
                                                     <Trash2 className="h-4 w-4 text-destructive" />
                                                 </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Audio message. Max 5MB.</p>

                                        {/* Record Button */}
                                         <div className="flex items-center gap-2 pt-2">
                                             <Button
                                                variant={isRecording ? "destructive" : "secondary"}
                                                onClick={isRecording ? stopRecording : startRecording}
                                                size="sm"
                                            >
                                                {isRecording ? <PauseCircle className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                                                {isRecording ? 'Stop Recording' : 'Record Voice'}
                                            </Button>
                                            {isRecording && <span className="text-sm text-destructive animate-pulse">Recording...</span>}
                                         </div>

                                         {/* Audio Preview */}
                                         {audioPreviewUrl && !isRecording && (
                                            <div className="pt-2">
                                                <Label>Audio Preview</Label>
                                                <audio controls src={audioPreviewUrl} className="w-full mt-1">
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">* Both Image and Audio are required.</p>
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
    <>
    {/* Removed <FirebaseAnalyticsLogger /> */}
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 py-6">
        {/* Options Panel */}
        <Card className="lg:col-span-2 order-2 lg:order-1 animate-fade-in">
          <CardHeader>
            <CardTitle>Customize Your QR Code</CardTitle>
            <CardDescription>Select type, enter content, and personalize the style.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* Tabs for Content */}
             <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-1 mb-4">
                    <TabsTrigger value="content"><Settings2 className="inline-block mr-1 h-4 w-4" /> Options</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="pt-6 space-y-6">
                    {/* Accordion for Content, Styling, Logo, Extras */}
                    <Accordion type="multiple" collapsible={"true"} className="w-full" defaultValue={["content-item", "styling-item"]}>
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
                                            setInputDataState({});
                                            setExpiryDate(undefined);
                                            setQrLabel('');
                                            // Reset specific fields for certain types
                                            removeLogo(); // Clear logo when type changes
                                            removeAudio();
                                            removeImageForGift();
                                             if (value === 'url') {
                                                 setInputDataState({ url: '' });
                                             }
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
                                     {/* Label for History */}
                                     <div className="space-y-2">
                                         <Label htmlFor="qr-label">Label Text (For History)</Label>
                                         <Input id="qr-label" type="text" value={qrLabel} onChange={(e) => setQrLabel(e.target.value)} placeholder="e.g., My Website QR" maxLength={50} />
                                         <p className="text-xs text-muted-foreground">Helps identify this QR in your history.</p>
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


                 {/* History Dialog */}
                 <AlertDialog open={showHistory} onOpenChange={setShowHistory}>
                     <AlertDialogContent className="max-w-4xl h-[85vh] flex flex-col">
                         <AlertDialogHeader>
                             <AlertDialogTitle className="flex justify-between items-center">
                                 Generation History ({history.length})
                                 <div className="flex items-center gap-2">
                                     <div className="relative flex-grow max-w-xs">
                                        <Input
                                            type="search"
                                            placeholder="Search label, type, or data..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 pr-4 py-2 h-9 text-sm" // Adjusted padding
                                        />
                                         {/* Search Icon inside Input */}
                                         <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                             <Search className="h-4 w-4" />
                                        </div>
                                     </div>
                                     <AlertDialogCancel asChild>
                                          <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                                              <X className="h-4 w-4" />
                                              <span className="sr-only">Close History</span>
                                          </Button>
                                     </AlertDialogCancel>
                                 </div>
                              </AlertDialogTitle>
                             <AlertDialogDescription>
                                Browse, search, reload, duplicate, or manage your previously generated QR codes. Click an item to load it. History is stored locally in your browser.
                             </AlertDialogDescription>
                         </AlertDialogHeader>

                         <div className="flex-grow border rounded-md my-4 overflow-hidden">
                            {history.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No history yet. Generate and save some QR codes!
                                </div>
                            ) : filteredHistory.length === 0 && searchTerm ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No history items match your search "{searchTerm}".
                                </div>
                             ) : (
                                <ScrollArea className="h-full">
                                     <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                         {filteredHistory.map((item) => {
                                             const TypeIcon = qrTypeOptions.find(opt => opt.value === item.type)?.icon || QrCodeIcon;
                                             const isEditing = editingLabelId === item.id;
                                             const displayLabel = item.label || `${qrTypeOptions.find(opt => opt.value === item.type)?.label || item.type} - ${item.id.slice(-4)}`;

                                             return (
                                                 <Card key={item.id} className="overflow-hidden group relative hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                                                      <button
                                                        onClick={() => { if (!isEditing) loadFromHistory(item); }}
                                                        className="flex-grow flex items-start gap-3 p-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-t-lg w-full text-left" // Ensure full width and left align
                                                        aria-label={`Load ${displayLabel}`}
                                                        disabled={isEditing}
                                                      >
                                                          {item.qrCodeSvgDataUrl ? (
                                                              <img src={item.qrCodeSvgDataUrl} alt="QR Code Preview" className="w-16 h-16 object-contain border rounded bg-white shrink-0" />
                                                          ) : (
                                                               <div className="w-16 h-16 flex items-center justify-center border rounded bg-muted shrink-0">
                                                                   <QrCodeIcon className="w-8 h-8 text-muted-foreground" />
                                                               </div>
                                                          )}
                                                         <div className="flex-grow min-w-0 space-y-1">
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        value={editingLabelValue}
                                                                        onChange={(e) => setEditingLabelValue(e.target.value)}
                                                                        className="h-7 text-sm px-2 flex-grow"
                                                                        maxLength={50}
                                                                        autoFocus
                                                                        onKeyDown={(e) => { if (e.key === 'Enter') { editHistoryLabel(item.id, editingLabelValue); setEditingLabelId(null); } else if (e.key === 'Escape') { setEditingLabelId(null); } }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); editHistoryLabel(item.id, editingLabelValue); setEditingLabelId(null); }}>
                                                                        <Check className="h-4 w-4 text-green-600" />
                                                                    </Button>
                                                                     <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); setEditingLabelId(null); }}>
                                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                 <TooltipProvider delayDuration={300}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                             <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{displayLabel}</p>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top"><p>{displayLabel}</p></TooltipContent>
                                                                    </Tooltip>
                                                                 </TooltipProvider>
                                                            )}
                                                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                 <TypeIcon className="h-3 w-3 shrink-0" />
                                                                 {qrTypeOptions.find(opt => opt.value === item.type)?.label || item.type}
                                                              </p>
                                                             <p className="text-xs text-muted-foreground">{format(item.timestamp, 'PP p')}</p>
                                                         </div>
                                                      </button>

                                                      <CardFooter className="p-2 border-t bg-muted/30 flex justify-end gap-1 mt-auto">
                                                         {/* Duplicate Button */}
                                                         <TooltipProvider delayDuration={300}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                     <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 h-7 w-7" onClick={(e) => { e.stopPropagation(); duplicateHistoryItem(item); }}>
                                                                         <Copy className="h-4 w-4" />
                                                                          <span className="sr-only">Duplicate Item</span>
                                                                     </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top"><p>Duplicate</p></TooltipContent>
                                                             </Tooltip>
                                                         </TooltipProvider>
                                                          {/* Share Button (Placeholder) */}
                                                         <TooltipProvider delayDuration={300}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10 h-7 w-7" onClick={(e) => { e.stopPropagation(); /* Implement Share Logic */ toast({ title: "Share (Coming Soon)", description: "Functionality to share this QR configuration." }); }}>
                                                                        <Share2 className="h-4 w-4" />
                                                                        <span className="sr-only">Share Item</span>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top"><p>Share (Coming Soon)</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                         {/* Edit Button */}
                                                         {!isEditing && (
                                                            <TooltipProvider delayDuration={300}>
                                                                 <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingLabelId(item.id); setEditingLabelValue(item.label || ''); }}>
                                                                           <Pencil className="h-4 w-4" />
                                                                            <span className="sr-only">Edit Label</span>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top"><p>Edit Label</p></TooltipContent>
                                                                 </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                         {/* Delete Button */}
                                                         <AlertDialog>
                                                            <TooltipProvider delayDuration={300}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                                                               <Trash2 className="h-4 w-4" />
                                                                                <span className="sr-only">Delete Item</span>
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                    </TooltipTrigger>
                                                                     <TooltipContent side="top"><p>Delete</p></TooltipContent>
                                                                 </Tooltip>
                                                            </TooltipProvider>
                                                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete History Item?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. Are you sure you want to delete "{displayLabel}"?
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => deleteFromHistory(item.id)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                         </AlertDialog>
                                                    </CardFooter>
                                                 </Card>
                                             );
                                         })}
                                     </div>
                                 </ScrollArea>
                             )}
                         </div>


                         <AlertDialogFooter>
                             {history.length > 0 && (
                                <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                         <Button variant="destructive-outline" className="mr-auto">Clear All History</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Clear Entire History?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                 This action cannot be undone. All saved QR codes will be permanently deleted from your browser storage.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={clearHistory} className={buttonVariants({ variant: "destructive" })}>Clear History</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                             )}
                             <Button variant="outline" onClick={() => setShowHistory(false)}>Close</Button>
                         </AlertDialogFooter>
                     </AlertDialogContent>
                 </AlertDialog>

             </Tabs>

          </CardContent>
        </Card>

        {/* QR Preview Panel */}
        <Card key={qrPreviewKey} className="lg:col-span-1 order-1 lg:order-2 sticky top-6 self-start animate-fade-in [animation-delay:0.2s]">
          <CardHeader>
            <CardTitle>Preview & Download</CardTitle>
            <CardDescription>Review your QR code, save it, or download it.</CardDescription>
             <Button onClick={() => setShowHistory(true)} variant="outline" size="sm" className="absolute top-4 right-4">
                 <History className="mr-1 h-4 w-4" /> History ({history.length})
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
             <div className="border rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-white p-2 relative w-full max-w-[256px] sm:max-w-[300px] lg:max-w-full aspect-square mx-auto" style={{ minHeight: '150px' }}>
                 <div ref={qrCodeRef} className="absolute inset-0 flex items-center justify-center">
                     {/* QR code appended here */}
                 </div>
                {!isQrGenerated && (
                     <div className="text-muted-foreground text-center p-4 flex flex-col items-center justify-center h-full absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10">
                         <QrCodeIcon className="h-12 w-12 mb-2 text-muted-foreground/50"/>
                         <span>Enter data to generate QR code.</span>
                     </div>
                 )}
                 {expiryDate && (
                    <p className="absolute bottom-1 left-1 right-1 text-[10px] text-center text-orange-600 bg-orange-100/80 px-1 py-0.5 rounded-b-md z-10 flex items-center justify-center gap-1">
                        <Clock className="h-2.5 w-2.5"/> Expires: {format(expiryDate, "PP HH:mm")}
                    </p>
                )}
            </div>
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
             {/* Save to History Button */}
            <Button onClick={saveToHistory} className="w-full" variant="secondary" disabled={!isQrGenerated}>
                 <Save className="mr-2 h-4 w-4" /> Save to History
            </Button>
            <p className="text-xs text-muted-foreground text-center px-4">History will only record manually saved QR codes. Unsaved QR codes will not appear.</p>
          </CardContent>
           <CardFooter>
              <Button onClick={onDownloadClick} className="w-full" disabled={!isQrGenerated}>
                <Download className="mr-2 h-4 w-4" /> Download QR Code ({fileExtension.toUpperCase()})
              </Button>
           </CardFooter>
        </Card>
    </div>
    </>
  );
}

export default QrCodeGenerator; // Default export
