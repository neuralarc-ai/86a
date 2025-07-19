"""
Helium AI Agent - Artifacts API
Provides REST endpoints for artifact creation and management

Developed by NeuralArc Inc (neuralarc.ai)
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
import uuid
from datetime import datetime
from pathlib import Path

from agent.tools.artifacts.artifact_tool import artifact_tool
from utils.logger import logger

# Initialize router
router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])

# Request/Response Models
class CreateArtifactRequest(BaseModel):
    artifact_type: str
    user_prompt: str
    title: Optional[str] = None
    workspace_id: Optional[str] = None

class ArtifactStatusResponse(BaseModel):
    workflow_id: str
    status: str
    artifact_type: str
    title: str
    description: str
    created_at: str
    updated_at: str
    phases: List[Dict[str, Any]]
    output_files: List[str]
    metadata: Dict[str, Any]

class InterruptWorkflowRequest(BaseModel):
    message: Optional[str] = ""

class ShareArtifactRequest(BaseModel):
    workflow_id: str
    title: str
    description: str
    tags: List[str] = []
    is_public: bool = True

class SharedArtifact(BaseModel):
    id: str
    title: str
    description: str
    artifact_type: str
    author: Dict[str, Any]
    created_at: str
    updated_at: str
    tags: List[str]
    stats: Dict[str, int]
    is_featured: bool
    is_public: bool

# Endpoints

@router.post("/create")
async def create_artifact(request: CreateArtifactRequest):
    """Create a new artifact with structured workflow"""
    try:
        result = await artifact_tool.create_artifact(
            artifact_type=request.artifact_type,
            user_prompt=request.user_prompt,
            title=request.title,
            workspace_id=request.workspace_id
        )
        
        return JSONResponse(content=json.loads(result))
    
    except Exception as e:
        logger.error(f"Failed to create artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{workflow_id}")
async def get_artifact_status(workflow_id: str):
    """Get the current status of an artifact creation workflow"""
    try:
        result = artifact_tool.get_workflow_status(workflow_id)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get artifact status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_artifacts():
    """List all artifact workflows"""
    try:
        workflows = artifact_tool.list_workflows()
        return JSONResponse(content={"workflows": workflows})
    
    except Exception as e:
        logger.error(f"Failed to list artifacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interrupt/{workflow_id}")
async def interrupt_workflow(workflow_id: str, request: InterruptWorkflowRequest):
    """Interrupt a running workflow"""
    try:
        result = await artifact_tool.interrupt_workflow(workflow_id, request.message)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return JSONResponse(content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to interrupt workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{workflow_id}/{filename}")
async def get_artifact_file(workflow_id: str, filename: str):
    """Get an artifact file"""
    try:
        # Check if workflow exists
        workflow_status = artifact_tool.get_workflow_status(workflow_id)
        if "error" in workflow_status:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Construct file path
        storage_path = Path(os.getenv('ARTIFACT_STORAGE_PATH', '/tmp/artifacts'))
        file_path = storage_path / workflow_id / filename
        
        if not file_path.exists():
            # For demo purposes, return a sample HTML file
            if filename.endswith('.html'):
                sample_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{workflow_status['title']}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }}
        .artifact-info {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 0.9em;
        }}
        .badge {{
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8em;
            display: inline-block;
            margin: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>{workflow_status['title']}</h1>
        
        <div class="artifact-info">
            <h3>Artifact Information</h3>
            <p><strong>Type:</strong> <span class="badge">{workflow_status['artifact_type'].upper()}</span></p>
            <p><strong>Description:</strong> {workflow_status['description']}</p>
            <p><strong>Created:</strong> {workflow_status['created_at']}</p>
            <p><strong>Status:</strong> <span class="badge">{workflow_status['status'].upper()}</span></p>
        </div>
        
        <div class="artifact-info">
            <h3>Sample Content</h3>
            <p>This is a sample artifact created by Helium AI Agent. The actual content would be generated based on your specific requirements and the artifact type selected.</p>
            <p>Helium AI Agent uses advanced AI workflows to create professional-quality artifacts including presentations, web pages, visualizations, documents, and more.</p>
        </div>
        
        <div class="footer">
            <p>Created with <strong>Helium AI Agent</strong></p>
            <p>Developed by <strong>NeuralArc Inc</strong> • <a href="https://neuralarc.ai" target="_blank">neuralarc.ai</a></p>
        </div>
    </div>
</body>
</html>
                """
                return StreamingResponse(
                    iter([sample_content.encode()]),
                    media_type="text/html",
                    headers={"Content-Disposition": f"inline; filename={filename}"}
                )
            else:
                raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get artifact file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{workflow_id}/{filename}")
