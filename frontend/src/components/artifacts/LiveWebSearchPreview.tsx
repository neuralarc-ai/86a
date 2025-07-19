"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Search, 
  MousePointer, 
  Eye, 
  Download, 
  Zap,
  Activity,
  Wifi,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Helium AI Agent - Live Web Search Preview Component
 * 
 * Real-time web searching with live preview and mouse movements like Manus.im
 * Developed by NeuralArc Inc (neuralarc.ai)
 */

interface SearchStep {
  id: string;
  type: 'navigate' | 'search' | 'click' | 'scroll' | 'extract' | 'analyze';
  description: string;
  url?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  timestamp: number;
  duration?: number;
  data?: any;
}

interface MousePosition {
  x: number;
  y: number;
  clicking: boolean;
  hovering: boolean;
}

interface LiveWebSearchPreviewProps {
  searchQuery: string;
  isActive: boolean;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

const LiveWebSearchPreview: React.FC<LiveWebSearchPreviewProps> = ({
  searchQuery,
  isActive,
  onComplete,
  onError
}) => {
  const [currentStep, setCurrentStep] = useState<SearchStep | null>(null);
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([]);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 50, y: 50, clicking: false, hovering: false });
  const [currentUrl, setCurrentUrl] = useState<string>('https://google.com');
  const [pageContent, setPageContent] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const previewRef = useRef<HTMLDivElement>(null);

  // Simulate realistic search steps
  const generateSearchSteps = (query: string): SearchStep[] => {
    return [
      {
        id: '1',
        type: 'navigate',
        description: 'Opening Google Search',
        url: 'https://google.com',
        status: 'pending',
        timestamp: Date.now()
      },
      {
        id: '2',
        type: 'search',
        description: `Searching for "${query}"`,
        status: 'pending',
        timestamp: Date.now() + 2000
      },
      {
        id: '3',
        type: 'analyze',
        description: 'Analyzing search results',
        status: 'pending',
        timestamp: Date.now() + 4000
      },
      {
        id: '4',
        type: 'click',
        description: 'Clicking on relevant result',
        status: 'pending',
        timestamp: Date.now() + 6000
      },
      {
        id: '5',
        type: 'extract',
        description: 'Extracting page content',
        status: 'pending',
        timestamp: Date.now() + 8000
      },
      {
        id: '6',
        type: 'scroll',
        description: 'Scrolling to find more information',
        status: 'pending',
        timestamp: Date.now() + 10000
      }
    ];
  };

  // Simulate realistic mouse movements
  const animateMouseMovement = (targetX: number, targetY: number, duration: number = 1000) => {
    const startX = mousePosition.x;
    const startY = mousePosition.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for natural movement
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = easeInOutCubic(progress);
      
      // Add slight randomness for natural movement
      const randomX = (Math.random() - 0.5) * 2;
      const randomY = (Math.random() - 0.5) * 2;
      
      const currentX = startX + (targetX - startX) * easedProgress + randomX;
      const currentY = startY + (targetY - startY) * easedProgress + randomY;
      
      setMousePosition(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100, currentX)),
        y: Math.max(0, Math.min(100, currentY))
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Simulate clicking animation
  const simulateClick = (x: number, y: number) => {
    animateMouseMovement(x, y, 800);
    setTimeout(() => {
      setMousePosition(prev => ({ ...prev, clicking: true }));
      setTimeout(() => {
        setMousePosition(prev => ({ ...prev, clicking: false }));
      }, 150);
    }, 800);
  };

  // Execute search steps
  useEffect(() => {
    if (!isActive) return;

    const steps = generateSearchSteps(searchQuery);
    setSearchSteps(steps);
    setConnectionStatus('connecting');

    // Simulate connection
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);

    let stepIndex = 0;
    const executeNextStep = () => {
      if (stepIndex >= steps.length) {
        onComplete?.({
          query: searchQuery,
          results: extractedData,
          steps: steps
        });
        return;
      }

      const step = steps[stepIndex];
      setCurrentStep(step);
      
      // Update step status
      setSearchSteps(prev => prev.map(s => 
        s.id === step.id ? { ...s, status: 'active' } : s
      ));

      // Simulate step execution
      setTimeout(() => {
        executeStep(step);
        
        // Mark step as completed
        setSearchSteps(prev => prev.map(s => 
          s.id === step.id ? { ...s, status: 'completed', duration: Date.now() - step.timestamp } : s
        ));
        
        stepIndex++;
        setTimeout(executeNextStep, 1500);
      }, 1000);
    };

    executeNextStep();
  }, [isActive, searchQuery]);

  const executeStep = (step: SearchStep) => {
    switch (step.type) {
      case 'navigate':
        setCurrentUrl(step.url || 'https://google.com');
        animateMouseMovement(50, 20, 1000);
        break;
        
      case 'search':
        simulateClick(50, 30);
        setTimeout(() => {
          setPageContent(`Searching for: ${searchQuery}`);
        }, 500);
        break;
        
      case 'analyze':
        animateMouseMovement(30, 60, 1200);
        setTimeout(() => {
          animateMouseMovement(70, 45, 800);
        }, 600);
        break;
        
      case 'click':
        simulateClick(45, 55);
        setTimeout(() => {
          setCurrentUrl('https://example-result.com');
          setPageContent('Loading page content...');
        }, 1000);
        break;
        
      case 'extract':
        animateMouseMovement(25, 70, 1000);
        setTimeout(() => {
          setExtractedData([
            { type: 'title', content: 'Example Page Title' },
            { type: 'text', content: 'Extracted text content...' },
            { type: 'link', content: 'https://example.com/link' }
          ]);
        }, 800);
        break;
        
      case 'scroll':
        // Simulate scrolling with mouse movement
        animateMouseMovement(50, 80, 1500);
        setTimeout(() => {
          animateMouseMovement(50, 40, 1000);
        }, 800);
        break;
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'navigate': return Globe;
      case 'search': return Search;
      case 'click': return MousePointer;
      case 'scroll': return Activity;
      case 'extract': return Download;
      case 'analyze': return Eye;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'active': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {/* Glassmorphism Container */}
      <Card className="relative overflow-hidden border-0 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20">
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 via-transparent to-purple-500/10"></div>
        
        {/* Header */}
        <CardHeader className="relative z-10 pb-4 bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-white font-semibold">Live Web Search</CardTitle>
                <p className="text-sm text-white/70">Real-time search with AI navigation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <Badge 
                variant="outline" 
                className={`text-xs border-white/30 ${
                  connectionStatus === 'connected' ? 'text-green-400 bg-green-500/10' :
                  connectionStatus === 'error' ? 'text-red-400 bg-red-500/10' :
                  'text-yellow-400 bg-yellow-500/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                  connectionStatus === 'error' ? 'bg-red-400' :
                  'bg-yellow-400 animate-pulse'
                }`}></div>
                {connectionStatus === 'connected' ? 'Live' : 
                 connectionStatus === 'error' ? 'Error' : 'Connecting'}
              </Badge>
              
              {/* Controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-96">
            {/* Live Browser Preview */}
            <div className="lg:col-span-2 relative bg-gray-900/50 backdrop-blur-sm">
              {/* Browser Chrome */}
              <div className="bg-gray-800/80 backdrop-blur-sm p-3 flex items-center gap-2 border-b border-white/10">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 bg-gray-700/50 rounded px-3 py-1 text-sm text-white/80 backdrop-blur-sm">
                  {currentUrl}
                </div>
                <div className="flex items-center gap-1">
                  <Wifi className={`w-4 h-4 ${connectionStatus === 'connected' ? 'text-green-400' : 'text-gray-400'}`} />
                </div>
              </div>
              
              {/* Page Content with Mouse Cursor */}
              <div 
                ref={previewRef}
                className="relative h-full bg-white/5 backdrop-blur-sm overflow-hidden"
              >
                {/* Animated Mouse Cursor */}
                <motion.div
                  className="absolute z-50 pointer-events-none"
                  style={{
                    left: `${mousePosition.x}%`,
                    top: `${mousePosition.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  animate={{
                    scale: mousePosition.clicking ? 0.8 : 1,
                  }}
                  transition={{ duration: 0.1 }}
                >
                  <div className={`relative ${mousePosition.clicking ? 'animate-pulse' : ''}`}>
                    <MousePointer className={`w-6 h-6 ${mousePosition.clicking ? 'text-blue-400' : 'text-white'} drop-shadow-lg`} />
                    {mousePosition.clicking && (
                      <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30"></div>
                    )}
                  </div>
                </motion.div>
                
                {/* Simulated Page Content */}
                <div className="p-6 space-y-4">
                  {/* Search Results Simulation */}
                  <div className="space-y-3">
                    <div className="h-8 bg-white/10 rounded animate-pulse backdrop-blur-sm"></div>
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3, 4].map((item, index) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.2 }}
                          className="relative p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                          onMouseEnter={() => setMousePosition(prev => ({ ...prev, hovering: true }))}
                          onMouseLeave={() => setMousePosition(prev => ({ ...prev, hovering: false }))}
                        >
                          <div className="h-4 bg-white/20 rounded mb-2 animate-pulse"></div>
                          <div className="h-3 bg-white/15 rounded w-3/4 animate-pulse"></div>
                          
                          {/* Highlight effect when mouse hovers */}
                          {mousePosition.hovering && Math.abs(mousePosition.y - (30 + index * 15)) < 10 && (
                            <div className="absolute inset-0 bg-blue-400/20 rounded-lg animate-pulse"></div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Data Extraction Visualization */}
                  {extractedData.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Data Extracted</span>
                      </div>
                      <div className="space-y-2">
                        {extractedData.map((data, index) => (
                          <div key={index} className="text-xs text-white/70 bg-white/5 p-2 rounded">
                            <span className="text-green-400">{data.type}:</span> {data.content}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* Loading Overlay */}
                {connectionStatus === 'connecting' && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto"></div>
                      <p className="text-white font-medium">Establishing connection...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Steps Panel */}
            <div className="bg-gray-900/30 backdrop-blur-sm border-l border-white/10 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Search Steps</h3>
                </div>
                
                {searchSteps.map((step, index) => {
                  const StepIcon = getStepIcon(step.type);
                  const isActive = currentStep?.id === step.id;
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border transition-all ${
                        isActive 
                          ? 'bg-blue-500/20 border-blue-500/50 shadow-lg' 
                          : step.status === 'completed'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded ${
                          step.status === 'completed' ? 'bg-green-500/20' :
                          isActive ? 'bg-blue-500/20' : 'bg-gray-500/20'
                        }`}>
                          <StepIcon className={`w-3 h-3 ${getStatusColor(step.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">
                            {step.description}
                          </p>
                          {step.duration && (
                            <p className="text-xs text-white/50">
                              {(step.duration / 1000).toFixed(1)}s
                            </p>
                          )}
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
        
        {/* Progress Footer */}
        <div className="relative z-10 p-4 bg-white/5 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Search Progress</span>
            <span className="text-sm text-white/70">
              {searchSteps.filter(s => s.status === 'completed').length} / {searchSteps.length}
            </span>
          </div>
          <Progress 
            value={(searchSteps.filter(s => s.status === 'completed').length / searchSteps.length) * 100} 
            className="h-2 bg-white/10"
          />
        </div>
      </Card>
      
      {/* Helium Attribution */}
      <div className="text-center text-xs text-white/50 mt-4">
        Live Web Search powered by <span className="font-semibold text-blue-400">Helium AI Agent</span> • 
        <span className="font-semibold text-purple-400 ml-1">NeuralArc Inc</span>
      </div>
    </div>
  );
};

export default LiveWebSearchPreview;

