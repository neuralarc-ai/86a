/**
 * Manus-Enhanced Side Panel Component
 * Integrates Manus-style artifact window with existing Suna functionality
 */

'use client';

import { Project } from '@/lib/api';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiMessageType } from '@/components/thread/types';
import { 
  CircleDashed, X, ChevronLeft, ChevronRight, Computer, Radio, Maximize2, 
  Minimize2, Play, RotateCcw, FileText, Image, Globe, BarChart3, BookOpen, 
  Plus, CheckCircle, Clock, AlertCircle, PlayCircle, PauseCircle, 
  Activity, Zap, Target, TrendingUp, Brain, Layers, Settings, Monitor,
  List, CheckSquare, Square, ArrowRight, Timer, Gauge, Download, Share2,
  Copy, Eye, File, FileSpreadsheet, Presentation, Video, Music, Archive,
  Database, Code, Folder, Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolView } from './tool-views/wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { ManusArtifactWindow } from './manus-artifact-window';
import { ManusCodeEditor } from './manus-code-editor';
import { ManusProgressBar, ManusStatusIndicator } from './manus-progress-bar';
import EnhancedTodoList, { TodoItem } from './enhanced-todo-list';

export interface ToolCallInput {
  assistantCall: {
    content?: string;
    name?: string;
    timestamp?: string;
  };
  toolResult?: {
    content?: string;
    isSuccess?: boolean;
    timestamp?: string;
  };
  messages?: ApiMessageType[];
}

interface ManusEnhancedSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls: ToolCallInput[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  project?: Project;
  className?: string;
}

// Sample file artifacts for demonstration
const sampleArtifacts = [
  {
    id: '1',
    name: 'live-remote-computer.tsx',
    path: 'suna-repo/frontend/src/components/thread/live-remote-computer.tsx',
    type: 'typescript',
    size: '15.2 KB',
    lastModified: '2 minutes ago',
    content: `/**
 * Live Remote Computer View Component
 * Shows real-time browser simulation during web crawling and scraping operations
 */

import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Wifi, WifiOff, Play, Pause, Square, RotateCcw, Maximize2, Minimize2, 
         MousePointer, Eye, Download, Share2, Copy, Settings, Activity, Globe, 
         Search, ArrowLeft, ArrowRight, RotateCw, Home, Bookmark, MoreHorizontal } from 'lucide-react';

interface LiveRemoteComputerProps {
  isActive: boolean;
  currentUrl?: string;
  status: 'idle' | 'connecting' | 'crawling' | 'scraping' | 'completed' | 'error';
  progress?: number;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  className?: string;
}

export const LiveRemoteComputer: React.FC<LiveRemoteComputerProps> = ({
  isActive,
  currentUrl = 'https://example.com',
  status = 'crawling',
  progress = 67,
  onPause,
  onResume,
  onStop,
  onRestart,
  className = ''
}) => {
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [currentStep, setCurrentStep] = useState('Analyzing page structure...');
  
  return (
    <div className={cn("bg-gray-900 rounded-lg border border-gray-700 overflow-hidden", className)}>
      {/* Browser Window Mockup */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-sm text-gray-300">
            {currentUrl}
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-4 h-64 bg-gray-900 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <Monitor className="w-16 h-16 text-blue-400 mb-4" />
          <p className="text-white font-medium mb-2">{currentStep}</p>
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};`
  },
  {
    id: '2',
    name: 'data-analysis.csv',
    path: 'workspace/data-analysis.csv',
    type: 'csv',
    size: '2.8 MB',
    lastModified: '5 minutes ago',
    content: 'Date,Revenue,Users,Conversion\n2024-01-01,15000,1200,0.12\n2024-01-02,18000,1350,0.13'
  },
  {
    id: '3',
    name: 'presentation.pptx',
    path: 'workspace/presentation.pptx',
    type: 'powerpoint',
    size: '5.1 MB',
    lastModified: '10 minutes ago',
    content: 'PowerPoint presentation with 15 slides'
  }
];

