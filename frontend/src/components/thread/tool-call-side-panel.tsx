'use client';

import { Project } from '@/lib/api';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiMessageType } from '@/components/thread/types';
import { CircleDashed, X, ChevronLeft, ChevronRight, Computer, Radio, Maximize2, Minimize2, Play, RotateCcw, FileText, Image, Globe, BarChart3, BookOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
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

interface ToolCallSnapshot {
  id: string;
  toolCall: ToolCallInput;
  index: number;
  timestamp: number;
  artifactType: string;
}

interface ArtifactTab {
  id: string;
  name: string;
  type: 'image' | 'webpage' | 'document' | 'visualization' | 'playbook' | 'other';
  icon: React.ComponentType<any>;
  color: string;
  isCompleted: boolean;
  isActive: boolean;
}

const FLOATING_LAYOUT_ID = 'tool-panel-float';
const CONTENT_LAYOUT_ID = 'tool-panel-content';

// Artifact type mapping based on tool names
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
    case 'image': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
    case 'webpage': return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800';
    case 'document': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    case 'visualization': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
    case 'playbook': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
  }
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

  const isMobile = useIsMobile();

  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);

  // Convert tool calls to artifact tabs
  const artifactTabs: ArtifactTab[] = React.useMemo(() => {
    return toolCallSnapshots.map((snapshot, index) => {
      const toolName = getUserFriendlyToolName(snapshot.toolCall.assistantCall.name || 'Tool');
      const type = getArtifactType(toolName);
      const isCompleted = snapshot.toolCall.toolResult?.content && snapshot.toolCall.toolResult.content !== 'STREAMING';
      
      return {
        id: snapshot.id,
        name: toolName,
        type,
        icon: getArtifactIcon(type),
        color: getArtifactColor(type),
        isCompleted,
        isActive: selectedArtifactId === snapshot.id || (selectedArtifactId === null && index === internalIndex)
      };
    });
  }, [toolCallSnapshots, internalIndex, selectedArtifactId]);

  React.useEffect(() => {
    const newSnapshots = toolCalls.map((toolCall, index) => ({
      id: `${index}-${toolCall.assistantCall.timestamp || Date.now()}`,
      toolCall,
      index,
      timestamp: Date.now(),
      artifactType: getArtifactType(getUserFriendlyToolName(toolCall.assistantCall.name || 'Tool'))
    }));

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
    } else if (hasNewSnapshots && navigationMode === 'live') {
      const latestSnapshot = newSnapshots[newSnapshots.length - 1];
      const isLatestStreaming = latestSnapshot?.toolCall.toolResult?.content === 'STREAMING';
      if (isLatestStreaming) {
        let lastCompletedIndex = -1;
        for (let i = newSnapshots.length - 1; i >= 0; i--) {
          const snapshot = newSnapshots[i];
          if (snapshot.toolCall.toolResult?.content &&
            snapshot.toolCall.toolResult.content !== 'STREAMING') {
            lastCompletedIndex = i;
            break;
          }
        }
        if (lastCompletedIndex >= 0) {
          setInternalIndex(lastCompletedIndex);
          setSelectedArtifactId(newSnapshots[lastCompletedIndex]?.id || null);
        } else {
          setInternalIndex(newSnapshots.length - 1);
          setSelectedArtifactId(newSnapshots[newSnapshots.length - 1]?.id || null);
        }
      } else {
        setInternalIndex(newSnapshots.length - 1);
        setSelectedArtifactId(newSnapshots[newSnapshots.length - 1]?.id || null);
      }
    }
  }, [toolCalls, navigationMode, toolCallSnapshots.length, isInitialized]);

  const handleArtifactSelect = (artifactId: string) => {
    const snapshotIndex = toolCallSnapshots.findIndex(s => s.id === artifactId);
    if (snapshotIndex >= 0) {
      setSelectedArtifactId(artifactId);
      setInternalIndex(snapshotIndex);
      setNavigationMode('manual');
      onNavigate(snapshotIndex);
    }
  };

  const handleReplaySession = () => {
    // Implement session replay functionality
    setShowReplayOptions(true);
    // This would trigger a replay of the current session
  };

  const safeInternalIndex = Math.min(internalIndex, Math.max(0, toolCallSnapshots.length - 1));
  const currentSnapshot = toolCallSnapshots[safeInternalIndex];
  const currentToolCall = currentSnapshot?.toolCall;
  const totalCalls = toolCallSnapshots.length;

  const completedToolCalls = toolCallSnapshots.filter(snapshot =>
    snapshot.toolCall.toolResult?.content &&
    snapshot.toolCall.toolResult.content !== 'STREAMING'
  );
  const totalCompletedCalls = completedToolCalls.length;

  let displayToolCall = currentToolCall;
  let displayIndex = safeInternalIndex;
  let displayTotalCalls = totalCalls;

  const isCurrentToolStreaming = currentToolCall?.toolResult?.content === 'STREAMING';
  if (isCurrentToolStreaming && totalCompletedCalls > 0) {
    const lastCompletedSnapshot = completedToolCalls[completedToolCalls.length - 1];
    displayToolCall = lastCompletedSnapshot.toolCall;
    displayIndex = totalCompletedCalls - 1;
    displayTotalCalls = totalCompletedCalls;
  } else if (!isCurrentToolStreaming) {
    const completedIndex = completedToolCalls.findIndex(snapshot => snapshot.id === currentSnapshot?.id);
    if (completedIndex >= 0) {
      displayIndex = completedIndex;
      displayTotalCalls = totalCompletedCalls;
    }
  }

  const currentToolName = displayToolCall?.assistantCall?.name || 'Tool Call';
  const CurrentToolIcon = getToolIcon(
    currentToolCall?.assistantCall?.name || 'unknown',
  );
  const isStreaming = displayToolCall?.toolResult?.content === 'STREAMING';

  // Extract actual success value from tool content with fallbacks
  const getActualSuccess = (toolCall: any): boolean => {
    const content = toolCall?.toolResult?.content;
    if (!content) return toolCall?.toolResult?.isSuccess ?? true;

    const safeParse = (data: any) => {
      try { return typeof data === 'string' ? JSON.parse(data) : data; }
      catch { return null; }
    };

    const parsed = safeParse(content);
    if (!parsed) return toolCall?.toolResult?.isSuccess ?? true;

    if (parsed.content) {
      const inner = safeParse(parsed.content);
      if (inner?.tool_execution?.result?.success !== undefined) {
        return inner.tool_execution.result.success;
      }
    }
    const success = parsed.tool_execution?.result?.success ??
      parsed.result?.success ??
      parsed.success;

    return success !== undefined ? success : (toolCall?.toolResult?.isSuccess ?? true);
  };

  const isSuccess = isStreaming ? true : getActualSuccess(displayToolCall);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  React.useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!isOpen) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-30 pointer-events-none">
        <div className="p-4 h-full flex items-stretch justify-end pointer-events-auto">
          <div
            className={cn(
              'border rounded-2xl flex flex-col shadow-2xl bg-background',
              isMobile
                ? 'w-full'
                : 'w-[40%] sm:w-[450px] md:w-[300px] lg:w-[350px] xl:w-[350px]',
            )}
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="pt-4 pl-4 pr-4">
                  <div className="flex items-center justify-between">
                    <div className="ml-2 flex items-center gap-2">
                      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                        {agentName ? `${agentName}'s Computer` : 'Helium\'s Brain'}
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClose}
                      className="h-8 w-8"
                      title="Minimize to floating preview"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-20 w-full rounded-md" />
                    <Skeleton className="h-40 w-full rounded-md" />
                    <Skeleton className="h-20 w-full rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!displayToolCall && toolCallSnapshots.length === 0) {
      return (
        <div className="flex flex-col h-full">
          <div className="pt-4 pl-4 pr-4">
            <div className="flex items-center justify-between">
              <div className="ml-2 flex items-center gap-2">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {agentName ? `${agentName}'s Computer` : 'Helium\'s Brain'}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 p-8">
            <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                  <Computer className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-zinc-400 dark:text-zinc-500 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  No tool activity
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Tool calls and computer interactions will appear here when they're being executed.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const toolView = displayToolCall ? (
      <ToolView
        name={displayToolCall.assistantCall.name}
        assistantContent={displayToolCall.assistantCall.content}
        toolContent={displayToolCall.toolResult?.content}
        assistantTimestamp={displayToolCall.assistantCall.timestamp}
        toolTimestamp={displayToolCall.toolResult?.timestamp}
        isSuccess={isSuccess}
        isStreaming={isStreaming}
        project={project}
        messages={messages}
        agentStatus={agentStatus}
        currentIndex={displayIndex}
        totalCalls={displayTotalCalls}
        onFileClick={onFileClick}
      />
    ) : null;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <motion.div
          layoutId={CONTENT_LAYOUT_ID}
          className="p-3 border-b border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between">
            <motion.div layoutId="tool-icon" className="ml-2 flex items-center gap-2">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {agentName ? `${agentName}'s Computer` : 'Helium\'s Brain'}
              </h2>
            </motion.div>

            <div className="flex items-center gap-2">
              {/* Session Replay Button */}
              {totalCompletedCalls > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReplaySession}
                  className="h-8 px-2 text-xs"
                  title="Replay session"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Replay
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
                title="Minimize to floating preview"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Manus-style Artifact Navigation - "All artifacts in one button" */}
        {artifactTabs.length > 0 && (
          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap mr-2 font-medium">
                All artifacts:
              </span>
              {artifactTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleArtifactSelect(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 whitespace-nowrap',
                      tab.isActive 
                        ? tab.color + ' shadow-sm'
                        : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                      !tab.isCompleted && 'opacity-60'
                    )}
                    title={`${tab.name} ${tab.isCompleted ? '(Completed)' : '(Running)'}`}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span className="max-w-20 truncate">{tab.name}</span>
                    {!tab.isCompleted && (
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {toolView}
        </div>

        {/* Session Status */}
        {totalCompletedCalls > 0 && agentStatus !== 'running' && (
          <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Session completed
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplaySession}
                className="h-6 px-2 text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                Watch again
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="sidepanel"
          layoutId={FLOATING_LAYOUT_ID}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.15 },
            layout: {
              type: "spring",
              stiffness: 400,
              damping: 35
            }
          }}
          className={cn(
            inlineMode
              ? 'h-full w-full border-l border-border flex flex-col bg-card rounded-2xl relative'
              : 'fixed top-2 right-2 bottom-4 border rounded-3xl flex flex-col z-30 bg-card',
            !inlineMode && (isMobile
              ? 'left-2'
              : 'w-[40vw] sm:w-[450px] md:w-[500px] lg:w-[550px] xl:w-[645px]')
          )}
          style={{
            overflow: 'hidden',
            ...(inlineMode ? {} : undefined),
          }}
        >
          <div className="flex-1 flex flex-col overflow-hidden bg-card">
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

