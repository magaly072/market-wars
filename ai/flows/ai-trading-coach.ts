'use server';
/**
 * @fileOverview AI Trading Coach updated for Market Wars 2.0.
 * Focuses on short, punchy debriefs and performance grading.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AITradingCoachInputSchema = z.object({
  asset: z.string(),
  direction: z.string(),
  leverage: z.number(),
  entryPrice: z.number(),
  exitPrice: z.number(),
  pnl: z.number(),
  roi: z.number(),
  priceHistory: z.array(z.number()),
});
export type AITradingCoachInput = z.infer<typeof AITradingCoachInputSchema>;

const AITradingCoachOutputSchema = z.object({
  feedback: z.string().describe('3 short sentences max.'),
  tip: z.string().describe('One improvement tip.'),
  riskGrade: z.enum(['A', 'B', 'C', 'D', 'F']),
  executionGrade: z.enum(['A', 'B', 'C', 'D', 'F']),
  disciplineGrade: z.enum(['A', 'B', 'C', 'D', 'F']),
  riskScore: z.number().min(1).max(10),
  mistakes: z.array(z.string()),
});
export type AITradingCoachOutput = z.infer<typeof AITradingCoachOutputSchema>;

export async function aiTradingCoach(input: AITradingCoachInput): Promise<AITradingCoachOutput> {
  return aiTradingCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTradingCoachPrompt',
  input: {
    schema: z.object({
      asset: z.string(),
      direction: z.string(),
      leverage: z.number(),
      entryPrice: z.number(),
      exitPrice: z.number(),
      pnl: z.number(),
      roi: z.number(),
      priceHistory: z.string(),
    }),
  },
  output: {schema: AITradingCoachOutputSchema},
  prompt: `You are a professional trading mentor. Analyze this closed trade.
Asset: {{{asset}}}
Direction: {{{direction}}}
PnL: {{{pnl}}}
ROI: {{{roi}}}%

Provide:
1. Feedback: Exactly 3 short sentences. 
   Sentence 1: What was done correctly.
   Sentence 2: Biggest mistake.
   Sentence 3: Market context.
2. Grades (A-F) for Risk, Execution, and Discipline.
3. One specific tactical tip.

Keep it blunt and technical.`,
});

const aiTradingCoachFlow = ai.defineFlow(
  {
    name: 'aiTradingCoachFlow',
    inputSchema: AITradingCoachInputSchema,
    outputSchema: AITradingCoachOutputSchema,
  },
  async input => {
    const {output} = await prompt({
      asset: input.asset,
      direction: input.direction,
      leverage: input.leverage,
      entryPrice: input.entryPrice,
      exitPrice: input.exitPrice,
      pnl: input.pnl,
      roi: input.roi,
      priceHistory: JSON.stringify(input.priceHistory),
    });
    return output!;
  }
);
