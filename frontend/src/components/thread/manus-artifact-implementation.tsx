/**
 * Manus-Style Artifact Implementation for Helium AI Agent
 * Based on Suna.so Code Modification Guide for Manus-like Artefact Implementation
 * Developed by NeuralArc Inc (neuralarc.ai)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Play, Pause, Square, RotateCcw, Maximize2, Minimize2,
  FileText, Code, Database, Image, Video, Music, Archive,
  Download, Share2, Copy, Settings, Activity, Globe,
  ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle,
  Loader2, Eye, EyeOff, Terminal, GitBranch, Save, Search,
  Zap, Brain, Cpu, MemoryStick, HardDrive, Network
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types based on the document specifications
interface AgentPhase {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  estimatedTime?: string;
  requiredCapabilities: string[];
  dependencies: number[];
  successCriteria: string[];
}

interface TaskPlan {
  goal: string;
  complexity: 'simple' | 'medium' | 'complex' | 'very_complex';
  phases: AgentPhase[];
  currentPhase: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  estimatedTotalDuration: string;
  successMetrics: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface AgentEvent {
  timestamp: Date;
  eventType: string;
  content: string;
  metadata: Record<string, any>;
  phaseId?: number;
}

interface MemoryEntry {
  timestamp: Date;
  entryType: string;
  content: string;
  metadata: Record<string, any>;
  phaseId?: number;
}

interface ArtifactFile {
  id: string;
  name: string;
  type: 'code' | 'document' | 'image' | 'video' | 'audio' | 'data' | 'archive' | 'other';
  size: string;
  path: string;
  content?: string;
  preview?: string;
  lastModified: Date;
  status: 'creating' | 'ready' | 'error';
}

interface ManusArtifactProps {
  agentId: string;
  taskPlan?: TaskPlan;
  files: ArtifactFile[];
  isActive: boolean;
  onPhaseAdvance?: (fromPhase: number, toPhase: number) => void;
  onTaskComplete?: () => void;
  onInterrupt?: () => void;
  className?: string;
}

// Enhanced artifact type detection
const getFileIcon = (type: ArtifactFile['type']) => {
  const icons = {
    code: Code,
    document: FileText,
    image: Image,
    video: Video,
    audio: Music,
    data: Database,
    archive: Archive,
    other: FileText
  };
  return icons[type] || FileText;
};

// Performance monitoring component
const PerformanceMonitor: React.FC<{ agentId: string }> = ({ agentId }) => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate performance metrics (in real implementation, these would come from actual monitoring)
      setMetrics({
        renderTime: Math.random() * 50 + 10,
        memoryUsage: Math.random() * 30 + 40,
        cpuUsage: Math.random() * 20 + 15,
        networkLatency: Math.random() * 100 + 50
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [agentId]);

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <Cpu className="h-3 w-3" />
        <span>{metrics.cpuUsage.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-1">
        <MemoryStick className="h-3 w-3" />
        <span>{metrics.memoryUsage.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-1">
        <Network className="h-3 w-3" />
        <span>{metrics.networkLatency.toFixed(0)}ms</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>{metrics.renderTime.toFixed(1)}ms</span>
      </div>
    </div>
  );
};

// Agent loop status indicator
const AgentLoopStatus: React.FC<{ 
  status: TaskPlan['status'];
  currentPhase: number;
  totalPhases: number;
  progress: number;
}> = ({ status, currentPhase, totalPhases, progress }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'text-blue-500';
      case 'paused': return 'text-yellow-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <span className={cn("text-sm font-medium", getStatusColor())}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      <span className="text-xs text-muted-foreground">
        Phase {currentPhase}/{totalPhases} • {progress.toFixed(0)}%
      </span>
    </div>
  );
};

// File preview component with syntax highlighting
const FilePreview: React.FC<{ file: ArtifactFile }> = ({ file }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getSyntaxHighlighting = (content: string, type: string) => {
    // Simplified syntax highlighting (in real implementation, use a proper syntax highlighter)
    if (type === 'code') {
      return content
        .replace(/(import|export|const|let|var|function|class|interface|type)/g, '<span class="text-purple-400">$1</span>')
        .replace(/(['"`])(.*?)\1/g, '<span class="text-green-400">$1$2$1</span>')
        .replace(/(\/\/.*$)/gm, '<span class="text-gray-500 italic">$1</span>');
    }
    return content;
  };

  if (!file.content && file.type !== 'image') {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading preview...
      </div>
    );
  }

  if (file.type === 'image') {
    return (
      <div className="relative">
        <img 
          src={file.preview || file.path} 
          alt={file.name}
          className="max-w-full h-auto rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{file.name}</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      
      <div className={cn(
        "bg-gray-900 rounded-lg p-4 overflow-auto font-mono text-sm",
        isExpanded ? "max-h-96" : "max-h-32"
      )}>
        <pre 
          className="text-gray-300"
          dangerouslySetInnerHTML={{
            __html: getSyntaxHighlighting(file.content || '', file.type)
          }}
        />
      </div>
    </div>
  );
};

// Main Manus Artifact Component
export const ManusArtifactImplementation: React.FC<ManusArtifactProps> = ({
  agentId,
  taskPlan,
  files,
  isActive,
  onPhaseAdvance,
  onTaskComplete,
  onInterrupt,
  className
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'artifacts' | 'live' | 'terminal' | 'git'>('artifacts');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);

  // Performance optimization with memoization
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }, [files]);

  const currentPhase = useMemo(() => {
    return taskPlan?.phases.find(phase => phase.id === taskPlan.currentPhase);
  }, [taskPlan]);

  const overallProgress = useMemo(() => {
    if (!taskPlan) return 0;
    const completedPhases = taskPlan.phases.filter(phase => phase.status === 'completed').length;
    return (completedPhases / taskPlan.phases.length) * 100;
  }, [taskPlan]);

  // Event handlers
  const handleFileSelect = useCallback((fileId: string) => {
    setSelectedFile(fileId);
  }, []);

  const handleDownload = useCallback((file: ArtifactFile) => {
    // Implement download logic
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleShare = useCallback((file: ArtifactFile) => {
    // Implement share logic
    if (navigator.share) {
      navigator.share({
        title: file.name,
        url: file.path
      });
    } else {
      navigator.clipboard.writeText(file.path);
    }
  }, []);

  const handleCopy = useCallback((file: ArtifactFile) => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            // Save current file
            break;
          case 'o':
            e.preventDefault();
            // Open file
            break;
          case 'f':
            e.preventDefault();
            // Search
            break;
        }
      }
      
      if (e.key === 'F11') {
        e.preventDefault();
        setIsMinimized(!isMinimized);
      }
      
      if (e.key === 'Escape') {
        setSelectedFile(null);
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMinimized]);

  // Real-time updates simulation
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate agent events
      const newEvent: AgentEvent = {
        timestamp: new Date(),
        eventType: 'progress_update',
        content: `Processing phase ${taskPlan?.currentPhase || 1}...`,
        metadata: { agentId, phase: taskPlan?.currentPhase },
        phaseId: taskPlan?.currentPhase
      };
      
      setAgentEvents(prev => [newEvent, ...prev.slice(0, 9)]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, taskPlan?.currentPhase, agentId]);

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-background border border-border rounded-lg p-3 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Monitor className="h-6 w-6" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-background border border-border rounded-xl shadow-lg overflow-hidden",
        "flex flex-col h-[600px] w-full max-w-4xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <span className="font-semibold">Helium's Computer</span>
          </div>
          
          {taskPlan && (
            <AgentLoopStatus
              status={taskPlan.status}
              currentPhase={taskPlan.currentPhase}
              totalPhases={taskPlan.phases.length}
              progress={overallProgress}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <PerformanceMonitor agentId={agentId} />
          
          <div className="flex items-center gap-1 ml-4">
            {isActive && onInterrupt && (
              <button
                onClick={onInterrupt}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Interrupt Agent"
              >
                <Square className="h-4 w-4 text-red-500" />
              </button>
            )}
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Current Task Display */}
      {currentPhase && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">
              Creating file: {currentPhase.title}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {currentPhase.description}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {[
          { id: 'artifacts', label: 'Artifacts', icon: FileText },
          { id: 'live', label: 'Live Preview', icon: Globe },
          { id: 'terminal', label: 'Terminal', icon: Terminal },
          { id: 'git', label: 'Git', icon: GitBranch }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                "border-b-2 border-transparent hover:bg-muted/50",
                activeTab === tab.id && "border-primary bg-muted/30 text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'artifacts' && (
            <motion.div
              key="artifacts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex"
            >
              {/* File List */}
              <div className="w-1/3 border-r border-border overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Files ({files.length})</h3>
                  <div className="space-y-2">
                    {sortedFiles.map(file => {
                      const Icon = getFileIcon(file.type);
                      return (
                        <button
                          key={file.id}
                          onClick={() => handleFileSelect(file.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                            "hover:bg-muted/50",
                            selectedFile === file.id && "bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{file.name}</div>
                            <div className="text-xs text-muted-foreground">{file.size}</div>
                          </div>
                          
                          {file.status === 'creating' && (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                          )}
                          
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file);
                              }}
                              className="p-1 rounded hover:bg-background transition-colors"
                              title="Download"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(file);
                              }}
                              className="p-1 rounded hover:bg-background transition-colors"
                              title="Share"
                            >
                              <Share2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(file);
                              }}
                              className="p-1 rounded hover:bg-background transition-colors"
                              title="Copy"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* File Preview */}
              <div className="flex-1 overflow-y-auto">
                {selectedFile ? (
                  <div className="p-4">
                    {(() => {
                      const file = files.find(f => f.id === selectedFile);
                      return file ? <FilePreview file={file} /> : null;
                    })()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a file to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-4"
            >
              <div className="h-full bg-gray-900 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center text-white">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Live preview will appear here</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Real-time browser simulation during web operations
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'terminal' && (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-4"
            >
              <div className="h-full bg-black rounded-lg p-4 font-mono text-green-400 text-sm">
                <div className="mb-2">Helium Terminal v1.0.0</div>
                <div className="mb-2">Connected to agent: {agentId}</div>
                <div className="mb-4">Type 'help' for available commands</div>
                
                {agentEvents.slice(0, 10).map((event, index) => (
                  <div key={index} className="mb-1 text-gray-300">
                    <span className="text-gray-500">
                      [{event.timestamp.toLocaleTimeString()}]
                    </span>{' '}
                    {event.content}
                  </div>
                ))}
                
                <div className="flex items-center">
                  <span className="text-green-400">helium@agent:~$</span>
                  <span className="ml-2 bg-green-400 w-2 h-4 animate-pulse"></span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'git' && (
            <motion.div
              key="git"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-4"
            >
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Git integration coming soon</p>
                  <p className="text-sm mt-2">
                    Version control and collaboration features
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      {taskPlan && (
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Phase {taskPlan.currentPhase} of {taskPlan.phases.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-500">live</span>
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="border-t border-border px-4 py-2 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Helium is working: {taskPlan?.goal || 'Processing...'}</span>
            <span>{taskPlan?.phases.length || 0} / {taskPlan?.phases.length || 0}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>0:12 Thinking</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ManusArtifactImplementation;

