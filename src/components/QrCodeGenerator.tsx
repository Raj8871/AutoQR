
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
import {
    Download, Image as ImageIcon, Link as LinkIcon, Phone, Mail, MessageSquare, MapPin, Calendar as CalendarIcon, Settings2, Palette, Clock, Wifi, Upload, Check, Trash2, Info, Eye, EyeOff, QrCode as QrCodeIcon, RefreshCcw, Star, Sparkles, Shapes, CreditCard, Copy, Pencil, StarIcon, Share2, X, QrCode, History, Gift, Music, User, Lock, Mic, PlayCircle, PauseCircle, FileAudio, Save // Added Mic, PlayCircle, PauseCircle, FileAudio, Save
} from 'lucide-react';
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { useToast, type Toast } from '@/hooks/use-toast'; // Corrected import for Toast type
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import * as Papa from 'papaparse';
import JSZip from 'jszip';
import { logFirebaseEvent } from '@/lib/firebase'; // Import logFirebaseEvent

// --- Types ---

// Define allowed QR types
type QrType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'sms' | 'location' | 'event' | 'wifi' | 'vcard' | 'upi' | 'audio-image' ; // Added audio-image

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
  { value: 'vcard', label: 'Contact (vCard)', icon: User, description: 'Share contact details in a standard vCard format.' },
  { value: 'upi', label: 'UPI Payment', icon: CreditCard, description: 'Generate a QR for UPI payments with a specific amount and note.' },
  { value: 'audio-image', label: 'Voice Gift Card', icon: Music, description: 'Combine an image and audio into a scannable gift card style page.' },
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
        // toastFn({ variant: "destructive", title: "Name Required", description: "First Name and Last Name are required for vCard." });
        return ''; // Don't toast immediately
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
         // Don't toast immediately, rely on generateQrDataString for feedback
         // toastFn({ variant: "destructive", title: "Invalid UPI ID", description: "Please enter a valid UPI ID (e.g., name@bank)." });
         return ''; // Stop generation if invalid
    }
     // Amount validation: Must be positive if entered
    if (data.upi_amount && (isNaN(amount) || amount <= 0)) {
        toastFn({ variant: "destructive", title: "Invalid Amount", description: "UPI amount must be a positive number." });
        return ''; // Stop generation if invalid
    }
     // Amount required for UPI
     if (!data.upi_amount || isNaN(amount) || amount <= 0) {
        // toastFn({ variant: "destructive", title: "Amount Required", description: "A positive amount is required for UPI payments." });
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

// Re-assignable reference for setInputDataState
let setInputDataRef: React.Dispatch<React.SetStateAction<Record<string, any>>> = () => {
  console.warn("setInputDataRef called before initialization.");
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
                 // Return empty string if input is empty
                 targetData = '';
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
                 // formatICS might have already shown a specific toastFn
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
           case 'vcard': // Added vCard case
                targetData = formatVCard(data, toastFn);
                if (!targetData && (data.vcard_firstName || data.vcard_lastName)) {
                    // formatVCard might have shown a toast if name was missing
                    return '';
                }
                if (!targetData && !data.vcard_firstName && !data.vcard_lastName) {
                     return ''; // Return empty if names are missing initially
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
                // Generate a unique ID or use timestamps for a temporary link
                // In a real app, this would be a hosted URL pointing to the generated page
                const uniqueId = `audio-card-${Date.now()}`;
                // Simulate hosting by generating a relative path or link to a preview page
                targetData = `/preview/${uniqueId}?img=${encodeURIComponent(data.audio_image_url || '')}&audio=${encodeURIComponent(data.audio_file_url || '')}&title=${encodeURIComponent(data.audio_image_title || 'Voice Gift Card')}`;
                if (!data.audio_image_url || !data.audio_file_url) {
                    // toastFn({ variant: "destructive", title: "Missing Files", description: "Please upload both an image and an audio file." });
                     return ''; // Don't toast immediately
                 }
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
             description: `Input data is too long (${targetData.length} characters) and exceeds the QR code limit (~${MAX_DATA_LENGTH_FAIL} chars). Please shorten it or use smaller files. QR Generation might fail.`,
             duration: 10000
         });
          // Don't return '' here, let the library attempt generation and throw if needed.
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
export default function QrCodeGenerator() {
  const { toast } = useToast(); // Get toast instance

  // Core QR State
  const [qrType, setQrType] = useState<QrType>('url');
  const [inputDataState, setInputDataState] = useState<Record<string, any>>({ url: '' }); // Initialize with empty URL
  const [options, setOptions] = useState<QRCodeStylingOptions>(defaultOptions);
  const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(null);
  const [qrCodeSvgDataUrl, setQrCodeSvgDataUrl] = useState<string | null>(null);
  const [isQrGenerated, setIsQrGenerated] = useState<boolean>(false); // Start as false
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

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false); // State to control history panel visibility
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelValue, setEditingLabelValue] = useState<string>('');


  // Bulk QR State
  const [bulkQrCodes, setBulkQrCodes] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const audioImageInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);


    // Assign the state setter to the reference after mount
    useEffect(() => {
        setInputDataRef = setInputDataState;
    }, [setInputDataState]);


  // --- Load History ---
  useEffect(() => {
    const loadedHistory = getLocalStorageItem<HistoryItem[]>('qrHistory', []);
    // Filter out any invalid items just in case
    setHistory(loadedHistory.filter(item => item && item.id && item.type && item.data && item.options && item.timestamp));
  }, []);


  // --- Audio Recording ---

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        audioChunksRef.current = []; // Clear previous chunks

        recorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); // Use WAV for wider compatibility or opus/webm
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
           // Set the audio file URL in inputDataState for the audio-image type
           handleInputChange('audio_file_url', url); // Use the generated URL
            toast({ title: "Recording Finished", description: "Audio saved. You can now preview or re-record." });
            // Stop the tracks after recording is done
            stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setIsRecording(true);
        toast({ title: "Recording Started", description: "Speak into your microphone." });
      } catch (err) {
        console.error('Error accessing microphone:', err);
        toast({ variant: "destructive", title: "Microphone Error", description: "Could not access microphone. Please check permissions." });
      }
    } else {
       toast({ variant: "destructive", title: "Not Supported", description: "Audio recording is not supported in your browser." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      // The onstop handler will process the audio
    }
  };


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
                // Clear previous content *before* creating/updating
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
                     if (typeof instance.update === 'function') {
                        await instance.update(qrOptions); // Await update
                     } else {
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
                if (instance && hasData) {
                   // Log event to firebase only if data is valid
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

           } catch (error: any) {
                console.error("Error creating/updating QR code instance:", error);
                // Check for specific QR code generation errors (like data overflow)
                if (error?.message?.includes("length overflow")) {
                    toast({ variant: "destructive", title: "QR Generation Error", description: `Data is too long for the QR code standard (${error.message}). Please shorten input or use smaller files.`, duration: 7000 });
                } else if (!error?.message?.includes('removeChild')) { // Avoid re-toasting the removeChild error
                     toast({ variant: "destructive", title: "QR Generation Error", description: `Could not create/update QR code: ${(error as Error).message}` });
                }
               setQrCodeSvgDataUrl(null);
               setQrCodeInstance(null);
               setIsQrGenerated(false);
                // Cautiously clear container, handling potential errors
               if (container) {
                   while (container.firstChild) {
                       try {
                            container.removeChild(container.firstChild);
                       } catch {
                            // Ignore if child already removed, break loop
                            break;
                       }
                   }
               }
           }
      };

      // Debounce the update
      const debounceTimeout = setTimeout(updateQrCode, 300);

       return () => {
            clearTimeout(debounceTimeout);
            // Reduced cleanup: Let React handle unmounting. Avoid direct DOM manipulation here
            // if possible, as it seems to cause the 'removeChild' error during fast updates/unmounts.
             if (instance && container && didAppend) {
                 // Potentially problematic cleanup - disabled to test fix
                 // try { instance.clear(); } catch (e) { console.warn("Error clearing QR instance:", e); }
             }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, qrType, inputDataState, toast]); // Removed qrCodeInstance from deps


  // --- History Management ---
  const addToHistory = useCallback(() => {
     const qrData = generateQrData(); // Generate data *at the time of saving*
     if (!qrData || !isQrGenerated || !qrCodeSvgDataUrl) { // Also check if generated and has preview
         toast({ variant: "destructive", title: "Cannot Save", description: "Please ensure a valid QR code is generated and previewed." });
         return;
     }

     const newItem: HistoryItem = {
       id: Date.now().toString(), // Simple ID based on timestamp
       type: qrType,
       data: { ...inputDataState }, // Clone input data
       options: { ...options, data: '' }, // Clone options, clear data for storage
       timestamp: Date.now(),
       label: qrLabel || `${qrType} - ${format(new Date(), 'PP p')}`, // Default label
       qrCodeSvgDataUrl: qrCodeSvgDataUrl, // Store the generated SVG preview
     };

     // Prevent duplicates based on content and type (simple check)
     const isDuplicate = history.some(item =>
         item.type === newItem.type &&
         JSON.stringify(item.data) === JSON.stringify(newItem.data) &&
         JSON.stringify(item.options) === JSON.stringify(newItem.options) // Compare options too
      );

     if (isDuplicate) {
        toast({ title: "Already in History", description: "This exact QR configuration is already saved." });
        return;
     }


     setHistory(prev => {
        const updatedHistory = [newItem, ...prev].slice(0, 50); // Keep max 50 items
        setLocalStorageItem('qrHistory', updatedHistory, toast);
         logFirebaseEvent('qr_history_saved', { qrType: qrType, itemCount: updatedHistory.length });
        toast({ title: "Saved to History", description: `"${newItem.label}" added.` });
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

       const processingCanvasSize = 200;
       const processedImageUrl = await processImage(imageUrl, shape, processingCanvasSize, opacity);

       setLogoPreviewUrl(processedImageUrl);
        setOptions(prev => ({
            ...prev,
            image: processedImageUrl,
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
         setLogoPreviewUrl(imageUrl);
          setOptions(prev => ({
              ...prev,
              image: imageUrl,
               imageOptions: {
                 ...(options.imageOptions ?? defaultOptions.imageOptions!),
                 imageSize: Math.max(0.1, Math.min(0.5, logoSize / 100)),
              }
          }));
     }
  }, [logoSize, options.imageOptions, toast]);


  const loadFromHistory = useCallback((item: HistoryItem) => {
     // Log event
      logFirebaseEvent('qr_history_loaded', { qrType: item.type });

     setQrType(item.type);
     setInputDataState({ ...item.data }); // Restore input data
     // Restore options, regenerating data string based on loaded data
     const restoredOptions = { ...item.options, data: generateQrDataString(item.type, item.data, toast) };
     setOptions(restoredOptions);

      // Restore logo related state if present in options
     if (item.options.image) {
         const originalSavedLogo = item.data.logoUrl || item.options.image; // Prefer original if saved
         const currentLogoShape = item.data.logoShape || 'square';
         const currentLogoOpacity = (item.data.logoOpacity || 100) / 100;

         setOriginalLogoUrl(originalSavedLogo);
         setLogoSize( (item.options.imageOptions?.imageSize ?? 0.4) * 100);
         setLogoShape(currentLogoShape);
         setLogoOpacity(item.data.logoOpacity || 100);

         // Re-apply shape/opacity based on restored values
         applyLogoShapeAndOpacity(originalSavedLogo, currentLogoShape, currentLogoOpacity);

     } else {
         removeLogo(); // Clear logo if none in history item
     }

     setQrLabel(item.label || '');
     // Set expiry date if it was present (visual only)
     setExpiryDate(item.data.expiryDate ? new Date(item.data.expiryDate) : undefined);
     setExpiryTime(item.data.expiryTime || "00:00");

     // Update preview state
     setIsQrGenerated(!!restoredOptions.data);
     setQrCodeSvgDataUrl(item.qrCodeSvgDataUrl);
     setQrPreviewKey(Date.now()); // Force preview update
     toast({ title: "Loaded from History", description: `Restored QR code configuration from ${format(item.timestamp, 'PP pp')}.` });
     setShowHistory(false); // Close history panel after loading
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [removeLogo, toast, applyLogoShapeAndOpacity]); // Dependencies

  const deleteFromHistory = useCallback((id: string) => {
     setHistory(prev => {
       const updatedHistory = prev.filter(item => item.id !== id);
       setLocalStorageItem('qrHistory', updatedHistory, toast);
        logFirebaseEvent('qr_history_deleted', { itemCount: updatedHistory.length });
       toast({ title: "Removed from History", variant: "destructive" });
       return updatedHistory;
     });
   }, [toast]);

  const clearHistory = useCallback(() => {
     setHistory([]);
     setLocalStorageItem('qrHistory', [], toast);
      logFirebaseEvent('qr_history_cleared');
     toast({ title: "History Cleared", variant: "destructive" });
     setShowHistory(false); // Close panel after clearing
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




  // --- Input Handlers ---
  const handleInputChange = (key: string, value: any) => {
    // Validation for numeric fields
    if ((key === 'latitude' || key === 'longitude' || key === 'upi_amount') && value && isNaN(Number(value))) {
         toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a valid number." });
         return;
    }
     if (key === 'upi_amount' && value && Number(value) < 0) {
         toast({ variant: "destructive", title: "Invalid Amount", description: "Amount cannot be negative." });
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

    setInputDataState(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key: string, checked: boolean | 'indeterminate') => {
     setInputDataState(prev => ({ ...prev, [key]: checked === true })); // Treat indeterminate as false
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
         imageOptions: { ...(prev.imageOptions ?? defaultOptions.imageOptions!), imageSize: imageSizeValue }
     }));
     // Store logo size in inputData for history restoration
     setInputDataState(prev => ({ ...prev, logoSize: sizePercent }));

     // Re-process logo if it exists
     if (originalLogoUrl) {
          applyLogoShapeAndOpacity(originalLogoUrl, logoShape, logoOpacity / 100);
     }
  }

 const handleLogoShapeChange = (value: 'square' | 'circle') => {
     setLogoShape(value);
      // Store logo shape in inputData for history restoration
     setInputDataState(prev => ({ ...prev, logoShape: value }));
     if (originalLogoUrl) {
         applyLogoShapeAndOpacity(originalLogoUrl, value, logoOpacity / 100);
     }
 };

 const handleLogoOpacityChange = (value: number[]) => {
     const opacityPercent = value[0];
      setLogoOpacity(opacityPercent); // Update slider state
       // Store logo opacity in inputData for history restoration
     setInputDataState(prev => ({ ...prev, logoOpacity: opacityPercent }));
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
       // Store hide dots setting in inputData for history restoration
      setInputDataState(prev => ({ ...prev, hideBackgroundDots: hide }));
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
        setOriginalLogoUrl(imageUrl); // Store the original
        applyLogoShapeAndOpacity(imageUrl, logoShape, logoOpacity / 100); // Apply current shape/opacity
         // Also store in inputData for history
        setInputDataState(prev => ({ ...prev, logoUrl: imageUrl }));
      };
      reader.onerror = () => toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected file." });
      reader.readAsDataURL(file);
    }
 }, [logoShape, logoOpacity, applyLogoShapeAndOpacity, toast]);

 const triggerLogoUpload = () => logoInputRef.current?.click();


 const handleAudioImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
         if (!file.type.startsWith('image/')) {
             toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload an image file (PNG, JPG, etc.)." });
             return;
         }
          if (file.size > 5 * 1024 * 1024) { // 5MB limit for audio-image
            toast({ variant: "destructive", title: "File Too Large", description: "Image should be less than 5MB." });
            return;
          }
         const reader = new FileReader();
         reader.onloadend = () => {
             const imageUrl = reader.result as string;
             handleInputChange('audio_image_url', imageUrl);
             toast({ title: "Image Uploaded" });
         };
         reader.onerror = () => toast({ variant: "destructive", title: "File Read Error", description: "Could not read the image file." });
         reader.readAsDataURL(file);
     }
 };

 const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
         if (!file.type.startsWith('audio/')) {
             toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload an audio file (MP3, WAV, etc.)." });
             return;
         }
         if (file.size > 10 * 1024 * 1024) { // 10MB limit for audio
             toast({ variant: "destructive", title: "File Too Large", description: "Audio file should be less than 10MB." });
             return;
         }
          const reader = new FileReader();
          reader.onloadend = () => {
              const audioUrl = reader.result as string; // This will be a data URL
              handleInputChange('audio_file_url', audioUrl);
              setAudioUrl(audioUrl); // For preview
              toast({ title: "Audio File Uploaded" });
          };
          reader.onerror = () => toast({ variant: "destructive", title: "File Read Error", description: "Could not read the audio file." });
          reader.readAsDataURL(file);
     }
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
       // Store expiry in inputData for history
       setInputDataState(prev => ({ ...prev, expiryDate: expiry?.toISOString(), expiryTime: expiry ? format(expiry, "HH:mm") : "00:00" }));
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
             if (isNaN(hours) || isNaN(minutes)) throw new Error("Invalid time format"); // Add validation
             combinedDate = new Date(date);
             combinedDate.setHours(hours, minutes, 0, 0); // Set H, M, S, MS

             if (combinedDate < new Date()) {
                 toast({ variant: "destructive", title: "Invalid Date/Time", description: "Expiry cannot be in the past." });
                 return;
             }
              setExpiryDate(combinedDate);
              toast({ title: "Expiry Reminder Set", description: `QR code visually marked to expire on ${format(combinedDate, "PPP 'at' HH:mm")}. (Backend needed for real expiry)` });
              // Store expiry in inputData for history
             setInputDataState(prev => ({ ...prev, expiryDate: combinedDate?.toISOString(), expiryTime: time }));

         } catch {
              toast({ variant: "destructive", title: "Invalid Time", description: "Please enter a valid time." });
              return; // Don't update if time parsing fails
         }
     } else {
         const hadExpiry = !!expiryDate;
         setExpiryDate(undefined);
         if (!date) setExpiryTime("00:00");
         if (hadExpiry) {
             toast({ title: "Expiry Removed", description: "QR code expiry marker removed." });
         }
          // Clear expiry in inputData for history
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

      // Log the download event
       logFirebaseEvent('qr_code_downloaded', {
           qrType: qrType,
           fileExtension: fileExtension,
           hasLogo: !!originalLogoUrl,
           dataLength: qrData.length
       });


      // Note: Real expiry needs backend logic.
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
  }, [qrCodeInstance, options, fileExtension, qrType, generateQrData, isQrGenerated, expiryDate, qrLabel, toast, originalLogoUrl]); // Added originalLogoUrl dependency



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
                                    {/* Conditionally render password based on encryption */}
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
                         case 'vcard': // Added vCard inputs
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
                         case 'audio-image':
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="audio-image-title">Title (Optional)</Label>
                                        <Input id="audio-image-title" type="text" value={inputDataState.audio_image_title || ''} onChange={(e) => handleInputChange('audio_image_title', e.target.value)} placeholder="e.g., Happy Birthday!" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="audio-image-upload">Upload Image *</Label>
                                        <Input ref={audioImageInputRef} id="audio-image-upload" type="file" accept="image/*" onChange={handleAudioImageUpload} required />
                                        {inputDataState.audio_image_url && (
                                             <img src={inputDataState.audio_image_url} alt="Image Preview" className="mt-2 h-20 w-auto rounded border object-contain" />
                                        )}
                                    </div>
                                     <div className="space-y-2">
                                         <Label>Upload or Record Audio *</Label>
                                          <div className="flex flex-col sm:flex-row gap-2">
                                             <Button variant="outline" className="w-full sm:w-auto" onClick={() => audioFileInputRef.current?.click()}>
                                                  <Upload className="mr-2 h-4 w-4" /> Upload Audio
                                             </Button>
                                              <Input ref={audioFileInputRef} id="audio-file-upload" type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" required/>
                                               <Button
                                                    variant={isRecording ? "destructive" : "outline"}
                                                    className="w-full sm:w-auto"
                                                    onClick={isRecording ? stopRecording : startRecording}
                                                >
                                                    {isRecording ? <><PauseCircle className="mr-2 h-4 w-4 animate-pulse" /> Stop Recording</> : <><Mic className="mr-2 h-4 w-4" /> Record Audio</>}
                                                </Button>
                                          </div>
                                           {audioUrl && (
                                             <div className="mt-2 flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                                 <FileAudio className="h-5 w-5 text-primary" />
                                                 <audio ref={audioRef} src={audioUrl} controls className="w-full h-8" />
                                                 <Button variant="ghost" size="icon" onClick={() => { setAudioUrl(null); setAudioBlob(null); handleInputChange('audio_file_url', ''); if (audioFileInputRef.current) audioFileInputRef.current.value = ''; }}>
                                                     <Trash2 className="h-4 w-4 text-destructive" />
                                                 </Button>
                                             </div>
                                           )}
                                          <p className="text-xs text-muted-foreground">Image (max 5MB), Audio (max 10MB). Recorded audio is WAV.</p>
                                     </div>
                                    <p className="text-xs text-muted-foreground">* Image and Audio are required.</p>
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

  // --- Bulk QR Code Generation ---

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a CSV file.' });
      return;
    }

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
         if (results.errors.length > 0) {
             console.error("CSV Parsing Errors:", results.errors);
             toast({ variant: 'destructive', title: 'CSV Parsing Error', description: `Error parsing row ${results.errors[0].row}: ${results.errors[0].message}` });
             setCsvData([]); // Clear data on error
         } else if (!results.data.length) {
             toast({ variant: 'destructive', title: 'Empty CSV', description: 'The uploaded CSV file is empty or has no valid data.' });
             setCsvData([]);
         } else if (!results.meta.fields || !results.meta.fields.includes('type') || !results.meta.fields.includes('data')) {
             toast({ variant: 'destructive', title: 'Invalid CSV Headers', description: "CSV must contain 'type' and 'data' columns." });
             setCsvData([]);
         } else {
            setCsvData(results.data as any[]); // Type assertion
            toast({ title: 'CSV Uploaded', description: `Found ${results.data.length} rows. Ready to generate.` });
         }
      },
      error: (error) => {
         console.error("CSV Parsing Failed:", error);
        toast({ variant: 'destructive', title: 'CSV Parsing Failed', description: 'Could not parse the CSV file.' });
         setCsvData([]);
      },
    });
  };

  const handleBulkDownload = async () => {
    if (bulkQrCodes.length === 0) {
      toast({ variant: 'destructive', title: 'No QR Codes to Download', description: 'Please generate QR codes first.' });
      return;
    }
    logFirebaseEvent('bulk_qr_download_started', { count: bulkQrCodes.length });

    const zip = new JSZip();
    const downloadFormat = fileExtension === 'svg' ? 'svg' : 'png'; // Prefer SVG or PNG for bulk

    bulkQrCodes.forEach((qrCodeDataUrl, index) => {
      try {
          const filename = `qr-code-${index + 1}-${csvData[index]?.type || 'bulk'}.${downloadFormat}`;
          const base64Data = qrCodeDataUrl.split(',')[1];
          if (!base64Data) {
              console.warn(`Could not extract base64 data for QR code ${index + 1}. Skipping.`);
              return; // Skip if data URL is malformed
          }
          zip.file(filename, base64Data, { base64: true });
      } catch (error) {
           console.error(`Error adding QR code ${index + 1} to zip:`, error);
      }
    });

    try {
         const zipFilename = 'bulk-qr-codes.zip';
         const content = await zip.generateAsync({ type: 'blob' });

         const url = window.URL.createObjectURL(content);
         const link = document.createElement('a');
         link.href = url;
         link.download = zipFilename;
         document.body.appendChild(link); // Required for Firefox
         link.click();
         document.body.removeChild(link); // Clean up
         window.URL.revokeObjectURL(url);

         toast({ title: 'Download Started', description: `Downloading ${bulkQrCodes.length} QR codes as ${zipFilename}.` });
          logFirebaseEvent('bulk_qr_download_completed', { count: bulkQrCodes.length });
    } catch (error) {
        console.error("Error generating or downloading zip file:", error);
        toast({ variant: 'destructive', title: 'Zip Download Failed', description: 'Could not create or download the zip file.' });
         logFirebaseEvent('bulk_qr_download_failed', { error: (error as Error).message });
    }
  };


  const generateBulkQrCodes = async () => {
    if (csvData.length === 0) {
      toast({ variant: 'destructive', title: 'No CSV Data', description: 'Please upload a valid CSV file first.' });
      return;
    }
    logFirebaseEvent('bulk_qr_generation_started', { count: csvData.length });

    const generatedCodes: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Use a temporary QR instance for bulk generation
    const bulkOptions = { ...options, type: 'svg' as 'svg', width: 256, height: 256 }; // Use SVG for data URL generation
    const tempInstance = new QRCodeStyling(bulkOptions);


    for (let i = 0; i < csvData.length; i++) {
         const row = csvData[i];
         // Basic validation of row data
         if (!row.type || !row.data || typeof row.type !== 'string' || typeof row.data !== 'string') {
              console.warn(`Invalid data in CSV row ${i + 1}. Skipping. Row:`, row);
              toast({ variant: 'destructive', title: 'Invalid Row Data', description: `Skipping row ${i + 1} due to missing or invalid 'type' or 'data'.`, duration: 5000 });
              errorCount++;
              continue;
         }

         const rowType = row.type.trim().toLowerCase() as QrType;
         const rowDataValue = row.data.trim();

         // Check if the type is valid
         if (!qrTypeOptions.some(opt => opt.value === rowType)) {
              console.warn(`Invalid QR type '${rowType}' in CSV row ${i + 1}. Skipping.`);
               toast({ variant: 'destructive', title: 'Invalid QR Type', description: `Skipping row ${i + 1}: Invalid type '${rowType}'.`, duration: 5000 });
               errorCount++;
              continue;
         }

         // Prepare data object for generateQrDataString
         const inputDataObject: Record<string, any> = {};
         // This needs refinement based on expected CSV columns for complex types
         if (rowType === 'url') inputDataObject.url = rowDataValue;
         else if (rowType === 'text') inputDataObject.text = rowDataValue;
         else if (rowType === 'phone') inputDataObject.phone = rowDataValue;
         else if (rowType === 'email') inputDataObject.email = rowDataValue; // Simplified: assumes only email address is in 'data' column
         // Add more complex parsing logic here if CSV has multiple columns for types like email, wifi, event etc.
         else inputDataObject[rowType] = rowDataValue; // Fallback for simple types

        const qrDataString = generateQrDataString(rowType, inputDataObject, toast);

         if (qrDataString) {
             try {
                  tempInstance.update({ data: qrDataString });
                  // Wait a tiny bit for the instance update (might not be strictly necessary for getRawDataURL)
                  await new Promise(resolve => setTimeout(resolve, 5));
                  const dataUrl = await tempInstance.getRawDataURL('svg');
                  if (dataUrl) {
                     generatedCodes.push(dataUrl);
                     successCount++;
                  } else {
                       console.warn(`Could not get data URL for QR code in row ${i + 1}. Skipping.`);
                       errorCount++;
                  }
             } catch (error: any) {
                  console.error(`Error generating QR for row ${i + 1}:`, error);
                   toast({ variant: 'destructive', title: `Generation Error (Row ${i + 1})`, description: error.message || 'Could not generate QR code.', duration: 5000 });
                  errorCount++;
             }
         } else {
             console.warn(`Could not generate valid QR data string for row ${i + 1}. Skipping.`);
             // generateQrDataString should have shown a toast for specific validation errors
             errorCount++;
         }
     }


    setBulkQrCodes(generatedCodes); // Update state with successfully generated codes
    if (successCount > 0) {
         toast({ title: 'Bulk Generation Complete', description: `Generated ${successCount} QR codes. ${errorCount > 0 ? `${errorCount} rows failed.` : ''}` });
          logFirebaseEvent('bulk_qr_generation_completed', { success: successCount, failed: errorCount });
    } else if (errorCount > 0) {
         toast({ variant: 'destructive', title: 'Bulk Generation Failed', description: `Could not generate any QR codes. ${errorCount} rows failed.` });
         logFirebaseEvent('bulk_qr_generation_failed', { failed: errorCount });
    } else {
         toast({ variant: 'destructive', title: 'Bulk Generation Failed', description: 'No QR codes were generated. Check CSV data.' });
         logFirebaseEvent('bulk_qr_generation_failed', { failed: csvData.length });
    }
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
             {/* Tabs for Content & Bulk */}
             <Tabs defaultValue="content" className="w-full">
                 <TabsList className="grid w-full grid-cols-2 mb-4"> {/* Adjusted grid cols */}
                    <TabsTrigger value="content"><Settings2 className="inline-block mr-1 h-4 w-4" /> Options</TabsTrigger>
                    <TabsTrigger value="bulk"><Upload className="inline-block mr-1 h-4 w-4" /> Bulk Generate</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="pt-6 space-y-6">
                    {/* Accordion for Content, Styling, Logo, Extras */}
                    <Accordion type="multiple" collapsible className="w-full" defaultValue={["content-item", "styling-item"]}>
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
                                            setInputDataState({}); // Clear input data on type change
                                            setExpiryDate(undefined);
                                            setQrLabel('');
                                             // Set default data for URL type if selected
                                             if (value === 'url') {
                                                 setInputDataState({ url: '' }); // Start with empty URL
                                             } else if (value === 'audio-image') {
                                                 // Reset audio/image states for this type
                                                 setInputDataState({});
                                                 setAudioUrl(null);
                                                 setAudioBlob(null);
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

                {/* Bulk Generate Tab */}
                <TabsContent value="bulk" className="pt-6 space-y-6">
                    <div className="space-y-4">
                        <Label htmlFor="csv-upload">Upload CSV File</Label>
                        <Input id="csv-upload" type="file" accept=".csv" onChange={handleCsvUpload} />
                        <p className="text-xs text-muted-foreground">Upload a CSV file with columns 'type' and 'data' for bulk QR code generation. Complex types may require additional columns.</p>
                        <Button onClick={generateBulkQrCodes} disabled={csvData.length === 0}>Generate Bulk QR Codes</Button>
                    </div>

                    {bulkQrCodes.length > 0 && (
                        <div className="space-y-4 pt-4 border-t">
                             <h4 className="font-medium">Generated QR Codes ({bulkQrCodes.length})</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {bulkQrCodes.map((qrCodeDataUrl, index) => (
                                    <div key={index} className="border rounded-lg overflow-hidden shadow-sm bg-white p-1 aspect-square flex items-center justify-center">
                                        <img src={qrCodeDataUrl} alt={`QR Code ${index + 1}`} className="w-full h-auto object-contain" />
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleBulkDownload} className="w-full sm:w-auto">
                                <Download className="mr-2 h-4 w-4" /> Download All as Zip
                             </Button>
                        </div>
                    )}
                </TabsContent>

                 {/* History Dialog */}
                 <AlertDialog open={showHistory} onOpenChange={setShowHistory}>
                     <AlertDialogContent className="max-w-3xl h-[80vh] flex flex-col">
                         <AlertDialogHeader>
                             <AlertDialogTitle className="flex justify-between items-center">
                                 Generation History ({history.length})
                                 <AlertDialogCancel asChild>
                                      <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                                          <X className="h-4 w-4" />
                                          <span className="sr-only">Close History</span>
                                      </Button>
                                 </AlertDialogCancel>
                              </AlertDialogTitle>
                             <AlertDialogDescription>
                                Previously generated QR codes stored locally. Click to reload, or use the icons to edit the label or delete.
                             </AlertDialogDescription>
                         </AlertDialogHeader>

                         {history.length > 0 ? (
                             <ScrollArea className="flex-grow border rounded-md my-4">
                                 <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                     {history.map((item) => {
                                         const TypeIcon = qrTypeOptions.find(opt => opt.value === item.type)?.icon || QrCodeIcon;
                                         const isEditing = editingLabelId === item.id;

                                         return (
                                             <Card key={item.id} className="overflow-hidden group relative hover:shadow-md transition-shadow">
                                                  {/* Make entire card clickable except action buttons */}
                                                  <button
                                                    onClick={() => { if (!isEditing) loadFromHistory(item); }}
                                                    className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                                                    aria-label={`Load ${item.label || `QR from ${format(item.timestamp, 'p')}`}`}
                                                    disabled={isEditing}
                                                  >
                                                  </button>
                                                 <CardContent className="p-3 flex items-start gap-3">
                                                      {/* QR Preview */}
                                                      {item.qrCodeSvgDataUrl ? (
                                                          <img src={item.qrCodeSvgDataUrl} alt="QR Code Preview" className="w-16 h-16 sm:w-20 sm:h-20 object-contain border rounded bg-white shrink-0" />
                                                      ) : (
                                                           <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border rounded bg-muted shrink-0">
                                                               <QrCodeIcon className="w-8 h-8 text-muted-foreground" />
                                                           </div>
                                                      )}
                                                      {/* Text Content and Actions */}
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
                                                                />
                                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { editHistoryLabel(item.id, editingLabelValue); setEditingLabelId(null); }}>
                                                                    <Check className="h-4 w-4 text-green-600" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.label || `QR Code ${item.id}`}</p>
                                                        )}

                                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                             <TypeIcon className="h-3 w-3 shrink-0" />
                                                             {qrTypeOptions.find(opt => opt.value === item.type)?.label || item.type}
                                                          </p>
                                                         <p className="text-xs text-muted-foreground">{format(item.timestamp, 'PP p')}</p>
                                                     </div>
                                                      {/* Action Buttons (outside clickable area logic) */}
                                                        <div className="flex flex-col gap-1 absolute top-1 right-1 z-20">
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
                                                                            This action cannot be undone. Are you sure you want to delete "{item.label || `QR Code ${item.id}`}"?
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => deleteFromHistory(item.id)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                             </AlertDialog>
                                                        </div>
                                                 </CardContent>
                                             </Card>
                                         );
                                     })}
                                 </div>
                             </ScrollArea>
                         ) : (
                             <div className="flex-grow flex items-center justify-center text-muted-foreground">
                                 No history yet. Generate and save some QR codes!
                             </div>
                         )}

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
             {/* History Button */}
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
            <Button onClick={addToHistory} className="w-full" variant="secondary" disabled={!isQrGenerated}>
                 <Save className="mr-2 h-4 w-4" /> Save to History
            </Button>
              <p className="text-xs text-muted-foreground text-center px-4">Note: QR codes are saved to your history only upon explicit action. If you do not manually save the QR code, it will not be added to your history.</p>
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

