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
  Database, Code, Folder
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
import LiveCrawlingPreview from './live-crawling-preview';
import LiveRemoteComputer from './live-remote-computer';
import { BottomProgressMonitor } from './bottom-progress-monitor';
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

interface ToolCallSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls: ToolCallInput[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  externalNavigateToIndex?: number;
  messages?: ApiMessageType[];
  agentStatus: string;
  project?: Project;
  renderAssistantMessage?: (message: ApiMessageType) => React.ReactNode;
}

interface ArtifactFile {
  id: string;
  name: string;
  type: 'document' | 'image' | 'webpage' | 'visualization' | 'playbook' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'archive' | 'database' | 'code';
  size?: string;
  url?: string;
  content?: string;
  preview?: string;
  downloadUrl?: string;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'document':
      return <FileText className="h-5 w-5 text-blue-600" />;
    case 'image':
      return <Image className="h-5 w-5 text-orange-600" />;
    case 'webpage':
      return <Globe className="h-5 w-5 text-pink-600" />;
    case 'visualization':
      return <BarChart3 className="h-5 w-5 text-purple-600" />;
    case 'playbook':
      return <BookOpen className="h-5 w-5 text-green-600" />;
    case 'spreadsheet':
      return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
    case 'presentation':
      return <Presentation className="h-5 w-5 text-red-600" />;
    case 'video':
      return <Video className="h-5 w-5 text-indigo-600" />;
    case 'audio':
      return <Music className="h-5 w-5 text-yellow-600" />;
    case 'archive':
      return <Archive className="h-5 w-5 text-slate-600" />;
    case 'database':
      return <Database className="h-5 w-5 text-cyan-600" />;
    case 'code':
      return <Code className="h-5 w-5 text-gray-600" />;
    default:
      return <File className="h-5 w-5 text-gray-600" />;
  }
};

const getFileTypeFromName = (filename: string): ArtifactFile['type'] => {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
    case 'md':
      return 'document';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return 'image';
    case 'html':
    case 'htm':
      return 'webpage';
    case 'csv':
    case 'xlsx':
    case 'xls':
      return 'spreadsheet';
    case 'ppt':
    case 'pptx':
      return 'presentation';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'video';
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'audio';
    case 'zip':
    case 'tar':
    case 'gz':
      return 'archive';
    case 'sql':
    case 'db':
    case 'sqlite':
      return 'database';
    case 'js':
    case 'ts':
    case 'py':
    case 'java':
    case 'cpp':
      return 'code';
    default:
      return 'document';
  }
};

