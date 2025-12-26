import type {
  SubProductItem,
  ProductWithItems,
  ProductVariant,
  ShopProduct,
  ShopProductItem,
  StandaloneProduct,
  ProductDataItem,
} from "./types/productData";

// Helper function to convert legacy product format to variants format
const createVariantFromLegacy = (
  image: string,
  price: number
): ProductVariant[] => {
  return [{ name: "Default", image, price }];
};

const basketProducts: ProductWithItems[] = [
  {
    id: "1",
    name: "The Dee Basket",
    items: [
      {
        id: "dee-1",
        name: "The Free Writing Journal",
        description:
          "A beautifully crafted 280 lined hardback journal designed for reflection and clarity. It is the perfect companion for mindful writing and meditative moments. The orange fabric spine adds a subtle warmth against the deep blue covers, while the embossed gold quote <em>“I write so I can hear myself think”</em> inspires every page. The Free Writing Journal is an elevated essential for those dedicated to deepening their journaling practice.",
        category: "Stationery",
        variants: createVariantFromLegacy(
          "/images/products/journal.jpg",
          20
        ),
        details: {
          brand: "Positive Planner",
          weight: "0.725kg",
          dimensions: "24.5 x 17.5 x 2 cm",
          pages: "280",
          paper: "FSC 120gsm",
        },
      },
      {
        id: "dee-2",
        name: "Breckland Orchard Posh Pop",
        description:
          "A refreshing blend of ripe strawberries and tangy rhubarb, perfectly balanced for a bright, crisp taste. A hint of vanilla adds smoothness and depth, creating a delicately layered flavour that’s both vibrant and satisfying.",
        category: "Beverages",
        variants: createVariantFromLegacy(
          "/images/products/breckland-posh-pop.jpg",
          6
        ),
        details: {
          weight: "39.6 kilograms",
          volume: "275 Millilitres",
        },
      },
      {
        id: "dee-3",
        name: "Maegen Tomato & Mint Leaf Candle",
        description:
          "Bold and contemporary, this colourful striped glass candle features a refreshing scent and can be reused as distinctive glassware once the candle is finished.",
        category: "Home & Living",
        variants: createVariantFromLegacy(
          "/images/products/maegen-tomato-candle.jpg",
          33
        ),
        details: {
          netWeight: "280g / 10oz",
          wax: "Soy Wax",
        },
      },
      {
        id: "dee-4",
        name: "Maegen Green Bubble Matches",
        description:
          "Add a touch of colour to your interiors with these stylish bubble matches housed in a tactile glass bottle—perfect alongside your favourite candle.",
        category: "Home & Living",
        variants: createVariantFromLegacy(
          "/images/products/maegen-green-matches.jpg",
          15
        ),
        details: {
          quantity: "100 long matches",
          dimensions: "Height 15.5cm | Width 10cm | Depth 4.5cm",
        },
      },
      {
        id: "dee-5",
        name: "Frank's Salted Caramel Fudge Shortbread Cookies",
        description:
          "Indulge in the rich, buttery flavour of Frank’s shortbread, enhanced with swirls of salted caramel fudge. Each cookie delivers a perfect balance of sweetness and subtle saltiness, making them an irresistible treat for everyday enjoyment or gifting.",
        category: "Food & Treats",
        variants: createVariantFromLegacy(
          "/images/products/salted-caramel-cookies.jpg",
          6
        ),
        details: {
          ingredients: [
            "Wheat Flour (Calcium Carbonate, Iron, Nicotinamide, Thiamine)",
            "Salted Butter",
            "Sugar",
            "Caramel and Sea Salt Fudge (8%)",
            "Glucose Syrup",
            "Skimmed Sweetened Condensed Milk",
            "Partly Hydrogenated Palm Kernel Oil",
            "Fondant (Sugar, Glucose Syrup)",
            "Sea Salt (1%)",
            "Emulsifier: Sunflower Lecithin",
            "Flavouring",
          ],
        },
      },
      {
        id: "dee-6",
        name: "Black Wicker Basket",
        description:
          "A medium-sized black wicker basket with a branded removable cotton liner and vegan leather straps. Handmade by skilled weavers, each piece is eco-friendly and designed to last. The removable liner is made from 140g/sqm cotton and tailored to fit our wicker baskets with extended straps. It secures neatly around the hinges with discreet hook-and-loop fasteners. Perfect for storage, picnics, or home styling, our wicker baskets can be beautifully repurposed for everyday living.",
        category: "Baskets",
        variants: createVariantFromLegacy(
          "/images/products/black-wicker-basket.jpg",
          85
        ),
        details: {
          dimensions: "Length: 35cm | Width: 47cm | Height: 21cm",
          materials: [
            "Natural wicker",
            "140g/sqm cotton liner",
            "Vegan leather straps",
          ],
        },
      },
    ],
  },
  {
    id: "2",
    name: "The Duro Basket",
    items: [
      {
        id: "duro-1",
        name: "Shirley Temple Wine by Black Lines",
        description:
          "This non-alcoholic cocktail is a vibrant blend of grenadine, ginger ale, raspberry soda, fresh lemon, blood orange, and bitters. 0.0% ABV | 750ml.",
        category: "Beverages",
        variants: createVariantFromLegacy(
          "/images/products/shirley-temple-wine.jpg",
          13
        ),
        details: {
          alcoholContent: "0.0% ABV",
          volume: "750ml",
          ingredients: [
            "Grenadine",
            "Ginger ale",
            "Raspberry soda",
            "Fresh lemon",
            "Blood orange",
            "Bitters",
          ],
        },
      },
      {
        id: "duro-2",
        name: "Eau Nude Perfume Set",
        description:
          "A medley of lush red fruits, opulent florals, soft musk, and creamy vanilla. This elegant gift set includes a full-size and travel-size perfume plus a vitamin E–enriched body lotion that layers your signature scent throughout the day.",
        category: "Beauty & Fragrance",
        variants: createVariantFromLegacy(
          "/images/products/eau-nude-perfume.jpg",
          28
        ),
        details: {
          contents: [
            "100ml Eau Nude Eau de Parfum",
            "10ml Eau Nude Eau de Parfum",
            "200ml Eau Nude Body Lotion",
          ],
          fragranceNotes: {
            top: "Raspberry & Mandarin",
            middle: "Jasmine & Rose",
            base: "Patchouli & Amber",
          },
        },
      },
      {
        id: "duro-3",
        name: "Le Creuset Mini Cocotte (Garnet)",
        description:
          "This charming petite casserole is perfect for single servings or small-plate side dishes. Ideal for dips, condiments, and nibbles, it combines playful design with everyday practicality and includes a matching lid for heating sauces or keeping snacks fresh.",
        category: "Kitchen & Dining",
        variants: createVariantFromLegacy(
          "/images/products/le-creuset-cocotte-garnet.jpg",
          27
        ),
        details: {
          material: "Stoneware (Glazed)",
          care: "Dishwasher Safe",
          storage: "Freezer Compatible",
          heatSource: "Grill, Microwave and Oven compatible",
          temperatureRange: "-23℃ to 260℃",
        },
      },
      {
        id: "duro-4",
        name: "Frank's Raspberry Shortbread Cookies",
        description:
          "Hand-baked in Hereford with the finest natural ingredients. Buttery, delicate shortbread infused with the bright, tangy sweetness of real raspberries. Pairs well with tea or coffee.",
        category: "Food & Treats",
        variants: createVariantFromLegacy(
          "/images/products/frank-raspberry-shortbread.jpg",
          6
        ),
        details: {
          ingredients: [
            "Wheat",
            "Flour (Calcium Carbonate, Iron, Nicotinamide, Thiamine)",
            "Salted Butter (32%)",
            "Sugar Raspberries (1%) (100% Natural Raspberries)",
            "Natural Raspberry Flavouring(<1%)",
          ],
        },
      },
      {
        id: "duro-5",
        name: "Cartwright & Butler Winter Spiced Orange and Cranberry Shortbread Cookies",
        description:
          "Buttery shortbread infused with orange and studded with cranberries, gently topped with cinnamon sugar for a comforting, festive treat from Cartwright & Butler.",
        category: "Food & Treats",
        variants: createVariantFromLegacy(
          "/images/products/cartwright-orange-cranberry.jpg",
          7
        ),
        details: {
          ingredients: [
            "Wheat Flour (Calcium, Iron, Niacin, Thiamine)",
            "Salted Butter (29%)",
            "Milk",
            "Salt",
            "Sugar",
            "Maize Starch",
            "Cranberries (6%)",
            "Cranberry",
            "Cane Sugar",
            "Sunflower Oil",
            "Cinnamon",
            "Natural Flavouring: Orange Oil (1%)",
          ],
          packageDimensions: "16.9 x 7.5 x 6.7 cm",
          weight: "200g",
          storage:
            "Store in a cool, dry place away from direct sunlight. Once opened, consume within one week.",
        },
      },
      {
        id: "duro-6",
        name: "Natural Wicker Basket",
        description:
          "A medium-sized wicker basket with a branded removable cotton liner and vegan leather straps. Handmade by skilled weavers, each piece is eco-friendly and designed to last. The removable liner is made from 140g/sqm cotton and tailored to fit our wicker baskets with extended straps. It secures neatly around the hinges with discreet hook-and-loop fasteners. Perfect for storage, picnics, or home styling, our wicker baskets can be beautifully repurposed for everyday living.",
        category: "Baskets",
        variants: createVariantFromLegacy(
          "/images/products/wicker-basket.jpg",
          85
        ),
        details: {
          dimensions: "Length: 35cm | Width: 47cm | Height: 21cm",
          materials: [
            "Natural wicker",
            "140g/sqm cotton liner",
            "Vegan leather straps",
          ],
        },
      },
    ],
  },
];

