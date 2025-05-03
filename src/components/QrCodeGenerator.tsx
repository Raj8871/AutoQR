
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
import { Download, Image as ImageIcon, Link as LinkIcon, Phone, Mail, MessageSquare, MapPin, Calendar as CalendarIcon, User, Settings2, Palette, Clock, Wifi, Upload, Check, Trash2, Info, Eye, EyeOff, QrCode as QrCodeIcon, History as HistoryIcon, RefreshCcw, Star, Sparkles, Shapes, CreditCard, Copy, Pencil, StarIcon, Share2, X, Mic, Lock } from 'lucide-react'; // Added Mic, Lock
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// Removed Firebase imports

// --- Types ---

// Define allowed QR types
type QrType = 'url' | 'text' | 'email' | 'phone' | 'whatsapp' | 'sms' | 'location' | 'event' | 'vcard' | 'wifi' | 'upi' | 'voice' | 'password'; // Added 'voice', 'password'

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
  { value: 'upi', label: 'UPI Payment', icon: CreditCard, description: 'Generate a QR for UPI payments with a specific amount and note.' },
  { value: 'voice', label: 'Voice Message', icon: Mic, description: 'Record or upload an audio message to share.' }, // Added Voice
  { value: 'password', label: 'Password Protected Content', icon: Lock, description: 'Secure content (URL/Text) behind a password.' }, // Added Password
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
  isFavorite?: boolean; // Optional: Mark favorite QR codes
  previewSvgDataUrl: string | null; // Store the preview URL for quick display
}


const LOCAL_STORAGE_KEY = 'qrCodeHistory';
const MAX_HISTORY_ITEMS = 50; // Increased history limit

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
  // Basic validation: Require at least first name, last name, or organization/phone/email
  if (!data.firstName && !data.lastName && !data.organization && !data.phone && !data.mobile && !data.email) return '';
  return vCardString;
};

// Format ICS data
const formatICS = (data: Record<string, any>): string => {
    const formatDate = (date: Date | null | undefined): string => {
      if (!date) return '';
      // Format: YYYYMMDDTHHMMSSZ (UTC time)
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    if (!data.summary || !data.startDate) return ''; // Summary and start date are mandatory
    let icsString = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LinkSpark//QR Event Generator//EN\nBEGIN:VEVENT\n';
    icsString += `SUMMARY:${data.summary}\n`;
    if (data.location) icsString += `LOCATION:${data.location}\n`;
    if (data.description) icsString += `DESCRIPTION:${data.description.replace(/\n/g, '\\n')}\n`; // Escape newlines

    const startDate = new Date(data.startDate); // Ensure it's a Date object
    icsString += `DTSTART:${formatDate(startDate)}\n`;

    if (data.endDate) {
      const endDate = new Date(data.endDate);
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
              toast({ variant: "destructive", title: "Invalid Start Date", description: "Could not calculate default end date." });
              return ''; // Prevent generation if start date was bad
         }
    }
    icsString += 'UID:' + Date.now() + '@linkspark.com\n'; // Unique ID for the event
    icsString += 'END:VEVENT\nEND:VCALENDAR';
    return icsString;
}

// Format Wi-Fi data
const formatWifi = (data: Record<string, any>): string => {
    // Escape special characters: \, ;, ,, ", :
    const escapeValue = (value: string = '') => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');

    const ssid = escapeValue(data.wifi_ssid);
    const password = escapeValue(data.wifi_password);
    const encryption = data.wifi_encryption === 'None' ? 'nopass' : (data.wifi_encryption || 'WPA'); // Default to WPA if not None
    const hidden = data.wifi_hidden ? 'true' : 'false';

    if (!ssid) return ''; // SSID is mandatory

    // Password is required unless encryption is 'nopass'
    if (encryption !== 'nopass' && !password) {
         toast({ variant: "destructive", title: "Password Required", description: "Password is required for WPA/WEP encryption." });
         return '';
    }

    // Construct the string: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
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
         toast({ variant: "destructive", title: "Invalid UPI ID", description: "Please enter a valid UPI ID (e.g., name@bank)." });
         return ''; // Stop generation if invalid
    }
     // Amount validation: Must be positive if entered
    if (data.upi_amount && (isNaN(amount) || amount <= 0)) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "UPI amount must be a positive number." });
        return ''; // Stop generation if invalid
    }

    // Construct URI: upi://pay?pa=<upi_id>&pn=<payee_name>&am=<amount>&cu=INR&tn=<note>
    let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;
    if (payeeName) {
        upiString += `&pn=${encodeURIComponent(payeeName)}`; // Add Payee Name
    }
    // Only include amount if it's positive
    if (amount > 0) {
        upiString += `&am=${amount.toFixed(2)}`; // Amount with 2 decimal places
    }
    upiString += `&cu=INR`; // Currency is INR
    if (note) {
        upiString += `&tn=${encodeURIComponent(note)}`; // Transaction Note
    }

    return upiString;
};


