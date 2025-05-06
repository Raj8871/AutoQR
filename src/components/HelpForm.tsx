
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bot } from 'lucide-react';
import { answerHelpQuestion, type HelpQuestionOutput } from '@/ai/flows/help-flow'; // Import the server action
import { useToast } from '@/hooks/use-toast';

// Define the form schema using Zod
const formSchema = z.object({
  question: z.string().min(10, {
    message: 'Question must be at least 10 characters.',
  }).max(500, {
    message: 'Question cannot exceed 500 characters.',
  }),
});

export type HelpFormValues = z.infer<typeof formSchema>;

export function HelpForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [aiResponse, setAiResponse] = React.useState<HelpQuestionOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Initialize the form with react-hook-form and Zod resolver
  const form = useForm<HelpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
    },
  });

  // Handle form submission
  async function onSubmit(values: HelpFormValues) {
    setIsSubmitting(true);
    setAiResponse(null); // Clear previous response
    setError(null); // Clear previous error
    console.log('Submitting help question:', values);

    try {
      const result = await answerHelpQuestion(values);
      setAiResponse(result);
    } catch (err) {
      console.error('Error getting help answer:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get answer: ${errorMessage}`);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not get help: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask our AI Assistant</CardTitle>
        <CardDescription>Have questions about LinkSpark? Ask below and our AI will try to help.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., How do I add a logo to my QR code?"
                      className="resize-none"
                      rows={4}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Answer...
                </>
              ) : (
                'Ask Question'
              )}
            </Button>
          </form>
        </Form>

        {/* Display AI Response or Error */}
        {(aiResponse || error || isSubmitting) && (
          <Card className="mt-6 bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitting && <p className="text-muted-foreground">Thinking...</p>}
              {error && <p className="text-destructive">{error}</p>}
              {aiResponse && <p className="whitespace-pre-wrap">{aiResponse.answer}</p>}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
