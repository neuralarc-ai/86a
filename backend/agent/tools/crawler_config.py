"""
Crawler Configuration Management

This module provides configuration management for the Manus-style crawler system,
including environment variable handling, proxy configuration, and feature flags.

Author: Neural Arc Inc (neuralarc.ai)
Date: July 19, 2025
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum


class ProxyProvider(Enum):
    """Supported proxy providers"""
    BRIGHTDATA = "brightdata"
    OXYLABS = "oxylabs"
    SMARTPROXY = "smartproxy"
    ROTATING_PROXIES = "rotating_proxies"
    CUSTOM = "custom"


class BrowserType(Enum):
    """Supported browser types"""
    CHROMIUM = "chromium"
    FIREFOX = "firefox"
    WEBKIT = "webkit"


@dataclass
class ProxyConfig:
    """Proxy configuration settings"""
    enabled: bool = False
    provider: ProxyProvider = ProxyProvider.BRIGHTDATA
    endpoint: str = ""
    username: str = ""
    password: str = ""
    port: int = 8080
    rotation_interval: int = 100  # Requests before rotation
    country_codes: List[str] = field(default_factory=list)
    sticky_session: bool = False
    
    @classmethod
    def from_env(cls) -> 'ProxyConfig':
        """Create proxy config from environment variables"""
        return cls(
            enabled=os.getenv('CRAWLER_USE_PROXIES', 'false').lower() == 'true',
            provider=ProxyProvider(os.getenv('PROXY_PROVIDER', 'brightdata')),
            endpoint=os.getenv('PROXY_ENDPOINT', ''),
            username=os.getenv('PROXY_USERNAME', ''),
            password=os.getenv('PROXY_PASSWORD', ''),
            port=int(os.getenv('PROXY_PORT', '8080')),
            rotation_interval=int(os.getenv('PROXY_ROTATION_INTERVAL', '100')),
            country_codes=os.getenv('PROXY_COUNTRY_CODES', '').split(',') if os.getenv('PROXY_COUNTRY_CODES') else [],
            sticky_session=os.getenv('PROXY_STICKY_SESSION', 'false').lower() == 'true'
        )


@dataclass
class BrowserConfig:
    """Browser configuration settings"""
    browser_type: BrowserType = BrowserType.CHROMIUM
    headless: bool = True
    timeout: int = 30
    viewport_width: int = 1920
    viewport_height: int = 1080
    user_data_dir: Optional[str] = None
    disable_images: bool = False
    disable_javascript: bool = False
    disable_css: bool = False
    max_concurrent_pages: int = 5
    
    @classmethod
    def from_env(cls) -> 'BrowserConfig':
        """Create browser config from environment variables"""
        return cls(
            browser_type=BrowserType(os.getenv('CRAWLER_BROWSER_TYPE', 'chromium')),
            headless=os.getenv('CRAWLER_HEADLESS', 'true').lower() == 'true',
            timeout=int(os.getenv('CRAWLER_TIMEOUT', '30')),
            viewport_width=int(os.getenv('CRAWLER_VIEWPORT_WIDTH', '1920')),
            viewport_height=int(os.getenv('CRAWLER_VIEWPORT_HEIGHT', '1080')),
            user_data_dir=os.getenv('CRAWLER_USER_DATA_DIR'),
            disable_images=os.getenv('CRAWLER_DISABLE_IMAGES', 'false').lower() == 'true',
            disable_javascript=os.getenv('CRAWLER_DISABLE_JS', 'false').lower() == 'true',
            disable_css=os.getenv('CRAWLER_DISABLE_CSS', 'false').lower() == 'true',
            max_concurrent_pages=int(os.getenv('CRAWLER_MAX_CONCURRENT_PAGES', '5'))
        )


@dataclass
class AntiDetectionConfig:
    """Anti-detection configuration settings"""
    enabled: bool = True
    rotate_user_agents: bool = True
    randomize_viewport: bool = True
    simulate_human_behavior: bool = True
    fingerprint_randomization: bool = True
    header_rotation: bool = True
    request_delay_min: float = 1.0
    request_delay_max: float = 3.0
    mouse_movement_simulation: bool = True
    scroll_simulation: bool = True
    
    @classmethod
    def from_env(cls) -> 'AntiDetectionConfig':
        """Create anti-detection config from environment variables"""
        return cls(
            enabled=os.getenv('CRAWLER_STEALTH_MODE', 'true').lower() == 'true',
            rotate_user_agents=os.getenv('CRAWLER_ROTATE_UA', 'true').lower() == 'true',
            randomize_viewport=os.getenv('CRAWLER_RANDOMIZE_VIEWPORT', 'true').lower() == 'true',
            simulate_human_behavior=os.getenv('CRAWLER_SIMULATE_BEHAVIOR', 'true').lower() == 'true',
            fingerprint_randomization=os.getenv('FINGERPRINT_RANDOMIZATION', 'true').lower() == 'true',
            header_rotation=os.getenv('HEADER_ROTATION', 'true').lower() == 'true',
            request_delay_min=float(os.getenv('CRAWLER_DELAY_MIN', '1.0')),
            request_delay_max=float(os.getenv('CRAWLER_DELAY_MAX', '3.0')),
            mouse_movement_simulation=os.getenv('MOUSE_SIMULATION', 'true').lower() == 'true',
            scroll_simulation=os.getenv('SCROLL_SIMULATION', 'true').lower() == 'true'
        )


@dataclass
class ScalingConfig:
    """Scaling and performance configuration"""
    max_workers: int = 5
    max_pages_per_job: int = 100
    max_crawl_depth: int = 5
    rate_limit_requests_per_second: float = 10.0
    memory_limit_mb: int = 1024
    disk_cache_size_mb: int = 512
    enable_distributed_crawling: bool = False
    worker_timeout: int = 300
    
    @classmethod
    def from_env(cls) -> 'ScalingConfig':
        """Create scaling config from environment variables"""
        return cls(
            max_workers=int(os.getenv('CRAWLER_MAX_WORKERS', '5')),
            max_pages_per_job=int(os.getenv('CRAWLER_MAX_PAGES', '100')),
            max_crawl_depth=int(os.getenv('CRAWLER_MAX_DEPTH', '5')),
            rate_limit_requests_per_second=float(os.getenv('CRAWLER_RATE_LIMIT', '10.0')),
            memory_limit_mb=int(os.getenv('CRAWLER_MEMORY_LIMIT', '1024')),
            disk_cache_size_mb=int(os.getenv('CRAWLER_CACHE_SIZE', '512')),
            enable_distributed_crawling=os.getenv('CRAWLER_DISTRIBUTED', 'false').lower() == 'true',
            worker_timeout=int(os.getenv('CRAWLER_WORKER_TIMEOUT', '300'))
        )


@dataclass
class ExtractionConfig:
    """Data extraction configuration"""
    default_extract_types: List[str] = field(default_factory=lambda: ['text', 'links'])
    max_content_length: int = 1048576  # 1MB
    extract_images: bool = True
    extract_tables: bool = True
    extract_forms: bool = True
    extract_structured_data: bool = True
    content_language_detection: bool = True
    text_cleaning_enabled: bool = True
    duplicate_detection: bool = True
    
    @classmethod
    def from_env(cls) -> 'ExtractionConfig':
        """Create extraction config from environment variables"""
        default_types = os.getenv('CRAWLER_DEFAULT_EXTRACT_TYPES', 'text,links').split(',')
        
        return cls(
            default_extract_types=default_types,
            max_content_length=int(os.getenv('CRAWLER_MAX_CONTENT_LENGTH', '1048576')),
            extract_images=os.getenv('CRAWLER_EXTRACT_IMAGES', 'true').lower() == 'true',
            extract_tables=os.getenv('CRAWLER_EXTRACT_TABLES', 'true').lower() == 'true',
            extract_forms=os.getenv('CRAWLER_EXTRACT_FORMS', 'true').lower() == 'true',
            extract_structured_data=os.getenv('CRAWLER_EXTRACT_STRUCTURED', 'true').lower() == 'true',
            content_language_detection=os.getenv('CRAWLER_LANGUAGE_DETECTION', 'true').lower() == 'true',
            text_cleaning_enabled=os.getenv('CRAWLER_TEXT_CLEANING', 'true').lower() == 'true',
            duplicate_detection=os.getenv('CRAWLER_DUPLICATE_DETECTION', 'true').lower() == 'true'
        )


@dataclass
class StorageConfig:
    """Storage and persistence configuration"""
    workspace_path: str = "/tmp/crawler_workspace"
    results_retention_days: int = 30
    enable_compression: bool = True
    backup_enabled: bool = False
    backup_interval_hours: int = 24
    max_storage_size_gb: int = 10
    
    @classmethod
    def from_env(cls) -> 'StorageConfig':
        """Create storage config from environment variables"""
        return cls(
            workspace_path=os.getenv('CRAWLER_WORKSPACE_PATH', '/tmp/crawler_workspace'),
            results_retention_days=int(os.getenv('CRAWLER_RETENTION_DAYS', '30')),
            enable_compression=os.getenv('CRAWLER_COMPRESSION', 'true').lower() == 'true',
            backup_enabled=os.getenv('CRAWLER_BACKUP_ENABLED', 'false').lower() == 'true',
            backup_interval_hours=int(os.getenv('CRAWLER_BACKUP_INTERVAL', '24')),
            max_storage_size_gb=int(os.getenv('CRAWLER_MAX_STORAGE_GB', '10'))
        )


@dataclass
class SecurityConfig:
    """Security and compliance configuration"""
    respect_robots_txt: bool = True
    user_agent_compliance: bool = True
    rate_limiting_enabled: bool = True
    ip_rotation_enabled: bool = False
    request_signing_enabled: bool = False
    data_encryption_enabled: bool = True
    audit_logging_enabled: bool = True
    
    @classmethod
    def from_env(cls) -> 'SecurityConfig':
        """Create security config from environment variables"""
        return cls(
            respect_robots_txt=os.getenv('CRAWLER_RESPECT_ROBOTS', 'true').lower() == 'true',
            user_agent_compliance=os.getenv('CRAWLER_UA_COMPLIANCE', 'true').lower() == 'true',
            rate_limiting_enabled=os.getenv('CRAWLER_RATE_LIMITING', 'true').lower() == 'true',
            ip_rotation_enabled=os.getenv('CRAWLER_IP_ROTATION', 'false').lower() == 'true',
            request_signing_enabled=os.getenv('CRAWLER_REQUEST_SIGNING', 'false').lower() == 'true',
            data_encryption_enabled=os.getenv('CRAWLER_DATA_ENCRYPTION', 'true').lower() == 'true',
            audit_logging_enabled=os.getenv('CRAWLER_AUDIT_LOGGING', 'true').lower() == 'true'
        )


class CrawlerConfig:
    """Main crawler configuration class"""
    
    def __init__(self):
        self.proxy = ProxyConfig.from_env()
        self.browser = BrowserConfig.from_env()
        self.anti_detection = AntiDetectionConfig.from_env()
        self.scaling = ScalingConfig.from_env()
        self.extraction = ExtractionConfig.from_env()
        self.storage = StorageConfig.from_env()
        self.security = SecurityConfig.from_env()
        
        # Feature flags
        self.features = self._load_feature_flags()
        
        # Logging configuration
        self._setup_logging()
    
    def _load_feature_flags(self) -> Dict[str, bool]:
        """Load feature flags from environment"""
        return {
            'advanced_extraction': os.getenv('CRAWLER_FEATURE_ADVANCED_EXTRACTION', 'true').lower() == 'true',
            'ai_content_analysis': os.getenv('CRAWLER_FEATURE_AI_ANALYSIS', 'false').lower() == 'true',
            'real_time_monitoring': os.getenv('CRAWLER_FEATURE_MONITORING', 'true').lower() == 'true',
            'distributed_crawling': os.getenv('CRAWLER_FEATURE_DISTRIBUTED', 'false').lower() == 'true',
            'smart_retry': os.getenv('CRAWLER_FEATURE_SMART_RETRY', 'true').lower() == 'true',
            'content_deduplication': os.getenv('CRAWLER_FEATURE_DEDUPLICATION', 'true').lower() == 'true',
            'auto_scaling': os.getenv('CRAWLER_FEATURE_AUTO_SCALING', 'false').lower() == 'true'
        }
    
    def _setup_logging(self):
        """Setup logging configuration"""
        log_level = os.getenv('CRAWLER_LOG_LEVEL', 'INFO').upper()
        log_format = os.getenv('CRAWLER_LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        logging.basicConfig(
            level=getattr(logging, log_level),
            format=log_format,
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler(os.path.join(self.storage.workspace_path, 'crawler.log'))
            ]
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return {
            'proxy': self.proxy.__dict__,
            'browser': self.browser.__dict__,
            'anti_detection': self.anti_detection.__dict__,
            'scaling': self.scaling.__dict__,
            'extraction': self.extraction.__dict__,
            'storage': self.storage.__dict__,
            'security': self.security.__dict__,
            'features': self.features
        }
    
    def save_to_file(self, filepath: str):
        """Save configuration to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2, default=str)
    
    @classmethod
    def load_from_file(cls, filepath: str) -> 'CrawlerConfig':
        """Load configuration from JSON file"""
        with open(filepath, 'r') as f:
            config_data = json.load(f)
        
        config = cls()
        
        # Update configurations from file
        if 'proxy' in config_data:
            for key, value in config_data['proxy'].items():
                if hasattr(config.proxy, key):
                    setattr(config.proxy, key, value)
        
        if 'browser' in config_data:
            for key, value in config_data['browser'].items():
                if hasattr(config.browser, key):
                    setattr(config.browser, key, value)
        
        # Continue for other config sections...
        
        return config
    
    def validate(self) -> List[str]:
        """Validate configuration and return list of issues"""
        issues = []
        
        # Validate proxy configuration
        if self.proxy.enabled:
            if not self.proxy.endpoint:
                issues.append("Proxy endpoint is required when proxy is enabled")
            if not self.proxy.username or not self.proxy.password:
                issues.append("Proxy credentials are required when proxy is enabled")
        
        # Validate browser configuration
        if self.browser.timeout <= 0:
            issues.append("Browser timeout must be positive")
        
        if self.browser.max_concurrent_pages <= 0:
            issues.append("Max concurrent pages must be positive")
        
        # Validate scaling configuration
        if self.scaling.max_workers <= 0:
            issues.append("Max workers must be positive")
        
        if self.scaling.rate_limit_requests_per_second <= 0:
            issues.append("Rate limit must be positive")
        
        # Validate storage configuration
        if not os.path.exists(os.path.dirname(self.storage.workspace_path)):
            issues.append(f"Workspace directory does not exist: {self.storage.workspace_path}")
        
        return issues
    
    def get_user_agent_list(self) -> List[str]:
        """Get list of user agents for rotation"""
        return [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36"
        ]
    
    def get_proxy_url(self) -> Optional[str]:
        """Get formatted proxy URL"""
        if not self.proxy.enabled:
            return None
        
        if self.proxy.username and self.proxy.password:
            return f"http://{self.proxy.username}:{self.proxy.password}@{self.proxy.endpoint}:{self.proxy.port}"
        else:
            return f"http://{self.proxy.endpoint}:{self.proxy.port}"
    
    def is_feature_enabled(self, feature_name: str) -> bool:
        """Check if a feature is enabled"""
        return self.features.get(feature_name, False)
    
    def update_feature(self, feature_name: str, enabled: bool):
        """Update feature flag"""
        self.features[feature_name] = enabled
    
    def get_browser_args(self) -> List[str]:
        """Get browser launch arguments"""
        args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
        
        if self.browser.disable_images:
            args.append('--blink-settings=imagesEnabled=false')
        
        if self.security.respect_robots_txt:
            args.append('--disable-web-security')
        
        return args
    
    def get_context_options(self) -> Dict[str, Any]:
        """Get browser context options"""
        options = {
            'viewport': {
                'width': self.browser.viewport_width,
                'height': self.browser.viewport_height
            },
            'ignore_https_errors': True,
            'java_script_enabled': not self.browser.disable_javascript
        }
        
        if self.proxy.enabled:
            proxy_url = self.get_proxy_url()
            if proxy_url:
                options['proxy'] = {'server': proxy_url}
        
        return options


