"use client";

import type { CartItem, Product, Promotion } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  total: number;
  taxes: number;
  appliedPromotion: Promotion | null;
  applyPromotion: (promotion: Promotion) => void;
  removePromotion: () => void;
}

const TAX_RATE = 0.05; // Example 5% tax rate

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('bananaBlissCart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
    const storedPromotion = localStorage.getItem('bananaBlissPromotion');
    if (storedPromotion) {
      setAppliedPromotion(JSON.parse(storedPromotion));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bananaBlissCart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (appliedPromotion) {
      localStorage.setItem('bananaBlissPromotion', JSON.stringify(appliedPromotion));
    } else {
      localStorage.removeItem('bananaBlissPromotion');
    }
  }, [appliedPromotion]);


  const applyPromotion = (promotion: Promotion) => {
    setAppliedPromotion(promotion);
    // Re-calculate prices if a discount is applied
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (promotion.discountedProductId === item.id && promotion.discountPercentage) {
          return {
            ...item,
            originalPrice: item.originalPrice || item.price, // Store original if not already stored
            price: (item.originalPrice || item.price) * (1 - promotion.discountPercentage),
          };
        }
        return item;
      })
    );
  };

  const removePromotion = () => {
    setAppliedPromotion(null);
    // Revert prices to original
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.originalPrice) {
          return { ...item, price: item.originalPrice, originalPrice: undefined };
        }
        return item;
      })
    );
  };


  const addToCart = (product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      // If promotion is active and applies to this product, apply discount
      let price = product.price;
      let originalPrice = undefined;
      if (appliedPromotion && appliedPromotion.discountedProductId === product.id && appliedPromotion.discountPercentage) {
        originalPrice = product.price;
        price = product.price * (1 - appliedPromotion.discountPercentage);
      }
      return [...prevItems, { ...product, quantity, price, originalPrice }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock)) } : item
      ).filter(item => item.quantity > 0) // Remove if quantity is 0
    );
  };

  const clearCart = () => {
    setCartItems([]);
    removePromotion();
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = subtotal * TAX_RATE;
  const total = subtotal + taxes;


  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartCount, 
      subtotal,
      total,
      taxes,
      appliedPromotion,
      applyPromotion,
      removePromotion
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
