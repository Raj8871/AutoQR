
'use server';

import type { ContactFormValues } from '@/components/ContactForm'; // Import the type
import { z } from 'zod';

// Define the schema again on the server for validation consistency
const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10).max(500),
});

interface SubmitResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to handle contact form submission.
 * In a real application, this would typically send an email, save to a database, or integrate with a CRM.
 * For now, it just logs the data and returns a success message.
 */
export async function submitContactForm(
  data: ContactFormValues
): Promise<SubmitResult> {
  // Validate data on the server side
  const validationResult = formSchema.safeParse(data);

  if (!validationResult.success) {
    console.error('Server-side validation failed:', validationResult.error.flatten().fieldErrors);
    return {
      success: false,
      error: 'Invalid data provided. Please check your input.',
    };
  }

  // Process the validated data (e.g., send email, save to DB)
  console.log('Received contact form submission:', validationResult.data);

  // Simulate processing delay (remove in production)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate potential failure (remove or adjust in production)
  // if (Math.random() > 0.8) {
  //   console.error('Simulated submission failure.');
  //   return { success: false, error: 'Simulated server error. Please try again.' };
  // }

  // Return success
  return { success: true };
}
