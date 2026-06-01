'use server';
/**
 * @fileOverview An AI agent that analyzes market trends and technical indicators.
 * Updated for Market Wars 2.0 to provide educational guidance without signals.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIMarketSentimentInputSchema = z.object({
  assetName: z.string().describe('The name of the asset.'),
  priceHistory: z.array(z.number()).describe('Historical price series.'),
  currentPrice: z.number().describe('The current price.'),
});
export type AIMarketSentimentInput = z.infer<typeof AIMarketSentimentInputSchema>;

const AIMarketSentimentOutputSchema = z.object({
  sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']).describe('Market sentiment.'),
  trendStrength: z.enum(['Weak', 'Moderate', 'Strong']).describe('Trend strength.'),
  momentum: z.enum(['Weak', 'Medium', 'Strong']).describe('Momentum status.'),
  volatility: z.enum(['Low', 'Medium', 'High']).describe('Volatility level.'),
  confidenceScore: z.number().min(0).max(100).describe('Confidence score.'),
  explanation: z.string().describe('Brief educational guidance.'),
});
export type AIMarketSentimentOutput = z.infer<typeof AIMarketSentimentOutputSchema>;

export async function aiMarketSentiment(input: AIMarketSentimentInput): Promise<AIMarketSentimentOutput> {
  return aiMarketSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiMarketSentimentPrompt',
  input: {
    schema: z.object({
      assetName: z.string(),
      priceHistory: z.string(),
      currentPrice: z.number(),
    }),
  },
  output: {schema: AIMarketSentimentOutputSchema},
  prompt: `You are a institutional technical analyst. 
Analyze the following market data for {{{assetName}}}.

Current Price: {{{currentPrice}}}
Price History: {{{priceHistory}}}

1. Determine Sentiment (Bullish/Bearish/Neutral).
2. Rate Trend, Momentum, and Volatility.
3. Provide a Confidence Score (0-100).
4. Provide BRIEF educational guidance based on current volatility and trend.

CRITICAL: NEVER provide specific buy/sell signals. Only describe the market environment.
Keep the explanation under 2 short sentences.`,
});

const aiMarketSentimentFlow = ai.defineFlow(
  {
    name: 'aiMarketSentimentFlow',
    inputSchema: AIMarketSentimentInputSchema,
    outputSchema: AIMarketSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt({
      assetName: input.assetName,
      currentPrice: input.currentPrice,
      priceHistory: JSON.stringify(input.priceHistory),
    });
    return output!;
  }
);
