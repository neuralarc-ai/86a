/**
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
}

export const LiveRemoteComputer: React.FC<LiveRemoteComputerProps> = ({
  isActive,
  currentUrl = 'https://example.com',
  status,
  progress = 0,
  onPause,
  onResume,
  onStop,
  onRestart,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isMouseVisible, setIsMouseVisible] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [crawlingSteps, setCrawlingSteps] = useState<CrawlingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  // Simulate mouse movement during crawling
  useEffect(() => {
    if (status === 'crawling' || status === 'scraping') {
      setIsMouseVisible(true);
      const interval = setInterval(() => {
        setMousePosition({
          x: Math.random() * 90 + 5, // 5% to 95%
          y: Math.random() * 80 + 10  // 10% to 90%
        });
      }, 1500);

      return () => {
        clearInterval(interval);
        setIsMouseVisible(false);
      };
    }
  }, [status]);

  // Simulate crawling steps
  useEffect(() => {
    if (status === 'crawling') {
      const steps: CrawlingStep[] = [
        { id: '1', action: 'Navigate to homepage', url: 'https://example.com', timestamp: Date.now(), status: 'completed' },
        { id: '2', action: 'Click navigation menu', url: 'https://example.com/menu', timestamp: Date.now() + 1000, status: 'completed' },
        { id: '3', action: 'Scroll to content section', url: 'https://example.com/content', timestamp: Date.now() + 2000, status: 'active' },
        { id: '4', action: 'Extract product data', url: 'https://example.com/products', timestamp: Date.now() + 3000, status: 'pending' },
        { id: '5', action: 'Download images', url: 'https://example.com/images', timestamp: Date.now() + 4000, status: 'pending' }
      ];
      setCrawlingSteps(steps);
      
      // Simulate step progression
      let stepIndex = 0;
      const stepInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(stepIndex);
          stepIndex++;
        } else {
          clearInterval(stepInterval);
        }
      }, 2000);

      return () => clearInterval(stepInterval);
    }
  }, [status]);

  // Simulate connection quality changes
  useEffect(() => {
    const qualityInterval = setInterval(() => {
      const qualities: ('excellent' | 'good' | 'poor')[] = ['excellent', 'good', 'poor'];
      setConnectionQuality(qualities[Math.floor(Math.random() * qualities.length)]);
    }, 5000);

    return () => clearInterval(qualityInterval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connecting': return 'text-yellow-500';
      case 'crawling': return 'text-blue-500';
      case 'scraping': return 'text-purple-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting': return <Activity className="w-4 h-4 animate-pulse" />;
      case 'crawling': return <Globe className="w-4 h-4 animate-spin" />;
      case 'scraping': return <Search className="w-4 h-4 animate-bounce" />;
      case 'completed': return <Eye className="w-4 h-4" />;
      case 'error': return <WifiOff className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'good': return <Wifi className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <Wifi className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      {/* Computer Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Monitor className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Remote Computer View</span>
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-xs text-gray-400 capitalize">{connectionQuality}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-1.5 rounded ${isRecording ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'} hover:bg-opacity-80 transition-colors`}
          >
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-current'}`} />
          </button>
          
          {status === 'crawling' || status === 'scraping' ? (
            <button
              onClick={onPause}
              className="p-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onResume}
              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={onStop}
            className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
          
          <button
            onClick={onRestart}
            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Browser Window */}
      <div className="bg-white">
        {/* Browser Header */}
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-600 ml-4">Remote Browser Session</span>
          </div>
          
          {/* Browser Navigation */}
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700">
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700">
              <RotateCw className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700">
              <Home className="w-4 h-4" />
            </button>
            
            <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-1 text-sm">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{currentUrl}</span>
                {(status === 'crawling' || status === 'scraping') && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
            
            <button className="p-1 text-gray-500 hover:text-gray-700">
              <Bookmark className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Browser Content Area */}
        <div 
          ref={screenRef}
          className="relative bg-white h-96 overflow-hidden"
          style={{ minHeight: isFullscreen ? '60vh' : '24rem' }}
        >
          {/* Simulated Website Content */}
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Example Website</h1>
                <nav className="mt-2">
                  <div className="flex space-x-6">
                    <a href="#" className="text-blue-600 hover:text-blue-800">Home</a>
                    <a href="#" className="text-gray-600 hover:text-gray-800">Products</a>
                    <a href="#" className="text-gray-600 hover:text-gray-800">Services</a>
                    <a href="#" className="text-gray-600 hover:text-gray-800">About</a>
                    <a href="#" className="text-gray-600 hover:text-gray-800">Contact</a>
                  </div>
                </nav>
              </div>

              {/* Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold mb-3">Main Content</h2>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                  
                  {/* Highlighted content being scraped */}
                  {(status === 'scraping' || status === 'crawling') && (
                    <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300 rounded animate-pulse">
                      <p className="text-sm text-blue-800">Data being extracted...</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Sidebar</h3>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Mouse Cursor */}
          {isMouseVisible && (
            <div
              className="absolute pointer-events-none transition-all duration-1000 ease-in-out z-10"
              style={{
                left: `${mousePosition.x}%`,
                top: `${mousePosition.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <MousePointer className="w-6 h-6 text-blue-600 drop-shadow-lg" />
              <div className="absolute -top-1 -left-1 w-8 h-8 border-2 border-blue-400 rounded-full animate-ping opacity-30"></div>
            </div>
          )}

          {/* Loading Overlay */}
          {status === 'connecting' && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Connecting to remote computer...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="capitalize">{status}</span>
          </div>
          
          {progress > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-gray-400">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {crawlingSteps.length > 0 && (
            <div className="text-gray-400">
              Step {currentStep + 1} of {crawlingSteps.length}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-400 hover:text-white">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-white">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-white">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Crawling Steps Panel (when active) */}
      {crawlingSteps.length > 0 && (status === 'crawling' || status === 'scraping') && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <h4 className="text-white font-medium mb-3">Crawling Progress</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {crawlingSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center space-x-3 p-2 rounded ${
                  index === currentStep ? 'bg-blue-900 bg-opacity-50' : 'bg-gray-700 bg-opacity-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'active' ? 'bg-blue-500 animate-pulse' :
                  step.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-sm text-gray-300 flex-1">{step.action}</span>
                <span className="text-xs text-gray-500">{step.url.split('/').pop()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveRemoteComputer;

