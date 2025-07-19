import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentStatus {
  agent_id: string;
  status: string;
  progress_percentage: number;
  current_phase: number;
  task_plan: any;
  recent_activities: any[];
}

interface AgentLoopMonitorProps {
  agentId: string;
  onInterrupt?: () => void;
}

export const AgentLoopMonitor: React.FC<AgentLoopMonitorProps> = ({ 
  agentId, 
  onInterrupt 
}) => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentStatus = async () => {
      try {
        const response = await fetch(`/api/agent/status/${agentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch agent status');
        }
        const data = await response.json();
        setAgentStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [agentId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading agent status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!agentStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>No agent status available</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Agent Loop Monitor</span>
            <Badge className={getStatusColor(agentStatus.status)}>
              {agentStatus.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(agentStatus.progress_percentage)}%</span>
              </div>
              <Progress value={agentStatus.progress_percentage} className="w-full" />
            </div>

            {/* Current Phase */}
            {agentStatus.task_plan && (
              <div>
                <h4 className="font-semibold mb-2">Current Phase</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">
                    Phase {agentStatus.current_phase}: {
                      agentStatus.task_plan.phases?.find(
                        (p: any) => p.id === agentStatus.current_phase
                      )?.title || 'Unknown'
                    }
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {agentStatus.task_plan.phases?.find(
                      (p: any) => p.id === agentStatus.current_phase
                    )?.description || 'No description available'}
                  </div>
                </div>
              </div>
            )}

            {/* Task Goal */}
            {agentStatus.task_plan?.goal && (
              <div>
                <h4 className="font-semibold mb-2">Task Goal</h4>
                <div className="bg-blue-50 p-3 rounded text-sm">
                  {agentStatus.task_plan.goal}
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex space-x-2">
              {agentStatus.status === 'active' && onInterrupt && (
                <Button 
                  variant="outline" 
                  onClick={onInterrupt}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Interrupt Agent
                </Button>
              )}
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {agentStatus.recent_activities.length > 0 ? (
              agentStatus.recent_activities.map((activity, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-3 py-1">
                  <div className="flex justify-between items-start">
                    <div className="text-sm">
                      <span className="font-medium">{activity.type}:</span>
                      <span className="ml-1">{activity.content}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">No recent activities</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

