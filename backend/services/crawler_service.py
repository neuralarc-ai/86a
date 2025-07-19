"""
Manus-Style Web Crawler Service for Suna Integration

This service provides web crawling capabilities integrated with the Suna platform,
following Manus AI patterns for advanced web scraping and data extraction.

Author: Neural Arc Inc (neuralarc.ai)
Date: July 19, 2025
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
import uuid

from agent.tools.manus_crawler_tool import (
    ManusCrawler, CrawlConfig, CrawlJob, CrawlStatus, ExtractionType
)
from agent.tools.crawler_config import CrawlerConfig
from utils.auth_utils import get_current_user_id_from_jwt
from utils.logger import logger

# Initialize router
router = APIRouter(prefix="/crawler", tags=["crawler"])

# In-memory job storage (in production, use database)
active_jobs: Dict[str, CrawlJob] = {}
job_results: Dict[str, List[Dict]] = {}

class CrawlRequest(BaseModel):
    """Request model for crawling operations"""
    urls: List[str] = Field(..., description="List of URLs to crawl")
    max_pages: int = Field(default=10, ge=1, le=100, description="Maximum pages to crawl")
    max_depth: int = Field(default=3, ge=1, le=5, description="Maximum crawl depth")
    extract_types: List[str] = Field(default=["text", "links"], description="Types of data to extract")
    delay_range: List[int] = Field(default=[1, 3], description="Delay range between requests")
    timeout: int = Field(default=30, ge=5, le=120, description="Request timeout in seconds")
    headless: bool = Field(default=True, description="Run browser in headless mode")
    use_stealth: bool = Field(default=True, description="Use stealth mode to avoid detection")
    respect_robots: bool = Field(default=True, description="Respect robots.txt")
    custom_headers: Optional[Dict[str, str]] = Field(default=None, description="Custom HTTP headers")

class CrawlResponse(BaseModel):
    """Response model for crawl job creation"""
    job_id: str
    status: str
    message: str
    estimated_time: Optional[str] = None

class CrawlJobStatus(BaseModel):
    """Model for crawl job status"""
    job_id: str
    status: str
    progress: float
    pages_crawled: int
    total_pages: int
    results_count: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None

@router.post("/start", response_model=CrawlResponse)
async def start_crawl(
    request: CrawlRequest,
    background_tasks: BackgroundTasks,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Start a new crawling job"""
    try:
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Convert extract types to enum
        extract_types = []
        for extract_type in request.extract_types:
            try:
                extract_types.append(ExtractionType(extract_type.lower()))
            except ValueError:
                logger.warning(f"Unknown extraction type: {extract_type}")
        
        # Create crawl configuration
        config = CrawlConfig(
            max_pages=request.max_pages,
            max_depth=request.max_depth,
            delay_range=tuple(request.delay_range),
            timeout=request.timeout,
            headless=request.headless,
            use_stealth=request.use_stealth,
            respect_robots=request.respect_robots,
            extract_types=extract_types,
            custom_headers=request.custom_headers or {}
        )
        
        # Create crawl job
        job = CrawlJob(
            id=job_id,
            urls=request.urls,
            config=config,
            status=CrawlStatus.PENDING,
            results=[],
            created_at=datetime.now()
        )
        
        # Store job
        active_jobs[job_id] = job
        job_results[job_id] = []
        
        # Start crawling in background
        background_tasks.add_task(execute_crawl_job, job_id, current_user_id)
        
        # Estimate completion time
        estimated_pages = min(request.max_pages, len(request.urls) * (2 ** request.max_depth))
        avg_delay = sum(request.delay_range) / 2
        estimated_time = f"{int((estimated_pages * avg_delay) / 60)} minutes"
        
        logger.info(f"Started crawl job {job_id} for user {current_user_id}")
        
        return CrawlResponse(
            job_id=job_id,
            status="started",
            message=f"Crawl job started successfully. Estimated completion: {estimated_time}",
            estimated_time=estimated_time
        )
        
    except Exception as e:
        logger.error(f"Failed to start crawl job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start crawl job: {str(e)}")

