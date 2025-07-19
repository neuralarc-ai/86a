/**
 * Manus-Style Progress Bar and Status Indicators
 * Replicates the exact progress monitoring from Manus.im
 */

import React, { useState, useEffect } from 'react';
import { 
  SkipBack, SkipForward, ChevronLeft, ChevronRight, 
  Play, Pause, Monitor, Brain, Activity, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ManusProgressBarProps {
  progress: number;
  isLive?: boolean;
  isPlaying?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSkipToStart?: () => void;
  onSkipToEnd?: () => void;
  className?: string;
}

interface ManusStatusIndicatorProps {
  status: string;
  isThinking?: boolean;
  thinkingTime?: string;
  currentStep?: number;
  totalSteps?: number;
  avatar?: string;
  className?: string;
}

export const ManusProgressBar: React.FC<ManusProgressBarProps> = ({
  progress,
  isLive = true,
  isPlaying = true,
  currentStep = 4,
  totalSteps = 6,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onSkipToStart,
  onSkipToEnd,
  className = ''
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`bg-gray-800 px-6 py-3 border-t border-gray-700 ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Navigation Controls */}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onSkipToStart}
          className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 h-8 w-8"
          title="Skip to start"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onPrevious}
          className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 h-8 w-8"
          title="Previous step"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {/* Progress Bar */}
        <div className="flex-1 relative">
          <div className="relative">
            {/* Background track */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              {/* Progress fill */}
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${animatedProgress}%` }}
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
              </div>
            </div>
            
            {/* Live indicator */}
            {isLive && (
              <div className="absolute right-0 top-0 h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-lg">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            )}
          </div>
          
          {/* Progress percentage */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {Math.round(animatedProgress)}%
            </span>
          </div>
        </div>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onNext}
          className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 h-8 w-8"
          title="Next step"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onSkipToEnd}
          className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 h-8 w-8"
          title="Skip to end"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
        
        {/* Play/Pause Control */}
        <div className="border-l border-gray-600 pl-4">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={isPlaying ? onPause : onPlay}
            className="text-gray-400 hover:text-white hover:bg-gray-700 p-1 h-8 w-8"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Live Status */}
        <div className="flex items-center space-x-2 border-l border-gray-600 pl-4">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className={`text-sm font-medium ${isLive ? 'text-green-400' : 'text-gray-400'}`}>
            {isLive ? 'live' : 'offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ManusStatusIndicator: React.FC<ManusStatusIndicatorProps> = ({
  status,
  isThinking = true,
  thinkingTime = '0:12',
  currentStep = 4,
  totalSteps = 6,
  avatar,
  className = ''
}) => {
  const [dots, setDots] = useState('');

  // Animate thinking dots
  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDots('');
    }
  }, [isThinking]);

  return (
    <div className={`bg-gray-800 px-6 py-4 rounded-b-lg border-t border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Status Information */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center relative">
            {avatar ? (
              <img src={avatar} alt="Manus" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Monitor className="w-4 h-4 text-white" />
            )}
            
            {/* Thinking indicator */}
            {isThinking && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse">
                <Brain className="w-2 h-2 text-white m-0.5" />
              </div>
            )}
          </div>
          
          {/* Status Text */}
          <div>
            <p className="text-white font-medium">
              Manus is working: {status}
            </p>
            <div className="flex items-center space-x-4 mt-1">
              {/* Timer */}
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400 text-sm font-mono">{thinkingTime}</span>
              </div>
              
              {/* Thinking Status */}
              {isThinking && (
                <div className="flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
                  <span className="text-blue-400 text-sm animate-pulse">
                    Thinking{dots}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Step Counter and Navigation */}
        <div className="flex items-center space-x-4">
          <div className="text-gray-400 text-sm font-medium">
            {currentStep} / {totalSteps}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
              title="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
              title="Next step"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Progress Steps Visualization */}
      <div className="mt-3 flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              index < currentStep 
                ? 'bg-blue-500' 
                : index === currentStep 
                ? 'bg-blue-400 animate-pulse' 
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default { ManusProgressBar, ManusStatusIndicator };