export const EnhancedToolCallSidePanel: React.FC<ToolCallSidePanelProps> = ({
  isOpen,
  onClose,
  toolCalls,
  currentIndex,
  onNavigate,
  externalNavigateToIndex,
  messages = [],
  agentStatus,
  project,
  renderAssistantMessage
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('artifacts');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showProgressMonitor, setShowProgressMonitor] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  const [isProgressPaused, setIsProgressPaused] = useState(false);
  const [crawlingSteps, setCrawlingSteps] = useState([]);
  const [isCrawlingActive, setIsCrawlingActive] = useState(false);

  // Sample to-do items for demonstration
  const [todoItems, setTodoItems] = useState<TodoItem[]>([
    {
      id: '1',
      title: 'Review legal contract terms',
      description: 'Analyze the new partnership agreement with focus on liability clauses',
      completed: false,
      priority: 'high',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      tags: ['legal', 'contract', 'review'],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      starred: true,
      category: 'Legal'
    },
    {
      id: '2',
      title: 'Prepare quarterly financial report',
      description: 'Compile Q4 financial data and create executive summary',
      completed: false,
      priority: 'urgent',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      tags: ['finance', 'quarterly', 'report'],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      starred: false,
      category: 'Finance'
    },
    {
      id: '3',
      title: 'Update employee handbook',
      description: 'Incorporate new remote work policies and benefits information',
      completed: true,
      priority: 'medium',
      tags: ['hr', 'handbook', 'policies'],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      starred: false,
      category: 'HR'
    },
    {
      id: '4',
      title: 'Schedule team building event',
      description: 'Organize quarterly team building activity for all departments',
      completed: false,
      priority: 'low',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      tags: ['team', 'event', 'planning'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      starred: false,
      category: 'HR'
    },
    {
      id: '5',
      title: 'Conduct security audit',
      description: 'Perform comprehensive security assessment of all systems',
      completed: false,
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      tags: ['security', 'audit', 'systems'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      starred: true,
      category: 'IT'
    }
  ]);

  // Sample artifacts for demonstration
  const [artifacts, setArtifacts] = useState<ArtifactFile[]>([
    {
      id: '1',
      name: 'Business_Report.pdf',
      type: 'document',
      size: '2.4 MB',
      preview: 'Executive summary of Q4 business performance...',
      downloadUrl: '/api/download/business-report.pdf'
    },
    {
      id: '2',
      name: 'Sales_Data.xlsx',
      type: 'spreadsheet',
      size: '1.8 MB',
      preview: 'Monthly sales figures and analytics...',
      downloadUrl: '/api/download/sales-data.xlsx'
    },
    {
      id: '3',
      name: 'Presentation.pptx',
      type: 'presentation',
      size: '5.2 MB',
      preview: 'Q4 Results Presentation - 24 slides',
      downloadUrl: '/api/download/presentation.pptx'
    }
  ]);

  // Initialize progress steps for demo
  useEffect(() => {
    if (agentStatus === 'running') {
      setProgressSteps([
        { id: '1', title: 'Initializing', description: 'Setting up crawling environment', status: 'completed', duration: 1200 },
        { id: '2', title: 'Loading Page', description: 'Navigating to target website', status: 'completed', duration: 2300 },
        { id: '3', title: 'Extracting Data', description: 'Scraping content from page', status: 'running', duration: null },
        { id: '4', title: 'Processing', description: 'Analyzing extracted information', status: 'pending', duration: null },
        { id: '5', title: 'Finalizing', description: 'Saving results and cleanup', status: 'pending', duration: null }
      ]);
      setCrawlingSteps([
        { id: '1', title: 'Page Load', description: 'Loading target webpage', status: 'completed', url: 'https://example.com' },
        { id: '2', title: 'Element Detection', description: 'Finding data elements', status: 'running', url: 'https://example.com' },
        { id: '3', title: 'Data Extraction', description: 'Extracting content', status: 'pending', url: 'https://example.com' }
      ]);
      setShowProgressMonitor(true);
      setIsCrawlingActive(true);
    }
  }, [agentStatus]);

  const handleDownload = async (file: ArtifactFile) => {
    try {
      if (file.downloadUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = file.downloadUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback: open in new tab
        window.open(file.url || '#', '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async (file: ArtifactFile) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: file.name,
          text: file.preview || `Sharing ${file.name}`,
          url: file.url || window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        const shareText = `${file.name}\n${file.preview || ''}\n${file.url || window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCopy = async (file: ArtifactFile) => {
    try {
      const textToCopy = file.content || file.preview || file.name;
      await navigator.clipboard.writeText(textToCopy);
      // You could show a toast notification here
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-xl border-l"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="font-semibold text-gray-900">Helium's Brain</h2>
                <p className="text-sm text-gray-600">All artifacts in one place</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 flex flex-col h-full">
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
                  <TabsTrigger value="artifacts" className="flex items-center space-x-2">
                    <Folder className="h-4 w-4" />
                    <span>Artifacts</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <span>Live Preview</span>
                  </TabsTrigger>
                  <TabsTrigger value="todos" className="flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4" />
                    <span>Tasks</span>
                  </TabsTrigger>
                </TabsList>

                {/* Artifacts Tab */}
                <TabsContent value="artifacts" className="flex-1 overflow-hidden m-4 mt-2">
                  <div className="h-full overflow-y-auto space-y-3">
                    {artifacts.map((file) => (
                      <motion.div
                        key={file.id}
                        className="group relative bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getFileIcon(file.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{file.name}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{file.preview}</p>
                            {file.size && (
                              <p className="text-xs text-gray-500 mt-2">{file.size}</p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons - Show on Hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDownload(file)}
                              title="Download"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleShare(file)}
                              title="Share"
                            >
                              <Share2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleCopy(file)}
                              title="Copy"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* File Type Badge */}
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {file.type}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}

                    {artifacts.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Folder className="h-12 w-12 mb-4 text-gray-400" />
                        <p className="text-center">No artifacts yet</p>
                        <p className="text-sm text-center mt-1">Files will appear here as they are created</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Live Preview Tab */}
                <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
                  <LiveRemoteComputer
                    isActive={isCrawlingActive}
                    currentUrl="https://example.com"
                    status={isCrawlingActive ? 'crawling' : 'idle'}
                    progress={currentProgressStep * 20}
                    onPause={() => setIsCrawlingActive(false)}
                    onResume={() => setIsCrawlingActive(true)}
                    onStop={() => {
                      setIsCrawlingActive(false);
                      setCurrentProgressStep(0);
                    }}
                    onRestart={() => {
                      setIsCrawlingActive(true);
                      setCurrentProgressStep(0);
                    }}
                    className="h-full"
                  />
                </TabsContent>

                {/* To-Do List Tab */}
                <TabsContent value="todos" className="flex-1 overflow-hidden m-4 mt-2">
                  <EnhancedTodoList
                    items={todoItems}
                    onItemsChange={setTodoItems}
                    className="h-full"
                    showCategories={true}
                    showFilters={true}
                    showStats={true}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Progress Monitor */}
      <BottomProgressMonitor
        isVisible={showProgressMonitor}
        isActive={isCrawlingActive}
        steps={progressSteps}
        currentStepIndex={currentProgressStep}
        onStepChange={setCurrentProgressStep}
        onPlay={() => setIsProgressPaused(false)}
        onPause={() => setIsProgressPaused(true)}
        onStop={() => {
          setShowProgressMonitor(false);
          setIsCrawlingActive(false);
        }}
        onClose={() => setShowProgressMonitor(false)}
        isPaused={isProgressPaused}
        isMinimized={false}
        onToggleMinimize={() => {}}
        autoProgress={true}
        playbackSpeed={1}
        onSpeedChange={() => {}}
      />
    </>
  );
};

export default EnhancedToolCallSidePanel;
    assistantContent?: string,
    toolContent?: string,
  ) => React.ReactNode;
  renderToolResult?: (
    toolContent?: string,
    isSuccess?: boolean,
  ) => React.ReactNode;
  isLoading?: boolean;
  agentName?: string;
  onFileClick?: (filePath: string) => void;
  inlineMode?: boolean;
}

interface ProcessStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  details?: string;
  subSteps?: ProcessStep[];
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
  progress?: number;
  dependencies?: string[];
}

interface ToolCallSnapshot {
  id: string;
  toolCall: ToolCallInput;
  index: number;
  timestamp: number;
  artifactType: string;
  processSteps: ProcessStep[];
  taskItems: TaskItem[];
}

interface ArtifactTab {
  id: string;
  name: string;
  type: 'image' | 'webpage' | 'document' | 'visualization' | 'playbook' | 'other';
  icon: React.ComponentType<any>;
  color: string;
  isCompleted: boolean;
  isActive: boolean;
  progress: number;
  estimatedTime?: string;
}

// Enhanced artifact type mapping
const getArtifactType = (toolName: string): ArtifactTab['type'] => {
  const name = toolName.toLowerCase();
  if (name.includes('image') || name.includes('generate') || name.includes('media')) return 'image';
  if (name.includes('browser') || name.includes('web') || name.includes('deploy')) return 'webpage';
  if (name.includes('file') || name.includes('write') || name.includes('document')) return 'document';
  if (name.includes('chart') || name.includes('plot') || name.includes('data')) return 'visualization';
  if (name.includes('plan') || name.includes('guide') || name.includes('playbook')) return 'playbook';
  return 'other';
};

const getArtifactIcon = (type: ArtifactTab['type']) => {
  switch (type) {
    case 'image': return Image;
    case 'webpage': return Globe;
    case 'document': return FileText;
    case 'visualization': return BarChart3;
    case 'playbook': return BookOpen;
    default: return Plus;
  }
};

const getArtifactColor = (type: ArtifactTab['type']) => {
  switch (type) {
    case 'image': return 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/10 dark:text-orange-400 dark:border-orange-800';
    case 'webpage': return 'bg-gradient-to-r from-pink-100 to-pink-50 text-pink-700 border-pink-200 dark:from-pink-900/20 dark:to-pink-800/10 dark:text-pink-400 dark:border-pink-800';
    case 'document': return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/10 dark:text-blue-400 dark:border-blue-800';
    case 'visualization': return 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/10 dark:text-purple-400 dark:border-purple-800';
    case 'playbook': return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200 dark:from-green-900/20 dark:to-green-800/10 dark:text-green-400 dark:border-green-800';
    default: return 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200 dark:from-gray-900/20 dark:to-gray-800/10 dark:text-gray-400 dark:border-gray-800';
  }
};

const getStatusIcon = (status: ProcessStep['status']) => {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'running': return Activity;
    case 'error': return AlertCircle;
    default: return Clock;
  }
};

const getStatusColor = (status: ProcessStep['status']) => {
  switch (status) {
    case 'completed': return 'text-green-600 dark:text-green-400';
    case 'running': return 'text-blue-600 dark:text-blue-400';
    case 'error': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
};

const getPriorityColor = (priority: TaskItem['priority']) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
    default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getTaskStatusIcon = (status: TaskItem['status']) => {
  switch (status) {
    case 'completed': return CheckSquare;
    case 'in-progress': return Activity;
    case 'blocked': return AlertCircle;
    default: return Square;
  }
};

// Mock data generators for demonstration
const generateProcessSteps = (toolName: string): ProcessStep[] => {
  const baseSteps: ProcessStep[] = [
    {
      id: '1',
      name: 'Initialize Tool',
      status: 'completed',
      startTime: new Date(Date.now() - 5000),
      endTime: new Date(Date.now() - 4500),
      duration: 500,
      details: `Setting up ${toolName} environment`
    },
    {
      id: '2',
      name: 'Process Input',
      status: 'completed',
      startTime: new Date(Date.now() - 4500),
      endTime: new Date(Date.now() - 3000),
      duration: 1500,
      details: 'Analyzing and validating input parameters'
    },
    {
      id: '3',
      name: 'Execute Operation',
      status: 'running',
      startTime: new Date(Date.now() - 3000),
      details: 'Performing main operation'
    },
    {
      id: '4',
      name: 'Generate Output',
      status: 'pending',
      details: 'Formatting and preparing results'
    },
    {
      id: '5',
      name: 'Finalize',
      status: 'pending',
      details: 'Cleanup and validation'
    }
  ];

  return baseSteps;
};

const generateTaskItems = (toolName: string): TaskItem[] => {
  const baseTasks: TaskItem[] = [
    {
      id: '1',
      title: `Configure ${toolName} parameters`,
      description: 'Set up initial configuration and validate inputs',
      status: 'completed',
      priority: 'high',
      progress: 100,
      tags: ['setup', 'configuration']
    },
    {
      id: '2',
      title: 'Process data inputs',
      description: 'Analyze and transform input data for processing',
      status: 'completed',
      priority: 'high',
      progress: 100,
      tags: ['data', 'processing']
    },
    {
      id: '3',
      title: 'Execute main operation',
      description: 'Perform the primary tool operation',
      status: 'in-progress',
      priority: 'critical',
      progress: 65,
      tags: ['execution', 'core']
    },
    {
      id: '4',
      title: 'Validate results',
      description: 'Check output quality and accuracy',
      status: 'todo',
      priority: 'medium',
      progress: 0,
      tags: ['validation', 'quality']
    },
    {
      id: '5',
      title: 'Generate final output',
      description: 'Format and prepare final deliverables',
      status: 'todo',
      priority: 'high',
      progress: 0,
      tags: ['output', 'formatting']
    }
  ];

  return baseTasks;
};

export function EnhancedToolCallSidePanel({
  isOpen,
  onClose,
  toolCalls,
  currentIndex,
  onNavigate,
  messages,
  agentStatus,
  project,
  isLoading = false,
  externalNavigateToIndex,
  agentName,
  onFileClick,
  inlineMode,
}: ToolCallSidePanelProps) {
  const [dots, setDots] = React.useState('');
  const [internalIndex, setInternalIndex] = React.useState(0);
  const [navigationMode, setNavigationMode] = React.useState<'live' | 'manual'>('live');
  const [toolCallSnapshots, setToolCallSnapshots] = React.useState<ToolCallSnapshot[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = React.useState<string | null>(null);
  const [showReplayOptions, setShowReplayOptions] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('artifacts');
  const [processMonitorExpanded, setProcessMonitorExpanded] = React.useState(true);

  const isMobile = useIsMobile();

  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);

  // Enhanced artifact tabs with progress tracking
  const artifactTabs: ArtifactTab[] = React.useMemo(() => {
    return toolCallSnapshots.map((snapshot, index) => {
      const toolName = getUserFriendlyToolName(snapshot.toolCall.assistantCall.name || 'Tool');
      const type = getArtifactType(toolName);
      const isCompleted = snapshot.toolCall.toolResult?.content && snapshot.toolCall.toolResult.content !== 'STREAMING';
      const isStreaming = snapshot.toolCall.toolResult?.content === 'STREAMING';
      
      // Calculate progress based on process steps
      const completedSteps = snapshot.processSteps.filter(step => step.status === 'completed').length;
      const totalSteps = snapshot.processSteps.length;
      const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
      
      return {
        id: snapshot.id,
        name: toolName,
        type,
        icon: getArtifactIcon(type),
        color: getArtifactColor(type),
        isCompleted,
        isActive: selectedArtifactId === snapshot.id || (selectedArtifactId === null && index === internalIndex),
        progress: isCompleted ? 100 : (isStreaming ? progress : 0),
        estimatedTime: isCompleted ? 'Completed' : (isStreaming ? 'Processing...' : 'Pending')
      };
    });
  }, [toolCallSnapshots, internalIndex, selectedArtifactId]);

  // Update snapshots with enhanced data
  React.useEffect(() => {
    const newSnapshots = toolCalls.map((toolCall, index) => {
      const toolName = getUserFriendlyToolName(toolCall.assistantCall.name || 'Tool');
      return {
        id: `${index}-${toolCall.assistantCall.timestamp || Date.now()}`,
        toolCall,
        index,
        timestamp: Date.now(),
        artifactType: getArtifactType(toolName),
        processSteps: generateProcessSteps(toolName),
        taskItems: generateTaskItems(toolName)
      };
    });

    const hadSnapshots = toolCallSnapshots.length > 0;
    const hasNewSnapshots = newSnapshots.length > toolCallSnapshots.length;
    setToolCallSnapshots(newSnapshots);

    if (!isInitialized && newSnapshots.length > 0) {
      const completedCount = newSnapshots.filter(s =>
        s.toolCall.toolResult?.content &&
        s.toolCall.toolResult.content !== 'STREAMING'
      ).length;

      if (completedCount > 0) {
        let lastCompletedIndex = -1;
        for (let i = newSnapshots.length - 1; i >= 0; i--) {
          const snapshot = newSnapshots[i];
          if (snapshot.toolCall.toolResult?.content &&
            snapshot.toolCall.toolResult.content !== 'STREAMING') {
            lastCompletedIndex = i;
            break;
          }
        }
        setInternalIndex(Math.max(0, lastCompletedIndex));
        setSelectedArtifactId(newSnapshots[Math.max(0, lastCompletedIndex)]?.id || null);
      } else {
        setInternalIndex(Math.max(0, newSnapshots.length - 1));
        setSelectedArtifactId(newSnapshots[Math.max(0, newSnapshots.length - 1)]?.id || null);
      }
      setIsInitialized(true);
    }
  }, [toolCalls, toolCallSnapshots.length, isInitialized]);

  // Animated dots for loading states
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const currentSnapshot = toolCallSnapshots[internalIndex];
  const currentArtifact = artifactTabs.find(tab => tab.isActive);

  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    if (artifactTabs.length === 0) return 0;
    const totalProgress = artifactTabs.reduce((sum, tab) => sum + tab.progress, 0);
    return totalProgress / artifactTabs.length;
  }, [artifactTabs]);

  const handleArtifactSelect = (artifactId: string) => {
    const snapshot = toolCallSnapshots.find(s => s.id === artifactId);
    if (snapshot) {
      setSelectedArtifactId(artifactId);
      setInternalIndex(snapshot.index);
      setNavigationMode('manual');
    }
  };

  const handleReplaySession = () => {
    setNavigationMode('live');
    setInternalIndex(0);
    setSelectedArtifactId(toolCallSnapshots[0]?.id || null);
    setShowReplayOptions(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex flex-col bg-background border-l border-border shadow-2xl",
        isMobile ? "w-full" : "w-[600px]"
      )}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Helium's Brain</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {agentStatus === 'running' ? (
              <><Activity className="h-3 w-3 mr-1" />Active</>
            ) : (
              <><CheckCircle className="h-3 w-3 mr-1" />Ready</>
            )}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplayOptions(!showReplayOptions)}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="p-4 border-b border-border bg-muted/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{artifactTabs.filter(tab => tab.isCompleted).length} of {artifactTabs.length} completed</span>
          <span>{artifactTabs.filter(tab => tab.progress > 0 && !tab.isCompleted).length} in progress</span>
        </div>
      </div>

      {/* Enhanced Artifact Navigation */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            All Artifacts in One View
          </h3>
          <Badge variant="secondary" className="text-xs">
            {artifactTabs.length} items
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {artifactTabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleArtifactSelect(tab.id)}
                className={cn(
                  "relative flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 hover:shadow-md",
                  tab.color,
                  tab.isActive && "ring-2 ring-primary ring-offset-2 shadow-lg transform scale-105"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{tab.name}</span>
                {tab.isCompleted && (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                )}
                {tab.progress > 0 && !tab.isCompleted && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
                    <div 
                      className="h-full bg-current transition-all duration-300"
                      style={{ width: `${tab.progress}%` }}
                    />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Content Area with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="artifacts" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              Artifacts
            </TabsTrigger>
            <TabsTrigger value="process" className="text-xs">
              <Monitor className="h-3 w-3 mr-1" />
              Process
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">
              <List className="h-3 w-3 mr-1" />
              Tasks
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="artifacts" className="h-full m-0 p-4">
              {currentSnapshot && (
                <div className="h-full overflow-auto">
                  <ToolView
                    toolCall={currentSnapshot.toolCall}
                    messages={messages}
                    onFileClick={onFileClick}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="process" className="h-full m-0 p-4">
              <div className="space-y-4 h-full overflow-auto">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Process Monitor
                      <Badge variant="outline" className="ml-auto text-xs">
                        Real-time
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentSnapshot?.processSteps.map((step, index) => {
                      const StatusIcon = getStatusIcon(step.status);
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/20"
                        >
                          <StatusIcon className={cn("h-4 w-4 mt-0.5", getStatusColor(step.status))} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{step.name}</p>
                              {step.duration && (
                                <Badge variant="secondary" className="text-xs">
                                  {step.duration}ms
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{step.details}</p>
                            {step.status === 'running' && (
                              <div className="mt-2">
                                <Progress value={65} className="h-1" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Gauge className="h-4 w-4 mr-2" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted/20">
                        <div className="text-lg font-bold text-green-600">2.3s</div>
                        <div className="text-xs text-muted-foreground">Avg Response</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/20">
                        <div className="text-lg font-bold text-blue-600">98%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/20">
                        <div className="text-lg font-bold text-purple-600">45MB</div>
                        <div className="text-xs text-muted-foreground">Memory Usage</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/20">
                        <div className="text-lg font-bold text-orange-600">12</div>
                        <div className="text-xs text-muted-foreground">Active Tools</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="h-full m-0 p-4">
              <div className="space-y-4 h-full overflow-auto">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Task Management
                      <Badge variant="outline" className="ml-auto text-xs">
                        {currentSnapshot?.taskItems.filter(task => task.status === 'completed').length || 0} / {currentSnapshot?.taskItems.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentSnapshot?.taskItems.map((task, index) => {
                      const StatusIcon = getTaskStatusIcon(task.status);
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <StatusIcon className={cn(
                              "h-4 w-4 mt-0.5",
                              task.status === 'completed' ? 'text-green-600' :
                              task.status === 'in-progress' ? 'text-blue-600' :
                              task.status === 'blocked' ? 'text-red-600' : 'text-gray-400'
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{task.title}</p>
                                <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                                  {task.priority}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                              )}
                              {task.progress !== undefined && task.progress > 0 && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{task.progress}%</span>
                                  </div>
                                  <Progress value={task.progress} className="h-1" />
                                </div>
                              )}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {task.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Task Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Task Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 rounded bg-green-50 dark:bg-green-900/20">
                        <div className="text-sm font-bold text-green-600">
                          {currentSnapshot?.taskItems.filter(t => t.status === 'completed').length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                        <div className="text-sm font-bold text-blue-600">
                          {currentSnapshot?.taskItems.filter(t => t.status === 'in-progress').length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">In Progress</div>
                      </div>
                      <div className="text-center p-2 rounded bg-gray-50 dark:bg-gray-900/20">
                        <div className="text-sm font-bold text-gray-600">
                          {currentSnapshot?.taskItems.filter(t => t.status === 'todo').length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">To Do</div>
                      </div>
                      <div className="text-center p-2 rounded bg-red-50 dark:bg-red-900/20">
                        <div className="text-sm font-bold text-red-600">
                          {currentSnapshot?.taskItems.filter(t => t.status === 'blocked').length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Blocked</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Enhanced Footer */}
      <div className="p-4 border-t border-border bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNavigationMode(navigationMode === 'live' ? 'manual' : 'live')}
              className="text-xs"
            >
              {navigationMode === 'live' ? (
                <><PlayCircle className="h-3 w-3 mr-1" />Live</>
              ) : (
                <><PauseCircle className="h-3 w-3 mr-1" />Manual</>
              )}
            </Button>
            {showReplayOptions && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplaySession}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Watch Again
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {currentArtifact?.estimatedTime || 'Ready'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

