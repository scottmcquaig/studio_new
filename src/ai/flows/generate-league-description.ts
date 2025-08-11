'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate a fun and engaging league description based on the game type and specific settings.
 *
 * - generateLeagueDescription - A function that generates the league description.
 * - GenerateLeagueDescriptionInput - The input type for the generateLeagueDescription function.
 * - GenerateLeagueDescriptionOutput - The return type for the generateLeagueDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLeagueDescriptionInputSchema = z.object({
  gameType: z.enum(['big_brother', 'survivor', 'custom']).describe('The type of game for the league.'),
  rosterSize: z.number().describe('The number of players on each team.'),
  draftType: z.enum(['snake', 'fixed']).describe('The type of draft used in the league.'),
  visibility: z.enum(['private', 'link']).describe('The visibility of the league.'),
  leagueName: z.string().describe('The name of the league.'),
  season: z.string().describe('The season of the game.'),
});

export type GenerateLeagueDescriptionInput = z.infer<typeof GenerateLeagueDescriptionInputSchema>;

const GenerateLeagueDescriptionOutputSchema = z.object({
  description: z.string().describe('A fun and engaging description of the league.'),
});

export type GenerateLeagueDescriptionOutput = z.infer<typeof GenerateLeagueDescriptionOutputSchema>;

export async function generateLeagueDescription(input: GenerateLeagueDescriptionInput): Promise<GenerateLeagueDescriptionOutput> {
  return generateLeagueDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLeagueDescriptionPrompt',
  input: {schema: GenerateLeagueDescriptionInputSchema},
  output: {schema: GenerateLeagueDescriptionOutputSchema},
  prompt: `You are a creative marketing expert specializing in generating engaging descriptions for fantasy leagues.

  Create a fun and captivating description for the "{{leagueName}}" fantasy league, based on the following information:

  Game Type: {{gameType}}
  Season: {{season}}
  Roster Size: {{rosterSize}}
  Draft Type: {{draftType}}
  Visibility: {{visibility}}

  The description should be concise and entice potential users to join the league.  Make it sound exciting and engaging. Be creative!
  `,
});

const generateLeagueDescriptionFlow = ai.defineFlow(
  {
    name: 'generateLeagueDescriptionFlow',
    inputSchema: GenerateLeagueDescriptionInputSchema,
    outputSchema: GenerateLeagueDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