// --- Password Protection (Basic Simulation) ---
// In a real app, use server-side encryption/decryption or a secure service
const encryptContent = (content: string, pass: string): string => {
  // VERY basic XOR simulation - NOT SECURE for production
  let encrypted = '';
  for (let i = 0; i < content.length; i++) {
    encrypted += String.fromCharCode(content.charCodeAt(i) ^ pass.charCodeAt(i % pass.length));
  }
  return btoa(encrypted); // Base64 encode for URL safety
};

const formatPasswordProtectedData = (data: Record<string, any>): string => {
    const content = data.password_content || '';
    const password = data.password_pass || '';

    if (!content || !password) {
        toast({ variant: "destructive", title: "Missing Info", description: "Content and password are required." });
        return '';
    }

    const encrypted = encryptContent(content, password);
    // Simple URL structure for the intermediate page (simulated)
    // In a real app, this URL would point to your server endpoint
    const intermediateUrl = `/protected?data=${encodeURIComponent(encrypted)}`;
    return intermediateUrl;
}


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
const generateQrDataString = (type: QrType, data: Record<string, any>): string => {
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
                 return ''; // Empty URL
             }
             break;
          case 'text': targetData = data.text?.trim() || ''; break;
          case 'email':
            const emailTo = data.email?.trim();
             // Basic email validation
             if (emailTo && emailTo.includes('@')) {
                 targetData = `mailto:${emailTo}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
             } else if (emailTo) {
                  toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
                  return '';
             } else {
                  return ''; // Empty email
             }
            break;
          case 'phone': targetData = data.phone?.trim() ? `tel:${data.phone.trim()}` : ''; break;
          case 'whatsapp':
            // Basic check for digits only (allow leading '+')
            const phoneNum = (data.whatsapp_phone || '').replace(/[^0-9+]/g, '');
            if (phoneNum && phoneNum.length > 5) { // Very basic length check
                 targetData = `https://wa.me/${phoneNum.replace('+', '')}?text=${encodeURIComponent(data.whatsapp_message || '')}`;
            } else if (phoneNum) {
                toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid WhatsApp number including country code." });
                return '';
            } else {
                 return '';
            }
            break;
          case 'sms':
            const smsPhoneNum = (data.sms_phone || '').trim();
            if (smsPhoneNum) {
                 targetData = `sms:${smsPhoneNum}?body=${encodeURIComponent(data.sms_message || '')}`;
            } else {
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
                  return '';
             }
             break;
          case 'event':
              targetData = formatICS({ summary: data.event_summary, location: data.event_location, description: data.event_description, startDate: data.event_start, endDate: data.event_end });
              // formatICS handles its own validation and returns '' on failure
              if (!targetData && (data.event_summary || data.event_start)) {
                 // formatICS might have already shown a toast, maybe avoid double-toasting
                 // console.warn("ICS data generation failed.");
              }
              break;
          case 'vcard':
               targetData = formatVCard({ firstName: data.vcard_firstName, lastName: data.vcard_lastName, organization: data.vcard_organization, title: data.vcard_title, phone: data.vcard_phone, mobile: data.vcard_mobile, email: data.vcard_email, website: data.vcard_website, address: data.vcard_address });
                if (!targetData && (data.vcard_firstName || data.vcard_lastName || data.vcard_organization || data.vcard_phone || data.vcard_email)) {
                     toast({ variant: "destructive", title: "Incomplete vCard", description: "Please provide at least a name, organization, phone, or email." });
                 }
               break;
          case 'wifi':
               targetData = formatWifi({ wifi_ssid: data.wifi_ssid, wifi_password: data.wifi_password, wifi_encryption: data.wifi_encryption || 'WPA/WPA2', wifi_hidden: data.wifi_hidden || false });
                // formatWifi handles its own validation
               break;
          case 'upi': // Added UPI case
               targetData = formatUpi({ upi_id: data.upi_id, upi_name: data.upi_name, upi_amount: data.upi_amount, upi_note: data.upi_note });
                // formatUpi handles its own validation
               break;
          case 'voice': // Added Voice case
              // For now, just link to the data URL if available
              if (data.voice_data_url) {
                  targetData = data.voice_data_url;
              } else {
                  toast({ variant: "destructive", title: "No Voice Message", description: "Please record or upload a voice message first." });
                  return '';
              }
              break;
          case 'password': // Added Password case
              targetData = formatPasswordProtectedData({ password_content: data.password_content, password_pass: data.password_pass });
              // formatPasswordProtectedData handles its own validation
              break;
          default: targetData = '';
        }
    } catch (error) {
        console.error(`Error generating QR data string for type ${type}:`, error);
        toast({ variant: "destructive", title: "Data Error", description: `Could not format data for ${type}. Please check your inputs.` });
        return '';
    }

    // Final check for excessively long data which might cause QR generation errors
    const MAX_DATA_LENGTH = 2953; // Approx limit for high error correction, version 40, binary data
     if (targetData.length > MAX_DATA_LENGTH) {
         console.warn(`QR data for type ${type} might be too long (${targetData.length} chars). Potential generation issues.`);
         toast({
             variant: "destructive", // Changed to destructive as it might fail
             title: "Data Too Long",
             description: `The input data is very long (${targetData.length} characters) and may fail to generate a QR code. Consider shortening it. Max ~${MAX_DATA_LENGTH} chars.`
         });
         // Stop generation if data is clearly too long for QR code standard
         return '';
     }

    return targetData;
};


