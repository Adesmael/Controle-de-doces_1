
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
import type { Product } from '@/lib/types';

const GeneratePromotionInputSchema = z.object({
  userPurchaseHistory: z
    .string()
    .describe('The purchase history of the user, as a JSON string. Each purchase can include items like { productId: string, quantity: number, date: string }.'),
  currentInventory: z.array(z.object({
      id: z.string(),
      name: z.string(),
      stock: z.number(),
      price: z.number(),
      category: z.string().optional(),
    }))
    .describe('The current inventory of products. Only include products with stock > 0.'),
  cartItems: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      price: z.number(),
    })).optional().describe('Current items in the user\'s shopping cart, if any. This field is optional.')
});
export type GeneratePromotionInput = z.infer<typeof GeneratePromotionInputSchema>;

const GeneratePromotionOutputSchema = z.object({
  promotionMessage: z
    .string()
    .describe('A personalized promotion message to incentivize the user to purchase. Should be engaging and clear.'),
  discountedProductId: z
    .string()
    .optional()
    .describe('The ID of the product that is being offered at a discount. Should be chosen strategically from currentInventory.'),
  discountPercentage: z
    .number()
    .min(0.01).max(0.99)
    .optional()
    .describe('The percentage of discount being offered (e.g., 0.1 for 10%). Only if discountedProductId is present.'),
});
export type GeneratePromotionOutput = z.infer<typeof GeneratePromotionOutputSchema>;

export async function generatePromotion(input: GeneratePromotionInput): Promise<GeneratePromotionOutput> {
  return generatePromotionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePromotionPrompt',
  input: {schema: GeneratePromotionInputSchema},
  output: {schema: GeneratePromotionOutputSchema},
  prompt: `You are an expert marketing assistant for "Controle de Doces", a sweets shop. Your goal is to create compelling, personalized promotions to increase sales.

  Available Data:
  - User Purchase History: {{{userPurchaseHistory}}}
  - Current Product Inventory (only products with stock > 0): {{{currentInventory}}}
  {{#if cartItems}}
  - Current Shopping Cart: {{{cartItems}}}
  {{/if}}

  Your Task:
  Generate a personalized promotion. Consider the following:
  1.  User's Past Purchases: Recommend complementary products, or offer a discount on a product they might like based on past behavior.
  2.  Current Inventory: Prioritize promoting products with healthy stock levels. If a product has very low stock, it might not be a good candidate for a broad promotion.
  3.  Current Cart (if available and provided): If the user has items in their cart, try to offer a promotion that encourages them to complete the purchase, perhaps by adding a related item at a discount, or a small discount on a cart item if it makes sense. If no cart items are provided, focus on purchase history and inventory.
  4.  Promotion Strategy:
      *   The promotion should be appealing and easy to understand.
      *   If offering a discount, select a specific product ID from the 'currentInventory' and a reasonable discount percentage (e.g., 10% to 25%). Avoid very high discounts unless there's a strong reason.
      *   The \`promotionMessage\` should clearly state the offer. For example: "We noticed you love our traditional sweets! Add a 'Doce de Banana com Chocolate' to your order and get 15% off on it!" or "Based on your past purchases, how about a 10% off 'Geleia de Banana Artesanal'?"
      *   If no specific product discount is suitable, create a general encouraging message based on inventory or past purchases. In this case, \`discountedProductId\` and \`discountPercentage\` should be omitted. For example: "Explore our delicious range of sweets! We have great options for you."

  Output Format:
  Return a JSON object matching the specified output schema. Ensure \`discountedProductId\` (if present) is a valid ID from the \`currentInventory\` list. If \`discountPercentage\` is provided, \`discountedProductId\` must also be provided.
  The promotion message should be in Brazilian Portuguese.
`,
});

const generatePromotionFlow = ai.defineFlow(
  {
    name: 'generatePromotionFlow',
    inputSchema: GeneratePromotionInputSchema,
    outputSchema: GeneratePromotionOutputSchema,
  },
  async input => {

    const productsInStock = input.currentInventory.filter(p => p.stock > 0);
    if (productsInStock.length === 0) {

      return { promotionMessage: "Nossos doces estão em alta demanda! Volte em breve para novas ofertas." };
    }

    const {output} = await prompt({
      ...input,
      currentInventory: productsInStock
    });

    if (!output) {
        return { promotionMessage: "Não foi possível gerar uma promoção no momento. Aproveite nossos preços!" };
    }

    if (output.discountPercentage && !output.discountedProductId) {

        console.warn("AI generated discountPercentage without discountedProductId. Clearing discount.");
        output.discountedProductId = undefined;
        output.discountPercentage = undefined;
    }

    if (output.discountedProductId && !productsInStock.find(p => p.id === output.discountedProductId)) {
        console.warn(`AI suggested an invalid or out-of-stock product ID: ${output.discountedProductId}. Clearing discount.`);
        output.discountedProductId = undefined;
        output.discountPercentage = undefined;
        output.promotionMessage = "Confira nossos deliciosos doces! Temos ótimas opções para você."
    }


    return output;
  }
);
