import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import SystemArchitecture from '../components/systemDesign/SystemArchitecture';
import ClassDiagram from '../components/systemDesign/ClassDiagram';
import SequenceDiagram from '../components/systemDesign/SequenceDiagram';
import DataFlowDiagram from '../components/systemDesign/DataFlowDiagram';
import TechStack from '../components/systemDesign/TechStack';
import { Book, Code, Database, GitBranch, Layers } from 'lucide-react';

export default function SystemDesign() {
  const [activeTab, setActiveTab] = useState('architecture');

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const tabVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ukuqala System Design Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
          This documentation provides a comprehensive overview of the Ukuqala application's architecture, 
          class structure, data flow, and interaction patterns to aid in understanding and future development.
        </p>
      </div>

      <Tabs 
        defaultValue="architecture" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 mb-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="architecture" className="flex items-center justify-center">
              <Layers className="h-4 w-4 mr-2" />
              <span>Architecture</span>
            </TabsTrigger>
            <TabsTrigger value="class" className="flex items-center justify-center">
              <Code className="h-4 w-4 mr-2" />
              <span>Class Diagram</span>
            </TabsTrigger>
            <TabsTrigger value="sequence" className="flex items-center justify-center">
              <GitBranch className="h-4 w-4 mr-2" />
              <span>Sequence Diagram</span>
            </TabsTrigger>
            <TabsTrigger value="dataflow" className="flex items-center justify-center">
              <Database className="h-4 w-4 mr-2" />
              <span>Data Flow</span>
            </TabsTrigger>
            <TabsTrigger value="techstack" className="flex items-center justify-center">
              <Book className="h-4 w-4 mr-2" />
              <span>Tech Stack</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <motion.div
          key={activeTab}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={tabVariants}
          transition={{ duration: 0.2 }}
        >
          <TabsContent value="architecture" className="mt-0">
            <SystemArchitecture />
          </TabsContent>
          
          <TabsContent value="class" className="mt-0">
            <ClassDiagram />
          </TabsContent>
          
          <TabsContent value="sequence" className="mt-0">
            <SequenceDiagram />
          </TabsContent>
          
          <TabsContent value="dataflow" className="mt-0">
            <DataFlowDiagram />
          </TabsContent>
          
          <TabsContent value="techstack" className="mt-0">
            <TechStack />
          </TabsContent>
        </motion.div>
      </Tabs>
    </motion.div>
  );
}
