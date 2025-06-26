import { FoodItem } from '@/types/nutrition';

export const PREDEFINED_MEALS: Record<string, FoodItem[]> = {
  breakfast: [
    {
      id: 'breakfast-1',
      name: "Oatmeal with Berries",
      calories: 310,
      protein: 13,
      carbs: 58,
      fat: 6,
      category: "breakfast",
      is_custom: false
    },
    {
      id: 'breakfast-2',
      name: "Greek Yogurt Parfait",
      calories: 285,
      protein: 20,
      carbs: 40,
      fat: 8,
      category: "breakfast",
      is_custom: false
    },
    {
      id: 'breakfast-3',
      name: "Scrambled Eggs with Toast",
      calories: 350,
      protein: 21,
      carbs: 30,
      fat: 16,
      category: "breakfast",
      is_custom: false
    },
    {
      id: 'breakfast-4',
      name: "Smoothie Bowl",
      calories: 320,
      protein: 15,
      carbs: 62,
      fat: 4,
      category: "breakfast",
      is_custom: false
    },
    {
      id: 'breakfast-5',
      name: "Whole Grain Pancakes",
      calories: 380,
      protein: 12,
      carbs: 65,
      fat: 10,
      category: "breakfast",
      is_custom: false
    }
  ],
  lunch: [
    {
      id: 'lunch-1',
      name: "Grilled Chicken Salad",
      calories: 400,
      protein: 35,
      carbs: 20,
      fat: 22,
      category: "lunch",
      is_custom: false
    },
    {
      id: 'lunch-2',
      name: "Quinoa Buddha Bowl",
      calories: 450,
      protein: 18,
      carbs: 65,
      fat: 15,
      category: "lunch",
      is_custom: false
    },
    {
      id: 'lunch-3',
      name: "Turkey Avocado Wrap",
      calories: 420,
      protein: 28,
      carbs: 45,
      fat: 18,
      category: "lunch",
      is_custom: false
    },
    {
      id: 'lunch-4',
      name: "Tuna Sandwich",
      calories: 380,
      protein: 25,
      carbs: 40,
      fat: 14,
      category: "lunch",
      is_custom: false
    },
    {
      id: 'lunch-5',
      name: "Mediterranean Pasta Salad",
      calories: 440,
      protein: 16,
      carbs: 68,
      fat: 12,
      category: "lunch",
      is_custom: false
    }
  ],
  dinner: [
    {
      id: 'dinner-1',
      name: "Salmon with Roasted Vegetables",
      calories: 480,
      protein: 42,
      carbs: 25,
      fat: 24,
      category: "dinner",
      is_custom: false
    },
    {
      id: 'dinner-2',
      name: "Lean Beef Stir-Fry",
      calories: 520,
      protein: 45,
      carbs: 35,
      fat: 20,
      category: "dinner",
      is_custom: false
    },
    {
      id: 'dinner-3',
      name: "Vegetarian Chickpea Curry",
      calories: 440,
      protein: 18,
      carbs: 62,
      fat: 16,
      category: "dinner",
      is_custom: false
    },
    {
      id: 'dinner-4',
      name: "Grilled Fish Tacos",
      calories: 460,
      protein: 32,
      carbs: 48,
      fat: 18,
      category: "dinner",
      is_custom: false
    },
    {
      id: 'dinner-5',
      name: "Turkey Meatballs with Zucchini Noodles",
      calories: 380,
      protein: 35,
      carbs: 20,
      fat: 22,
      category: "dinner",
      is_custom: false
    }
  ],
  snack: [
    {
      id: 'snack-1',
      name: "Mixed Nuts and Dried Fruit",
      calories: 180,
      protein: 6,
      carbs: 15,
      fat: 12,
      category: "snack",
      is_custom: false
    },
    {
      id: 'snack-2',
      name: "Apple with Peanut Butter",
      calories: 200,
      protein: 7,
      carbs: 25,
      fat: 10,
      category: "snack",
      is_custom: false
    },
    {
      id: 'snack-3',
      name: "Protein Smoothie",
      calories: 220,
      protein: 20,
      carbs: 25,
      fat: 5,
      category: "snack",
      is_custom: false
    },
    {
      id: 'snack-4',
      name: "Hummus with Carrots",
      calories: 160,
      protein: 6,
      carbs: 18,
      fat: 8,
      category: "snack",
      is_custom: false
    },
    {
      id: 'snack-5',
      name: "Greek Yogurt with Honey",
      calories: 150,
      protein: 12,
      carbs: 20,
      fat: 4,
      category: "snack",
      is_custom: false
    }
  ]
};
