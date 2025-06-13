
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
import type { Product } from '@/lib/types'; // Para usar o tipo Product

const GeneratePromotionInputSchema = z.object({
  userPurchaseHistory: z
    .string()
    .describe('The purchase history of the user, as a JSON string. Each purchase can include items like { productId: string, quantity: number, date: string }.'),
  currentInventory: z.array(z.object({ // Alterado para array de objetos Product (parcial)
      id: z.string(),
      name: z.string(),
      stock: z.number(),
      price: z.number(),
      category: z.string().optional(),
    }))
    .describe('The current inventory of products. Only include products with stock > 0.'),
  cartItems: z.array(z.object({ // Adicionado para contexto do carrinho atual
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      price: z.number(),
    })).optional().describe('Current items in the user\'s shopping cart, if any.')
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
    .min(0.01).max(0.99) // Desconto entre 1% e 99%
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
  prompt: `You are an expert marketing assistant for "Banana Bliss Ticketing", a banana sweets shop. Your goal is to create compelling, personalized promotions to increase sales.

  Available Data:
  - User Purchase History: {{{jsonEncode userPurchaseHistory}}}
  - Current Product Inventory (only products with stock > 0): {{{jsonEncode currentInventory}}}
  {{#if cartItems}}
  - Current Shopping Cart: {{{jsonEncode cartItems}}}
  {{/if}}

  Your Task:
  Generate a personalized promotion. Consider the following:
  1.  User's Past Purchases: Recommend complementary products, or offer a discount on a product they might like based on past behavior.
  2.  Current Inventory: Prioritize promoting products with healthy stock levels. If a product has very low stock, it might not be a good candidate for a broad promotion.
  3.  Current Cart (if available): If the user has items in their cart, try to offer a promotion that encourages them to complete the purchase, perhaps by adding a related item at a discount, or a small discount on a cart item if it makes sense.
  4.  Promotion Strategy:
      *   The promotion should be appealing and easy to understand.
      *   If offering a discount, select a specific product ID from the 'currentInventory' and a reasonable discount percentage (e.g., 10% to 25%). Avoid very high discounts unless there's a strong reason (e.g., clearing old stock, which is not explicitly stated here).
      *   The ` + "`promotionMessage`" + ` should clearly state the offer. For example: "We noticed you love our traditional sweets! Add a 'Doce de Banana com Chocolate' to your order and get 15% off on it!" or "Complete your order now and get 10% off 'Geleia de Banana Artesanal'!"
      *   If no specific product discount is suitable, create a general encouraging message. In this case, ` + "`discountedProductId`" + ` and ` + "`discountPercentage`" + ` should be omitted. For example: "Your cart is looking delicious! Complete your sweet journey with Banana Bliss today."

  Output Format:
  Return a JSON object matching the specified output schema. Ensure ` + "`discountedProductId`" + ` (if present) is a valid ID from the ` + "`currentInventory`" + ` list. If ` + "`discountPercentage`" + ` is provided, ` + "`discountedProductId`" + ` must also be provided.
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
    // Filter inventory for products with stock > 0 before sending to the prompt
    const productsInStock = input.currentInventory.filter(p => p.stock > 0);
    if (productsInStock.length === 0) {
      // No products in stock, return a generic message or handle as an error
      return { promotionMessage: "Nossos doces estão em alta demanda! Volte em breve para novas ofertas." };
    }

    const {output} = await prompt({
      ...input,
      currentInventory: productsInStock // Send only in-stock products
    });
    
    if (!output) {
        return { promotionMessage: "Não foi possível gerar uma promoção no momento. Aproveite nossos preços!" };
    }

    // Ensure that if discountPercentage is set, discountedProductId is also set.
    if (output.discountPercentage && !output.discountedProductId) {
        // If AI provided a percentage but no product, try to pick one or clear the discount.
        // For simplicity, let's clear it if the AI failed to pick a product.
        console.warn("AI generated discountPercentage without discountedProductId. Clearing discount.");
        output.discountedProductId = undefined;
        output.discountPercentage = undefined;
    }
    // Ensure discountedProductId is valid if present
    if (output.discountedProductId && !productsInStock.find(p => p.id === output.discountedProductId)) {
        console.warn(`AI suggested an invalid or out-of-stock product ID: ${output.discountedProductId}. Clearing discount.`);
        output.discountedProductId = undefined;
        output.discountPercentage = undefined;
        output.promotionMessage = "Confira nossos deliciosos doces! Temos ótimas opções para você." // Fallback message
    }


    return output;
  }
);
// Helper for handlebars if needed, though jsonEncode is not standard. Assuming it's a custom helper or will be handled by the prompt.
// For actual implementation, use JSON.stringify directly in the flow logic before passing to prompt if necessary.
// Handlebars.registerHelper('jsonEncode', function(context) {
//   return JSON.stringify(context);
// });
