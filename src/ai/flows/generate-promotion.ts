'use server';

/**
 * @fileOverview AI promotions agent.
 *
 * - generatePromotion - A function that generates promotions based on user history and inventory.
 * - GeneratePromotionInput - The input type for the generatePromotion function.
 * - GeneratePromotionOutput - The return type for the generatePromotion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePromotionInputSchema = z.object({
  userPurchaseHistory: z
    .string()
    .describe('The purchase history of the user, as a JSON string.'),
  currentInventory: z
    .string()
    .describe('The current inventory of products, as a JSON string.'),
});
export type GeneratePromotionInput = z.infer<typeof GeneratePromotionInputSchema>;

const GeneratePromotionOutputSchema = z.object({
  promotionMessage: z
    .string()
    .describe('A personalized promotion message to incentivize the user to purchase.'),
  discountedProductId: z
    .string()
    .optional()
    .describe('The ID of the product that is being offered at a discount.'),
  discountPercentage: z
    .number()
    .optional()
    .describe('The percentage of discount being offered (e.g., 0.1 for 10%).'),
});
export type GeneratePromotionOutput = z.infer<typeof GeneratePromotionOutputSchema>;

export async function generatePromotion(input: GeneratePromotionInput): Promise<GeneratePromotionOutput> {
  return generatePromotionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePromotionPrompt',
  input: {schema: GeneratePromotionInputSchema},
  output: {schema: GeneratePromotionOutputSchema},
  prompt: `You are an expert marketing assistant, skilled at creating personalized promotions to increase sales.

  Based on the user's past purchases and current inventory, generate a promotion message to incentivize the user to purchase more items.

  User Purchase History: {{{userPurchaseHistory}}}
Current Inventory: {{{currentInventory}}}

  Consider the purchase history to recommend complementary products or offer discounts on previously purchased items.
  Also, consider the inventory to suggest products that need to be moved quickly.

  Return a JSON object with the promotion message, discounted product ID (if applicable), and discount percentage (if applicable).
`,
});

const generatePromotionFlow = ai.defineFlow(
  {
    name: 'generatePromotionFlow',
    inputSchema: GeneratePromotionInputSchema,
    outputSchema: GeneratePromotionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
