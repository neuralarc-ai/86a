import React from 'react';
import { SiteHeader } from '@/components/thread/thread-site-header';
import { FileViewerModal } from '@/components/thread/file-viewer-modal';
import { ToolCallSidePanel } from '@/components/thread/tool-call-side-panel';
import { BillingErrorAlert } from '@/components/billing/usage-limit-alert';
import { Project } from '@/lib/api';
import { ApiMessageType, BillingData } from '../_types';
import { ToolCallInput } from '@/components/thread/tool-call-side-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';

interface ThreadLayoutProps {
  children: React.ReactNode;
  threadId: string;
  projectName: string;
  projectId: string;
  project: Project | null;
  sandboxId: string | null;
  isSidePanelOpen: boolean;
  onToggleSidePanel: () => void;
  onProjectRenamed?: (newName: string) => void;
  onViewFiles: (filePath?: string, filePathList?: string[]) => void;
  fileViewerOpen: boolean;
  setFileViewerOpen: (open: boolean) => void;
  fileToView: string | null;
  filePathList?: string[];
  toolCalls: ToolCallInput[];
  messages: ApiMessageType[];
  externalNavIndex?: number;
  agentStatus: 'idle' | 'running' | 'connecting' | 'error';
  currentToolIndex: number;
  onSidePanelNavigate: (index: number) => void;
  onSidePanelClose: () => void;
  renderAssistantMessage: (assistantContent?: string, toolContent?: string) => React.ReactNode;
  renderToolResult: (toolContent?: string, isSuccess?: boolean) => React.ReactNode;
  isLoading: boolean;
  showBillingAlert: boolean;
  billingData: BillingData;
  onDismissBilling: () => void;
  debugMode: boolean;
  isMobile: boolean;
  initialLoadCompleted: boolean;
  agentName?: string;
}

export function ThreadLayout({
  children,
  threadId,
  projectName,
  projectId,
  project,
  sandboxId,
  isSidePanelOpen,
  onToggleSidePanel,
  onProjectRenamed,
  onViewFiles,
  fileViewerOpen,
  setFileViewerOpen,
  fileToView,
  filePathList,
  toolCalls,
  messages,
  externalNavIndex,
  agentStatus,
  currentToolIndex,
  onSidePanelNavigate,
  onSidePanelClose,
  renderAssistantMessage,
  renderToolResult,
  isLoading,
  showBillingAlert,
  billingData,
  onDismissBilling,
  debugMode,
  isMobile,
  initialLoadCompleted,
  agentName
}: ThreadLayoutProps) {
  const isMobileDevice = useIsMobile();
  const { state: leftSidebarState } = useSidebar();
  return (
    <div className="flex h-screen overflow-hidden">
      {debugMode && (
        <div className="fixed top-16 right-4 bg-amber-500 text-black text-xs px-2 py-1 rounded-md shadow-md z-50">
          Debug Mode
        </div>
      )}

      {/* Responsive layout: side-by-side on desktop, overlay on mobile */}
      {isSidePanelOpen && !isMobileDevice ? (
        <>
          <div className="flex flex-col h-full w-[60%] min-w-[350px] transition-all duration-200 ease-in-out">
            <div className={`w-full max-w-3xl ${leftSidebarState === 'collapsed' ? 'ml-24' : 'ml-6'}`}>
              <SiteHeader
                threadId={threadId}
                projectName={projectName}
                projectId={projectId}
                onViewFiles={onViewFiles}
                onToggleSidePanel={onToggleSidePanel}
                onProjectRenamed={onProjectRenamed}
                isMobileView={isMobile}
                debugMode={debugMode}
              />
            </div>
            <div className="flex flex-col flex-1 w-full h-full justify-between">
              <div className="flex-1 w-full flex flex-col justify-start h-0">
                <div className="w-full max-w-3xl ml-8 flex flex-col flex-1 h-0 gap-4 pb-10">
                  {children}
                </div>
              </div>
            </div>
          </div>
          <div className="h-full w-[40%] bg-background border-l p-4 border-border overflow-hidden fixed right-0 top-0" style={{height: '100vh', zIndex: 40}}>
            <ToolCallSidePanel
              isOpen={isSidePanelOpen && initialLoadCompleted}
              onClose={onSidePanelClose}
              toolCalls={toolCalls}
              messages={messages}
              externalNavigateToIndex={externalNavIndex}
              agentStatus={agentStatus}
              currentIndex={currentToolIndex}
              onNavigate={onSidePanelNavigate}
              project={project || undefined}
              renderAssistantMessage={renderAssistantMessage}
              renderToolResult={renderToolResult}
              isLoading={!initialLoadCompleted || isLoading}
              onFileClick={onViewFiles}
              agentName={agentName}
              inlineMode={true}
            />
          </div>
        </>
      ) : (
        <div
          className={
            'flex flex-col flex-1 overflow-hidden transition-all duration-200 ease-in-out' +
            ((!initialLoadCompleted || isSidePanelOpen) && isMobileDevice
              ? ' mr-[90%] sm:mr-[450px] md:mr-[500px] lg:mr-[550px] xl:mr-[650px]'
              : '')
          }
        >
          <SiteHeader
            threadId={threadId}
            projectName={projectName}
            projectId={projectId}
            onViewFiles={onViewFiles}
            onToggleSidePanel={onToggleSidePanel}
            onProjectRenamed={onProjectRenamed}
            isMobileView={isMobile}
            debugMode={debugMode}
          />
          {children}
          {/* Overlay mode for mobile or when not open */}
          <ToolCallSidePanel
            isOpen={isSidePanelOpen && initialLoadCompleted && isMobileDevice}
            onClose={onSidePanelClose}
            toolCalls={toolCalls}
            messages={messages}
            externalNavigateToIndex={externalNavIndex}
            agentStatus={agentStatus}
            currentIndex={currentToolIndex}
            onNavigate={onSidePanelNavigate}
            project={project || undefined}
            renderAssistantMessage={renderAssistantMessage}
            renderToolResult={renderToolResult}
            isLoading={!initialLoadCompleted || isLoading}
            onFileClick={onViewFiles}
            agentName={agentName}
            inlineMode={false}
          />
        </div>
      )}

      {sandboxId && (
        <FileViewerModal
          open={fileViewerOpen}
          onOpenChange={setFileViewerOpen}
          sandboxId={sandboxId}
          initialFilePath={fileToView}
          project={project || undefined}
          filePathList={filePathList}
        />
      )}

      <BillingErrorAlert
        message={billingData.message}
        currentUsage={billingData.currentUsage}
        limit={billingData.limit}
        accountId={billingData.accountId}
        onDismiss={onDismissBilling}
        isOpen={showBillingAlert}
      />
    </div>
  );
} 