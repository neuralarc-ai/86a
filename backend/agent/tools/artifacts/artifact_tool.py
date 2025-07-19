"""
Helium AI Agent - Artifact Creation Tool
Implements Manus.im-style artifact creation workflows

Developed by NeuralArc Inc (neuralarc.ai)
"""

import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Literal
from pathlib import Path

from pydantic import BaseModel, Field


class ArtifactPhase(BaseModel):
    """Represents a phase in the artifact creation workflow"""
    id: str
    title: str
    description: str
    status: Literal["pending", "in_progress", "completed", "failed"] = "pending"
    progress: float = 0.0
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    outputs: List[str] = []
    errors: List[str] = []


class ArtifactWorkflow(BaseModel):
    """Represents the complete artifact creation workflow"""
    id: str
    artifact_type: Literal["image", "slides", "webpage", "visualization", "playbook", "document"]
    title: str
    description: str
    user_prompt: str
    phases: List[ArtifactPhase]
    status: Literal["planning", "executing", "completed", "failed"] = "planning"
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    output_files: List[str] = []
    metadata: Dict[str, Any] = {}


class ArtifactCreationTool:
    """
    Tool for creating structured artifacts with Manus.im-style workflows
    Developed by NeuralArc Inc (neuralarc.ai)
    """
    
    def __init__(self):
        self.workflows: Dict[str, ArtifactWorkflow] = {}
        self.active_workflow: Optional[str] = None
        self.storage_path = Path(os.getenv('ARTIFACT_STORAGE_PATH', '/tmp/artifacts'))
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
    async def create_artifact(
        self,
        artifact_type: str,
        user_prompt: str,
        title: Optional[str] = None,
        workspace_id: Optional[str] = None
    ) -> str:
        """
        Create a new artifact using structured workflow
        
        Args:
            artifact_type: Type of artifact to create (image, slides, webpage, etc.)
            user_prompt: User's description of what they want to create
            title: Optional title for the artifact
            workspace_id: Daytona workspace ID for execution
            
        Returns:
            JSON string containing workflow information and initial status
        """
        
        # Generate unique workflow ID
        workflow_id = str(uuid.uuid4())
        
        # Create workflow based on artifact type
        workflow = self._create_workflow(
            workflow_id=workflow_id,
            artifact_type=artifact_type,
            user_prompt=user_prompt,
            title=title or f"{artifact_type.title()} Creation"
        )
        
        # Store workflow
        self.workflows[workflow_id] = workflow
        self.active_workflow = workflow_id
        
        # Start execution
        asyncio.create_task(self._execute_workflow(workflow_id, workspace_id))
        
        return json.dumps({
            "workflow_id": workflow_id,
            "status": "started",
            "artifact_type": artifact_type,
            "title": workflow.title,
            "phases": [
                {
                    "id": phase.id,
                    "title": phase.title,
                    "description": phase.description,
                    "status": phase.status
                }
                for phase in workflow.phases
            ]
        })
    
    def _create_workflow(
        self,
        workflow_id: str,
        artifact_type: str,
        user_prompt: str,
        title: str
    ) -> ArtifactWorkflow:
        """Create workflow with phases based on artifact type"""
        
        # Define phases based on artifact type
        phase_templates = {
            "slides": [
                ("research", "Research and Content Gathering", "Gather information and visual assets for the presentation"),
                ("outline", "Structure and Outline", "Create presentation outline and slide structure"),
                ("design", "Design and Styling", "Apply professional design and visual styling"),
                ("content", "Content Creation", "Generate slide content with academic depth"),
                ("finalize", "Finalization and Export", "Finalize presentation and prepare for delivery")
            ],
            "webpage": [
                ("research", "Research and Planning", "Research content and plan website structure"),
                ("design", "Design and Layout", "Create visual design and layout structure"),
                ("development", "Development and Coding", "Implement HTML, CSS, and JavaScript"),
                ("content", "Content Integration", "Integrate content and optimize for web"),
                ("testing", "Testing and Optimization", "Test functionality and optimize performance")
            ],
            "visualization": [
                ("data_analysis", "Data Analysis", "Analyze data and identify visualization requirements"),
                ("chart_design", "Chart Design", "Design appropriate chart types and layouts"),
                ("implementation", "Implementation", "Create interactive visualizations"),
                ("styling", "Styling and Polish", "Apply professional styling and branding"),
                ("export", "Export and Delivery", "Export in multiple formats for delivery")
            ],
            "image": [
                ("concept", "Concept Development", "Develop visual concept and style direction"),
                ("composition", "Composition Planning", "Plan image composition and elements"),
                ("generation", "Image Generation", "Generate or create visual elements"),
                ("refinement", "Refinement and Editing", "Refine and edit for quality"),
                ("finalization", "Finalization", "Finalize image and prepare for delivery")
            ],
            "playbook": [
                ("research", "Research and Analysis", "Research best practices and methodologies"),
                ("structure", "Structure Development", "Create playbook structure and sections"),
                ("content", "Content Creation", "Write detailed procedures and guidelines"),
                ("formatting", "Formatting and Design", "Apply professional formatting and design"),
                ("review", "Review and Validation", "Review for accuracy and completeness")
            ],
            "document": [
                ("research", "Research and Information Gathering", "Gather relevant information and sources"),
                ("outline", "Document Structure", "Create document outline and organization"),
                ("writing", "Content Writing", "Write comprehensive document content"),
                ("formatting", "Formatting and Design", "Apply professional formatting and styling"),
                ("review", "Review and Finalization", "Review, edit, and finalize document")
            ]
        }
        
        # Get phases for artifact type (default to document if not found)
        phases_template = phase_templates.get(artifact_type, phase_templates["document"])
        
        # Create phase objects
        phases = [
            ArtifactPhase(
                id=phase_id,
                title=title,
                description=description
            )
            for phase_id, title, description in phases_template
        ]
        
        return ArtifactWorkflow(
            id=workflow_id,
            artifact_type=artifact_type,
            title=title,
            description=f"Creating {artifact_type} based on: {user_prompt}",
            user_prompt=user_prompt,
            phases=phases
        )
    
    async def _execute_workflow(self, workflow_id: str, workspace_id: Optional[str] = None):
        """Execute the artifact creation workflow"""
        
        workflow = self.workflows[workflow_id]
        workflow.status = "executing"
        
        try:
            # Execute each phase
            for phase in workflow.phases:
                await self._execute_phase(workflow, phase, workspace_id)
                
            workflow.status = "completed"
            
        except Exception as e:
            workflow.status = "failed"
            # Add error to the current phase
            current_phase = next((p for p in workflow.phases if p.status == "in_progress"), None)
            if current_phase:
                current_phase.status = "failed"
                current_phase.errors.append(str(e))
                current_phase.end_time = datetime.now()
        
        workflow.updated_at = datetime.now()
    
    async def _execute_phase(self, workflow: ArtifactWorkflow, phase: ArtifactPhase, workspace_id: Optional[str] = None):
        """Execute a single phase of the workflow"""
        
        phase.status = "in_progress"
        phase.start_time = datetime.now()
        phase.progress = 0.0
        
        try:
            # Simulate phase execution with progress updates
            for i in range(10):
                await asyncio.sleep(0.5)  # Simulate work
                phase.progress = (i + 1) * 10.0
                
                # Add some outputs during execution
                if i == 3:
                    phase.outputs.append(f"Started {phase.title.lower()}")
                elif i == 7:
                    phase.outputs.append(f"Processing {workflow.artifact_type} content")
                elif i == 9:
                    phase.outputs.append(f"Completed {phase.title.lower()}")
            
            # Mark phase as completed
            phase.status = "completed"
            phase.progress = 100.0
            phase.end_time = datetime.now()
            
            # Add output files for final phase
            if phase.id == workflow.phases[-1].id:
                workflow.output_files = self._generate_output_files(workflow)
            
        except Exception as e:
            phase.status = "failed"
            phase.errors.append(str(e))
            phase.end_time = datetime.now()
            raise
    
    def _generate_output_files(self, workflow: ArtifactWorkflow) -> List[str]:
        """Generate output files based on artifact type"""
        
        base_name = workflow.title.lower().replace(' ', '_')
        
        file_templates = {
            "slides": [f"{base_name}.pptx", f"{base_name}.pdf", f"{base_name}_notes.txt"],
            "webpage": [f"{base_name}.html", f"{base_name}.css", f"{base_name}.js"],
            "visualization": [f"{base_name}.html", f"{base_name}.png", f"{base_name}_data.json"],
            "image": [f"{base_name}.png", f"{base_name}_hd.png", f"{base_name}_metadata.json"],
            "playbook": [f"{base_name}.pdf", f"{base_name}.docx", f"{base_name}_checklist.txt"],
            "document": [f"{base_name}.pdf", f"{base_name}.docx", f"{base_name}_summary.txt"]
        }
        
        return file_templates.get(workflow.artifact_type, [f"{base_name}.txt"])
    
    def get_workflow_status(self, workflow_id: str) -> Dict[str, Any]:
        """Get the current status of a workflow"""
        
        if workflow_id not in self.workflows:
            return {"error": "Workflow not found"}
        
        workflow = self.workflows[workflow_id]
        
        return {
            "workflow_id": workflow.id,
            "status": workflow.status,
            "artifact_type": workflow.artifact_type,
            "title": workflow.title,
            "description": workflow.description,
            "created_at": workflow.created_at.isoformat(),
            "updated_at": workflow.updated_at.isoformat(),
            "phases": [
                {
                    "id": phase.id,
                    "title": phase.title,
                    "description": phase.description,
                    "status": phase.status,
                    "progress": phase.progress,
                    "outputs": phase.outputs,
                    "errors": phase.errors,
                    "start_time": phase.start_time.isoformat() if phase.start_time else None,
                    "end_time": phase.end_time.isoformat() if phase.end_time else None
                }
                for phase in workflow.phases
            ],
            "output_files": workflow.output_files,
            "metadata": workflow.metadata
        }
    
    def list_workflows(self) -> List[Dict[str, Any]]:
        """List all workflows"""
        
        return [
            {
                "workflow_id": workflow.id,
                "status": workflow.status,
                "artifact_type": workflow.artifact_type,
                "title": workflow.title,
                "created_at": workflow.created_at.isoformat(),
                "updated_at": workflow.updated_at.isoformat()
            }
            for workflow in self.workflows.values()
        ]
    
    async def interrupt_workflow(self, workflow_id: str, message: str = "") -> Dict[str, Any]:
        """Interrupt a running workflow"""
        
        if workflow_id not in self.workflows:
            return {"error": "Workflow not found"}
        
        workflow = self.workflows[workflow_id]
        
        if workflow.status != "executing":
            return {"error": "Workflow is not currently executing"}
        
        # Mark workflow as failed
        workflow.status = "failed"
        workflow.updated_at = datetime.now()
        
        # Mark current phase as failed
        current_phase = next((p for p in workflow.phases if p.status == "in_progress"), None)
        if current_phase:
            current_phase.status = "failed"
            current_phase.errors.append(f"Interrupted by user: {message}")
            current_phase.end_time = datetime.now()
        
        return {"status": "interrupted", "message": "Workflow has been interrupted"}


# Global instance
artifact_tool = ArtifactCreationTool()