export function QrCodeGenerator() {
  // Core QR State
  const [qrType, setQrType] = useState<QrType>('url');
  const [inputData, setInputData] = useState<Record<string, any>>({}); // Default empty
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
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false); // For password protected content

   // Voice Message State
   const [isRecording, setIsRecording] = useState(false);
   const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
   const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
   const audioChunksRef = useRef<Blob[]>([]);
   const audioRef = useRef<HTMLAudioElement>(null); // Ref for audio playback


   // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null); // Track item being edited
  const [editedLabel, setEditedLabel] = useState<string>(''); // Temp state for editing label
  const [filterFavorites, setFilterFavorites] = useState<boolean>(false); // State to filter favorites
  const [historySearchTerm, setHistorySearchTerm] = useState<string>(''); // State for history search

  // Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null); // Ref for the container div
  const voiceFileInputRef = useRef<HTMLInputElement>(null); // Ref for voice file input

   // --- History Management ---

  // Load history from local storage on mount
  useEffect(() => {
    const loadedHistory = getLocalStorageItem<HistoryItem[]>(LOCAL_STORAGE_KEY, []);
    // Sort by timestamp descending on load
    loadedHistory.sort((a, b) => b.timestamp - a.timestamp);
    setHistory(loadedHistory);
  }, []);

  // Update local storage whenever history changes
  useEffect(() => {
    setLocalStorageItem(LOCAL_STORAGE_KEY, history);
  }, [history]);

   // Add item to history
  const addToHistory = useCallback((newItemData: Omit<HistoryItem, 'id' | 'timestamp' | 'previewSvgDataUrl' | 'isFavorite'>, svgDataUrl: string | null) => {
    // Basic validation before adding: Ensure there's data
    const qrDataString = generateQrDataString(newItemData.qrType, newItemData.inputData);
    if (!qrDataString) {
        // console.warn("Attempted to save empty or invalid QR code to history.");
        return; // Don't save if data generation failed
    }

     // Prevent excessively long data from being saved (optional, but good practice)
     if (qrDataString.length > 3000) { // Stricter limit for history save
        // console.warn("QR data too long to save in history.");
         // Optionally toast here too, or just silently fail to save history item
         toast({ variant: "destructive", title: "Data Too Long", description: "QR data is too long to save in history."});
         return;
     }


    const fullItem: HistoryItem = {
        ...newItemData,
        id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        timestamp: Date.now(),
        previewSvgDataUrl: svgDataUrl, // Use the passed SVG data URL
        isFavorite: false, // Default to not favorite
    };

     // Add or update logic
     setHistory(prevHistory => {
        // Check if an item with similar data already exists (simple check)
        // This check might be too simple for complex types like vCard or event
        // Consider a more robust comparison if needed
        // const existingIndex = prevHistory.findIndex(item =>
        //     item.qrType === fullItem.qrType && JSON.stringify(item.inputData) === JSON.stringify(fullItem.inputData)
        // );
        const existingIndex = -1; // Disable simple duplicate check for now

        let newHistory: HistoryItem[];
        if (existingIndex > -1) {
            // Update existing item's timestamp and preview, move to top
            const updatedHistory = [...prevHistory];
            const [existingItem] = updatedHistory.splice(existingIndex, 1);
            existingItem.timestamp = fullItem.timestamp;
            existingItem.previewSvgDataUrl = fullItem.previewSvgDataUrl;
            existingItem.label = fullItem.label; // Update label too
            // Preserve favorite status
            newHistory = [{ ...existingItem, isFavorite: existingItem.isFavorite }, ...updatedHistory];
        } else {
            // Add new item to the top
            newHistory = [fullItem, ...prevHistory];
        }

         // Sort by timestamp (newest first) and limit size
        newHistory.sort((a, b) => b.timestamp - a.timestamp);
        newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);

        return newHistory;
     });
  }, []); // No dependencies needed if it only calls setHistory based on arguments


   // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    toast({ title: "History Cleared", description: "Your QR code generation history has been removed." });
  }, []);

  // Remove single item from history
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    toast({ title: "Item Removed", description: "QR code removed from history." });
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback((id: string) => {
    setHistory(prev => prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  }, []);

   // Edit Label Handlers
   const startEditingLabel = (id: string, currentLabel: string) => {
       setEditingItemId(id);
       setEditedLabel(currentLabel);
   };

   const cancelEditingLabel = () => {
       setEditingItemId(null);
       setEditedLabel('');
   };

   const saveEditedLabel = (id: string) => {
        setHistory(prev => prev.map(item =>
            item.id === id ? { ...item, label: editedLabel.trim() || `${item.qrType.toUpperCase()} QR` } : item // Default label if empty
        ));
        toast({ title: "Label Updated" });
        cancelEditingLabel(); // Exit editing mode
   };

   // Handle share action (example using Web Share API if available)
   const shareHistoryItem = async (item: HistoryItem) => {
       const qrData = generateQrDataString(item.qrType, item.inputData);
       const shareData: ShareData = {
           title: `QR Code: ${item.label || item.qrType.toUpperCase()}`,
           text: `Scan this QR code! Type: ${item.qrType}`, // Simplified text
           // url: 'YOUR_APP_URL/view?id=' + item.id // If you have shareable links
       };

        // Try sharing SVG data URL if available and supported
        let files: File[] = [];
        if (item.previewSvgDataUrl && item.previewSvgDataUrl.startsWith('data:image/svg+xml')) {
            try {
                const response = await fetch(item.previewSvgDataUrl);
                const blob = await response.blob();
                const file = new File([blob], `${item.label || 'qr-code'}.svg`, { type: 'image/svg+xml' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                   files.push(file);
                }
            } catch (err) {
                console.warn("Could not create file from SVG data URL for sharing:", err);
            }
        }

       if (navigator.share) {
           try {
                if (files.length > 0 && navigator.canShare({ files })) {
                     await navigator.share({ ...shareData, files });
                } else if (navigator.canShare(shareData)) {
                     await navigator.share(shareData);
                } else {
                    throw new Error("Cannot share this data type.");
                }
               toast({ title: "Shared Successfully" });
           } catch (error) {
                console.error('Error sharing:', error);
                // Fallback to clipboard if sharing fails or is not fully supported
                 navigator.clipboard.writeText(qrData)
                 .then(() => toast({ title: "Content Copied", description: "QR code data copied to clipboard (Share failed)." }))
                 .catch(() => toast({ variant: "destructive", title: "Share/Copy Failed", description: "Could not share or copy the QR code data." }));
           }
       } else {
            // Fallback: Copy the data to clipboard if Share API not available
            navigator.clipboard.writeText(qrData)
             .then(() => toast({ title: "Content Copied", description: "QR code data copied to clipboard (Share API not available)." }))
             .catch(() => toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy the QR code data." }));
       }
   };


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
      let didAppend = false; // Flag to track if append was called

      // Ensure width/height are numbers before passing to library
      const width = typeof options.width === 'number' ? options.width : defaultOptions.width;
      const height = typeof options.height === 'number' ? options.height : defaultOptions.height;

      const qrOptions = { ...options, data: qrData, width, height };


      const updateQrCode = async () => {
           try {
                // Clear previous content *before* creating/updating
                // This helps prevent the "removeChild" error
                container.innerHTML = '';

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
                     if (container.firstChild) {
                         // Check if update method exists before calling
                         if (typeof instance.update === 'function') {
                            instance.update(qrOptions);
                         } else {
                             // Fallback: create new instance if update is not available (should not happen with current library version)
                              container.innerHTML = ''; // Clear again just in case
                              instance = new QRCodeStyling(qrOptions);
                              instance.append(container);
                              didAppend = true;
                              setQrCodeInstance(instance);
                         }
                    } else {
                         // Instance exists but element is gone after clearing, re-append
                         instance.append(container);
                         didAppend = true;
                    }
                }

                // Generate SVG preview for history *after* successful generation/update
                if (instance) {
                   // Delay slightly to ensure DOM update completes before getting data
                   await new Promise(resolve => setTimeout(resolve, 50));
                   const blob = await instance.getRawData('svg');
                    if (blob) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const svgDataUrl = reader.result as string;
                            setQrCodeSvgDataUrl(svgDataUrl); // Keep for history save

                            // Save to history AFTER successful generation and preview update
                             const currentInputData = { ...inputData };
                            // Clean up large data before saving to history (e.g., voice data URL)
                            if (currentInputData.voice_data_url && currentInputData.voice_data_url.length > 1000) {
                                currentInputData.voice_data_url_preview = currentInputData.voice_data_url.substring(0, 100) + '...[truncated]';
                                delete currentInputData.voice_data_url; // Remove full data URL from history item
                            }

                            addToHistory({
                                qrType: qrType,
                                inputData: currentInputData, // Use potentially cleaned input data
                                options: { // Store relevant options
                                    dotsOptions: options.dotsOptions,
                                    backgroundOptions: options.backgroundOptions,
                                    cornersSquareOptions: options.cornersSquareOptions,
                                    cornersDotOptions: options.cornersDotOptions,
                                    image: options.image, // Store processed image URL
                                    imageOptions: options.imageOptions,
                                    // Don't store width/height from options unless specifically needed
                                },
                                label: qrLabel || `${qrTypeOptions.find(o => o.value === qrType)?.label || qrType.toUpperCase()} QR`, // Default label if empty
                            }, svgDataUrl); // Pass SVG data URL
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
               if (container) container.innerHTML = '';
           }
      };

      // Debounce the update to prevent rapid re-renders on input change
      const debounceTimeout = setTimeout(updateQrCode, 300);

      return () => {
           clearTimeout(debounceTimeout);
           // The container clearing is now handled at the beginning of updateQrCode
       };
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, qrType, inputData, qrLabel, addToHistory]); // Removed qrCodeInstance from deps


   // Reload settings from a history item
  const loadFromHistory = useCallback((item: HistoryItem) => {
    const dataToLoad = { ...item.inputData };
     // Restore full voice data URL if it was truncated (requires separate storage or placeholder logic)
     // For now, we just load the potentially truncated data

    setQrType(item.qrType);
    setInputData(dataToLoad); // Use restored data
    // Reconstruct full options from stored partial options + defaults
    const loadedOptions = {
        ...defaultOptions, // Start with defaults
        type: 'svg', // Ensure type is svg for preview
        width: options.width, // Keep current preview size
        height: options.height,
        ...item.options,  // Apply stored customizable options
        data: generateQrDataString(item.qrType, dataToLoad) // Regenerate data string with loaded data
    };
    setOptions(loadedOptions); // This triggers the main useEffect
    setQrLabel(item.label);

    // Restore audio state if loading a voice QR
     if (item.qrType === 'voice' && item.inputData.voice_data_url_preview) {
        // Cannot restore full audio from truncated preview in history
        // Clear current audio state
        setAudioBlob(null);
        setAudioDataUrl(null);
        setInputData(prev => ({ ...prev, voice_data_url: null })); // Clear in current inputData too
        toast({ variant: "default", title: "Voice Message Cleared", description: "Voice message data is not stored in history. Please record/upload again." });
    } else if (item.qrType !== 'voice') {
        // Clear audio state if loading a non-voice type
        setAudioBlob(null);
        setAudioDataUrl(null);
    }


    // Attempt to reconstruct logo state from stored options
    if (item.options?.image) {
        setLogoPreviewUrl(item.options.image); // Use the stored (potentially processed) image URL
        setOriginalLogoUrl(null); // Assume we don't have the original when loading history
        setLogoSize(item.options.imageOptions?.imageSize ? Math.round(item.options.imageOptions.imageSize * 100) : 40);
        // Infer shape/opacity from options if possible, otherwise default
        // (We didn't store shape/opacity explicitly before, might need to adjust history item structure if needed)
        setLogoShape('square'); // Default assumption
        setLogoOpacity(100); // Default assumption
    } else {
        removeLogo(); // Clear logo if none in history item
    }

    // Reset expiry state (not stored in history)
    setExpiryDate(undefined);
    setExpiryTime("00:00");

    setQrPreviewKey(Date.now()); // Force re-render of preview container if needed
    toast({ title: "Loaded from History", description: `Restored QR code configuration from ${format(item.timestamp, 'PP pp')}.` });
  }, [removeLogo, options.width, options.height, generateQrDataString]); // Added generateQrDataString


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
 }, [logoSize, options.imageOptions]); // Removed logoShape, logoOpacity, relying on state


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
  }, [qrCodeInstance, options, fileExtension, qrType, generateQrData, isQrGenerated, expiryDate, qrLabel]);


    // --- Voice Message Recording ---
    const startRecording = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = []; // Clear previous chunks

                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); // Use WAV for better compatibility
                    setAudioBlob(audioBlob);
                    const url = URL.createObjectURL(audioBlob);
                    setAudioDataUrl(url);
                    setInputData(prev => ({ ...prev, voice_data_url: url })); // Set data URL for QR
                    // Stop the tracks to release the microphone
                     stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
                toast({ title: "Recording Started", description: "Click stop when finished." });
            } catch (err) {
                console.error("Error accessing microphone:", err);
                toast({ variant: "destructive", title: "Microphone Error", description: "Could not access microphone. Please check permissions." });
            }
        } else {
             toast({ variant: "destructive", title: "Not Supported", description: "Audio recording is not supported by your browser." });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            toast({ title: "Recording Stopped" });
        }
    };

     const handleVoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
             if (!['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(file.type)) {
                toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload MP3, WAV, or OGG audio." });
                return;
             }
             if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ variant: "destructive", title: "File Too Large", description: "Audio file should be less than 5MB." });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                 const dataUrl = reader.result as string;
                 setAudioDataUrl(dataUrl); // For playback preview
                 setInputData(prev => ({ ...prev, voice_data_url: dataUrl })); // Use data URL directly for QR (can get very long!)
                 setAudioBlob(file); // Store blob if needed later (e.g., for actual upload)
                  toast({ title: "Audio File Loaded" });
            }
             reader.onerror = () => toast({ variant: "destructive", title: "File Read Error"});
             reader.readAsDataURL(file);
        }
     };

     const removeAudio = () => {
        setAudioBlob(null);
        setAudioDataUrl(null);
        setInputData(prev => ({ ...prev, voice_data_url: null }));
         if (voiceFileInputRef.current) voiceFileInputRef.current.value = '';
         if (audioRef.current) audioRef.current.src = ''; // Clear audio player source
        toast({ title: "Audio Removed" });
     }

     // --- Filtered and Sorted History ---
    const filteredHistory = history
        .filter(item => {
            if (filterFavorites && !item.isFavorite) return false;
            if (historySearchTerm) {
                const term = historySearchTerm.toLowerCase();
                // Search in label, type, and potentially input data values
                const labelMatch = item.label.toLowerCase().includes(term);
                const typeMatch = item.qrType.toLowerCase().includes(term);
                // Basic search in inputData values (can be extended)
                const inputDataMatch = Object.values(item.inputData)
                    .some(value => typeof value === 'string' && value.toLowerCase().includes(term));
                return labelMatch || typeMatch || inputDataMatch;
            }
            return true;
        })
        .sort((a, b) => b.timestamp - a.timestamp); // Ensure sorting is always applied



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
                                         <legend className="text-sm font-medium px-1">Name *</legend>
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
                        case 'voice': // Voice Message Inputs
                            return (
                                <div className="space-y-4">
                                    <Label>Voice Message</Label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            variant={isRecording ? "destructive" : "outline"}
                                            onClick={isRecording ? stopRecording : startRecording}
                                            className="w-full sm:w-auto"
                                        >
                                            <Mic className="mr-2 h-4 w-4" />
                                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                                        </Button>
                                        <Button variant="outline" onClick={() => voiceFileInputRef.current?.click()} className="w-full sm:w-auto">
                                            <Upload className="mr-2 h-4 w-4"/> Upload File (MP3, WAV)
                                        </Button>
                                         <Input
                                            ref={voiceFileInputRef}
                                            id="voice-file-upload"
                                            type="file"
                                            accept="audio/mpeg, audio/wav, audio/ogg"
                                            onChange={handleVoiceFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                    {isRecording && <p className="text-sm text-destructive animate-pulse">Recording...</p>}
                                     {audioDataUrl && (
                                        <div className="space-y-2 border p-3 rounded-md">
                                            <Label>Preview</Label>
                                            <audio ref={audioRef} controls src={audioDataUrl} className="w-full">
                                                Your browser does not support the audio element.
                                            </audio>
                                            <Button variant="ghost" size="sm" onClick={removeAudio} className="text-destructive w-full">
                                                <Trash2 className="mr-2 h-4 w-4" /> Remove Audio
                                            </Button>
                                        </div>
                                    )}
                                     <p className="text-xs text-muted-foreground">Record a message or upload an audio file (max 5MB).</p>
                                </div>
                            );
                        case 'password': // Password Protected Content Inputs
                                return (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password-content">Content (URL or Text) *</Label>
                                            <Textarea
                                                id="password-content"
                                                value={inputData.password_content || ''}
                                                onChange={(e) => handleInputChange('password_content', e.target.value)}
                                                placeholder="Enter the URL or text to protect..."
                                                rows={4}
                                                required
                                            />
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="password-pass">Password *</Label>
                                             <div className="flex items-center gap-2">
                                                <Input
                                                    id="password-pass"
                                                    type={passwordVisible ? 'text' : 'password'}
                                                    value={inputData.password_pass || ''}
                                                    onChange={(e) => handleInputChange('password_pass', e.target.value)}
                                                    placeholder="Enter a strong password"
                                                    required
                                                />
                                                 <Button variant="ghost" size="icon" onClick={() => setPasswordVisible(!passwordVisible)} type="button" aria-label={passwordVisible ? "Hide password" : "Show password"}>
                                                    {passwordVisible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                                </Button>
                                             </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            <Info className="inline-block h-3 w-3 mr-1" />
                                            The QR code will link to a page asking for this password.
                                            <strong className="ml-1">This is a basic simulation and not cryptographically secure for sensitive data.</strong>
                                        </p>
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


  // --- Render History Item ---
 const renderHistoryItem = (item: HistoryItem) => {
    const Icon = qrTypeOptions.find(opt => opt.value === item.qrType)?.icon || QrCodeIcon;
    const description = item.label || `${item.qrType.toUpperCase()} QR`;

    return (
      <div key={item.id} className="flex items-center justify-between gap-2 p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
        {/* Main clickable area to load */}
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-grow min-w-0" onClick={() => loadFromHistory(item)}> {/* Added min-w-0 */}
          {item.previewSvgDataUrl ? (
            <img src={item.previewSvgDataUrl} alt="QR Preview" className="h-10 w-10 rounded border object-contain bg-white shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-grow overflow-hidden"> {/* Added overflow-hidden */}
            {editingItemId === item.id ? (
                 <div className="flex items-center gap-1">
                    <Input
                        type="text"
                        value={editedLabel}
                        onChange={(e) => setEditedLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEditedLabel(item.id); if (e.key === 'Escape') cancelEditingLabel(); }}
                        className="h-7 text-sm flex-grow" // Use flex-grow
                        autoFocus
                        maxLength={40}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => saveEditedLabel(item.id)}><Check className="h-4 w-4 text-green-500" /></Button> {/* shrink-0 */}
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={cancelEditingLabel}><X className="h-4 w-4 text-destructive" /></Button> {/* shrink-0 */}
                </div>
            ) : (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <p className="text-sm font-medium truncate cursor-pointer hover:underline" title={description} onClick={(e) => {e.stopPropagation(); startEditingLabel(item.id, item.label);}}> {/* Prevent load on edit click */}
                             {description}
                                <Pencil className="inline-block h-3 w-3 ml-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /> {/* Edit Icon */}
                           </p>
                        </TooltipTrigger>
                        <TooltipContent><p>Click label to edit</p></TooltipContent>
                    </Tooltip>
                 </TooltipProvider>

            )}
            <p className="text-xs text-muted-foreground">{format(item.timestamp, 'MMM d, HH:mm')}</p>
          </div>
        </div>

         {/* Action Buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
            <TooltipProvider>
                 {/* Favorite Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFavorite(item.id)}>
                            <StarIcon className={cn("h-4 w-4 transition-colors", item.isFavorite ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground hover:text-yellow-500")} />
                         </Button>
                    </TooltipTrigger>
                     <TooltipContent><p>{item.isFavorite ? 'Unmark as favorite' : 'Mark as favorite'}</p></TooltipContent>
                </Tooltip>
                {/* Share Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shareHistoryItem(item)}>
                            <Share2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                    </TooltipTrigger>
                     <TooltipContent><p>Share</p></TooltipContent>
                </Tooltip>
                 {/* Reload Button */}
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadFromHistory(item)}>
                            <RefreshCcw className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                    </TooltipTrigger>
                     <TooltipContent><p>Reload this configuration</p></TooltipContent>
                </Tooltip>
                {/* Delete Button */}
                <AlertDialog>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete this item</p></TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete QR Code?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove "{item.label}" created on {format(item.timestamp, 'PP')} from your history? This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeFromHistory(item.id)} className={cn(buttonVariants({ variant: "destructive" }))}>
                            Yes, Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TooltipProvider>
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
             {/* Tabs for Content & History */}
             <Tabs defaultValue="content" className="w-full">
                 {/* Use full width tabs on small screens */}
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="content"><Settings2 className="inline-block mr-1 h-4 w-4" /> Options</TabsTrigger>
                    <TabsTrigger value="history"><HistoryIcon className="inline-block mr-1 h-4 w-4" /> History ({filteredHistory.length})</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="pt-6 space-y-6">
                    {/* Accordion for Content, Styling, Logo, Extras */}
                    <Accordion type="multiple" collapsible className="w-full" defaultValue={["content-item", "styling-item"]}>
                         {/* Step 1: Content */}
                        <AccordionItem value="content-item">
                             <AccordionTrigger className="text-lg font-semibold">
                                <span className="flex items-center gap-2"><QrCodeIcon className="h-5 w-5"/> 1. Content</span>
                             </AccordionTrigger>
                             <AccordionContent className="pt-4 space-y-6">
                                {/* QR Type Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="qr-type">Select QR Code Type</Label>
                                    <Select
                                        onValueChange={(value: QrType) => {
                                            setQrType(value);
                                            setInputData({}); // Clear input data on type change
                                            setAudioBlob(null); // Clear audio state
                                            setAudioDataUrl(null);
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
                                     {/* Label */}
                                     <div className="space-y-2">
                                         <Label htmlFor="qr-label">Label Text (For History)</Label>
                                         <Input id="qr-label" type="text" value={qrLabel} onChange={(e) => setQrLabel(e.target.value)} placeholder="e.g., My Website QR" maxLength={40} />
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

                 {/* History Tab */}
                <TabsContent value="history" className="pt-6 space-y-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                        <div className="flex-grow">
                            <Label htmlFor="history-search" className="text-base font-semibold">Generation History</Label>
                             <Input
                                id="history-search"
                                type="text"
                                placeholder="Search history (label, type...)"
                                value={historySearchTerm}
                                onChange={(e) => setHistorySearchTerm(e.target.value)}
                                className="mt-1 h-9"
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
                            <Button
                                variant={filterFavorites ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilterFavorites(!filterFavorites)}
                                disabled={history.length === 0}
                                title={filterFavorites ? "Show All" : "Show Favorites Only"}
                            >
                                <StarIcon className={cn("h-4 w-4", filterFavorites ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground")} />
                                <span className="ml-2 hidden sm:inline">{filterFavorites ? "Favorites" : "All"}</span>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" disabled={history.length === 0} title="Clear All History">
                                        <Trash2 className="h-4 w-4" />
                                        <span className="ml-2 hidden sm:inline">Clear All</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Clear All History?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete your entire QR code generation history ({history.length} items) from this browser. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={clearHistory} className={cn(buttonVariants({ variant: "destructive" }))}>
                                            Yes, Clear History
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                    <ScrollArea className="h-[450px] w-full border rounded-md">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map(renderHistoryItem)
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <HistoryIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                     {historySearchTerm || filterFavorites ? 'No matching history items found.' : 'No history yet.'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {!(historySearchTerm || filterFavorites) && 'Generated QR codes will appear here.'}
                                </p>
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

