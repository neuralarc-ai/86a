'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, Globe, Search, Download, CheckCircle, AlertCircle, 
  Clock, Activity, Zap, Eye, MousePointer, Keyboard, 
  ArrowRight, Loader2, Play, Pause, RotateCcw, Maximize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface CrawlingStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  description: string;
  timestamp?: string;
  duration?: number;
  url?: string;
  screenshot?: string;
  data?: any;
}

interface LiveCrawlingPreviewProps {
  isActive: boolean;
  currentUrl?: string;
  steps: CrawlingStep[];
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  isPaused?: boolean;
}

export const LiveCrawlingPreview: React.FC<LiveCrawlingPreviewProps> = ({
  isActive,
  currentUrl,
  steps,
  onPause,
  onResume,
  onStop,
  isPaused = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simulatedScreenshot, setSimulatedScreenshot] = useState<string>('');

  // Simulate browser screenshots for demo
  useEffect(() => {
    if (isActive && !isPaused) {
      const interval = setInterval(() => {
        // Simulate different browser states
        const screenshots = [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMzgwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZTVlN2ViIiByeD0iNCIvPjx0ZXh0IHg9IjIwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzc0MTUxIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMzgwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzMzMzMzIiByeD0iNCIvPjx0ZXh0IHg9IjIwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIj5TY3JhcGluZyBkYXRhLi4uPC90ZXh0PjxyZWN0IHg9IjEwIiB5PSI2MCIgd2lkdGg9IjE4MCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzM0ZDM5OSIgcng9IjIiLz48L3N2Zz4=',
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMzgwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMTBiOTgxIiByeD0iNCIvPjx0ZXh0IHg9IjIwIiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIj5Db21wbGV0ZWQhPC90ZXh0Pjwvc3ZnPg=='
        ];
        setSimulatedScreenshot(screenshots[Math.floor(Math.random() * screenshots.length)]);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isActive, isPaused]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Monitor className="h-6 w-6 text-blue-600" />
            {isActive && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Live Crawling Preview</h3>
            <p className="text-sm text-gray-600">
              {isActive ? 'Actively crawling' : 'Crawling session'} • {completedSteps}/{totalSteps} steps
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isActive && (
            <>
              {isPaused ? (
                <Button size="sm" variant="outline" onClick={onResume}>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onStop}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Browser Preview */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {/* Browser Chrome */}
          <div className="bg-gray-200 px-4 py-2 border-b flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex-1 bg-white rounded px-3 py-1 text-sm text-gray-600 font-mono">
              {currentUrl || 'https://example.com'}
            </div>
            <div className="flex items-center space-x-1">
              {isActive && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            </div>
          </div>

          {/* Browser Content */}
          <div className="flex-1 bg-white relative overflow-hidden">
            <AnimatePresence mode="wait">
              {simulatedScreenshot ? (
                <motion.img
                  key={simulatedScreenshot}
                  src={simulatedScreenshot}
                  alt="Browser screenshot"
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <motion.div
                  className="flex items-center justify-center h-full text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center">
                    <Globe className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Waiting for crawling to start...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay indicators */}
            {isActive && (
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
            )}

            {/* Mouse cursor simulation */}
            {isActive && !isPaused && (
              <motion.div
                className="absolute pointer-events-none"
                animate={{
                  x: [100, 200, 150, 250],
                  y: [100, 150, 200, 120]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <MousePointer className="h-5 w-5 text-blue-600" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Steps Panel */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-1">Crawling Steps</h4>
            <p className="text-sm text-gray-600">Real-time step progression</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    step.status === 'running' 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {step.title}
                        </h5>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(step.status)}`}
                        >
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                      
                      {step.url && (
                        <div className="flex items-center text-xs text-blue-600 mb-1">
                          <Globe className="h-3 w-3 mr-1" />
                          <span className="truncate">{step.url}</span>
                        </div>
                      )}
                      
                      {step.duration && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {step.duration}ms
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {step.status === 'running' && (
                    <div className="mt-2">
                      <Progress value={75} className="h-1" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Zap className="h-4 w-4 mr-1" />
              {steps.filter(s => s.status === 'running').length} active
            </div>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              {completedSteps} completed
            </div>
            {steps.some(s => s.status === 'error') && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {steps.filter(s => s.status === 'error').length} errors
              </div>
            )}
          </div>
          
          <div className="text-gray-500">
            {isActive ? (isPaused ? 'Paused' : 'Running') : 'Completed'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCrawlingPreview;

