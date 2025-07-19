/**
 * Simple Manus-Style Artifact Window
 * Developed by NeuralArc Inc
 * Simplified implementation matching Manus.im exactly
 */

import React, { useState, useEffect } from 'react';
import { Monitor, X, Maximize2, Minimize2, Edit3, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';

interface SimpleArtifactWindowProps {
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

export const SimpleArtifactWindow: React.FC<SimpleArtifactWindowProps> = ({
  isOpen,
  onClose,
  fileName = 'live-remote-computer.tsx',
  filePath = 'suna-repo/frontend/src/components/thread/live-remote-computer.tsx',
  content = `/**
 * Live Remote Computer View Component
 * Developed by NeuralArc Inc
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
  language = 'typescript',
  isThinking = true,
  progress = 67,
  currentStep = 4,
  totalSteps = 6,
  status = 'Enhance artifact window with live remote computer view',
  thinkingTime = '0:12'
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  // Simple syntax highlighting
  const highlightCode = (code: string) => {
    return code
      .replace(/\b(import|export|interface|const|let|var|function|return|if|else|for|while|class|extends|implements|type|enum)\b/g, 
        '<span style="color: #569cd6;">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, 
        '<span style="color: #6a9955; font-style: italic;">$1</span>')
      .replace(/(["\'`])((?:\\.|(?!\1)[^\\])*?)\1/g, 
        '<span style="color: #ce9178;">$1$2$1</span>')
      .replace(/(<\/?[a-zA-Z][^>]*>)/g, 
        '<span style="color: #569cd6;">$1</span>')
      .replace(/\b(\d+)\b/g, 
        '<span style="color: #b5cea8;">$1</span>');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className={`bg-gray-900 rounded-lg shadow-2xl border border-gray-700 flex flex-col ${
        isMaximized ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'
      }`}>
        
        {/* Header - Exact Manus Style */}
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
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded"
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
            <span className="text-blue-400 text-sm font-mono">{filePath}</span>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          {/* File Tab */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="flex">
              <div className="bg-gray-900 px-4 py-2 border-r border-gray-700 flex items-center space-x-2">
                <span className="text-white text-sm font-medium">{fileName}</span>
              </div>
            </div>
          </div>

          {/* Code Content */}
          <div className="flex-1 overflow-auto bg-gray-900 p-4 font-mono text-sm leading-relaxed">
            <div className="text-gray-300">
              {content.split('\n').map((line, index) => (
                <div key={index} className="flex">
                  <span className="text-gray-600 text-right w-12 pr-4 select-none">
                    {index + 1}
                  </span>
                  <span 
                    className="flex-1"
                    dangerouslySetInnerHTML={{ __html: highlightCode(line) || '&nbsp;' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar - Exact Manus Style */}
        <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white p-1">
              <SkipBack className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-white p-1">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex-1">
              <div className="relative">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="absolute right-0 top-0 h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <button className="text-gray-400 hover:text-white p-1">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-white p-1">
              <SkipForward className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">live</span>
            </div>
          </div>
        </div>

        {/* Status Bar - Exact Manus Style */}
        <div className="bg-gray-800 px-6 py-4 rounded-b-lg border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Helium is working: {status}</p>
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
              <button className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleArtifactWindow;

