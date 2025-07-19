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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolView } from './tool-views/wrapper';
import { motion, AnimatePresence } from 'framer-motion';

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
  renderAssistantMessage?: (
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
  type: 'image' | 'webpage' | 'document' | 'visualization' | 'playbook' | 'spreadsheet' | 'presentation' | 'pdf' | 'video' | 'audio' | 'archive' | 'database' | 'other';
  icon: React.ComponentType<any>;
  color: string;
  isCompleted: boolean;
  isActive: boolean;
  progress: number;
  estimatedTime?: string;
}

// Enhanced artifact type mapping with file type detection
const getArtifactType = (toolName: string, content?: string): ArtifactTab['type'] => {
  const name = toolName.toLowerCase();
  const contentLower = content?.toLowerCase() || '';
  
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
  
  return 'other';
};

const getArtifactIcon = (type: ArtifactTab['type']) => {
  switch (type) {
    case 'image': return Image;
    case 'webpage': return Globe;
    case 'document': return FileText;
    case 'visualization': return BarChart3;
    case 'playbook': return BookOpen;
    case 'spreadsheet': return FileSpreadsheet;
    case 'presentation': return Presentation;
    case 'pdf': return FileImage;
    case 'video': return Video;
    case 'audio': return Music;
    case 'archive': return Archive;
    case 'database': return Database;
    default: return File;
  }
};

