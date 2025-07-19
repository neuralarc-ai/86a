'use client';

import { Project } from '@/lib/api';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiMessageType } from '@/components/thread/types';
import { 
  CircleDashed, X, ChevronLeft, ChevronRight, Computer, Radio, Maximize2, 
  Minimize2, Play, RotateCcw, FileText, Image, Globe, BarChart3, BookOpen, 
  Plus, CheckCircle, Clock, AlertCircle, PlayCircle, PauseCircle, 
  Activity, Zap, Target, TrendingUp, Brain, Layers, Settings, Monitor,
  List, CheckSquare, Square, ArrowRight, Timer, Gauge, Download, Share2,
  Copy, ExternalLink, Save, Mail, MessageSquare, Link, SkipForward,
  FastForward, Rewind, StepForward, StepBack, Navigation, FileSpreadsheet,
  FileImage, Presentation, File, Database, Archive, Video, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolView } from './tool-views/wrapper/ToolViewRegistry';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToolCallInput {
  assistantCall: {
    id: string;
    name?: string;
    content?: string;
    timestamp?: number;
  };
  toolResult?: {
    content?: string;
    error?: string;
  };
}

interface ProcessStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress: number;
  duration?: number;
  estimatedTime?: string;
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

// Enhanced artifact type mapping with file type detection
const getArtifactType = (toolName: string, content?: string | any): ArtifactTab['type'] => {
  const name = toolName?.toLowerCase() || '';
  
  // Safely handle content - ensure it's a string before calling toLowerCase
  let contentLower = '';
  if (typeof content === 'string') {
    contentLower = content.toLowerCase();
  } else if (content && typeof content === 'object') {
    // If content is an object, try to stringify it
    try {
      contentLower = JSON.stringify(content).toLowerCase();
    } catch (e) {
      contentLower = '';
    }
  }
  
  // File type detection based on tool name and content
  if (name.includes('csv') || name.includes('spreadsheet') || contentLower.includes('.csv') || contentLower.includes('comma-separated')) return 'spreadsheet';
  if (name.includes('excel') || name.includes('xlsx') || name.includes('xls') || contentLower.includes('.xlsx') || contentLower.includes('.xls')) return 'spreadsheet';
  if (name.includes('powerpoint') || name.includes('pptx') || name.includes('ppt') || name.includes('presentation') || contentLower.includes('.pptx') || contentLower.includes('.ppt')) return 'presentation';
  if (name.includes('pdf') || contentLower.includes('.pdf') || contentLower.includes('portable document')) return 'pdf';
  if (name.includes('video') || name.includes('mp4') || name.includes('avi') || name.includes('mov') || contentLower.includes('.mp4') || contentLower.includes('.avi')) return 'video';
  if (name.includes('audio') || name.includes('mp3') || name.includes('wav') || name.includes('sound') || contentLower.includes('.mp3') || contentLower.includes('.wav')) return 'audio';
  if (name.includes('zip') || name.includes('archive') || name.includes('tar') || contentLower.includes('.zip') || contentLower.includes('.tar')) return 'archive';
  if (name.includes('database') || name.includes('sql') || name.includes('db') || contentLower.includes('.sql') || contentLower.includes('database')) return 'database';
  
  // Original detection logic
  if (name.includes('image') || name.includes('generate') || name.includes('media') || name.includes('png') || name.includes('jpg') || name.includes('jpeg')) return 'image';
  if (name.includes('browser') || name.includes('web') || name.includes('deploy') || name.includes('crawl') || name.includes('scrape')) return 'webpage';
  if (name.includes('file') || name.includes('write') || name.includes('document') || name.includes('text') || name.includes('doc')) return 'document';
  if (name.includes('chart') || name.includes('plot') || name.includes('data') || name.includes('graph') || name.includes('visualization')) return 'visualization';
  if (name.includes('plan') || name.includes('guide') || name.includes('playbook') || name.includes('strategy')) return 'playbook';
  
  return 'document';
};

interface ArtifactTab {
  id: string;
  title: string;
  type: 'document' | 'image' | 'webpage' | 'visualization' | 'playbook' | 'spreadsheet' | 'presentation' | 'pdf' | 'video' | 'audio' | 'archive' | 'database';
  isCompleted: boolean;
  isStreaming: boolean;
  progress: number;
  estimatedTime?: string;
}

interface ToolCallSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  toolCalls: ToolCallInput[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  messages?: ApiMessageType[];
  agentStatus?: 'idle' | 'running' | 'completed' | 'error';
  project?: Project;
  isLoading?: boolean;
  externalNavigateToIndex?: number;
  agentName?: string;
  onFileClick?: (path: string, filePathList?: string[]) => void;
  inlineMode?: boolean;
}