async def download_artifact_file(workflow_id: str, filename: str):
    """Download an artifact file"""
    try:
        # Check if workflow exists
        workflow_status = artifact_tool.get_workflow_status(workflow_id)
        if "error" in workflow_status:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Construct file path
        storage_path = Path(os.getenv('ARTIFACT_STORAGE_PATH', '/tmp/artifacts'))
        file_path = storage_path / workflow_id / filename
        
        if not file_path.exists():
            # For demo purposes, create a sample file
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, 'w') as f:
                f.write(f"Sample content for {filename}\nGenerated by Helium AI Agent\nDeveloped by NeuralArc Inc")
        
        return FileResponse(
            file_path,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download artifact file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/share")
async def share_artifact(request: ShareArtifactRequest):
    """Share an artifact to the community gallery"""
    try:
        # Check if workflow exists
        workflow_status = artifact_tool.get_workflow_status(request.workflow_id)
        if "error" in workflow_status:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Create shared artifact entry (in a real implementation, this would be stored in database)
        shared_artifact = {
            "id": str(uuid.uuid4()),
            "workflow_id": request.workflow_id,
            "title": request.title,
            "description": request.description,
            "artifact_type": workflow_status["artifact_type"],
            "tags": request.tags,
            "is_public": request.is_public,
            "created_at": datetime.now().isoformat(),
            "author": {"name": "Anonymous User"},  # In real implementation, get from auth
            "stats": {"views": 0, "likes": 0, "downloads": 0}
        }
        
        return JSONResponse(content={
            "status": "shared",
            "shared_artifact": shared_artifact
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to share artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gallery")
async def get_artifact_gallery():
    """Get community gallery of shared artifacts"""
    try:
        # In a real implementation, this would query the database
        # For demo purposes, return mock data
        mock_artifacts = [
            {
                "id": "1",
                "title": "Tang Dynasty Historical Presentation",
                "description": "Comprehensive slides about the Tang Dynasty with interactive maps and detailed timelines",
                "artifact_type": "slides",
                "author": {"name": "Dr. Sarah Chen"},
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "tags": ["history", "education", "china", "dynasty", "academic"],
                "stats": {"views": 1250, "likes": 89, "downloads": 45},
                "is_featured": True,
                "is_public": True
            },
            {
                "id": "2",
                "title": "Modern SaaS Landing Page",
                "description": "Clean, responsive landing page design for SaaS products with conversion optimization",
                "artifact_type": "webpage",
                "author": {"name": "Alex Rodriguez"},
                "created_at": "2024-01-14T15:45:00Z",
                "updated_at": "2024-01-14T15:45:00Z",
                "tags": ["web design", "landing page", "saas", "responsive", "conversion"],
                "stats": {"views": 890, "likes": 67, "downloads": 34},
                "is_featured": False,
                "is_public": True
            },
            {
                "id": "3",
                "title": "Sales Performance Dashboard",
                "description": "Interactive dashboard showing quarterly sales metrics with real-time data visualization",
                "artifact_type": "visualization",
                "author": {"name": "Maria Santos"},
                "created_at": "2024-01-13T09:20:00Z",
                "updated_at": "2024-01-13T09:20:00Z",
                "tags": ["dashboard", "sales", "analytics", "charts", "business"],
                "stats": {"views": 2100, "likes": 156, "downloads": 78},
                "is_featured": True,
                "is_public": True
            }
        ]
        
        return JSONResponse(content={"artifacts": mock_artifacts})
    
    except Exception as e:
        logger.error(f"Failed to get artifact gallery: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/like/{artifact_id}")
async def like_artifact(artifact_id: str):
    """Like a shared artifact"""
    try:
        # In a real implementation, this would update the database
        return JSONResponse(content={
            "status": "liked",
            "artifact_id": artifact_id
        })
    
    except Exception as e:
        logger.error(f"Failed to like artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/view/{artifact_id}")
async def view_shared_artifact(artifact_id: str):
    """View a shared artifact (increments view count)"""
    try:
        # In a real implementation, this would query the database and increment view count
        mock_artifact = {
            "id": artifact_id,
            "title": "Sample Shared Artifact",
            "description": "This is a sample shared artifact from the Helium AI community",
            "artifact_type": "webpage",
            "author": {"name": "Community User"},
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "tags": ["sample", "demo", "community"],
            "stats": {"views": 100, "likes": 10, "downloads": 5},
            "is_featured": False,
            "is_public": True,
            "content_url": f"/api/artifacts/files/sample/{artifact_id}.html"
        }
        
        return JSONResponse(content=mock_artifact)
    
    except Exception as e:
        logger.error(f"Failed to view shared artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for artifacts API"""
    return JSONResponse(content={
        "status": "healthy",
        "service": "Helium AI Artifacts API",
        "version": "1.0.0",
        "developer": "NeuralArc Inc",
        "website": "https://neuralarc.ai"
    })

