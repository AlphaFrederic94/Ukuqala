import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  ChefHat, 
  BarChart3, 
  Zap, 
  Award,
  TrendingUp,
  Target,
  Activity,
  Heart
} from 'lucide-react';

export const NutritionShowcase: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      title: "AI-Powered Analytics",
      description: "Advanced nutrition analysis with personalized insights and recommendations",
      color: "from-purple-500 to-violet-600",
      bgColor: "from-purple-50 to-violet-50",
      highlights: [
        "Real-time nutrition scoring",
        "Macro balance analysis", 
        "Hydration tracking",
        "Trend identification"
      ]
    },
    {
      icon: <ChefHat className="h-8 w-8 text-emerald-500" />,
      title: "Smart Meal Generation",
      description: "AI creates personalized meals based on your preferences and goals",
      color: "from-emerald-500 to-teal-600",
      bgColor: "from-emerald-50 to-teal-50",
      highlights: [
        "Dietary restriction support",
        "Calorie target matching",
        "Macro optimization",
        "Recipe instructions"
      ]
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      title: "Advanced Visualization",
      description: "Beautiful charts and graphs for comprehensive nutrition tracking",
      color: "from-blue-500 to-indigo-600",
      bgColor: "from-blue-50 to-indigo-50",
      highlights: [
        "Interactive pie charts",
        "Trend line graphs",
        "Progress bars",
        "Real-time updates"
      ]
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-500" />,
      title: "Enhanced Notifications",
      description: "Smart toast notifications with AI insights and progress tracking",
      color: "from-orange-500 to-red-600",
      bgColor: "from-orange-50 to-red-50",
      highlights: [
        "AI insight notifications",
        "Achievement tracking",
        "Progress celebrations",
        "Action suggestions"
      ]
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-4"
        >
          <div className="p-3 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-xl mr-3">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
            Enhanced Nutrition Features
          </h2>
        </motion.div>
        
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Experience the next generation of nutrition tracking with AI-powered insights, 
          smart meal generation, and comprehensive analytics.
        </p>
      </div>

      {/* Feature Navigation */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {features.map((feature, index) => (
          <button
            key={index}
            onClick={() => setActiveFeature(index)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeFeature === index
                ? `bg-gradient-to-r ${feature.color} text-white shadow-lg scale-105`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {feature.icon}
            <span className="font-medium">{feature.title}</span>
          </button>
        ))}
      </div>

      {/* Active Feature Display */}
      <motion.div
        key={activeFeature}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-gradient-to-br ${features[activeFeature].bgColor} rounded-xl p-6 border border-gray-200`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 bg-gradient-to-r ${features[activeFeature].color} rounded-xl`}>
                {React.cloneElement(features[activeFeature].icon, { className: "h-6 w-6 text-white" })}
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {features[activeFeature].title}
              </h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              {features[activeFeature].description}
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <Award className="h-4 w-4 mr-2 text-yellow-500" />
                Key Features
              </h4>
              {features[activeFeature].highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                  <span className="text-gray-700">{highlight}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Feature Preview Mockup */}
              <div className="w-64 h-48 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                
                {activeFeature === 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <div className="text-sm font-medium">Nutrition Score: 85</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-400 to-violet-500 h-2 rounded-full w-4/5"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-100 p-2 rounded text-center">Protein: 85g</div>
                      <div className="bg-green-100 p-2 rounded text-center">Carbs: 120g</div>
                      <div className="bg-yellow-100 p-2 rounded text-center">Fats: 45g</div>
                    </div>
                  </div>
                )}
                
                {activeFeature === 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <ChefHat className="h-4 w-4 text-emerald-500" />
                      <div className="text-sm font-medium">Grilled Salmon Bowl</div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>• 150g Salmon fillet</div>
                      <div>• Quinoa & vegetables</div>
                      <div>• Avocado & lemon</div>
                    </div>
                    <div className="bg-emerald-100 p-2 rounded text-xs text-center">
                      485 calories | 35g protein
                    </div>
                  </div>
                )}
                
                {activeFeature === 2 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <div className="text-sm font-medium">Weekly Trends</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 h-16">
                      {[65, 80, 75, 90, 85, 70, 95].map((height, i) => (
                        <div key={i} className="bg-blue-200 rounded-t" style={{ height: `${height}%` }}></div>
                      ))}
                    </div>
                    <div className="text-xs text-center text-gray-600">Calories by day</div>
                  </div>
                )}
                
                {activeFeature === 3 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <div className="text-sm font-medium">Smart Notifications</div>
                    </div>
                    <div className="bg-orange-100 p-2 rounded text-xs">
                      <div className="font-medium">🎉 Achievement Unlocked!</div>
                      <div>7-day hydration streak</div>
                    </div>
                    <div className="bg-purple-100 p-2 rounded text-xs">
                      <div className="font-medium">💡 AI Insight</div>
                      <div>Consider adding more fiber</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
              >
                <Sparkles className="h-3 w-3 text-white" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <div className="text-center mt-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white rounded-xl p-6"
        >
          <h3 className="text-xl font-bold mb-2">Ready to Transform Your Nutrition?</h3>
          <p className="text-purple-100 mb-4">
            Experience the power of AI-driven nutrition tracking and personalized meal planning.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <Heart className="h-5 w-5 text-red-300" />
            <span className="text-sm">Built with care for your health journey</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
