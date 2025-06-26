export interface CommonFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  servingSize: string;
  category: string[];  // e.g., ["vegetarian", "gluten-free"]
  allergens: string[]; // e.g., ["nuts", "dairy"]
  imageUrl?: string;
}

export const FOOD_CATEGORIES = {
  PROTEINS: 'proteins',
  GRAINS: 'grains',
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  DAIRY: 'dairy',
  SNACKS: 'snacks',
} as const;

export const COMMON_FOODS: Record<string, CommonFood[]> = {
  [FOOD_CATEGORIES.PROTEINS]: [
    { 
      name: "Grilled Chicken Breast",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      servingSize: "100g",
      category: ["high-protein", "low-carb"],
      allergens: [],
      imageUrl: "/images/foods/chicken-breast.jpg"
    },
    // ... more proteins
  ],
  [FOOD_CATEGORIES.GRAINS]: [
    // ... grains
  ],
  // ... other categories
};

export const getFoodsByDietaryRestriction = (restriction: string): CommonFood[] => {
  return Object.values(COMMON_FOODS)
    .flat()
    .filter(food => food.category.includes(restriction));
};

export const getFoodsByMaxCalories = (maxCalories: number): CommonFood[] => {
  return Object.values(COMMON_FOODS)
    .flat()
    .filter(food => food.calories <= maxCalories);
};

export const getFoodsByNutrientContent = (
  nutrient: 'protein' | 'carbs' | 'fat',
  minAmount: number
): CommonFood[] => {
  return Object.values(COMMON_FOODS)
    .flat()
    .filter(food => food[nutrient] >= minAmount);
};
