import React, { useEffect, useState } from 'react';
import { getServers, getChannels, Server, Channel } from '../services/peerForumService';
import { testPeerForum } from '../test-peer-forum';

const PeerForumTest: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        setLoading(true);
        const serversData = await getServers();
        setServers(serversData);
        
        if (serversData.length > 0) {
          setSelectedServerId(serversData[0].id);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching servers:', err);
        setError('Failed to fetch servers. See console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  useEffect(() => {
    const fetchChannels = async () => {
      if (!selectedServerId) return;
      
      try {
        setLoading(true);
        const channelsData = await getChannels(selectedServerId);
        setChannels(channelsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching channels:', err);
        setError('Failed to fetch channels. See console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [selectedServerId]);

  const handleServerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedServerId(e.target.value);
  };

  const runTests = async () => {
    // Override console.log to capture test results
    const originalConsoleLog = console.log;
    const testLogs: string[] = [];
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      testLogs.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };
    
    try {
      await testPeerForum();
      setTestResults(testLogs);
    } catch (err) {
      console.error('Error running tests:', err);
      setError('Failed to run tests. See console for details.');
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Peer Forum Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <button 
          onClick={runTests}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Run Tests
        </button>
      </div>
      
      {testResults.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {testResults.join('\n')}
          </pre>
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Servers</h2>
        {loading && servers.length === 0 ? (
          <p>Loading servers...</p>
        ) : (
          <select 
            value={selectedServerId || ''} 
            onChange={handleServerChange}
            className="border rounded p-2 w-full"
          >
            {servers.map(server => (
              <option key={server.id} value={server.id}>
                {server.name} {server.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-2">Channels</h2>
        {loading && selectedServerId ? (
          <p>Loading channels...</p>
        ) : channels.length === 0 ? (
          <p>No channels found for this server.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(channel => (
              <div key={channel.id} className="border rounded p-4">
                <h3 className="font-bold">{channel.name}</h3>
                <p className="text-sm text-gray-600">{channel.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Type: {channel.type} | Category: {channel.category || 'None'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerForumTest;
