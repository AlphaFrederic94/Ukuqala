import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firebaseSocialService } from '../../lib/firebaseSocialService';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, PlusCircle, X, TestTube } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

const FirebaseTestPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingTestPost, setIsCreatingTestPost] = useState(false);
  const [isRemovingTestPosts, setIsRemovingTestPosts] = useState(false);
  const [isCleaningDatabase, setIsCleaningDatabase] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Create a test post
  const handleCreateTestPost = async () => {
    if (!user) return;

    try {
      setIsCreatingTestPost(true);
      addTestResult('Creating test post...');

      // Call the Firebase service to create a test post
      const result = await firebaseSocialService.createTestPost(user.id);

      console.log('Create test post result:', result);
      addTestResult(`Create test post result: ${JSON.stringify(result)}`);

      if (result.success) {
        // Show success message
        toast({
          title: 'Success',
          description: result.message,
          status: 'success'
        });
      } else {
        // Show error message
        toast({
          title: 'Error',
          description: `Failed to create test post: ${result.message}`,
          status: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating test post:', error);
      addTestResult(`Error creating test post: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Error',
        description: 'An error occurred while creating a test post',
        status: 'error'
      });
    } finally {
      setIsCreatingTestPost(false);
    }
  };

  // Remove test posts
  const handleRemoveTestPosts = async () => {
    if (!user) return;

    try {
      setIsRemovingTestPosts(true);
      addTestResult('Removing test posts...');

      // Call the Firebase service to remove test posts
      const result = await firebaseSocialService.removeTestPosts();

      console.log('Remove test posts result:', result);
      addTestResult(`Remove test posts result: ${JSON.stringify(result)}`);

      if (result.success) {
        // Show success message
        toast({
          title: 'Success',
          description: result.message,
          status: 'success'
        });
      } else {
        // Show error message
        toast({
          title: 'Error',
          description: `Failed to remove test posts: ${result.message}`,
          status: 'error'
        });
      }
    } catch (error) {
      console.error('Error removing test posts:', error);
      addTestResult(`Error removing test posts: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Error',
        description: 'An error occurred while removing test posts',
        status: 'error'
      });
    } finally {
      setIsRemovingTestPosts(false);
    }
  };

  // Clean Firebase database
  const handleCleanDatabase = async () => {
    try {
      setIsCleaningDatabase(true);
      addTestResult('Cleaning Firebase database...');

      // Call the Firebase service to clean the database
      const result = await firebaseSocialService.cleanFirebaseDatabase();

      console.log('Clean database result:', result);
      addTestResult(`Clean database result: ${JSON.stringify(result)}`);

      if (result.success) {
        // Show success message
        toast({
          title: 'Success',
          description: result.message,
          status: 'success'
        });
      } else {
        // Show error message
        toast({
          title: 'Error',
          description: `Failed to clean database: ${result.message}`,
          status: 'error'
        });
      }
    } catch (error) {
      console.error('Error cleaning database:', error);
      addTestResult(`Error cleaning database: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Error',
        description: 'An error occurred while cleaning the database',
        status: 'error'
      });
    } finally {
      setIsCleaningDatabase(false);
    }
  };

  // Initialize Firebase collections
  const handleInitializeCollections = async () => {
    try {
      addTestResult('Initializing Firebase collections...');

      // Call the Firebase service to initialize collections
      const result = await firebaseSocialService.initializeFirebaseCollections();

      console.log('Initialize Firebase collections result:', result);
      addTestResult(`Initialize Firebase collections result: ${result}`);

      if (result) {
        // Show success message
        toast({
          title: 'Success',
          description: 'Firebase collections initialized successfully',
          status: 'success'
        });
      } else {
        // Show error message
        toast({
          title: 'Error',
          description: 'Failed to initialize Firebase collections',
          status: 'error'
        });
      }
    } catch (error) {
      console.error('Error initializing Firebase collections:', error);
      addTestResult(`Error initializing Firebase collections: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Error',
        description: 'An error occurred while initializing Firebase collections',
        status: 'error'
      });
    }
  };

  // Add a test result to the list
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Initialize Firebase collections on page load
  useEffect(() => {
    try {
      handleInitializeCollections();
    } catch (error) {
      console.error('Error initializing Firebase collections:', error);
      addTestResult(`Error initializing Firebase collections: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Firebase Test Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TestTube className="w-5 h-5 mr-2 text-blue-500" />
              Firebase Test Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleInitializeCollections}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Initialize Firebase Collections
            </Button>

            <Button
              onClick={handleCreateTestPost}
              disabled={isCreatingTestPost}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingTestPost ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Test Post...
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Test Post
                </>
              )}
            </Button>

            <Button
              onClick={handleRemoveTestPosts}
              disabled={isRemovingTestPosts}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isRemovingTestPosts ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Removing Test Posts...
                </>
              ) : (
                <>
                  <X className="w-5 h-5 mr-2" />
                  Remove Test Posts
                </>
              )}
            </Button>

            <Button
              onClick={handleCleanDatabase}
              disabled={isCleaningDatabase}
              className="w-full bg-red-800 hover:bg-red-900 text-white"
            >
              {isCleaningDatabase ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Cleaning Database...
                </>
              ) : (
                <>
                  <X className="w-5 h-5 mr-2" />
                  Clean Entire Database
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md h-80 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No test results yet</p>
              ) : (
                <ul className="space-y-2">
                  {testResults.map((result, index) => (
                    <li key={index} className="text-sm font-mono">{result}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FirebaseTestPage;