@router.get("/status/{job_id}", response_model=CrawlJobStatus)
async def get_crawl_status(
    job_id: str,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get the status of a crawling job"""
    try:
        if job_id not in active_jobs:
            raise HTTPException(status_code=404, detail="Crawl job not found")
        
        job = active_jobs[job_id]
        results = job_results.get(job_id, [])
        
        # Calculate progress
        progress = 0.0
        if job.config.max_pages > 0:
            progress = min(100.0, (len(results) / job.config.max_pages) * 100)
        
        return CrawlJobStatus(
            job_id=job_id,
            status=job.status.value,
            progress=progress,
            pages_crawled=len(results),
            total_pages=job.config.max_pages,
            results_count=len(results),
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get crawl status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get crawl status: {str(e)}")

@router.get("/results/{job_id}")
async def get_crawl_results(
    job_id: str,
    page: int = 1,
    limit: int = 50,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get the results of a crawling job"""
    try:
        if job_id not in active_jobs:
            raise HTTPException(status_code=404, detail="Crawl job not found")
        
        results = job_results.get(job_id, [])
        
        # Pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_results = results[start_idx:end_idx]
        
        return {
            "job_id": job_id,
            "total_results": len(results),
            "page": page,
            "limit": limit,
            "results": paginated_results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get crawl results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get crawl results: {str(e)}")

@router.post("/stop/{job_id}")
async def stop_crawl(
    job_id: str,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Stop a running crawling job"""
    try:
        if job_id not in active_jobs:
            raise HTTPException(status_code=404, detail="Crawl job not found")
        
        job = active_jobs[job_id]
        
        if job.status in [CrawlStatus.COMPLETED, CrawlStatus.FAILED]:
            return {"message": "Job already completed"}
        
        # Update job status
        job.status = CrawlStatus.PAUSED
        job.completed_at = datetime.now()
        
        logger.info(f"Stopped crawl job {job_id} for user {current_user_id}")
        
        return {"message": "Crawl job stopped successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to stop crawl job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop crawl job: {str(e)}")

@router.delete("/job/{job_id}")
async def delete_crawl_job(
    job_id: str,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Delete a crawling job and its results"""
    try:
        if job_id not in active_jobs:
            raise HTTPException(status_code=404, detail="Crawl job not found")
        
        # Remove job and results
        del active_jobs[job_id]
        if job_id in job_results:
            del job_results[job_id]
        
        logger.info(f"Deleted crawl job {job_id} for user {current_user_id}")
        
        return {"message": "Crawl job deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete crawl job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete crawl job: {str(e)}")

@router.get("/jobs")
async def list_crawl_jobs(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """List all crawling jobs for the current user"""
    try:
        jobs = []
        for job_id, job in active_jobs.items():
            results = job_results.get(job_id, [])
            progress = 0.0
            if job.config.max_pages > 0:
                progress = min(100.0, (len(results) / job.config.max_pages) * 100)
            
            jobs.append({
                "job_id": job_id,
                "status": job.status.value,
                "progress": progress,
                "pages_crawled": len(results),
                "total_pages": job.config.max_pages,
                "created_at": job.created_at,
                "urls": job.urls[:3]  # Show first 3 URLs
            })
        
        return {"jobs": jobs}
        
    except Exception as e:
        logger.error(f"Failed to list crawl jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list crawl jobs: {str(e)}")

async def execute_crawl_job(job_id: str, user_id: str):
    """Execute a crawling job in the background"""
    try:
        job = active_jobs[job_id]
        job.status = CrawlStatus.RUNNING
        job.started_at = datetime.now()
        
        # Initialize crawler
        crawler = ManusCrawler()
        
        # Execute crawling
        results = await crawler.crawl_urls(job.urls, job.config)
        
        # Store results
        job_results[job_id] = [
            {
                "url": result.url,
                "status_code": result.status_code,
                "title": result.title,
                "content": result.content[:1000],  # Truncate for storage
                "links": result.links,
                "images": result.images,
                "metadata": result.metadata,
                "timestamp": result.timestamp.isoformat(),
                "processing_time": result.processing_time
            }
            for result in results
        ]
        
        # Update job status
        job.status = CrawlStatus.COMPLETED
        job.completed_at = datetime.now()
        job.results = results
        
        logger.info(f"Completed crawl job {job_id} with {len(results)} results")
        
    except Exception as e:
        logger.error(f"Crawl job {job_id} failed: {str(e)}")
        job = active_jobs.get(job_id)
        if job:
            job.status = CrawlStatus.FAILED
            job.completed_at = datetime.now()

