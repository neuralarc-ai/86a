"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Play, 
  Pause, 
  Square, 
  Eye, 
  Download, 
  Share2, 
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Image as ImageIcon,
  Globe,
  BarChart3,
  BookOpen,
  Presentation,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ArtifactViewer from '@/components/artifacts/ArtifactViewer';

/**
 * Helium AI Agent - Artifact Integration Component
 * 
 * Integrates the artifact system with the tool call side panel
 * Developed by NeuralArc Inc (neuralarc.ai)
 */

interface ArtifactPhase {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  outputs: string[];
  errors: string[];
  start_time?: string;
  end_time?: string;
}

interface ArtifactWorkflow {
  workflow_id: string;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  artifact_type: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  phases: ArtifactPhase[];
  output_files: string[];
  metadata: Record<string, any>;
}

interface ArtifactIntegrationProps {
  toolName: string;
  toolContent?: string;
  assistantContent?: string;
  isStreaming?: boolean;
  isSuccess?: boolean;
  onCreateArtifact?: (type: string, prompt: string, title?: string) => void;
  onViewArtifact?: (workflowId: string) => void;
}

const ARTIFACT_TYPE_ICONS = {
  image: ImageIcon,
  slides: Presentation,
  webpage: Globe,
  visualization: BarChart3,
  playbook: BookOpen,
  document: FileText
};

const ARTIFACT_TYPE_COLORS = {
  image: 'bg-gradient-to-br from-orange-500 to-red-500',
  slides: 'bg-gradient-to-br from-green-500 to-emerald-500',
  webpage: 'bg-gradient-to-br from-pink-500 to-purple-500',
  visualization: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  playbook: 'bg-gradient-to-br from-red-500 to-pink-500',
  document: 'bg-gradient-to-br from-purple-500 to-indigo-500'
};