class ConfigManager:
    """Configuration manager for the crawler system"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_file = config_file
        self.config = self._load_config()
    
    def _load_config(self) -> CrawlerConfig:
        """Load configuration from file or environment"""
        if self.config_file and os.path.exists(self.config_file):
            return CrawlerConfig.load_from_file(self.config_file)
        else:
            return CrawlerConfig()
    
    def save_config(self, filepath: Optional[str] = None):
        """Save current configuration to file"""
        save_path = filepath or self.config_file or 'crawler_config.json'
        self.config.save_to_file(save_path)
    
    def reload_config(self):
        """Reload configuration from file"""
        self.config = self._load_config()
    
    def validate_config(self) -> bool:
        """Validate current configuration"""
        issues = self.config.validate()
        if issues:
            for issue in issues:
                logging.error(f"Configuration issue: {issue}")
            return False
        return True
    
    def get_config(self) -> CrawlerConfig:
        """Get current configuration"""
        return self.config
    
    def update_config(self, updates: Dict[str, Any]):
        """Update configuration with new values"""
        for section, values in updates.items():
            if hasattr(self.config, section):
                section_config = getattr(self.config, section)
                for key, value in values.items():
                    if hasattr(section_config, key):
                        setattr(section_config, key, value)


# Environment variable template for documentation
ENV_TEMPLATE = """
# Manus Crawler Configuration Environment Variables

