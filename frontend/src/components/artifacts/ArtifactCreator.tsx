"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, 
  Presentation, 
  Globe, 
  BarChart3, 
  BookOpen, 
  FileText,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';

/**
 * Helium AI Agent - Artifact Creator Component
 * 
 * Professional artifact creation interface with Manus.im-style workflows
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

const ARTIFACT_TYPES = [
  {
    id: 'image',
    name: 'Image',
    icon: Image,
    color: 'bg-gradient-to-br from-orange-500 to-red-500',
    description: 'Generate custom images and illustrations with AI'
  },
  {
    id: 'slides',
    name: 'Slides',
    icon: Presentation,
    color: 'bg-gradient-to-br from-green-500 to-emerald-500',
    description: 'Create professional presentations and slide decks'
  },
  {
    id: 'webpage',
    name: 'Webpage',
    icon: Globe,
    color: 'bg-gradient-to-br from-pink-500 to-purple-500',
    description: 'Build interactive web pages and applications'
  },
  {
    id: 'visualization',
    name: 'Visualization',
    icon: BarChart3,
    color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    description: 'Create data visualizations and interactive charts'
  },
  {
    id: 'playbook',
    name: 'Playbook',
    icon: BookOpen,
    color: 'bg-gradient-to-br from-red-500 to-pink-500',
    description: 'Develop process guides and documentation'
  },
  {
    id: 'document',
    name: 'Document',
    icon: FileText,
    color: 'bg-gradient-to-br from-purple-500 to-indigo-500',
    description: 'Generate comprehensive documents and reports'
  }
];

const ArtifactCreator: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [currentWorkflow, setCurrentWorkflow] = useState<ArtifactWorkflow | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Simulate API calls (replace with actual API integration)
  const createArtifact = async () => {
    if (!selectedType || !prompt.trim()) {
      setError('Please select an artifact type and provide a description');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Simulate API call to create artifact
      const response = await fetch('/api/artifacts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artifact_type: selectedType,
          user_prompt: prompt,
          title: title || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create artifact');
      }

      const result = await response.json();
      
      // Start polling for status updates
      pollWorkflowStatus(result.workflow_id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsCreating(false);
    }
  };

  const pollWorkflowStatus = async (workflowId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/artifacts/status/${workflowId}`);
        if (!response.ok) {
          throw new Error('Failed to get workflow status');
        }

        const workflow: ArtifactWorkflow = await response.json();
        setCurrentWorkflow(workflow);

        if (workflow.status === 'executing') {
          // Continue polling
          setTimeout(poll, 2000);
        } else {
          // Workflow completed or failed
          setIsCreating(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get status');
        setIsCreating(false);
      }
    };

    poll();
  };

  const interruptWorkflow = async () => {
    if (!currentWorkflow) return;

    try {
      await fetch(`/api/artifacts/interrupt/${currentWorkflow.workflow_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'User requested interruption'
        })
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to interrupt workflow');
    }
  };

  const resetForm = () => {
    setSelectedType('');
    setPrompt('');
    setTitle('');
    setCurrentWorkflow(null);
    setIsCreating(false);
    setError('');
  };

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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Artifact
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your ideas into professional artifacts with Helium's AI-powered creation workflows
        </p>
        <div className="text-sm text-gray-500">
          Powered by <span className="font-semibold text-blue-600">NeuralArc Inc</span>
        </div>
      </div>

      {!currentWorkflow ? (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl text-gray-800">New Artifact</CardTitle>
            <p className="text-gray-600">Choose your artifact type and describe what you want to create</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Artifact Type Selection */}
            <div className="space-y-4">
              <label className="text-lg font-semibold text-gray-800">
                Select Artifact Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ARTIFACT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`group p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        selectedType === type.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`p-4 rounded-xl ${type.color} text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900 text-lg">{type.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-3">
              <label className="text-lg font-semibold text-gray-800">
                Title (Optional)
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your artifact"
                className="text-lg p-4 border-2 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <label className="text-lg font-semibold text-gray-800">
                Description
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create in detail..."
                rows={6}
                className="text-lg p-4 border-2 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Create Button */}
            <Button
              onClick={createArtifact}
              disabled={!selectedType || !prompt.trim() || isCreating}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isCreating ? (
                <>
                  <Clock className="w-5 h-5 mr-3 animate-spin" />
                  Creating Artifact...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-3" />
                  Create Artifact
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(currentWorkflow.status)}
                  <CardTitle className="text-2xl text-gray-800">{currentWorkflow.title}</CardTitle>
                  <Badge 
                    variant={currentWorkflow.status === 'completed' ? 'default' : 'secondary'}
                    className="text-sm px-3 py-1"
                  >
                    {currentWorkflow.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-600 text-lg">{currentWorkflow.description}</p>
              </div>
              <div className="flex gap-3">
                {currentWorkflow.status === 'executing' && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={interruptWorkflow}
                    className="border-2 hover:bg-red-50 hover:border-red-300"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={resetForm}
                  className="border-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  New Artifact
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Overall Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Overall Progress</span>
                <span className="text-lg font-bold text-blue-600">{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className="h-3 bg-gray-200" />
            </div>

            {/* Phase Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">Workflow Phases</h3>
              <div className="space-y-4">
                {currentWorkflow.phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      phase.status === 'in_progress'
                        ? 'border-blue-300 bg-blue-50 shadow-md'
                        : phase.status === 'completed'
                        ? 'border-green-300 bg-green-50 shadow-md'
                        : phase.status === 'failed'
                        ? 'border-red-300 bg-red-50 shadow-md'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-semibold">
                          {index + 1}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">{phase.title}</h4>
                        {getStatusIcon(phase.status)}
                      </div>
                      <Badge
                        variant={
                          phase.status === 'completed'
                            ? 'default'
                            : phase.status === 'failed'
                            ? 'destructive'
                            : phase.status === 'in_progress'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-sm px-3 py-1"
                      >
                        {phase.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-base">{phase.description}</p>
                    
                    {phase.status === 'in_progress' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-gray-700">Phase Progress</span>
                          <span className="text-blue-600">{Math.round(phase.progress)}%</span>
                        </div>
                        <Progress value={phase.progress} className="h-2 bg-gray-200" />
                      </div>
                    )}
                    
                    {phase.outputs.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Outputs:</h5>
                        <ul className="space-y-2">
                          {phase.outputs.map((output, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{output}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {phase.errors.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-semibold text-red-700 mb-2">Errors:</h5>
                        <ul className="space-y-2">
                          {phase.errors.map((error, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-red-600">{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Output Files */}
            {currentWorkflow.output_files.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Output Files</h3>
                <div className="grid gap-3">
                  {currentWorkflow.output_files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-800">{file}</span>
                      </div>
                      <Button variant="outline" size="sm" className="border-2">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Footer Attribution */}
      <div className="text-center text-sm text-gray-500 pt-4">
        Developed by <span className="font-semibold text-blue-600">NeuralArc Inc</span> • 
        <a href="https://neuralarc.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
          neuralarc.ai
        </a>
      </div>
    </div>
  );
};

export default ArtifactCreator;

