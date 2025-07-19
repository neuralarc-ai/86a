"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Code, 
  Download, 
  Share2, 
  ExternalLink,
  Maximize2,
  Copy,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Monitor,
  Sparkles,
  Search,
  Globe
} from 'lucide-react';
import LiveWebSearchPreview from './LiveWebSearchPreview';

/**
 * Helium AI Agent - Artifact Viewer Component
 * 
 * Professional artifact viewing interface with glassmorphism effects and live web search
 * Developed by NeuralArc Inc (neuralarc.ai)
 */

interface ArtifactViewerProps {
  workflowId: string;
  artifactType: string;
  title: string;
  outputFiles: string[];
  metadata?: Record<string, any>;
}

const ARTIFACT_TYPE_COLORS = {
  image: 'bg-gradient-to-br from-orange-500 to-red-500',
  slides: 'bg-gradient-to-br from-green-500 to-emerald-500',
  webpage: 'bg-gradient-to-br from-pink-500 to-purple-500',
  visualization: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  playbook: 'bg-gradient-to-br from-red-500 to-pink-500',
  document: 'bg-gradient-to-br from-purple-500 to-indigo-500'
};

const ARTIFACT_TYPE_ICONS = {
  image: ImageIcon,
  slides: FileText,
  webpage: Monitor,
  visualization: FileText,
  playbook: FileText,
  document: FileText
};

const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  workflowId,
  artifactType,
  title,
  outputFiles,
  metadata = {}
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'live-search'>('preview');
  const [artifactContent, setArtifactContent] = useState<string>('');
  const [artifactCode, setArtifactCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showLiveSearch, setShowLiveSearch] = useState<boolean>(false);

  useEffect(() => {
    loadArtifactContent();
  }, [workflowId]);

  const loadArtifactContent = async () => {
    setIsLoading(true);
    try {
      // Load the main artifact file
      const mainFile = outputFiles.find(file => 
        file.includes('final.html') || file.includes('.html')
      ) || outputFiles[0];

      if (mainFile) {
        // Simulate loading artifact content
        const response = await fetch(`/api/artifacts/files/${workflowId}/${mainFile}`);
        if (response.ok) {
          const content = await response.text();
          setArtifactContent(content);
          setArtifactCode(content);
        }
      }
    } catch (error) {
      console.error('Failed to load artifact content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/artifacts/download/${workflowId}/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const shareArtifact = async () => {
    try {
      const shareUrl = `${window.location.origin}/artifacts/share/${workflowId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy share URL:', error);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(artifactCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const openInNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(artifactContent);
      newWindow.document.close();
    }
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading artifact preview...</p>
          </div>
        </div>
      );
    }

    switch (artifactType) {
      case 'webpage':
      case 'slides':
        return (
          <div className="w-full h-96 border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner bg-white">
            <iframe
              srcDoc={artifactContent}
              className="w-full h-full"
              title={title}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );
      
      case 'image':
        return (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
            <img
              src={`/api/artifacts/files/${workflowId}/${outputFiles[0]}`}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </div>
        );
      
      case 'visualization':
        return (
          <div className="w-full h-96 border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner bg-white">
            <iframe
              srcDoc={artifactContent}
              className="w-full h-full"
              title={title}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );
      
      case 'document':
      case 'playbook':
        return (
          <div className="w-full h-96 border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner bg-white">
            <iframe
              srcDoc={artifactContent}
              className="w-full h-full"
              title={title}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-500 font-medium">Preview not available for this artifact type</p>
            </div>
          </div>
        );
    }
  };

  const renderCodeView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-900 rounded-xl">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto"></div>
            <p className="text-gray-300 font-medium">Loading source code...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            className="bg-white/90 backdrop-blur-sm border-2 hover:bg-white shadow-lg"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </>
            )}
          </Button>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-auto h-96 text-sm font-mono border-2 border-gray-700 shadow-inner">
          <code className="language-html">{artifactCode}</code>
        </pre>
      </div>
    );
  };

  const TypeIcon = ARTIFACT_TYPE_ICONS[artifactType as keyof typeof ARTIFACT_TYPE_ICONS] || FileText;
  const typeColor = ARTIFACT_TYPE_COLORS[artifactType as keyof typeof ARTIFACT_TYPE_COLORS] || 'bg-gray-500';

  return (
    <div className="relative">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 rounded-2xl"></div>
      <div className="absolute inset-0 backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 shadow-2xl"></div>
      
      {/* Main Content */}
      <Card className="relative z-10 w-full border-0 bg-transparent shadow-none">
        <CardHeader className="pb-6 bg-white/10 backdrop-blur-sm rounded-t-2xl border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${typeColor} text-white shadow-lg backdrop-blur-sm`}>
                <TypeIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-semibold flex items-center gap-3 drop-shadow-sm">
                  {title}
                  <Badge 
                    variant="secondary" 
                    className="text-sm px-3 py-1 bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                  >
                    {artifactType.toUpperCase()}
                  </Badge>
                </CardTitle>
                <p className="text-white/80 mt-1 drop-shadow-sm">Professional artifact created with Helium AI</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={openInNewTab}
                disabled={!artifactContent}
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm shadow-lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={shareArtifact}
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm shadow-lg"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 bg-white/5 backdrop-blur-sm rounded-b-2xl">
          {/* Enhanced Tabs with Live Search */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'code' | 'live-search')}>
            <TabsList className="grid w-full grid-cols-3 h-12 bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
              <TabsTrigger 
                value="preview" 
                className="flex items-center gap-2 text-base font-medium text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-sm backdrop-blur-sm"
              >
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="code" 
                className="flex items-center gap-2 text-base font-medium text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-sm backdrop-blur-sm"
              >
                <Code className="w-4 h-4" />
                Source Code
              </TabsTrigger>
              <TabsTrigger 
                value="live-search" 
                className="flex items-center gap-2 text-base font-medium text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-sm backdrop-blur-sm"
              >
                <Search className="w-4 h-4" />
                Live Search
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg overflow-hidden">
                {renderPreview()}
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg overflow-hidden">
                {renderCodeView()}
              </div>
            </TabsContent>
            
            <TabsContent value="live-search" className="mt-6">
              <LiveWebSearchPreview
                searchQuery={title}
                isActive={activeTab === 'live-search'}
                onComplete={(results) => {
                  console.log('Search completed:', results);
                }}
                onError={(error) => {
                  console.error('Search error:', error);
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Output Files with Glassmorphism */}
          {outputFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white drop-shadow-sm">Available Files</h3>
              <div className="grid gap-3">
                {outputFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm animate-pulse"></div>
                      <span className="font-medium text-white">{file}</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-1 bg-white/10 border-white/30 text-white/80 backdrop-blur-sm"
                      >
                        {file.split('.').pop()?.toUpperCase()}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata with Glassmorphism */}
          {Object.keys(metadata).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white drop-shadow-sm">Metadata</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
                <pre className="text-sm text-white/80 font-mono overflow-auto">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Footer Attribution with Glassmorphism */}
          <div className="text-center text-sm text-white/60 pt-4 border-t border-white/20">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Created with Helium AI Agent by</span>
              <span className="font-semibold text-blue-400">NeuralArc Inc</span>
              <span>•</span>
              <a 
                href="https://neuralarc.ai" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                neuralarc.ai
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArtifactViewer;

