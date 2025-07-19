'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Play, Pause, SkipForward, SkipBack,
  Monitor, Activity, Clock, CheckCircle, AlertCircle, Zap,
  Minimize2, Maximize2, X, RotateCcw, FastForward, Rewind
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: string;
  duration?: number;
  screenshot?: string;
  data?: any;
}

interface BottomProgressMonitorProps {
  isVisible: boolean;
  isActive: boolean;
  steps: ProgressStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onClose?: () => void;
  isPaused?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  autoProgress?: boolean;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
}

export const BottomProgressMonitor: React.FC<BottomProgressMonitorProps> = ({
  isVisible,
  isActive,
  steps,
  currentStepIndex,
  onStepChange,
  onPlay,
  onPause,
  onStop,
  onClose,
  isPaused = false,
  isMinimized = false,
  onToggleMinimize,
  autoProgress = true,
  playbackSpeed = 1,
  onSpeedChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localCurrentStep, setLocalCurrentStep] = useState(currentStepIndex);

  useEffect(() => {
    setLocalCurrentStep(currentStepIndex);
  }, [currentStepIndex]);

  // Auto-progress through steps when active
  useEffect(() => {
    if (isActive && !isPaused && autoProgress && !isDragging) {
      const interval = setInterval(() => {
        if (localCurrentStep < steps.length - 1) {
          const nextStep = localCurrentStep + 1;
          setLocalCurrentStep(nextStep);
          onStepChange(nextStep);
        }
      }, 2000 / playbackSpeed);

      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, autoProgress, localCurrentStep, steps.length, playbackSpeed, onStepChange, isDragging]);

  const currentStep = steps[localCurrentStep];
  const progress = steps.length > 0 ? ((localCurrentStep + 1) / steps.length) * 100 : 0;
  const completedSteps = steps.filter(step => step.status === 'completed').length;

  const handleStepChange = (newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, steps.length - 1));
    setLocalCurrentStep(clampedIndex);
    onStepChange(clampedIndex);
  };

  const handleSliderChange = (value: number[]) => {
    const newIndex = value[0];
    setLocalCurrentStep(newIndex);
    setIsDragging(true);
  };

  const handleSliderCommit = (value: number[]) => {
    const newIndex = value[0];
    onStepChange(newIndex);
    setIsDragging(false);
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-3 w-3 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const speedOptions = [0.5, 1, 1.5, 2, 3];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Minimized View */}
        {isMinimized ? (
          <div className="px-4 py-2 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-3">
              <Monitor className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                Step {localCurrentStep + 1} of {steps.length}
              </span>
              <Badge variant="outline" className="text-xs">
                {Math.round(progress)}%
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              {isActive && (
                <div className="flex items-center space-x-1">
                  {isPaused ? (
                    <Button size="sm" variant="ghost" onClick={onPlay}>
                      <Play className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={onPause}>
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
              <Button size="sm" variant="ghost" onClick={onToggleMinimize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          /* Full View */
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Progress Monitor</h3>
                  <p className="text-sm text-gray-600">
                    Step {localCurrentStep + 1} of {steps.length} • {completedSteps} completed
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Speed Control */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Speed:</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
                    className="text-xs border rounded px-2 py-1"
                  >
                    {speedOptions.map(speed => (
                      <option key={speed} value={speed}>{speed}x</option>
                    ))}
                  </select>
                </div>

                {/* Control Buttons */}
                {isActive && (
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => handleStepChange(0)}>
                      <Rewind className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleStepChange(localCurrentStep - 1)}
                      disabled={localCurrentStep === 0}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    {isPaused ? (
                      <Button size="sm" variant="outline" onClick={onPlay}>
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={onPause}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleStepChange(localCurrentStep + 1)}
                      disabled={localCurrentStep === steps.length - 1}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleStepChange(steps.length - 1)}>
                      <FastForward className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onStop}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Button size="sm" variant="ghost" onClick={onToggleMinimize}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar with Step Markers */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>
              
              {/* Custom Progress Slider */}
              <div className="relative">
                <Slider
                  value={[localCurrentStep]}
                  onValueChange={handleSliderChange}
                  onValueCommit={handleSliderCommit}
                  max={steps.length - 1}
                  step={1}
                  className="w-full"
                />
                
                {/* Step Markers */}
                <div className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`w-2 h-2 rounded-full -mt-1 ${
                        index <= localCurrentStep 
                          ? step.status === 'completed' 
                            ? 'bg-green-500' 
                            : step.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Current Step Info */}
            {currentStep && (
              <motion.div
                key={currentStep.id}
                className="bg-gray-50 rounded-lg p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStepStatusIcon(currentStep.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{currentStep.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          currentStep.status === 'running' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : currentStep.status === 'completed'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : currentStep.status === 'error'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {currentStep.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{currentStep.description}</p>
                    
                    {currentStep.duration && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Duration: {currentStep.duration}ms
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Progress Bar for Running Steps */}
                {currentStep.status === 'running' && (
                  <div className="mt-3">
                    <Progress value={65} className="h-1" />
                  </div>
                )}
              </motion.div>
            )}

            {/* Step Navigation Thumbnails */}
            <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(index)}
                  className={`flex-shrink-0 p-2 rounded-lg border transition-all duration-200 ${
                    index === localCurrentStep
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      {getStepStatusIcon(step.status)}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate w-20">
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Step {index + 1}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default BottomProgressMonitor;

