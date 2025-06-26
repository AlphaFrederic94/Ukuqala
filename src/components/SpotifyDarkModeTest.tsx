import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { MetricCard } from './MetricCard';
import { Heart, Activity, Brain, Zap } from 'lucide-react';

export const SpotifyDarkModeTest: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Spotify Dark Mode Test</h1>
        <p className="text-gray-600 dark:text-spotify-text-light">
          Testing all components with the new Spotify-inspired dark mode
        </p>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-spotify-text-light">
              This is a sample card with Spotify dark mode styling.
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Hover Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-spotify-text-light">
              This card has hover effects enabled.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="default" className="w-full mb-2">
              Primary Button
            </Button>
            <Button variant="outline" className="w-full">
              Secondary Button
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Heart Rate"
          value="72"
          unit="bpm"
          icon={<Heart className="h-5 w-5 text-red-500" />}
        />
        <MetricCard
          title="Steps"
          value="8,432"
          unit="steps"
          icon={<Activity className="h-5 w-5 text-blue-500" />}
        />
        <MetricCard
          title="Sleep"
          value="7.5"
          unit="hours"
          icon={<Brain className="h-5 w-5 text-purple-500" />}
        />
        <MetricCard
          title="Energy"
          value="85"
          unit="%"
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
        />
      </div>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Sample Input
            </label>
            <Input placeholder="Enter some text..." />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Sample Textarea
            </label>
            <textarea
              className="w-full p-3 border rounded-md"
              placeholder="Enter a longer message..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Sample Select
            </label>
            <select className="w-full p-3 border rounded-md">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <Button variant="default">Save</Button>
            <Button variant="outline">Cancel</Button>
            <Button variant="ghost">Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Background Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-spotify-black p-6 rounded-lg border border-gray-200 dark:border-spotify-lighter-gray">
          <h3 className="text-lg font-semibold mb-2">Black Frame</h3>
          <p className="text-gray-600 dark:text-spotify-text-light">
            This uses the black frame color for maximum contrast.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-spotify-medium-gray p-6 rounded-lg border border-gray-200 dark:border-spotify-lighter-gray">
          <h3 className="text-lg font-semibold mb-2">Medium Gray Content</h3>
          <p className="text-gray-600 dark:text-spotify-text-light">
            This uses the medium gray for content areas.
          </p>
        </div>
      </div>

      {/* Color Palette Display */}
      <Card>
        <CardHeader>
          <CardTitle>Spotify Color Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-full h-16 bg-spotify-black rounded-lg mb-2"></div>
              <p className="text-xs">Black</p>
            </div>
            <div className="text-center">
              <div className="w-full h-16 bg-spotify-dark-gray rounded-lg mb-2"></div>
              <p className="text-xs">Dark Gray</p>
            </div>
            <div className="text-center">
              <div className="w-full h-16 bg-spotify-medium-gray rounded-lg mb-2"></div>
              <p className="text-xs">Medium Gray</p>
            </div>
            <div className="text-center">
              <div className="w-full h-16 bg-spotify-light-gray rounded-lg mb-2"></div>
              <p className="text-xs">Light Gray</p>
            </div>
            <div className="text-center">
              <div className="w-full h-16 bg-spotify-green rounded-lg mb-2"></div>
              <p className="text-xs">Spotify Green</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpotifyDarkModeTest;