# Browser Configuration
CRAWLER_BROWSER_TYPE=chromium
CRAWLER_HEADLESS=true
CRAWLER_TIMEOUT=30
CRAWLER_VIEWPORT_WIDTH=1920
CRAWLER_VIEWPORT_HEIGHT=1080
CRAWLER_DISABLE_IMAGES=false
CRAWLER_DISABLE_JS=false
CRAWLER_DISABLE_CSS=false
CRAWLER_MAX_CONCURRENT_PAGES=5

# Anti-Detection Configuration
CRAWLER_STEALTH_MODE=true
CRAWLER_ROTATE_UA=true
CRAWLER_RANDOMIZE_VIEWPORT=true
CRAWLER_SIMULATE_BEHAVIOR=true
FINGERPRINT_RANDOMIZATION=true
HEADER_ROTATION=true
CRAWLER_DELAY_MIN=1.0
CRAWLER_DELAY_MAX=3.0
MOUSE_SIMULATION=true
SCROLL_SIMULATION=true

# Proxy Configuration
CRAWLER_USE_PROXIES=false
PROXY_PROVIDER=brightdata
PROXY_ENDPOINT=proxy.brightdata.com
PROXY_USERNAME=your_username
PROXY_PASSWORD=your_password
PROXY_PORT=22225
PROXY_ROTATION_INTERVAL=100
PROXY_COUNTRY_CODES=US,UK,CA
PROXY_STICKY_SESSION=false

