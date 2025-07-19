/**
 * Manus-Style Artifact Window Component
 * Replicates the exact design and functionality from Manus.im
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Maximize2, Minimize2, X, Edit3, Play, Pause, 
  SkipBack, SkipForward, ChevronLeft, ChevronRight,
  FileText, Code, Folder, Settings, Download, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ManusArtifactWindowProps {
  isOpen: boolean;
  onClose: () => void;
  currentFile?: {
    name: string;
    path: string;
    content: string;
    language: string;
  };
  isThinking?: boolean;
  thinkingTime?: string;
  currentStep?: number;
  totalSteps?: number;
  status?: string;
  progress?: number;
  className?: string;
}

export const ManusArtifactWindow: React.FC<ManusArtifactWindowProps> = ({
  isOpen,
  onClose,
  currentFile = {
    name: 'live-remote-computer.tsx',
    path: 'suna-repo/frontend/src/components/thread/live-remote-computer.tsx',
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

interface CrawlingStep {
  id: string;
  action: string;
  url: string;
  timestamp: number;
  status: 'pending' | 'active' | 'completed' | 'error';
  screenshot?: string;
  data?: any;
}`,
    language: 'typescript'
  },
  isThinking = true,
  thinkingTime = '0:12',
  currentStep = 4,
  totalSteps = 6,
  status = 'Enhance artifact window with live remote computer view',
  progress = 67,
  className = ''
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentLine, setCurrentLine] = useState(1);
  const codeRef = useRef<HTMLDivElement>(null);

  // Simulate typing effect for thinking state
  useEffect(() => {
    if (isThinking && codeRef.current) {
      const lines = currentFile.content.split('\n');
      let lineIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (lineIndex < lines.length) {
          setCurrentLine(lineIndex + 1);
          lineIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, 100);

      return () => clearInterval(typeInterval);
    }
  }, [isThinking, currentFile.content]);

  // Syntax highlighting for TypeScript/React
  const highlightCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      let highlightedLine = line;
      
      // Keywords
      highlightedLine = highlightedLine.replace(
        /\b(import|export|interface|const|let|var|function|return|if|else|for|while|class|extends|implements|type|enum)\b/g,
        '<span class="text-blue-400">$1</span>'
      );
      
      // Strings
      highlightedLine = highlightedLine.replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="text-green-400">$1$2$1</span>'
      );
      
      // Comments
      highlightedLine = highlightedLine.replace(
        /(\/\*[\s\S]*?\*\/|\/\/.*$)/gm,
        '<span class="text-gray-500">$1</span>'
      );
      
      // React/HTML tags
      highlightedLine = highlightedLine.replace(
        /(<\/?[a-zA-Z][^>]*>)/g,
        '<span class="text-red-400">$1</span>'
      );
      
      // Numbers
      highlightedLine = highlightedLine.replace(
        /\b(\d+)\b/g,
        '<span class="text-orange-400">$1</span>'
      );

      return (
        <div key={index} className="flex">
          <span className="text-gray-600 text-right w-12 pr-4 select-none">
            {index + 1}
          </span>
          <span 
            className="flex-1"
            dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
          />
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 ${className}`}>
      <div 
        className={`bg-gray-900 rounded-lg shadow-2xl border border-gray-700 flex flex-col ${
          isMaximized ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'
        } ${isMinimized ? 'h-16' : ''}`}
      >
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 rounded-t-lg border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-white font-semibold text-lg">Manus's Computer</h2>
                <p className="text-gray-400 text-sm">Manus is using Editor</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* File Info */}
            <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
              <div className="flex items-center space-x-2 text-gray-300">
                <Edit3 className="w-4 h-4" />
                <span className="text-sm">Creating file</span>
                <span className="text-blue-400 text-sm font-mono">{currentFile.path}</span>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
              {/* File Tab */}
              <div className="bg-gray-800 border-b border-gray-700">
                <div className="flex">
                  <div className="bg-gray-900 px-4 py-2 border-r border-gray-700 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm font-medium">{currentFile.name}</span>
                  </div>
                </div>
              </div>

              {/* Code Content */}
              <div 
                ref={codeRef}
                className="flex-1 overflow-auto bg-gray-900 p-4 font-mono text-sm leading-relaxed"
              >
                <div className="text-gray-300">
                  {highlightCode(currentFile.content)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
              <div className="flex items-center space-x-4">
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-1">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-1">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex-1">
                  <div className="relative">
                    <Progress 
                      value={progress} 
                      className="h-2 bg-gray-700"
                    />
                    <div className="absolute right-0 top-0 h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-1">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-1">
                  <SkipForward className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">live</span>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="bg-gray-800 px-6 py-4 rounded-b-lg border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Manus is working: {status}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-gray-400 text-sm">{thinkingTime}</span>
                      {isThinking && (
                        <span className="text-blue-400 text-sm animate-pulse">Thinking</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400 text-sm">{currentStep} / {totalSteps}</span>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManusArtifactWindow;

