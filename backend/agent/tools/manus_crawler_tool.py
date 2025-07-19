"""
Manus-Style Web Crawler Tool for Suna Integration

This module implements a comprehensive web crawler/scraper tool based on Manus AI patterns,
designed for seamless integration into the Suna.so platform.

Author: Neural Arc Inc (neuralarc.ai)
Date: July 19, 2025
"""

import asyncio
import json
import logging
import random
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import os
import hashlib
import base64

from playwright.async_api import async_playwright, Browser, Page, BrowserContext
import aiohttp
from bs4 import BeautifulSoup
import pandas as pd
from urllib.parse import urljoin, urlparse, parse_qs
import re


class CrawlStatus(Enum):
    """Crawling job status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


class ExtractionType(Enum):
    """Data extraction type enumeration"""
    TEXT = "text"
    LINKS = "links"
    IMAGES = "images"
    TABLES = "tables"
    FORMS = "forms"
    STRUCTURED = "structured"
    CUSTOM = "custom"


@dataclass
class CrawlConfig:
    """Configuration for crawling operations"""
    max_pages: int = 10
    max_depth: int = 3
    delay_range: tuple = (1, 3)
    timeout: int = 30
    headless: bool = True
    use_stealth: bool = True
    respect_robots: bool = True
    follow_redirects: bool = True
    extract_types: List[ExtractionType] = None
    custom_headers: Dict[str, str] = None
    proxy_config: Dict[str, str] = None
    
    def __post_init__(self):
        if self.extract_types is None:
            self.extract_types = [ExtractionType.TEXT, ExtractionType.LINKS]
        if self.custom_headers is None:
            self.custom_headers = {}


@dataclass
class CrawlResult:
    """Result of a crawling operation"""
    url: str
    status_code: int
    title: str
    content: str
    links: List[str]
    images: List[str]
    metadata: Dict[str, Any]
    extracted_data: Dict[str, Any]
    timestamp: datetime
    processing_time: float
    error: Optional[str] = None


@dataclass
class CrawlJob:
    """Crawling job definition"""
    id: str
    urls: List[str]
    config: CrawlConfig
    status: CrawlStatus
    results: List[CrawlResult]
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    progress: float = 0.0


class UserAgentRotator:
    """Manages user agent rotation for anti-detection"""
    
    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36"
        ]
        self.current_index = 0
    
    def get_random_user_agent(self) -> str:
        """Get a random user agent string"""
        return random.choice(self.user_agents)
    
    def get_next_user_agent(self) -> str:
        """Get the next user agent in rotation"""
        user_agent = self.user_agents[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.user_agents)
        return user_agent


class AntiDetectionManager:
    """Manages anti-detection mechanisms"""
    
    def __init__(self):
        self.user_agent_rotator = UserAgentRotator()
        self.viewport_sizes = [
            (1920, 1080), (1366, 768), (1440, 900), (1536, 864), (1280, 720)
        ]
    
    async def apply_stealth_measures(self, page: Page, config: CrawlConfig):
        """Apply comprehensive stealth measures to the page"""
        
        if not config.use_stealth:
            return
        
        # Set random viewport size
        viewport = random.choice(self.viewport_sizes)
        await page.set_viewport_size(width=viewport[0], height=viewport[1])
        
        # Add stealth scripts
        await page.add_init_script("""
            // Override the navigator.webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Override the navigator.plugins property
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            
            // Override the navigator.languages property
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            
            // Override the screen.colorDepth property
            Object.defineProperty(screen, 'colorDepth', {
                get: () => 24,
            });
        """)
        
        # Set extra headers
        extra_headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            **config.custom_headers
        }
        await page.set_extra_http_headers(extra_headers)
    
    async def simulate_human_behavior(self, page: Page):
        """Simulate human-like behavior on the page"""
        
        # Random mouse movements
        for _ in range(random.randint(2, 5)):
            x = random.randint(100, 800)
            y = random.randint(100, 600)
            await page.mouse.move(x, y)
            await asyncio.sleep(random.uniform(0.1, 0.3))
        
        # Random scrolling
        for _ in range(random.randint(1, 3)):
            await page.mouse.wheel(0, random.randint(100, 500))
            await asyncio.sleep(random.uniform(0.5, 1.5))
        
        # Random delay
        await asyncio.sleep(random.uniform(1, 3))


class DataExtractor:
    """Intelligent data extraction from web pages"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def extract_data(self, page: Page, config: CrawlConfig) -> Dict[str, Any]:
        """Extract data from the page based on configuration"""
        
        extracted_data = {}
        
        try:
            # Get page content
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract based on configured types
            for extract_type in config.extract_types:
                if extract_type == ExtractionType.TEXT:
                    extracted_data['text'] = await self._extract_text(soup)
                elif extract_type == ExtractionType.LINKS:
                    extracted_data['links'] = await self._extract_links(page, soup)
                elif extract_type == ExtractionType.IMAGES:
                    extracted_data['images'] = await self._extract_images(page, soup)
                elif extract_type == ExtractionType.TABLES:
                    extracted_data['tables'] = await self._extract_tables(soup)
                elif extract_type == ExtractionType.FORMS:
                    extracted_data['forms'] = await self._extract_forms(soup)
                elif extract_type == ExtractionType.STRUCTURED:
                    extracted_data['structured'] = await self._extract_structured_data(soup)
            
            return extracted_data
            
        except Exception as e:
            self.logger.error(f"Error extracting data: {str(e)}")
            return {"error": str(e)}
    
    async def _extract_text(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract text content from the page"""
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Extract different text elements
        text_data = {
            'title': soup.title.string if soup.title else '',
            'headings': [h.get_text().strip() for h in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])],
            'paragraphs': [p.get_text().strip() for p in soup.find_all('p') if p.get_text().strip()],
            'body_text': soup.get_text().strip(),
            'meta_description': ''
        }
        
        # Extract meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            text_data['meta_description'] = meta_desc.get('content', '')
        
        return text_data
    
    async def _extract_links(self, page: Page, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract links from the page"""
        
        current_url = page.url
        links = []
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            absolute_url = urljoin(current_url, href)
            
            links.append({
                'url': absolute_url,
                'text': link.get_text().strip(),
                'title': link.get('title', ''),
                'rel': link.get('rel', [])
            })
        
        return links
    
    async def _extract_images(self, page: Page, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extract images from the page"""
        
        current_url = page.url
        images = []
        
        for img in soup.find_all('img'):
            src = img.get('src')
            if src:
                absolute_url = urljoin(current_url, src)
                images.append({
                    'url': absolute_url,
                    'alt': img.get('alt', ''),
                    'title': img.get('title', ''),
                    'width': img.get('width', ''),
                    'height': img.get('height', '')
                })
        
        return images
    
    async def _extract_tables(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract table data from the page"""
        
        tables = []
        
        for table in soup.find_all('table'):
            table_data = {
                'headers': [],
                'rows': [],
                'caption': ''
            }
            
            # Extract caption
            caption = table.find('caption')
            if caption:
                table_data['caption'] = caption.get_text().strip()
            
            # Extract headers
            header_row = table.find('tr')
            if header_row:
                headers = header_row.find_all(['th', 'td'])
                table_data['headers'] = [h.get_text().strip() for h in headers]
            
            # Extract rows
            rows = table.find_all('tr')[1:]  # Skip header row
            for row in rows:
                cells = row.find_all(['td', 'th'])
                table_data['rows'].append([cell.get_text().strip() for cell in cells])
            
            tables.append(table_data)
        
        return tables
    
    async def _extract_forms(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract form data from the page"""
        
        forms = []
        
        for form in soup.find_all('form'):
            form_data = {
                'action': form.get('action', ''),
                'method': form.get('method', 'GET').upper(),
                'fields': []
            }
            
            # Extract form fields
            for field in form.find_all(['input', 'select', 'textarea']):
                field_data = {
                    'type': field.get('type', field.name),
                    'name': field.get('name', ''),
                    'id': field.get('id', ''),
                    'placeholder': field.get('placeholder', ''),
                    'required': field.has_attr('required')
                }
                
                if field.name == 'select':
                    options = [opt.get_text().strip() for opt in field.find_all('option')]
                    field_data['options'] = options
                
                form_data['fields'].append(field_data)
            
            forms.append(form_data)
        
        return forms
    
    async def _extract_structured_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract structured data (JSON-LD, microdata, etc.)"""
        
        structured_data = {
            'json_ld': [],
            'microdata': [],
            'open_graph': {},
            'twitter_cards': {}
        }
        
        # Extract JSON-LD
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                data = json.loads(script.string)
                structured_data['json_ld'].append(data)
            except json.JSONDecodeError:
                continue
        
        # Extract Open Graph data
        for meta in soup.find_all('meta', property=re.compile(r'^og:')):
            property_name = meta.get('property')
            content = meta.get('content')
            if property_name and content:
                structured_data['open_graph'][property_name] = content
        
        # Extract Twitter Card data
        for meta in soup.find_all('meta', attrs={'name': re.compile(r'^twitter:')}):
            name = meta.get('name')
            content = meta.get('content')
            if name and content:
                structured_data['twitter_cards'][name] = content
        
        return structured_data


class CrawlerMemory:
    """File-based memory system for crawler state persistence"""
    
    def __init__(self, workspace_path: str):
        self.workspace_path = workspace_path
        self.jobs_dir = os.path.join(workspace_path, 'crawler_jobs')
        self.results_dir = os.path.join(workspace_path, 'crawler_results')
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure required directories exist"""
        os.makedirs(self.jobs_dir, exist_ok=True)
        os.makedirs(self.results_dir, exist_ok=True)
    
    async def save_job(self, job: CrawlJob):
        """Save crawl job to persistent storage"""
        job_file = os.path.join(self.jobs_dir, f"{job.id}.json")
        
        # Convert job to serializable format
        job_data = {
            'id': job.id,
            'urls': job.urls,
            'config': asdict(job.config),
            'status': job.status.value,
            'created_at': job.created_at.isoformat(),
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            'error_message': job.error_message,
            'progress': job.progress
        }
        
        with open(job_file, 'w') as f:
            json.dump(job_data, f, indent=2)
    
    async def load_job(self, job_id: str) -> Optional[CrawlJob]:
        """Load crawl job from persistent storage"""
        job_file = os.path.join(self.jobs_dir, f"{job_id}.json")
        
        if not os.path.exists(job_file):
            return None
        
        try:
            with open(job_file, 'r') as f:
                job_data = json.load(f)
            
            # Convert back to CrawlJob object
            config = CrawlConfig(**job_data['config'])
            
            job = CrawlJob(
                id=job_data['id'],
                urls=job_data['urls'],
                config=config,
                status=CrawlStatus(job_data['status']),
                results=[],  # Results loaded separately
                created_at=datetime.fromisoformat(job_data['created_at']),
                started_at=datetime.fromisoformat(job_data['started_at']) if job_data['started_at'] else None,
                completed_at=datetime.fromisoformat(job_data['completed_at']) if job_data['completed_at'] else None,
                error_message=job_data['error_message'],
                progress=job_data['progress']
            )
            
            # Load results
            job.results = await self.load_results(job_id)
            
            return job
            
        except Exception as e:
            logging.error(f"Error loading job {job_id}: {str(e)}")
            return None
    
    async def save_results(self, job_id: str, results: List[CrawlResult]):
        """Save crawl results to persistent storage"""
        results_file = os.path.join(self.results_dir, f"{job_id}_results.json")
        
        # Convert results to serializable format
        results_data = []
        for result in results:
            result_data = {
                'url': result.url,
                'status_code': result.status_code,
                'title': result.title,
                'content': result.content,
                'links': result.links,
                'images': result.images,
                'metadata': result.metadata,
                'extracted_data': result.extracted_data,
                'timestamp': result.timestamp.isoformat(),
                'processing_time': result.processing_time,
                'error': result.error
            }
            results_data.append(result_data)
        
        with open(results_file, 'w') as f:
            json.dump(results_data, f, indent=2)
    
    async def load_results(self, job_id: str) -> List[CrawlResult]:
        """Load crawl results from persistent storage"""
        results_file = os.path.join(self.results_dir, f"{job_id}_results.json")
        
        if not os.path.exists(results_file):
            return []
        
        try:
            with open(results_file, 'r') as f:
                results_data = json.load(f)
            
            results = []
            for result_data in results_data:
                result = CrawlResult(
                    url=result_data['url'],
                    status_code=result_data['status_code'],
                    title=result_data['title'],
                    content=result_data['content'],
                    links=result_data['links'],
                    images=result_data['images'],
                    metadata=result_data['metadata'],
                    extracted_data=result_data['extracted_data'],
                    timestamp=datetime.fromisoformat(result_data['timestamp']),
                    processing_time=result_data['processing_time'],
                    error=result_data['error']
                )
                results.append(result)
            
            return results
            
        except Exception as e:
            logging.error(f"Error loading results for job {job_id}: {str(e)}")
            return []


class ManusCrawlerAgent:
    """Main crawler agent implementing Manus-style iterative crawling"""
    
    def __init__(self, workspace_path: str = "/tmp/crawler_workspace"):
        self.workspace_path = workspace_path
        self.memory = CrawlerMemory(workspace_path)
        self.anti_detection = AntiDetectionManager()
        self.data_extractor = DataExtractor()
        self.logger = logging.getLogger(__name__)
        
        # Browser management
        self.playwright = None
        self.browser = None
        self.context = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._initialize_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self._cleanup_browser()
    
    async def _initialize_browser(self):
        """Initialize Playwright browser"""
        self.playwright = await async_playwright().start()
        
        # Launch browser with stealth settings
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        )
        
        # Create context with stealth settings
        self.context = await self.browser.new_context(
            user_agent=self.anti_detection.user_agent_rotator.get_random_user_agent(),
            viewport={'width': 1920, 'height': 1080},
            ignore_https_errors=True
        )
    
    async def _cleanup_browser(self):
        """Cleanup browser resources"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def create_crawl_job(self, urls: List[str], config: CrawlConfig) -> CrawlJob:
        """Create a new crawl job"""
        
        job_id = hashlib.md5(f"{urls}{datetime.now()}".encode()).hexdigest()
        
        job = CrawlJob(
            id=job_id,
            urls=urls,
            config=config,
            status=CrawlStatus.PENDING,
            results=[],
            created_at=datetime.now()
        )
        
        await self.memory.save_job(job)
        return job
    
    async def execute_crawl_job(self, job: CrawlJob) -> CrawlJob:
        """Execute a crawl job using Manus-style agent loop"""
        
        try:
            # Update job status
            job.status = CrawlStatus.RUNNING
            job.started_at = datetime.now()
            await self.memory.save_job(job)
            
            # Execute crawling loop
            await self._crawl_loop(job)
            
            # Mark job as completed
            job.status = CrawlStatus.COMPLETED
            job.completed_at = datetime.now()
            job.progress = 100.0
            
        except Exception as e:
            self.logger.error(f"Error executing crawl job {job.id}: {str(e)}")
            job.status = CrawlStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.now()
        
        finally:
            await self.memory.save_job(job)
            await self.memory.save_results(job.id, job.results)
        
        return job
    
    async def _crawl_loop(self, job: CrawlJob):
        """Main crawling loop implementing Manus agent pattern"""
        
        urls_to_crawl = job.urls.copy()
        crawled_urls = set()
        depth = 0
        
        while urls_to_crawl and depth < job.config.max_depth and len(job.results) < job.config.max_pages:
            
            # 1. Analyze: Current state and remaining work
            current_batch = urls_to_crawl[:min(5, len(urls_to_crawl))]  # Process in batches
            urls_to_crawl = urls_to_crawl[len(current_batch):]
            
            self.logger.info(f"Processing batch of {len(current_batch)} URLs at depth {depth}")
            
            # 2. Plan: Determine crawling strategy for this batch
            crawl_plan = await self._create_crawl_plan(current_batch, job.config)
            
            # 3. Execute: Crawl URLs in the batch
            batch_results = await self._execute_crawl_batch(crawl_plan, job.config)
            
            # 4. Observe: Process and validate results
            validated_results = await self._validate_results(batch_results)
            job.results.extend(validated_results)
            
            # 5. Adapt: Update strategy based on results
            new_urls = await self._extract_new_urls(validated_results, crawled_urls, job.config)
            urls_to_crawl.extend(new_urls)
            
            # Update crawled URLs set
            crawled_urls.update([result.url for result in validated_results])
            
            # Update progress
            job.progress = min(95.0, (len(job.results) / job.config.max_pages) * 100)
            await self.memory.save_job(job)
            
            # Increment depth
            depth += 1
            
            # Delay between batches
            await asyncio.sleep(random.uniform(*job.config.delay_range))
    
    async def _create_crawl_plan(self, urls: List[str], config: CrawlConfig) -> Dict[str, Any]:
        """Create crawling plan for a batch of URLs"""
        
        plan = {
            'urls': urls,
            'parallel_limit': min(3, len(urls)),  # Limit concurrent requests
            'retry_attempts': 3,
            'timeout': config.timeout,
            'use_stealth': config.use_stealth
        }
        
        return plan
    
    async def _execute_crawl_batch(self, plan: Dict[str, Any], config: CrawlConfig) -> List[CrawlResult]:
        """Execute crawling for a batch of URLs"""
        
        semaphore = asyncio.Semaphore(plan['parallel_limit'])
        tasks = []
        
        for url in plan['urls']:
            task = self._crawl_single_url(url, config, semaphore)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return valid results
        valid_results = []
        for result in results:
            if isinstance(result, CrawlResult):
                valid_results.append(result)
            elif isinstance(result, Exception):
                self.logger.error(f"Error in batch crawling: {str(result)}")
        
        return valid_results
    
    async def _crawl_single_url(self, url: str, config: CrawlConfig, semaphore: asyncio.Semaphore) -> CrawlResult:
        """Crawl a single URL with full Manus-style processing"""
        
        async with semaphore:
            start_time = time.time()
            
            try:
                # Create new page for this URL
                page = await self.context.new_page()
                
                # Apply anti-detection measures
                await self.anti_detection.apply_stealth_measures(page, config)
                
                # Navigate to URL
                response = await page.goto(url, timeout=config.timeout * 1000, wait_until='domcontentloaded')
                
                if not response:
                    raise Exception(f"Failed to load page: {url}")
                
                # Simulate human behavior
                await self.anti_detection.simulate_human_behavior(page)
                
                # Extract page data
                title = await page.title()
                content = await page.content()
                
                # Extract structured data
                extracted_data = await self.data_extractor.extract_data(page, config)
                
                # Get page metadata
                metadata = {
                    'url': url,
                    'final_url': page.url,
                    'status_code': response.status,
                    'headers': dict(response.headers),
                    'content_type': response.headers.get('content-type', ''),
                    'content_length': len(content)
                }
                
                # Create result
                result = CrawlResult(
                    url=url,
                    status_code=response.status,
                    title=title,
                    content=content,
                    links=extracted_data.get('links', []),
                    images=extracted_data.get('images', []),
                    metadata=metadata,
                    extracted_data=extracted_data,
                    timestamp=datetime.now(),
                    processing_time=time.time() - start_time
                )
                
                await page.close()
                return result
                
            except Exception as e:
                self.logger.error(f"Error crawling {url}: {str(e)}")
                
                # Create error result
                result = CrawlResult(
                    url=url,
                    status_code=0,
                    title="",
                    content="",
                    links=[],
                    images=[],
                    metadata={},
                    extracted_data={},
                    timestamp=datetime.now(),
                    processing_time=time.time() - start_time,
                    error=str(e)
                )
                
                return result
    
    async def _validate_results(self, results: List[CrawlResult]) -> List[CrawlResult]:
        """Validate and filter crawl results"""
        
        validated_results = []
        
        for result in results:
            # Skip results with errors
            if result.error:
                self.logger.warning(f"Skipping result with error: {result.error}")
                continue
            
            # Skip non-successful status codes
            if result.status_code < 200 or result.status_code >= 400:
                self.logger.warning(f"Skipping result with status code: {result.status_code}")
                continue
            
            # Skip empty content
            if not result.content.strip():
                self.logger.warning(f"Skipping result with empty content: {result.url}")
                continue
            
            validated_results.append(result)
        
        return validated_results
    
    async def _extract_new_urls(self, results: List[CrawlResult], crawled_urls: set, config: CrawlConfig) -> List[str]:
        """Extract new URLs from crawl results for further crawling"""
        
        new_urls = []
        
        for result in results:
            if isinstance(result.links, list):
                for link_data in result.links:
                    if isinstance(link_data, dict) and 'url' in link_data:
                        url = link_data['url']
                        
                        # Skip already crawled URLs
                        if url in crawled_urls:
                            continue
                        
                        # Skip non-HTTP URLs
                        if not url.startswith(('http://', 'https://')):
                            continue
                        
                        # Skip common file extensions
                        if any(url.lower().endswith(ext) for ext in ['.pdf', '.jpg', '.png', '.gif', '.zip', '.exe']):
                            continue
                        
                        new_urls.append(url)
        
        # Remove duplicates and limit
        new_urls = list(set(new_urls))
        return new_urls[:config.max_pages]
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a crawl job"""
        
        job = await self.memory.load_job(job_id)
        if not job:
            return None
        
        return {
            'id': job.id,
            'status': job.status.value,
            'progress': job.progress,
            'created_at': job.created_at.isoformat(),
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            'error_message': job.error_message,
            'results_count': len(job.results),
            'urls_count': len(job.urls)
        }
    
    async def get_job_results(self, job_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get the results of a crawl job"""
        
        job = await self.memory.load_job(job_id)
        if not job:
            return None
        
        results = []
        for result in job.results:
            result_data = {
                'url': result.url,
                'status_code': result.status_code,
                'title': result.title,
                'links_count': len(result.links) if result.links else 0,
                'images_count': len(result.images) if result.images else 0,
                'extracted_data': result.extracted_data,
                'timestamp': result.timestamp.isoformat(),
                'processing_time': result.processing_time,
                'error': result.error
            }
            results.append(result_data)
        
        return results


class ManusCrawlerTool:
    """Suna tool wrapper for Manus-style crawler"""
    
    def __init__(self, workspace_path: str = "/tmp/crawler_workspace"):
        self.workspace_path = workspace_path
        self.crawler_agent = None
    
    async def crawl_websites(self, 
                           urls: Union[str, List[str]], 
                           max_pages: int = 10,
                           max_depth: int = 2,
                           extract_types: List[str] = None,
                           use_stealth: bool = True,
                           delay_range: tuple = (1, 3)) -> Dict[str, Any]:
        """
        Crawl websites and extract data using Manus-style intelligent crawling
        
        Args:
            urls: Single URL or list of URLs to crawl
            max_pages: Maximum number of pages to crawl
            max_depth: Maximum crawling depth
            extract_types: Types of data to extract (text, links, images, tables, forms, structured)
            use_stealth: Whether to use anti-detection measures
            delay_range: Range of delays between requests (min, max) in seconds
        
        Returns:
            Dictionary containing crawl results and metadata
        """
        
        try:
            # Normalize URLs input
            if isinstance(urls, str):
                urls = [urls]
            
            # Normalize extract_types
            if extract_types is None:
                extract_types = ['text', 'links']
            
            extract_type_enums = []
            for extract_type in extract_types:
                try:
                    extract_type_enums.append(ExtractionType(extract_type.lower()))
                except ValueError:
                    logging.warning(f"Unknown extract type: {extract_type}")
            
            # Create crawl configuration
            config = CrawlConfig(
                max_pages=max_pages,
                max_depth=max_depth,
                delay_range=delay_range,
                use_stealth=use_stealth,
                extract_types=extract_type_enums
            )
            
            # Initialize crawler agent
            async with ManusCrawlerAgent(self.workspace_path) as crawler:
                # Create and execute crawl job
                job = await crawler.create_crawl_job(urls, config)
                completed_job = await crawler.execute_crawl_job(job)
                
                # Format results for return
                results = {
                    'job_id': completed_job.id,
                    'status': completed_job.status.value,
                    'total_pages_crawled': len(completed_job.results),
                    'total_processing_time': sum(r.processing_time for r in completed_job.results),
                    'crawl_results': []
                }
                
                for result in completed_job.results:
                    result_data = {
                        'url': result.url,
                        'title': result.title,
                        'status_code': result.status_code,
                        'content_preview': result.content[:500] + '...' if len(result.content) > 500 else result.content,
                        'extracted_data': result.extracted_data,
                        'links_found': len(result.links) if result.links else 0,
                        'images_found': len(result.images) if result.images else 0,
                        'processing_time': result.processing_time,
                        'timestamp': result.timestamp.isoformat()
                    }
                    
                    if result.error:
                        result_data['error'] = result.error
                    
                    results['crawl_results'].append(result_data)
                
                return results
                
        except Exception as e:
            logging.error(f"Error in crawl_websites: {str(e)}")
            return {
                'error': str(e),
                'status': 'failed',
                'crawl_results': []
            }
    
    async def get_crawl_status(self, job_id: str) -> Dict[str, Any]:
        """Get the status of a crawling job"""
        
        try:
            async with ManusCrawlerAgent(self.workspace_path) as crawler:
                status = await crawler.get_job_status(job_id)
                
                if status:
                    return status
                else:
                    return {'error': 'Job not found', 'job_id': job_id}
                    
        except Exception as e:
            logging.error(f"Error getting crawl status: {str(e)}")
            return {'error': str(e), 'job_id': job_id}
    
    async def get_crawl_results(self, job_id: str) -> Dict[str, Any]:
        """Get the results of a crawling job"""
        
        try:
            async with ManusCrawlerAgent(self.workspace_path) as crawler:
                results = await crawler.get_job_results(job_id)
                
                if results:
                    return {
                        'job_id': job_id,
                        'results_count': len(results),
                        'results': results
                    }
                else:
                    return {'error': 'Job not found', 'job_id': job_id}
                    
        except Exception as e:
            logging.error(f"Error getting crawl results: {str(e)}")
            return {'error': str(e), 'job_id': job_id}


# Tool registration for Suna integration
def get_tool_definition():
    """Get tool definition for Suna integration"""
    
    return {
        'name': 'manus_crawler',
        'description': 'Advanced web crawler and scraper with Manus-style intelligent automation',
        'functions': [
            {
                'name': 'crawl_websites',
                'description': 'Crawl websites and extract structured data using intelligent automation',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'urls': {
                            'type': ['string', 'array'],
                            'description': 'Single URL or list of URLs to crawl'
                        },
                        'max_pages': {
                            'type': 'integer',
                            'description': 'Maximum number of pages to crawl',
                            'default': 10
                        },
                        'max_depth': {
                            'type': 'integer',
                            'description': 'Maximum crawling depth',
                            'default': 2
                        },
                        'extract_types': {
                            'type': 'array',
                            'items': {'type': 'string'},
                            'description': 'Types of data to extract: text, links, images, tables, forms, structured',
                            'default': ['text', 'links']
                        },
                        'use_stealth': {
                            'type': 'boolean',
                            'description': 'Whether to use anti-detection measures',
                            'default': True
                        },
                        'delay_range': {
                            'type': 'array',
                            'items': {'type': 'number'},
                            'description': 'Range of delays between requests [min, max] in seconds',
                            'default': [1, 3]
                        }
                    },
                    'required': ['urls']
                }
            },
            {
                'name': 'get_crawl_status',
                'description': 'Get the status of a crawling job',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'job_id': {
                            'type': 'string',
                            'description': 'ID of the crawling job'
                        }
                    },
                    'required': ['job_id']
                }
            },
            {
                'name': 'get_crawl_results',
                'description': 'Get the results of a crawling job',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'job_id': {
                            'type': 'string',
                            'description': 'ID of the crawling job'
                        }
                    },
                    'required': ['job_id']
                }
            }
        ]
    }


if __name__ == "__main__":
    # Example usage
    async def main():
        tool = ManusCrawlerTool()
        
        # Test crawling
        result = await tool.crawl_websites(
            urls=["https://example.com"],
            max_pages=5,
            extract_types=["text", "links", "images"]
        )
        
        print(json.dumps(result, indent=2))
    
    asyncio.run(main())