const getArtifactColor = (type: ArtifactTab['type']) => {
  switch (type) {
    case 'image': return 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/10 dark:text-orange-400 dark:border-orange-800';
    case 'webpage': return 'bg-gradient-to-r from-pink-100 to-pink-50 text-pink-700 border-pink-200 dark:from-pink-900/20 dark:to-pink-800/10 dark:text-pink-400 dark:border-pink-800';
    case 'document': return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/10 dark:text-blue-400 dark:border-blue-800';
    case 'visualization': return 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/10 dark:text-purple-400 dark:border-purple-800';
    case 'playbook': return 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200 dark:from-green-900/20 dark:to-green-800/10 dark:text-green-400 dark:border-green-800';
    case 'spreadsheet': return 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/10 dark:text-emerald-400 dark:border-emerald-800';
    case 'presentation': return 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 dark:from-red-900/20 dark:to-red-800/10 dark:text-red-400 dark:border-red-800';
    case 'pdf': return 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border-rose-200 dark:from-rose-900/20 dark:to-rose-800/10 dark:text-rose-400 dark:border-rose-800';
    case 'video': return 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 border-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/10 dark:text-indigo-400 dark:border-indigo-800';
    case 'audio': return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/10 dark:text-yellow-400 dark:border-yellow-800';
    case 'archive': return 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200 dark:from-slate-900/20 dark:to-slate-800/10 dark:text-slate-400 dark:border-slate-800';
    case 'database': return 'bg-gradient-to-r from-cyan-100 to-cyan-50 text-cyan-700 border-cyan-200 dark:from-cyan-900/20 dark:to-cyan-800/10 dark:text-cyan-400 dark:border-cyan-800';
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

  // Download and Share Functions
  const downloadArtifact = React.useCallback(async (snapshot: ToolCallSnapshot) => {
    try {
      const toolName = getUserFriendlyToolName(snapshot.toolCall.assistantCall.name || 'Tool');
      const content = snapshot.toolCall.toolResult?.content || '';
      const timestamp = new Date().toISOString().split('T')[0];
      
      let filename = `${toolName.replace(/\s+/g, '_')}_${timestamp}`;
      let mimeType = 'text/plain';
      let downloadContent = content;

      // Determine file type and format content
      if (toolName.toLowerCase().includes('image') || snapshot.artifactType === 'image') {
        // For images, try to extract base64 or URL
        if (content.includes('data:image') || content.includes('base64')) {
          filename += '.png';
          mimeType = 'image/png';
        } else if (content.includes('http')) {
          // Download from URL
          try {
            const response = await fetch(content);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename + '.png';
            a.click();
            window.URL.revokeObjectURL(url);
            return;
          } catch (e) {
            console.error('Failed to download image:', e);
          }
        }
      } else if (toolName.toLowerCase().includes('web') || snapshot.artifactType === 'webpage') {
        filename += '.html';
        mimeType = 'text/html';
        downloadContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${toolName} - Generated by Helium</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .content { white-space: pre-wrap; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${toolName}</h1>
        <p>Generated by Helium's Brain on ${new Date().toLocaleDateString()}</p>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
        <p>Created with Helium AI Assistant</p>
    </div>
</body>
</html>`;
      } else if (toolName.toLowerCase().includes('document') || snapshot.artifactType === 'document') {
        filename += '.md';
        mimeType = 'text/markdown';
        downloadContent = `# ${toolName}

*Generated by Helium's Brain on ${new Date().toLocaleDateString()}*

---

${content}

---

*Created with Helium AI Assistant*`;
      } else if (toolName.toLowerCase().includes('data') || snapshot.artifactType === 'visualization') {
        filename += '.json';
        mimeType = 'application/json';
        try {
          downloadContent = JSON.stringify({
            tool: toolName,
            timestamp: new Date().toISOString(),
            data: content,
            metadata: {
              generator: "Helium AI Assistant",
              type: snapshot.artifactType,
              processSteps: snapshot.processSteps.length,
              taskItems: snapshot.taskItems.length
            }
          }, null, 2);
        } catch (e) {
          downloadContent = content;
        }
      } else {
        filename += '.txt';
        downloadContent = `${toolName}
Generated by Helium's Brain on ${new Date().toLocaleDateString()}

${content}

---
Created with Helium AI Assistant`;
      }

      // Create and download file
      const blob = new Blob([downloadContent], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(snapshot.toolCall.toolResult?.content || '');
        alert('Download failed, but content has been copied to clipboard');
      } catch (clipboardError) {
        alert('Download failed and clipboard access denied');
      }
    }
  }, []);

  const shareArtifact = React.useCallback(async (snapshot: ToolCallSnapshot) => {
    const toolName = getUserFriendlyToolName(snapshot.toolCall.assistantCall.name || 'Tool');
    const content = snapshot.toolCall.toolResult?.content || '';
    
    const shareData = {
      title: `${toolName} - Generated by Helium`,
      text: `Check out this ${toolName} created by Helium's Brain:\n\n${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Final fallback: copy content to clipboard
      try {
        await navigator.clipboard.writeText(content);
        alert('Content copied to clipboard for sharing');
      } catch (clipboardError) {
        alert('Share failed and clipboard access denied');
      }
    }
  }, []);

  const copyToClipboard = React.useCallback(async (snapshot: ToolCallSnapshot) => {
    try {
      const content = snapshot.toolCall.toolResult?.content || '';
      await navigator.clipboard.writeText(content);
      alert('Content copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy to clipboard');
    }
  }, []);

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

      {/* Enhanced Progress Overview with Skip Functionality */}
      <div className="p-4 border-b border-border bg-muted/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium flex items-center">
            <Navigation className="h-4 w-4 mr-2" />
            Live Progress Monitor
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
        </div>
        
        {/* Main Progress Bar */}
        <div className="relative mb-3">
          <Progress value={overallProgress} className="h-3" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white drop-shadow-sm">
              Step {internalIndex + 1} of {artifactTabs.length}
            </span>
          </div>
        </div>

        {/* Progress Controls */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (internalIndex > 0) {
                  const newIndex = internalIndex - 1;
                  setInternalIndex(newIndex);
                  onNavigate(newIndex);
                  setSelectedArtifactId(toolCallSnapshots[newIndex]?.id || null);
                }
              }}
              disabled={internalIndex === 0}
              className="h-7 w-7 p-0"
              title="Previous step"
            >
              <StepBack className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (internalIndex < artifactTabs.length - 1) {
                  const newIndex = internalIndex + 1;
                  setInternalIndex(newIndex);
                  onNavigate(newIndex);
                  setSelectedArtifactId(toolCallSnapshots[newIndex]?.id || null);
                }
              }}
              disabled={internalIndex >= artifactTabs.length - 1}
              className="h-7 w-7 p-0"
              title="Next step"
            >
              <StepForward className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newIndex = Math.min(internalIndex + 3, artifactTabs.length - 1);
                setInternalIndex(newIndex);
                onNavigate(newIndex);
                setSelectedArtifactId(toolCallSnapshots[newIndex]?.id || null);
              }}
              disabled={internalIndex >= artifactTabs.length - 1}
              className="h-7 w-7 p-0"
              title="Skip forward"
            >
              <SkipForward className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newIndex = artifactTabs.length - 1;
                setInternalIndex(newIndex);
                onNavigate(newIndex);
                setSelectedArtifactId(toolCallSnapshots[newIndex]?.id || null);
              }}
              disabled={internalIndex >= artifactTabs.length - 1}
              className="h-7 w-7 p-0"
              title="Jump to end"
            >
              <FastForward className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Badge 
              variant={agentStatus === 'running' ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {agentStatus === 'running' ? (
                <><Activity className="h-3 w-3 mr-1" />Live</>
              ) : (
                <><CheckCircle className="h-3 w-3 mr-1" />Complete</>
              )}
            </Badge>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{artifactTabs.filter(tab => tab.isCompleted).length} completed</span>
          <span className="flex items-center">
            <Timer className="h-3 w-3 mr-1" />
            {currentArtifact?.estimatedTime || 'Ready'}
          </span>
          <span>{artifactTabs.filter(tab => tab.progress > 0 && !tab.isCompleted).length} in progress</span>
        </div>

        {/* Interactive Progress Slider */}
        <div className="mt-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Jump to:</span>
            <Slider
              value={[internalIndex]}
              onValueChange={(value) => {
                const newIndex = value[0];
                setInternalIndex(newIndex);
                onNavigate(newIndex);
                setSelectedArtifactId(toolCallSnapshots[newIndex]?.id || null);
              }}
              max={Math.max(0, artifactTabs.length - 1)}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground min-w-[3ch]">
              {internalIndex + 1}
            </span>
          </div>
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
                <div className="h-full overflow-auto space-y-4">
                  {/* Remote Computer Preview for Web Operations */}
                  {(currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('browser') || 
                    currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('web') ||
                    currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('crawl') ||
                    currentSnapshot.toolCall.assistantCall.name?.toLowerCase().includes('scrape')) && (
                    <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center">
                          <Computer className="h-4 w-4 mr-2 text-blue-600" />
                          Remote Computer Preview
                          <Badge variant="outline" className="ml-auto text-xs">
                            {currentSnapshot.toolCall.toolResult?.content === 'STREAMING' ? 'Live' : 'Completed'}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative bg-gray-900 rounded-lg p-4 min-h-[200px]">
                          {/* Browser Window Mockup */}
                          <div className="bg-gray-800 rounded-t-lg p-2 mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              </div>
                              <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-300">
                                {currentSnapshot.toolCall.assistantCall.content?.match(/https?:\/\/[^\s]+/)?.[0] || 'https://example.com'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Browser Content */}
                          <div className="bg-white rounded-b-lg p-4 min-h-[150px] relative overflow-hidden">
                            {currentSnapshot.toolCall.toolResult?.content === 'STREAMING' ? (
                              <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                  <p className="text-sm text-gray-600">Navigating and extracting data...</p>
                                  <div className="mt-2 flex items-center justify-center space-x-2">
                                    <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                                    <span className="text-xs text-green-600">Connected</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                  <div className="h-16 bg-blue-100 rounded"></div>
                                  <div className="h-16 bg-green-100 rounded"></div>
                                  <div className="h-16 bg-purple-100 rounded"></div>
                                </div>
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Extracted
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Status Indicator */}
                          <div className="absolute bottom-2 left-2 flex items-center space-x-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              currentSnapshot.toolCall.toolResult?.content === 'STREAMING' 
                                ? "bg-green-500 animate-pulse" 
                                : "bg-gray-400"
                            )}></div>
                            <span className="text-xs text-gray-400">
                              {currentSnapshot.toolCall.toolResult?.content === 'STREAMING' 
                                ? "Processing..." 
                                : "Completed"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Main Artifact Content */}
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
      )}
    </AnimatePresence>
  );
}

