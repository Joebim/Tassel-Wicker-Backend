export interface CartItem {
  id: string; // Unique item identifier (productId or productId-variantSlug)
  productId: string; // Product ID
  name: string; // Product name
  price: number; // Item price (in cents or base currency unit)
  image: string; // Product image URL
  category: string; // Product category
  description: string; // Product description
  quantity: number; // Quantity in cart
  variantName?: string; // Optional variant name (e.g., "Large", "Red")
  customItems?: Array<{
    // For custom baskets
    id: string;
    name: string;
    image: string;
    price: number;
  }>;
  basketItems?: Array<{
    // For normal baskets
    name: string;
    image: string;
    category: string;
  }>;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface Cart {
  id: string; // Cart ID (user ID for logged-in users, session ID for guests)
  userId?: string; // User ID if logged in
  sessionId?: string; // Session ID for guest carts
  items: CartItem[]; // Array of cart items
  totalPrice: number; // Total cart price (calculated)
  totalItems: number; // Total item count (calculated)
  lastSyncedAt?: string; // ISO 8601 timestamp of last sync
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface SyncCartRequest {
  localCart: CartItem[]; // Cart items from client (localStorage)
  lastSyncedAt?: string; // Last sync timestamp from client
  mergeStrategy?: "local" | "server" | "merge"; // How to handle conflicts
}

export interface SyncCartResponse {
  cart: Cart; // Merged/synced cart
  conflicts?: Array<{
    // Conflicts if merge strategy is 'merge'
    itemId: string;
    localQuantity: number;
    serverQuantity: number;
    resolution: "local" | "server" | "combined";
  }>;
  syncedAt: string; // ISO 8601 timestamp
}

export interface MergeGuestCartRequest {
  guestCart: CartItem[]; // Guest cart items
}

export interface MergeGuestCartResponse {
  cart: Cart; // Merged user cart
  mergedItems: string[]; // Array of item IDs that were merged
}




