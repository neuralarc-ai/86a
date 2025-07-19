"""
Manus-Style Web Crawler Module for Suna Integration

This module provides advanced web crawling capabilities following Manus AI patterns.
"""

from .crawler_agent import CrawlerAgent
from .browser_controller import BrowserController
from .anti_detection import AntiDetectionManager
from .data_extractor import DataExtractor
from .memory_manager import MemoryManager

__all__ = [
    'CrawlerAgent',
    'BrowserController', 
    'AntiDetectionManager',
    'DataExtractor',
    'MemoryManager'
]

