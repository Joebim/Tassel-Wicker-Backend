// Type definitions for product data utilities

export interface ProductDetails {
  [key: string]: string | string[] | { [key: string]: string } | undefined;
  brand?: string;
  weight?: string;
  dimensions?: string;
  pages?: string;
  paper?: string;
  netWeight?: string;
  wax?: string;
  quantity?: string;
  ingredients?: string[];
  volume?: string;
  alcoholContent?: string;
  contents?: string[];
  fragranceNotes?: {
    top?: string;
    middle?: string;
    base?: string;
  };
  material?: string;
  care?: string;
  storage?: string;
  heatSource?: string;
  temperatureRange?: string;
  packageDimensions?: string;
  materials?: string[];
}

export interface ProductVariant {
  name: string;
  image: string;
  price: number;
}

export interface SubProductItem {
  id: string;
  name: string;
  description: string;
  category: string;
  details?: ProductDetails;
  variants: ProductVariant[];
  // Legacy support - if variants exist, these are ignored
  image?: string;
  price?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isCustom?: boolean;
  items?: SubProductItem[];
  customOptions?: {
    basketColors: string[];
    productRange: string;
    note: string;
  };
}

export interface ProductWithItems {
  id: string;
  name: string;
  items: SubProductItem[];
}

export interface StandaloneProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  details?: ProductDetails;
  variants: ProductVariant[];
  // Legacy support - if variants exist, these are ignored
  image?: string;
  price?: number;
}

export interface ShopProductItem {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  variants: ProductVariant[];
  details?: ProductDetails;
}

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  isNew: boolean;
  isFeatured: boolean;
  isCustom?: boolean;
  variants?: ProductVariant[];
  items?: ShopProductItem[];
  customOptions?: {
    basketColors: string[];
    productRange: string;
    note: string;
  };
  details?: ProductDetails;
}

export type ProductDataItem = SubProductItem | StandaloneProduct | ShopProduct;


