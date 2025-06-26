import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NewSocialLayout from '../../components/social/NewSocialLayout';
import { useFirebase } from '../../contexts/FirebaseContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const { socialService } = useFirebase();

  const testFirebaseConnection = async () => {
    try {
      // Initialize Firebase collections
      await socialService.initializeFirebaseCollections();

      // Get posts
      const posts = await socialService.getPosts(5);
      console.log('Firebase posts:', posts);

      // Get trending hashtags
      const hashtags = await socialService.getTrendingHashtags();
      console.log('Firebase trending hashtags:', hashtags);

      alert('Firebase connection test successful! Check console for details.');
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      alert('Firebase connection test failed. Check console for details.');
    }
  };

  return (
    <NewSocialLayout>
      <div className="mb-4 flex items-center">
        <button
          className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => navigate('/social')}
        >
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Social Features Test
        </h1>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Test the connection to Firebase and verify that social features are working correctly.
            </p>
            <Button onClick={testFirebaseConnection} className="w-full">
              Test Firebase Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    </NewSocialLayout>
  );
};

export default TestPage;