# Scaling Configuration
CRAWLER_MAX_WORKERS=5
CRAWLER_MAX_PAGES=100
CRAWLER_MAX_DEPTH=5
CRAWLER_RATE_LIMIT=10.0
CRAWLER_MEMORY_LIMIT=1024
CRAWLER_CACHE_SIZE=512
CRAWLER_DISTRIBUTED=false
CRAWLER_WORKER_TIMEOUT=300

# Extraction Configuration
CRAWLER_DEFAULT_EXTRACT_TYPES=text,links
CRAWLER_MAX_CONTENT_LENGTH=1048576
CRAWLER_EXTRACT_IMAGES=true
CRAWLER_EXTRACT_TABLES=true
CRAWLER_EXTRACT_FORMS=true
CRAWLER_EXTRACT_STRUCTURED=true
CRAWLER_LANGUAGE_DETECTION=true
CRAWLER_TEXT_CLEANING=true
CRAWLER_DUPLICATE_DETECTION=true

# Storage Configuration
CRAWLER_WORKSPACE_PATH=/tmp/crawler_workspace
CRAWLER_RETENTION_DAYS=30
CRAWLER_COMPRESSION=true
CRAWLER_BACKUP_ENABLED=false
CRAWLER_BACKUP_INTERVAL=24
CRAWLER_MAX_STORAGE_GB=10

