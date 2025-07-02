// triage-incident-reports.ts
'use server';

/**
 * @fileOverview AI flow for triaging incident reports, assigning criticality, and flagging content for moderation.
 *
 * - triageIncidentReport - Analyzes incident reports and assigns a criticality level.
 * - TriageIncidentReportInput - The input type for the triageIncidentReport function.
 * - TriageIncidentReportOutput - The return type for the triageIncidentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TriageIncidentReportInputSchema = z.object({
  text: z.string().describe('The text description of the incident report.'),
  imageDataUri: z
    .string()
    .describe(
      "A photo related to the incident, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
});
export type TriageIncidentReportInput = z.infer<typeof TriageIncidentReportInputSchema>;

const TriageIncidentReportOutputSchema = z.object({
  criticality: z.enum(['Low', 'Medium', 'High']).describe('The criticality level of the incident.'),
  flagForModeration: z.boolean().describe('Whether the content should be flagged for moderation.'),
  reason: z.string().describe('The reasoning behind the assigned criticality and moderation flag.'),
});
export type TriageIncidentReportOutput = z.infer<typeof TriageIncidentReportOutputSchema>;

export async function triageIncidentReport(input: TriageIncidentReportInput): Promise<TriageIncidentReportOutput> {
  return triageIncidentReportFlow(input);
}

const triageIncidentReportPrompt = ai.definePrompt({
  name: 'triageIncidentReportPrompt',
  input: {schema: TriageIncidentReportInputSchema},
  output: {schema: TriageIncidentReportOutputSchema},
  prompt: `You are an AI assistant specialized in triaging incident reports for a Civil Defense agency.

  Analyze the following incident report and determine its criticality level (Low, Medium, High) and whether it should be flagged for moderation.

  Consider factors such as the severity of the incident, potential impact on the community, and the presence of sensitive or inappropriate content.

  Justify your decision in the reason field.

  Incident Report:
  Text: {{{text}}}
  {{#if imageDataUri}}
  Image: {{media url=imageDataUri}}
  {{/if}}

  Format your response as a JSON object with 'criticality', 'flagForModeration', and 'reason' fields.
  `,
});

const triageIncidentReportFlow = ai.defineFlow(
  {
    name: 'triageIncidentReportFlow',
    inputSchema: TriageIncidentReportInputSchema,
    outputSchema: TriageIncidentReportOutputSchema,
  },
  async input => {
    const {output} = await triageIncidentReportPrompt(input);
    return output!;
  }
);