const getBasketItems = (basketId: string): SubProductItem[] => {
  const basket = basketProducts.find((product) => product.id === basketId);
  return basket ? basket.items : [];
};

const toShopItem = (item: SubProductItem): ShopProductItem => ({
  ...item,
  image: item.image ?? item.variants[0]?.image ?? "",
});

// Extract all sub-products from main shop products
export const getAllSubProducts = (): SubProductItem[] => {
  const allItems = basketProducts.flatMap((product) => product.items);
  const uniqueItems = allItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.name === item.name)
  );
  return uniqueItems;
};

export const getAdditionalProducts = (): StandaloneProduct[] => [
  {
    id: "add-1",
    name: "Ramekins with Lid by Next (2)",
    description:
      "These ceramic, flower-shaped ramekins come in a set of two. Perfect for sauces, dips, sweet treats, nibbles, or soufflés, they bring both style and versatility to your table. Their elegant design and durable craftsmanship make them as delightful to display as they are to use.",
    category: "Kitchen & Dining",
    variants: [
      {
        name: "Default",
        image:
          "/images/products/ramekins.jpg",
        price: 28,
      },
    ],
    details: {
      dimensions: "Height 11cm | Width 11cm | Depth 11cm",
    },
    items: [
      {
        id: "add-1-yellow",
        name: "Yellow Ramekin",
        description:
          "A beautiful yellow ceramic ramekin with lid, perfect for serving individual portions.",
        category: "Kitchen & Dining",
        image:
          "/images/products/yellow-ramekin.jpg",
        variants: [
          {
            name: "Default",
            image:
              "/images/products/yellow-ramekin.jpg",
            price: 14,
          },
        ],
        details: {
          dimensions: "Height 11cm | Width 11cm | Depth 11cm",
        },
      },
      {
        id: "add-1-pink",
        name: "Pink Ramekin",
        description:
          "A beautiful pink ceramic ramekin with lid, perfect for serving individual portions.",
        category: "Kitchen & Dining",
        image:
          "/images/products/pink-ramekin.jpg",
        variants: [
          {
            name: "Default",
            image:
              "/images/products/pink-ramekin.jpg",
            price: 14,
          },
        ],
        details: {
          dimensions: "Height 11cm | Width 11cm | Depth 11cm",
        },
      },
    ],
  } as StandaloneProduct & { items?: ShopProductItem[] },
  {
    id: "add-2",
    name: "Le Creuset Mini Cocotte (Chambray)",
    description:
      "This charming petite casserole is perfect for single servings or small-plate side dishes. Ideal for dips, condiments, and nibbles, it combines playful design with everyday practicality. Finished with a matching lid, it's perfect for heating sauces or keeping snacks fresh.",
    category: "Kitchen & Dining",
    variants: [
      {
        name: "Chambray",
        image:
          "/images/products/le-creuset-casserole-chambray.jpg",
        price: 27,
      },
    ],
    details: {
      material: "Stoneware (Glazed)",
      care: "Dishwasher Safe",
      storage: "Freezer Compatible",
      heatSource: "Grill, Microwave and Oven compatible",
      temperatureRange: "-23℃ to 260℃",
    },
  },
  {
    id: "add-3",
    name: "Whittard Luxury Hot Chocolate",
    description:
      "Smooth milk chocolate powder sealed in a reusable clip-top tin. Ideal for making hot chocolate or adding to desserts.",
    category: "Food & Treats",
    variants: createVariantFromLegacy(
      "/images/products/whittard-hot-chocolate.jpg",
      15.95
    ),
    details: {
      ingredients: [
        "Sugar",
        "Cocoa Powder (39%)",
        "Dextrose",
        "Flavouring",
        "Salt",
      ],
      weight: "200g",
      storage: "Best kept in a cool, dry place.",
    },
  },
  {
    id: "add-4",
    name: "Frank's Orange Milk Chocolate Dipped Shortbread",
    description:
      "A buttery, crisp shortbread infused with natural orange flavour and partially dipped in smooth milk chocolate. The zesty citrus notes complement the rich, creamy chocolate.",
    category: "Food & Treats",
    variants: createVariantFromLegacy(
      "/images/products/orange-milk-chocolate.jpg",
      6
    ),
    details: {
      ingredients: [
        "Wheat Flour (Calcium Carbonate, Iron, Nicotinamide, Thiamine)",
        "Salted Butter",
        "Sugar",
        "Milk Chocolate (2%)",
        "Cocoa Butter",
        "Cocoa Mass",
        "Emulsifier: Soya Lecithin, Natural Vanilla Flavour",
        "Natural Orange Extract (1%)",
        "Rapeseed Oil",
      ],
    },
  },
  {
    id: "add-5",
    name: "Frank's All Butter Shortbread",
    description:
      "A buttery shortbread made with quality ingredients for a rich, smooth texture and classic taste. Great alongside tea or coffee, or enjoyed on its own.",
    category: "Food & Treats",
    variants: createVariantFromLegacy(
      "/images/products/all-butter-shortbread.jpg",
      6
    ),
    details: {
      ingredients: [
        "Wheat Flour (Calcium Carbonate, Iron, Nicotinamide, Thiamine)",
        "Salted Butter (32%)",
        "Sugar",
      ],
    },
  },
  {
    id: "add-6",
    name: "Frank's Chocolate Chunk Shortbread",
    description:
      "Buttery shortbread with generous pieces of milk chocolate throughout. Made with the finest quality ingredients for a rich, consistent texture and flavour in every bite.",
    category: "Food & Treats",
    variants: createVariantFromLegacy(
      "/images/products/chocolate-chunk-cookies.jpg",
      6
    ),
    details: {
      ingredients: [
        "Wheat Flour (Calcium Carbonate, Iron, Nicotinamide, Thiamine)",
        "Salted Butter",
        "Sugar",
        "Chocolate Chunks (8%)",
        "Cocoa Mass",
        "Emulsifier: Soya Lecithin",
        "Natural Vanilla Flavouring (may contain traces of milk)",
      ],
    },
  },
  {
    id: "add-7",
    name: "Cartwright & Butler Apple Juice",
    description:
      "Made of 100% fresh apples, this pure apple juice is naturally sweet and refreshing. It is ideal for drinking on its own or using in recipes.",
    category: "Beverages",
    variants: createVariantFromLegacy(
      "/images/products/apple-juice.jpg",
      5.5
    ),
    details: {
      volume: "250ml",
      storage:
        "Once opened, keep refrigerated below 7°C and consume within 5 days.",
    },
  },
  {
    id: "add-8",
    name: "MAEGEN ORANGE BLOSSOM & BASIL CANDLE",
    description:
      "Bold and contemporary, these colourful striped glass candles feature a range of refreshing new scents. Designed for those who appreciate statement design and vibrant fragrance, each vessel can be reused as distinctive glassware once the candle is finished.",
    category: "Home & Living",
    variants: createVariantFromLegacy(
      "/images/products/maegen-atina-candle-red.jpg",
      33
    ),
    details: {
      quantity: "100 long matches",
      dimensions: "Height 15.5cm | Width 10cm | Depth 4.5cm",
    },
  },
  {
    id: "add-9",
    name: "Cartwright & Butler Butterscotch Crunch Cookies",
    description:
      "Crisp cookies made with butter and brown sugar, baked with pieces of sweet butterscotch for a light crunch and balanced flavour.",
    category: "Food & Treats",
    variants: createVariantFromLegacy(
      "/images/products/butterscotch-crunch-cookies.jpg",
      8.75
    ),
    details: {
      ingredients: [
        "Wheat Flour (Calcium, Iron, Niacin, Thiamin)",
        "Salted Butter (25%)",
        "Milk",
        "Salt",
        "Butter Sweets (10%)",
        "Brown Sugar",
        "Glucose Syrup",
        "Natural Flavoring",
        "Rice Flour",
        "Flavorings",
      ],
      packageDimensions: "6.5 x 7.5 x 16.5 cm",
      weight: "200g",
      storage:
        "Store in a cool, dry place away from direct sunlight. Once opened, consume within one week.",
    },
  },
  {
    id: "add-10",
    name: "Cartwright & Butler Strawberry & White Chocolate Cookies",
    description:
      "Baked with chunks of white chocolate and pieces of strawberry, these cookies bring together a mix of gentle sweetness and texture.",
    category: "Food & Treats",
    variants: createVariantFromLegacy(
      "/images/products/strawberry-cookies.jpg",
      8.75
    ),
    details: {
      ingredients: [
        "Wheat Flour (Calcium, Iron, Niacin, Thiamine)",
        "Salted Butter",
        "Sugar",
        "White Chocolate Chunks (11%)",
        "Whole Milk Powder",
        "Cocoa Butter",
        "Skimmed Milk Powder",
        "Emulsifier: Soya Lecithin",
        "Natural Vanilla Flavouring",
        "Strawberry Nuggets (5%)",
        "Strawberry Juice",
        "Lemon Pulp",
        "Gelling Agent: Pectin",
        "Oat Fibres",
        "Natural Flavouring",
        "Elderberry",
        "Aronia Juice Concentrate",
      ],
      packageDimensions: "16.6 x 6.6 x 7.3 cm",
      weight: "200g",
      storage:
        "Store in a cool, dry place away from direct sunlight. Once opened, consume within one week.",
    },
  },
  {
    id: "add-11",
    name: "Frank's Dipped Shortbread Vanilla White Chocolate",
    description:
      "A buttery, crisp shortbread infused with natural vanilla flavour and partially dipped in smooth white chocolate. The delicate vanilla notes complement the rich, creamy white chocolate.",
    category: "Food & Treats",
    variants: createVariantFromLegacy(
      "/images/products/vanilla-white-chocolate.jpg",
      6
    ),
    details: {
      ingredients: [
        "Wheat Flour",
        "Salted Butter",
        "Sugar",
        "White Chocolate (2%)",
        "Natural Vanilla Extract (1%)",
      ],
    },
  },
];

