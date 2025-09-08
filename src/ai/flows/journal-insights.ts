// Journal Insights Flow
'use server';

/**
 * @fileOverview Provides AI-powered insights from user journal entries.
 *
 * - getJournalInsights - Analyzes journal entries to identify themes and insights.
 * - JournalInsightsInput - The input type for the getJournalInsights function.
 * - JournalInsightsOutput - The return type for the getJournalInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JournalInsightsInputSchema = z.object({
  journalEntries: z.array(z.string()).describe('An array of journal entries to analyze.'),
});
export type JournalInsightsInput = z.infer<typeof JournalInsightsInputSchema>;

const JournalInsightsOutputSchema = z.object({
  recurringThemes: z.array(z.string()).describe('Identified recurring themes in the journal entries.'),
  frequentlyExpressedFeelings: z.array(z.string()).describe('Frequently expressed feelings in the journal entries.'),
  successfullyExecutedQuickWins: z.array(z.string()).describe('Examples of successfully executed quick wins.'),
  overallSentiment: z.string().describe('Overall sentiment expressed in the journal entries.'),
});
export type JournalInsightsOutput = z.infer<typeof JournalInsightsOutputSchema>;

export async function getJournalInsights(input: JournalInsightsInput): Promise<JournalInsightsOutput> {
  return journalInsightsFlow(input);
}

const journalInsightsPrompt = ai.definePrompt({
  name: 'journalInsightsPrompt',
  input: {schema: JournalInsightsInputSchema},
  output: {schema: JournalInsightsOutputSchema},
  prompt: `You are an AI journal analyst. Analyze the following journal entries and identify recurring themes, frequently expressed feelings, successfully executed quick wins, and the overall sentiment.

Journal Entries:
{{#each journalEntries}}
- {{{this}}}
{{/each}}

Recurring Themes: (List the recurring themes identified in the journal entries)
Frequently Expressed Feelings: (List the frequently expressed feelings in the journal entries)
Successfully Executed Quick Wins: (List examples of successfully executed quick wins)
Overall Sentiment: (Describe the overall sentiment expressed in the journal entries)
`,
});

const journalInsightsFlow = ai.defineFlow(
  {
    name: 'journalInsightsFlow',
    inputSchema: JournalInsightsInputSchema,
    outputSchema: JournalInsightsOutputSchema,
  },
  async input => {
    const {output} = await journalInsightsPrompt(input);
    return output!;
  }
);