# Security Configuration
CRAWLER_RESPECT_ROBOTS=true
CRAWLER_UA_COMPLIANCE=true
CRAWLER_RATE_LIMITING=true
CRAWLER_IP_ROTATION=false
CRAWLER_REQUEST_SIGNING=false
CRAWLER_DATA_ENCRYPTION=true
CRAWLER_AUDIT_LOGGING=true

# Feature Flags
CRAWLER_FEATURE_ADVANCED_EXTRACTION=true
CRAWLER_FEATURE_AI_ANALYSIS=false
CRAWLER_FEATURE_MONITORING=true
CRAWLER_FEATURE_DISTRIBUTED=false
CRAWLER_FEATURE_SMART_RETRY=true
CRAWLER_FEATURE_DEDUPLICATION=true
CRAWLER_FEATURE_AUTO_SCALING=false

# Logging Configuration
CRAWLER_LOG_LEVEL=INFO
CRAWLER_LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
"""


def create_default_config_file(filepath: str = "crawler_config.json"):
    """Create a default configuration file"""
    config = CrawlerConfig()
    config.save_to_file(filepath)
    print(f"Default configuration saved to {filepath}")


def create_env_template(filepath: str = ".env.crawler"):
    """Create environment variable template file"""
    with open(filepath, 'w') as f:
        f.write(ENV_TEMPLATE)
    print(f"Environment template saved to {filepath}")


if __name__ == "__main__":
    # Example usage
    config_manager = ConfigManager()
    
    if config_manager.validate_config():
        print("Configuration is valid")
        print(f"Proxy enabled: {config_manager.config.proxy.enabled}")
        print(f"Stealth mode: {config_manager.config.anti_detection.enabled}")
        print(f"Max workers: {config_manager.config.scaling.max_workers}")
    else:
        print("Configuration has issues")
    
    # Create default files
    create_default_config_file()
    create_env_template()