const ArtifactIntegration: React.FC<ArtifactIntegrationProps> = ({
  toolName,
  toolContent,
  assistantContent,
  isStreaming = false,
  isSuccess = true,
  onCreateArtifact,
  onViewArtifact
}) => {
  const [currentWorkflow, setCurrentWorkflow] = useState<ArtifactWorkflow | null>(null);
  const [showViewer, setShowViewer] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Detect if this tool call could benefit from artifact creation
  const canCreateArtifact = () => {
    const toolNameLower = toolName.toLowerCase();
    return (
      toolNameLower.includes('generate') ||
      toolNameLower.includes('create') ||
      toolNameLower.includes('build') ||
      toolNameLower.includes('design') ||
      toolNameLower.includes('write') ||
      toolNameLower.includes('develop') ||
      toolNameLower.includes('make')
    );
  };

  // Suggest artifact type based on tool name and content
  const suggestArtifactType = (): string => {
    const toolNameLower = toolName.toLowerCase();
    const contentLower = (toolContent || assistantContent || '').toLowerCase();
    
    if (toolNameLower.includes('image') || toolNameLower.includes('picture') || toolNameLower.includes('photo')) return 'image';
    if (toolNameLower.includes('slide') || toolNameLower.includes('presentation') || toolNameLower.includes('ppt')) return 'slides';
    if (toolNameLower.includes('web') || toolNameLower.includes('site') || toolNameLower.includes('page')) return 'webpage';
    if (toolNameLower.includes('chart') || toolNameLower.includes('graph') || toolNameLower.includes('data') || toolNameLower.includes('visual')) return 'visualization';
    if (toolNameLower.includes('guide') || toolNameLower.includes('playbook') || toolNameLower.includes('process')) return 'playbook';
    
    return 'document';
  };

  // Create artifact from current tool output
  const handleCreateArtifact = async () => {
    if (!canCreateArtifact() || !toolContent) return;
    
    setIsCreating(true);
    
    try {
      const artifactType = suggestArtifactType();
      const title = `${toolName} Output`;
      const prompt = `Create a professional ${artifactType} based on the following content: ${toolContent}`;
      
      // Call the artifact creation API
      const response = await fetch('/api/artifacts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artifact_type: artifactType,
          user_prompt: prompt,
          title: title
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Start polling for workflow status
        pollWorkflowStatus(result.workflow_id);
        
        if (onCreateArtifact) {
          onCreateArtifact(artifactType, prompt, title);
        }
      }
    } catch (error) {
      console.error('Failed to create artifact:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Poll workflow status
  const pollWorkflowStatus = async (workflowId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/artifacts/status/${workflowId}`);
        if (response.ok) {
          const workflow: ArtifactWorkflow = await response.json();
          setCurrentWorkflow(workflow);

          if (workflow.status === 'executing') {
            // Continue polling
            setTimeout(poll, 2000);
          }
        }
      } catch (error) {
        console.error('Failed to poll workflow status:', error);
      }
    };

    poll();
  };

  // Get overall progress
  const getOverallProgress = () => {
    if (!currentWorkflow) return 0;
    
    const totalPhases = currentWorkflow.phases.length;
    const completedPhases = currentWorkflow.phases.filter(p => p.status === 'completed').length;
    const currentPhase = currentWorkflow.phases.find(p => p.status === 'in_progress');
    
    let progress = (completedPhases / totalPhases) * 100;
    
    if (currentPhase) {
      progress += (currentPhase.progress / totalPhases);
    }
    
    return Math.min(progress, 100);
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Handle view artifact
  const handleViewArtifact = () => {
    if (currentWorkflow) {
      setShowViewer(true);
      if (onViewArtifact) {
        onViewArtifact(currentWorkflow.workflow_id);
      }
    }
  };

  // If there's an active workflow, show the workflow status
  if (currentWorkflow) {
    const TypeIcon = ARTIFACT_TYPE_ICONS[currentWorkflow.artifact_type as keyof typeof ARTIFACT_TYPE_ICONS] || FileText;
    const typeColor = ARTIFACT_TYPE_COLORS[currentWorkflow.artifact_type as keyof typeof ARTIFACT_TYPE_COLORS] || 'bg-gray-500';

    return (
      <div className="space-y-4">
        {/* Workflow Status Card */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeColor} text-white shadow-md`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {currentWorkflow.title}
                    {getStatusIcon(currentWorkflow.status)}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{currentWorkflow.description}</p>
                </div>
              </div>
              <Badge 
                variant={currentWorkflow.status === 'completed' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {currentWorkflow.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-bold text-blue-600">{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className="h-2" />
            </div>

            {/* Current Phase */}
            {currentWorkflow.phases.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Current Phase</h4>
                {currentWorkflow.phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      phase.status === 'in_progress'
                        ? 'border-blue-300 bg-blue-50'
                        : phase.status === 'completed'
                        ? 'border-green-300 bg-green-50'
                        : phase.status === 'failed'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium">{phase.title}</span>
                        {getStatusIcon(phase.status)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {phase.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{phase.description}</p>
                    
                    {phase.status === 'in_progress' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Phase Progress</span>
                          <span className="text-blue-600">{Math.round(phase.progress)}%</span>
                        </div>
                        <Progress value={phase.progress} className="h-1" />
                      </div>
                    )}
                    
                    {phase.outputs.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-600 mb-1">Outputs:</div>
                        <ul className="space-y-1">
                          {phase.outputs.map((output, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-600">{output}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              {currentWorkflow.status === 'completed' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewArtifact}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Artifact
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/artifacts/download/${currentWorkflow.workflow_id}/${currentWorkflow.output_files[0]}`, '_blank')}
                    disabled={currentWorkflow.output_files.length === 0}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/artifacts/view/${currentWorkflow.workflow_id}`;
                      navigator.clipboard.writeText(shareUrl);
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              {currentWorkflow.status === 'executing' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetch(`/api/artifacts/interrupt/${currentWorkflow.workflow_id}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ message: 'User requested stop' })
                    });
                  }}
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Creation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Artifact Viewer Modal */}
        {showViewer && currentWorkflow.status === 'completed' && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Artifact Viewer</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewer(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <ArtifactViewer
                  workflowId={currentWorkflow.workflow_id}
                  artifactType={currentWorkflow.artifact_type}
                  title={currentWorkflow.title}
                  outputFiles={currentWorkflow.output_files}
                  metadata={currentWorkflow.metadata}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If no workflow but can create artifact, show creation option
  if (canCreateArtifact() && toolContent && !isStreaming) {
    const suggestedType = suggestArtifactType();
    const TypeIcon = ARTIFACT_TYPE_ICONS[suggestedType as keyof typeof ARTIFACT_TYPE_ICONS] || FileText;
    const typeColor = ARTIFACT_TYPE_COLORS[suggestedType as keyof typeof ARTIFACT_TYPE_COLORS] || 'bg-gray-500';

    return (
      <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center">
              <div className={`p-3 rounded-xl ${typeColor} text-white shadow-lg`}>
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Create Professional Artifact</h3>
              <p className="text-sm text-gray-600">
                Transform this {toolName} output into a professional {suggestedType}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className={`p-2 rounded-lg ${typeColor} text-white`}>
                <TypeIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Suggested: {suggestedType.charAt(0).toUpperCase() + suggestedType.slice(1)}
              </span>
            </div>
            <Button
              onClick={handleCreateArtifact}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isCreating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Creating Artifact...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Create Artifact
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: no artifact integration needed
  return null;
};

export default ArtifactIntegration;

