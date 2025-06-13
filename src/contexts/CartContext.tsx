
"use client";

import type { CartItem, Product, Promotion } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getStoredProducts } from '@/lib/storage'; 

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => boolean; 
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => boolean; 
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  total: number;
  taxes: number;
  appliedPromotion: Promotion | null;
  applyPromotion: (promotion: Promotion) => void;
  removePromotion: () => void;
}

const TAX_RATE = 0.05; 

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);

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
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (promotion.discountedProductId === item.id && promotion.discountPercentage) {
          const originalPrice = item.originalPrice || item.price;
          return {
            ...item,
            originalPrice: originalPrice,
            price: originalPrice * (1 - promotion.discountPercentage),
          };
        }
        return item;
      })
    );
  };

  const removePromotion = () => {
    setAppliedPromotion(null);
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.originalPrice) {
          return { ...item, price: item.originalPrice, originalPrice: undefined };
        }
        return item;
      })
    );
  };


  const addToCart = (product: Product, quantity: number): boolean => {
    const allProducts = getStoredProducts();
    const currentProductInfo = allProducts.find(p => p.id === product.id);
    const stockAvailable = currentProductInfo ? currentProductInfo.stock : product.stock;

    let success = true;

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + quantity, stockAvailable);
        if (newQuantity < existingItem.quantity + quantity) success = false; 
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      const quantityToAdd = Math.min(quantity, stockAvailable);
      if (quantityToAdd < quantity) success = false;

      if (quantityToAdd <= 0) { 
          success = false;
          return prevItems;
      }

      let price = product.price;
      let originalPrice = undefined;
      if (appliedPromotion && appliedPromotion.discountedProductId === product.id && appliedPromotion.discountPercentage) {
        originalPrice = product.price;
        price = product.price * (1 - appliedPromotion.discountPercentage);
      }
      return [...prevItems, { ...product, quantity: quantityToAdd, price, originalPrice, stock: stockAvailable }]; 
    });
    return success;
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number): boolean => {
    const allProducts = getStoredProducts();
    const productInfo = allProducts.find(p => p.id === productId);
    const stockAvailable = productInfo ? productInfo.stock : 0; 

    let success = true;
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(0, Math.min(quantity, stockAvailable, item.stock)); 
          if (newQuantity < quantity) success = false;
          return { ...item, quantity: newQuantity };
        }
        return item;
      }
      ).filter(item => item.quantity > 0) 
    );
    return success;
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