export const shopProducts: ShopProduct[] = [
  {
    id: "1",
    name: "The Dee Basket",
    price: 130,
    image:
      "/images/products/nyla-basket-cover.jpg",
    category: "Baskets",
    description:
      "My personal favourite, this basket mirrors my love for meditative and slow living. It is designed to inspire mindfulness, presence, and moments of reflection throughout the day.",
    isNew: false,
    isFeatured: true,
    items: getBasketItems("1").map(toShopItem),
    details: {
      basketContents: [
        "The Free Writing Journal",
        "Breckland Orchard Posh Pop",
        "Maegen Tomato & Mint Leaf Candle",
        "Maegen Green Bubble Matches",
        "Frank’s Salted Caramel Fudge Shortbread Cookies",
        "Black Wicker Basket",
      ],
      note: "Curated to inspire mindfulness, presence, and moments of reflection throughout the day.",
      basketIncludes:
        "Includes a black wicker basket with removable cotton liner and vegan leather straps.",
    },
  },
  {
    id: "2",
    name: "The Duro Basket",
    price: 130,
    image:
      "/images/products/duro-basket-cover.jpg",
    category: "Baskets",
    description:
      "Derived from the Yoruba name <em>Durojaiye</em>, meaning “to wait and enjoy life,” this basket is a meditation on time and resilience. Named after my mother, the Duro Basket stands as a tribute to her strength, grace, love and enduring spirit.",
    isNew: true,
    isFeatured: false,
    items: getBasketItems("2").map(toShopItem),
    details: {
      basketContents: [
        "Shirley Temple Wine by Black Lines",
        "Eau Nude Perfume Set",
        "Le Creuset Mini Cocotte (Garnet)",
        "Frank’s Raspberry Shortbread Cookies",
        "Cartwright & Butler Winter Spiced Orange and Cranberry Shortbread Cookies",
        "Natural Wicker Basket",
      ],
      note: "A meditation on time and resilience—a tribute to strength, grace, love, and enduring spirit.",
      basketIncludes:
        "Includes a natural wicker basket with removable cotton liner and vegan leather straps.",
    },
  },
  {
    id: "3",
    name: "Build Your Basket",
    price: 0,
    image:
      "/images/products/build-your-basket.jpg",
    category: "Custom",
    description:
      "Create a celebration basket that's uniquely yours. Choose from our range of handpicked products and build a personalised basket for any occasion.",
    isNew: false,
    isFeatured: true,
    isCustom: true,
    items: [],
    customOptions: {
      basketColors: ["Natural Wicker Basket", "Black Wicker Basket"],
      productRange: "Select 3–5 products from our catalogue",
      note: "Our wicker baskets are available exclusively as part of a personalised set and are not available for individual purchase.",
    },
    details: {
      experience:
        "Create a celebration basket that’s uniquely yours with handpicked products for any occasion.",
      selection:
        "Select between three and five products, then choose the wicker basket colour that suits your story.",
      support:
        "Our team is available at info@tasselandwicker.com if you need guidance curating your basket.",
    },
  },
];

export const getAllProducts = (): ProductDataItem[] => {
  return [...getAllSubProducts(), ...getAdditionalProducts()];
};
