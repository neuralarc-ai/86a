'use client';

import { Project } from '@/lib/api';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiMessageType } from '@/components/thread/types';
import { ManusArtifactImplementation } from './manus-artifact-implementation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolView } from './tool-views/wrapper';
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
  const [activeTab, setActiveTab] = React.useState('artifacts');
  const [processMonitorExpanded, setProcessMonitorExpanded] = React.useState(true);

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

          {/* Enhanced Content Area with Tabs */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
                <TabsTrigger value="artifacts" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Artifacts
                </TabsTrigger>
                <TabsTrigger value="live" className="text-xs">
                  <Monitor className="h-3 w-3 mr-1" />
                  Live Preview
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">
                  <List className="h-3 w-3 mr-1" />
                  Tasks
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="artifacts" className="h-full m-0 p-0">
                  {/* Manus-Style Artifact Implementation */}
                  <ManusArtifactImplementation
                    agentId={agentName || 'helium-agent'}
                    taskPlan={currentSnapshot ? {
                      goal: `Processing ${getUserFriendlyToolName(currentSnapshot.toolCall.assistantCall.name || 'Tool')}`,
                      complexity: 'medium' as const,
                      phases: currentSnapshot.processSteps.map((step, index) => ({
                        id: index + 1,
                        title: step.name,
                        description: step.description || `Execute ${step.name}`,
                        status: step.status === 'completed' ? 'completed' : 
                               step.status === 'in-progress' ? 'in_progress' : 
                               step.status === 'error' ? 'failed' : 'pending',
                        progress: step.progress || 0,
                        estimatedTime: step.duration ? `${step.duration}ms` : undefined,
                        requiredCapabilities: [currentSnapshot.toolCall.assistantCall.name || 'general'],
                        dependencies: index > 0 ? [index] : [],
                        successCriteria: [`Complete ${step.name} successfully`]
                      })),
                      currentPhase: currentSnapshot.processSteps.findIndex(step => step.status === 'in-progress') + 1 || 1,
                      status: currentSnapshot.toolCall.toolResult?.content === 'STREAMING' ? 'active' : 'completed',
                      estimatedTotalDuration: '2-5 minutes',
                      successMetrics: ['Task completion', 'Quality output', 'Performance metrics'],
                      createdAt: new Date(currentSnapshot.timestamp),
                      updatedAt: new Date()
                    } : undefined}
                    files={currentSnapshot ? [{
                      id: currentSnapshot.id,
                      name: `${getUserFriendlyToolName(currentSnapshot.toolCall.assistantCall.name || 'output')}.${currentSnapshot.artifactType === 'code' ? 'tsx' : 'txt'}`,
                      type: currentSnapshot.artifactType as any,
                      size: currentSnapshot.toolCall.toolResult?.content ? 
                            `${Math.round(currentSnapshot.toolCall.toolResult.content.length / 1024)}KB` : '0KB',
                      path: `/artifacts/${currentSnapshot.id}`,
                      content: currentSnapshot.toolCall.toolResult?.content || currentSnapshot.toolCall.assistantCall.content || '',
                      lastModified: new Date(currentSnapshot.timestamp),
                      status: currentSnapshot.toolCall.toolResult?.content === 'STREAMING' ? 'creating' : 'ready'
                    }] : []}
                    isActive={agentStatus === 'running'}
                    onPhaseAdvance={(fromPhase, toPhase) => {
                      console.log(`Phase advanced from ${fromPhase} to ${toPhase}`);
                    }}
                    onTaskComplete={() => {
                      console.log('Task completed');
                    }}
                    onInterrupt={() => {
                      console.log('Agent interrupted');
                    }}
                    className="h-full"
                  />
                </TabsContent>

                <TabsContent value="live" className="h-full m-0 p-4">
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Live preview will appear here</p>
                      <p className="text-sm mt-2">Real-time browser simulation during web operations</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="h-full m-0 p-4">
                  <div className="h-full overflow-auto space-y-4">
                    <div className="text-center text-muted-foreground">
                      <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Task management coming soon</p>
                      <p className="text-sm mt-2">Enhanced task tracking and management</p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
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