// Sample todo items
const sampleTodos: TodoItem[] = [
  {
    id: '1',
    title: 'Implement Helio L1 model integration',
    description: 'Add the 70B parameter legal language model to the backend',
    completed: true,
    priority: 'high',
    dueDate: new Date('2025-07-20'),
    category: 'Development',
    starred: true,
    createdAt: new Date('2025-07-19')
  },
  {
    id: '2',
    title: 'Create live remote computer view',
    description: 'Build real-time browser simulation component',
    completed: true,
    priority: 'high',
    dueDate: new Date('2025-07-19'),
    category: 'UI/UX',
    starred: false,
    createdAt: new Date('2025-07-19')
  },
  {
    id: '3',
    title: 'Enhance artifact window design',
    description: 'Match Manus.im design exactly with dark theme',
    completed: false,
    priority: 'medium',
    dueDate: new Date('2025-07-20'),
    category: 'Design',
    starred: true,
    createdAt: new Date('2025-07-19')
  },
  {
    id: '4',
    title: 'Test GitHub integration',
    description: 'Verify all changes work correctly in production',
    completed: false,
    priority: 'high',
    dueDate: new Date('2025-07-20'),
    category: 'Testing',
    starred: false,
    createdAt: new Date('2025-07-19')
  }
];

export const ManusEnhancedSidePanel: React.FC<ManusEnhancedSidePanelProps> = ({
  isOpen,
  onClose,
  toolCalls,
  currentIndex,
  onNavigate,
  project,
  className = ''
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('artifacts');
  const [showManusWindow, setShowManusWindow] = useState(false);
  const [selectedFile, setSelectedFile] = useState(sampleArtifacts[0]);
  const [todos, setTodos] = useState<TodoItem[]>(sampleTodos);
  const [isThinking, setIsThinking] = useState(true);
  const [thinkingTime, setThinkingTime] = useState('0:12');
  const [currentStep, setCurrentStep] = useState(4);
  const [totalSteps] = useState(6);
  const [progress, setProgress] = useState(67);

  // Simulate thinking timer
  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setThinkingTime(prev => {
          const [minutes, seconds] = prev.split(':').map(Number);
          const totalSeconds = minutes * 60 + seconds + 1;
          const newMinutes = Math.floor(totalSeconds / 60);
          const newSeconds = totalSeconds % 60;
          return `${newMinutes}:${newSeconds.toString().padStart(2, '0')}`;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isThinking]);

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 2;
        if (newProgress >= 100) {
          setIsThinking(false);
          return 100;
        }
        return newProgress;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'typescript':
      case 'javascript':
        return <Code className="w-5 h-5 text-blue-400" />;
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-green-400" />;
      case 'powerpoint':
        return <Presentation className="w-5 h-5 text-orange-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-400" />;
      case 'image':
        return <Image className="w-5 h-5 text-purple-400" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleFileClick = (file: typeof sampleArtifacts[0]) => {
    setSelectedFile(file);
    if (file.type === 'typescript' || file.type === 'javascript') {
      setShowManusWindow(true);
    }
  };

  const handleDownload = (file: typeof sampleArtifacts[0]) => {
    // Simulate file download
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed right-0 top-0 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40',
          isMobile ? 'w-full' : 'w-[600px]',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <Monitor className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manus Artifact Window
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 m-4 mb-0">
              <TabsTrigger value="artifacts" className="flex items-center space-x-2">
                <Folder className="w-4 h-4" />
                <span>Artifacts</span>
              </TabsTrigger>
              <TabsTrigger value="live-preview" className="flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>Live Preview</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4" />
                <span>Tasks</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="artifacts" className="h-full p-4 overflow-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      File Artifacts
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => setShowManusWindow(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Open Editor
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {sampleArtifacts.map((file) => (
                      <Card 
                        key={file.id} 
                        className="group hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 dark:border-gray-700"
                        onClick={() => handleFileClick(file)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(file.type)}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {file.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {file.size} • {file.lastModified}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="live-preview" className="h-full p-4">
                <div className="h-full">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Live Remote Computer
                  </h3>
                  <LiveRemoteComputer
                    isActive={true}
                    currentUrl="https://example.com"
                    status="crawling"
                    progress={progress}
                    className="h-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="h-full p-4 overflow-auto">
                <EnhancedTodoList
                  todos={todos}
                  onUpdateTodos={setTodos}
                  className="h-full"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Bottom Progress Monitor */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <ManusProgressBar
            progress={progress}
            isLive={isThinking}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
          <ManusStatusIndicator
            status="Enhance artifact window with live remote computer view"
            isThinking={isThinking}
            thinkingTime={thinkingTime}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        </div>
      </motion.div>

      {/* Manus Artifact Window Modal */}
      <ManusArtifactWindow
        isOpen={showManusWindow}
        onClose={() => setShowManusWindow(false)}
        currentFile={selectedFile}
        isThinking={isThinking}
        thinkingTime={thinkingTime}
        currentStep={currentStep}
        totalSteps={totalSteps}
        status="Enhance artifact window with live remote computer view"
        progress={progress}
      />
    </>
  );
};

export default ManusEnhancedSidePanel;

