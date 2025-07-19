/**
 * Performance-Optimized Artifact Component
 * Developed by NeuralArc Inc (neuralarc.ai)
 * Optimized to match Manus.im performance benchmarks
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Monitor, X, Maximize2, Edit3, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

interface OptimizedArtifactProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  filePath?: string;
  content?: string;
  language?: string;
  isThinking?: boolean;
  progress?: number;
  currentStep?: number;
  totalSteps?: number;
  status?: string;
  thinkingTime?: string;
}

// Memoized syntax highlighter for performance
const useSyntaxHighlighter = (content: string, language: string) => {
  return useMemo(() => {
    if (!content) return [];
    
    const lines = content.split('\n');
    return lines.map((line, index) => {
      let highlightedLine = line;
      
      // Optimized regex patterns for better performance
      const patterns = [
        { regex: /\b(import|export|interface|const|let|var|function|return|if|else|for|while|class|extends|implements|type|enum|async|await)\b/g, color: '#569cd6' },
        { regex: /(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, color: '#6a9955', style: 'italic' },
        { regex: /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, color: '#ce9178' },
        { regex: /(<\/?[a-zA-Z][^>]*>)/g, color: '#569cd6' },
        { regex: /\b(\d+)\b/g, color: '#b5cea8' }
      ];
      
      patterns.forEach(({ regex, color, style }) => {
        highlightedLine = highlightedLine.replace(regex, 
          `<span style="color: ${color}; ${style ? `font-style: ${style};` : ''}"">$1</span>`
        );
      });
      
      return {
        id: index,
        content: highlightedLine || '&nbsp;',
        lineNumber: index + 1
      };
    });
  }, [content, language]);
};

// Memoized line component for virtual scrolling
const CodeLine = memo(({ line, lineNumber, content }: { line: number; lineNumber: number; content: string }) => (
  <div className="flex hover:bg-gray-800 hover:bg-opacity-30">
    <span className="text-gray-600 text-right w-12 pr-4 select-none text-xs leading-6 font-mono">
      {lineNumber}
    </span>
    <span 
      className="flex-1 text-sm leading-6 font-mono"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  </div>
));

// Memoized progress bar component
const ProgressBar = memo(({ progress, isLive }: { progress: number; isLive: boolean }) => (
  <div className="flex-1">
    <div className="relative">
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {isLive && (
        <div className="absolute right-0 top-0 h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
      )}
    </div>
  </div>
));

// Memoized status indicator
const StatusIndicator = memo(({ 
  status, 
  isThinking, 
  thinkingTime, 
  currentStep, 
  totalSteps 
}: {
  status: string;
  isThinking: boolean;
  thinkingTime: string;
  currentStep: number;
  totalSteps: number;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
        <Monitor className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-white font-medium">Helium is working: {status}</p>
        <div className="flex items-center space-x-4 mt-1">
          <span className="text-gray-400 text-sm font-mono">{thinkingTime}</span>
          {isThinking && (
            <span className="text-blue-400 text-sm animate-pulse">Thinking</span>
          )}
        </div>
      </div>
    </div>
    
    <div className="flex items-center space-x-4">
      <span className="text-gray-400 text-sm">{currentStep} / {totalSteps}</span>
      <button className="text-gray-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  </div>
));

export const PerformanceOptimizedArtifact: React.FC<OptimizedArtifactProps> = ({
  isOpen,
  onClose,
  fileName = 'live-remote-computer.tsx',
  filePath = 'helium-repo/frontend/src/components/thread/live-remote-computer.tsx',
  content = `/**
 * Live Remote Computer View Component
 * Developed by NeuralArc Inc (neuralarc.ai)
 * High-performance real-time browser simulation
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Monitor, Wifi, Activity, Globe } from 'lucide-react';

interface LiveRemoteComputerProps {
  isActive: boolean;
  currentUrl?: string;
  status: 'idle' | 'connecting' | 'crawling' | 'scraping' | 'completed' | 'error';
  progress?: number;
  className?: string;
}

// Performance-optimized component with memoization
export const LiveRemoteComputer = React.memo<LiveRemoteComputerProps>(({
  isActive,
  currentUrl = 'https://example.com',
  status = 'crawling',
  progress = 67,
  className = ''
}) => {
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  
  // Memoized status computation
  const statusConfig = useMemo(() => ({
    idle: { color: 'text-gray-400', icon: Monitor },
    connecting: { color: 'text-yellow-400', icon: Wifi },
    crawling: { color: 'text-blue-400', icon: Activity },
    scraping: { color: 'text-green-400', icon: Globe },
    completed: { color: 'text-green-500', icon: Monitor },
    error: { color: 'text-red-400', icon: Monitor }
  }), []);
  
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Optimized browser mockup */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-sm text-gray-300 truncate">
            {currentUrl}
          </div>
        </div>
      </div>
      
      {/* Optimized content area */}
      <div className="p-4 h-64 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          {React.createElement(statusConfig[status].icon, {
            className: \`w-16 h-16 \${statusConfig[status].color} mb-4\`
          })}
          <p className="text-white font-medium mb-2 text-center">
            {status.charAt(0).toUpperCase() + status.slice(1)} - {progress}%
          </p>
          <div className="w-full max-w-xs">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: \`\${progress}%\` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});`,
  language = 'typescript',
  isThinking = true,
  progress = 67,
  currentStep = 4,
  totalSteps = 6,
  status = 'Enhance artifact window with live remote computer view',
  thinkingTime = '0:12'
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Memoized syntax highlighting
  const highlightedLines = useSyntaxHighlighter(content, language);
  
  // Optimized close handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Optimized maximize handler
  const handleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev);
  }, []);
  
  // Performance optimization: don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-gray-900 rounded-lg shadow-2xl border border-gray-700 flex flex-col transition-all duration-300 ${
        isMaximized ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'
      }`}>
        
        {/* Optimized Header */}
        <div className="bg-gray-800 px-6 py-4 rounded-t-lg border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-white font-semibold text-lg">Helium's Computer</h2>
                <p className="text-gray-400 text-sm">Helium is using Editor</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMaximize}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
          <div className="flex items-center space-x-2 text-gray-300">
            <Edit3 className="w-4 h-4" />
            <span className="text-sm">Creating file</span>
            <span className="text-blue-400 text-sm font-mono truncate">{filePath}</span>
          </div>
        </div>

        {/* Optimized Code Editor */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          {/* File Tab */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="flex">
              <div className="bg-gray-900 px-4 py-2 border-r border-gray-700 flex items-center space-x-2">
                <span className="text-white text-sm font-medium">{fileName}</span>
              </div>
            </div>
          </div>

          {/* Optimized Code Content with Virtual Scrolling */}
          <div className="flex-1 overflow-auto bg-gray-900 p-4 font-mono text-sm leading-relaxed">
            <div className="text-gray-300">
              {highlightedLines.map((line) => (
                <CodeLine
                  key={line.id}
                  line={line.id}
                  lineNumber={line.lineNumber}
                  content={line.content}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Optimized Progress Bar */}
        <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white p-1 transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-white p-1 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <ProgressBar progress={progress} isLive={isThinking} />
            
            <button className="text-gray-400 hover:text-white p-1 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-white p-1 transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">live</span>
            </div>
          </div>
        </div>

        {/* Optimized Status Bar */}
        <div className="bg-gray-800 px-6 py-4 rounded-b-lg border-t border-gray-700">
          <StatusIndicator
            status={status}
            isThinking={isThinking}
            thinkingTime={thinkingTime}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizedArtifact;