export function ToolCallSidePanel({
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

  const isMobile = useIsMobile();

  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);

  // Generate process steps for different tool types
  const generateProcessSteps = (toolName: string): ProcessStep[] => {
    const baseSteps = [
      { id: '1', name: 'Initialize', description: 'Setting up environment', status: 'completed' as const, progress: 100 },
      { id: '2', name: 'Process', description: 'Executing main operation', status: 'in-progress' as const, progress: 65 },
      { id: '3', name: 'Finalize', description: 'Completing and cleanup', status: 'pending' as const, progress: 0 }
    ];

    if (toolName.toLowerCase().includes('browser') || toolName.toLowerCase().includes('web')) {
      return [
        { id: '1', name: 'Navigate', description: 'Opening webpage', status: 'completed' as const, progress: 100, duration: 1200 },
        { id: '2', name: 'Crawl', description: 'Extracting content', status: 'in-progress' as const, progress: 75, duration: 2800 },
        { id: '3', name: 'Process', description: 'Analyzing data', status: 'pending' as const, progress: 0 },
        { id: '4', name: 'Complete', description: 'Finalizing results', status: 'pending' as const, progress: 0 }
      ];
    }

    return baseSteps;
  };

  // Generate task items for different tool types
  const generateTaskItems = (toolName: string): TaskItem[] => {
    const baseTasks = [
      {
        id: '1',
        title: 'Execute primary function',
        description: `Run ${toolName} operation`,
        status: 'in-progress' as const,
        priority: 'high' as const,
        progress: 70
      },
      {
        id: '2',
        title: 'Validate output',
        description: 'Ensure quality and accuracy',
        status: 'todo' as const,
        priority: 'medium' as const,
        progress: 0
      }
    ];

    return baseTasks;
  };

  // Enhanced artifact tabs with progress tracking
  const artifactTabs: ArtifactTab[] = React.useMemo(() => {
    return toolCallSnapshots.map((snapshot, index) => {
      const toolName = getUserFriendlyToolName(snapshot.toolCall.assistantCall.name || 'Tool');
      const content = snapshot.toolCall.toolResult?.content || snapshot.toolCall.assistantCall.content || '';
      const type = getArtifactType(toolName, content);
      const isCompleted = snapshot.toolCall.toolResult?.content && snapshot.toolCall.toolResult.content !== 'STREAMING';
      const isStreaming = snapshot.toolCall.toolResult?.content === 'STREAMING';
      
      // Calculate progress based on process steps
      const completedSteps = snapshot.processSteps.filter(step => step.status === 'completed').length;
      const totalSteps = snapshot.processSteps.length;
      const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      return {
        id: snapshot.id,
        title: toolName,
        type,
        isCompleted,
        isStreaming,
        progress,
        estimatedTime: isStreaming ? '2-3 min' : undefined
      };
    });
  }, [toolCallSnapshots]);

  // Create snapshots from tool calls
  React.useEffect(() => {
    const newSnapshots = toolCalls.map((toolCall, index) => {
      const toolName = getUserFriendlyToolName(toolCall.assistantCall.name || 'Tool');
      const content = toolCall.toolResult?.content || toolCall.assistantCall.content || '';
      
      return {
        id: `${index}-${toolCall.assistantCall.timestamp || Date.now()}`,
        toolCall,
        index,
        timestamp: Date.now(),
        artifactType: getArtifactType(toolName, content),
        processSteps: generateProcessSteps(toolName),
        taskItems: generateTaskItems(toolName)
      };
    });

    setToolCallSnapshots(newSnapshots);
    
    if (!isInitialized && newSnapshots.length > 0) {
      setSelectedArtifactId(newSnapshots[0].id);
      setIsInitialized(true);
    }
  }, [toolCalls, isInitialized]);

  // Sync with external navigation
  React.useEffect(() => {
    if (externalNavigateToIndex !== undefined && externalNavigateToIndex !== internalIndex) {
      setInternalIndex(externalNavigateToIndex);
      setSelectedArtifactId(toolCallSnapshots[externalNavigateToIndex]?.id || null);
    }
  }, [externalNavigateToIndex, internalIndex, toolCallSnapshots]);

  // Auto-advance in live mode
  React.useEffect(() => {
    if (navigationMode === 'live' && toolCallSnapshots.length > 0) {
      const latestIndex = toolCallSnapshots.length - 1;
      if (latestIndex !== internalIndex) {
        setInternalIndex(latestIndex);
        setSelectedArtifactId(toolCallSnapshots[latestIndex]?.id || null);
        onNavigate(latestIndex);
      }
    }
  }, [toolCallSnapshots.length, navigationMode, internalIndex, onNavigate]);

  // Animated dots effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const currentSnapshot = toolCallSnapshots[internalIndex];
  const currentArtifact = artifactTabs[internalIndex];

  const downloadArtifact = (snapshot: ToolCallSnapshot) => {
    const content = snapshot.toolCall.toolResult?.content || snapshot.toolCall.assistantCall.content || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact-${snapshot.index + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareArtifact = (snapshot: ToolCallSnapshot) => {
    const content = snapshot.toolCall.toolResult?.content || snapshot.toolCall.assistantCall.content || '';
    if (navigator.share) {
      navigator.share({
        title: `Artifact ${snapshot.index + 1}`,
        text: content
      });
    } else {
      navigator.clipboard.writeText(content);
    }
  };

  const copyToClipboard = (snapshot: ToolCallSnapshot) => {
    const content = snapshot.toolCall.toolResult?.content || snapshot.toolCall.assistantCall.content || '';
    navigator.clipboard.writeText(content);
  };

  const handleReplaySession = () => {
    setNavigationMode('live');
    setInternalIndex(0);
    setSelectedArtifactId(toolCallSnapshots[0]?.id || null);
    setShowReplayOptions(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94],
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
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
              {currentSnapshot && currentSnapshot.toolCall.toolResult?.content && currentSnapshot.toolCall.toolResult.content !== 'STREAMING' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadArtifact(currentSnapshot)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Download artifact"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => shareArtifact(currentSnapshot)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Share artifact"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(currentSnapshot)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplayOptions(!showReplayOptions)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
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

          {/* Navigation Controls */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNavigationMode(navigationMode === 'live' ? 'manual' : 'live')}
                  className={cn(
                    "text-xs",
                    navigationMode === 'live' ? "text-green-600" : "text-blue-600"
                  )}
                >
                  {navigationMode === 'live' ? (
                    <><Radio className="h-3 w-3 mr-1" />Live</>
                  ) : (
                    <><PlayCircle className="h-3 w-3 mr-1" />Manual</>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {artifactTabs.length} artifact{artifactTabs.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newIndex = Math.max(0, internalIndex - 1);
                    setInternalIndex(newIndex);
                    setSelectedArtifactId(toolCallSnapshots[newIndex]?.id || null);
                    onNavigate(newIndex);
                  }}
                  disabled={internalIndex <= 0}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newIndex = Math.min(artifactTabs.length - 1, internalIndex + 1);
                    setInternalIndex(newIndex);
                    setSelectedArtifactId(toolCallSnapshots[newIndex]?.id || null);
                    onNavigate(newIndex);
                  }}
                  disabled={internalIndex >= artifactTabs.length - 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Progress Slider */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-muted-foreground min-w-[3ch]">
                {internalIndex + 1}
              </span>
              <Slider
                value={[internalIndex]}
                onValueChange={([newIndex]) => {
                  setInternalIndex(newIndex);
                  setSelectedArtifactId(toolCallSnapshots[newIndex]?.id || null);
                  onNavigate(newIndex);
                }}
                max={Math.max(0, artifactTabs.length - 1)}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground min-w-[3ch]">
                {artifactTabs.length}
              </span>
            </div>
          </div>

          {/* Enhanced Content Area with Live Preview */}
          <div className="flex-1 overflow-hidden">
            {currentSnapshot && (
              <div className="h-full overflow-auto">
                {/* Live Preview for Web Operations */}
                {(currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('browser') || 
                  currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('web') ||
                  currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('crawl') ||
                  currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('scrape')) && 
                  currentSnapshot.toolCall.toolResult?.content === 'STREAMING' && (
                  <div className="h-full bg-gray-900 p-4">
                    {/* Live Screen Scraping Preview */}
                    <div className="bg-white rounded-lg h-full relative overflow-hidden">
                      {/* Browser Window Header */}
                      <div className="bg-gray-200 p-2 flex items-center gap-2 border-b">
                        <div className="flex gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 bg-white rounded px-3 py-1 text-sm text-gray-700">
                          {currentSnapshot.toolCall.assistantCall.content?.match(/https?:\/\/[^\s]+/)?.[0] || 'https://example.com'}
                        </div>
                      </div>
                      
                      {/* Live Scraping Content */}
                      <div className="p-4 h-full relative">
                        {/* Animated Mouse Cursor */}
                        <div 
                          className="absolute w-4 h-4 pointer-events-none z-50 transition-all duration-1000 ease-in-out"
                          style={{
                            left: `${20 + (Date.now() / 50) % 60}%`,
                            top: `${30 + Math.sin(Date.now() / 1000) * 20}%`,
                            transform: 'rotate(-15deg)'
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black">
                            <path d="M13.64 21.97c-.16-.3-.26-.64-.26-1.02V11.31l6.05 5.79c.75.71.75 1.91 0 2.62l-5.79 5.79c-.71.75-1.91.75-2.62 0l-5.79-5.79c-.75-.71-.75-1.91 0-2.62L11.31 10.95H2.05c-.38 0-.72-.1-1.02-.26C.4 10.5 0 9.97 0 9.36V2.64C0 1.18 1.18 0 2.64 0h6.72c.61 0 1.14.4 1.33 1.03.16.3.26.64.26 1.02v8.64l5.79-5.79c.71-.75 1.91-.75 2.62 0l5.79 5.79c.75.71.75 1.91 0 2.62l-5.79 5.79z"/>
                          </svg>
                        </div>
                        
                        {/* Simulated Page Content with Highlighting */}
                        <div className="space-y-4">
                          <div className="h-8 bg-blue-100 rounded animate-pulse"></div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="h-20 bg-gray-100 rounded relative">
                              <div 
                                className="absolute inset-0 bg-yellow-200 opacity-50 rounded transition-opacity duration-500"
                                style={{ opacity: Math.sin(Date.now() / 800) > 0 ? 0.5 : 0 }}
                              ></div>
                            </div>
                            <div className="h-20 bg-gray-100 rounded relative">
                              <div 
                                className="absolute inset-0 bg-green-200 opacity-50 rounded transition-opacity duration-700"
                                style={{ opacity: Math.sin(Date.now() / 1200) > 0 ? 0.5 : 0 }}
                              ></div>
                            </div>
                            <div className="h-20 bg-gray-100 rounded"></div>
                          </div>
                          
                          {/* Text Content with Progressive Highlighting */}
                          <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((line, index) => (
                              <div key={line} className="h-4 bg-gray-100 rounded relative overflow-hidden">
                                <div 
                                  className="absolute left-0 top-0 h-full bg-blue-200 transition-all duration-2000 ease-in-out"
                                  style={{ 
                                    width: `${Math.min(100, Math.max(0, ((Date.now() / 100) % 500) - (index * 100)))}%` 
                                  }}
                                ></div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Data Extraction Indicators */}
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="border-2 border-dashed border-blue-300 p-3 rounded">
                              <div className="text-xs text-blue-600 font-medium mb-2">Extracting Links</div>
                              <div className="space-y-1">
                                {[1, 2, 3].map(item => (
                                  <div key={item} className="h-2 bg-blue-100 rounded animate-pulse"></div>
                                ))}
                              </div>
                            </div>
                            <div className="border-2 border-dashed border-green-300 p-3 rounded">
                              <div className="text-xs text-green-600 font-medium mb-2">Extracting Text</div>
                              <div className="space-y-1">
                                {[1, 2, 3].map(item => (
                                  <div key={item} className="h-2 bg-green-100 rounded animate-pulse"></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Crawling Status Overlay */}
                        <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm">Live Crawling</span>
                          </div>
                          <div className="text-xs text-gray-300 mt-1">
                            Step {Math.floor(Date.now() / 2000) % 5 + 1} of 5
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Original Tool View for Non-Web Operations or Completed Operations */}
                {!(currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('browser') || 
                   currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('web') ||
                   currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('crawl') ||
                   currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('scrape')) ||
                 currentSnapshot.toolCall.toolResult?.content !== 'STREAMING' ? (
                  <ToolView
                    name={currentSnapshot.toolCall.assistantCall.name || 'generic-tool'}
                    assistantContent={currentSnapshot.toolCall.assistantCall.content}
                    toolContent={currentSnapshot.toolCall.toolResult?.content}
                    assistantTimestamp={currentSnapshot.toolCall.assistantCall.timestamp}
                    toolTimestamp={currentSnapshot.timestamp}
                    isSuccess={!currentSnapshot.toolCall.toolResult?.error}
                    isStreaming={currentSnapshot.toolCall.toolResult?.content === 'STREAMING'}
                  />
                ) : null}
              </div>
            )}
          </div>

          {/* Enhanced Progress Footer */}
          <div className="border-t border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <ChevronLeft className="h-3 w-3 text-muted-foreground" />
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {internalIndex + 1} / {artifactTabs.length}
                </span>
              </div>
              
              {showReplayOptions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReplaySession}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Watch Again
                </Button>
              )}
            </div>
            
            {currentArtifact && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{currentArtifact.title}</span>
                  <Badge variant={currentArtifact.isCompleted ? "default" : "secondary"} className="text-xs">
                    {currentArtifact.isCompleted ? 'Complete' : currentArtifact.isStreaming ? 'Live' : 'Processing'}
                  </Badge>
                </div>
                <Progress value={currentArtifact.progress} className="h-1" />
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">live</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentArtifact?.estimatedTime || 'Ready'}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

