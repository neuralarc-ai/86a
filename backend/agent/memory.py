import json
import os
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class MemoryEntry:
    timestamp: datetime
    entry_type: str
    content: str
    metadata: Dict[str, Any]
    phase_id: Optional[int] = None

class FileBasedMemory:
    """File-based memory system for persistent agent context"""
    
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path)
        self.memory_dir = self.workspace_path / "agent_memory"
        self.context_file = self.memory_dir / "context.json"
        self.progress_file = self.memory_dir / "progress.log"
        self.memory_entries_file = self.memory_dir / "memory_entries.jsonl"
        self.intermediate_results_dir = self.memory_dir / "intermediate_results"
        
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create necessary directory structure"""
        directories = [
            self.memory_dir,
            self.intermediate_results_dir
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    async def store_context(self, context_data: Dict[str, Any]):
        """Store current context information"""
        context_with_timestamp = {
            **context_data,
            "last_updated": datetime.now().isoformat()
        }
        
        with open(self.context_file, 'w') as f:
            json.dump(context_with_timestamp, f, indent=2)
    
    async def retrieve_context(self) -> Dict[str, Any]:
        """Retrieve stored context"""
        try:
            with open(self.context_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    async def add_memory_entry(self, entry_type: str, content: str, metadata: Dict[str, Any] = None, phase_id: Optional[int] = None):
        """Add a new memory entry"""
        if metadata is None:
            metadata = {}
        
        entry = MemoryEntry(
            timestamp=datetime.now(),
            entry_type=entry_type,
            content=content,
            metadata=metadata,
            phase_id=phase_id
        )
        
        # Convert datetime to string for JSON serialization
        entry_dict = asdict(entry)
        entry_dict['timestamp'] = entry.timestamp.isoformat()
        
        with open(self.memory_entries_file, 'a') as f:
            f.write(json.dumps(entry_dict) + '\n')
    
    async def get_memory_entries(self, limit: Optional[int] = None, entry_type: Optional[str] = None, phase_id: Optional[int] = None) -> List[MemoryEntry]:
        """Retrieve memory entries with optional filtering"""
        entries = []
        
        try:
            with open(self.memory_entries_file, 'r') as f:
                for line in f:
                    if line.strip():
                        entry_dict = json.loads(line.strip())
                        # Convert timestamp string back to datetime
                        entry_dict['timestamp'] = datetime.fromisoformat(entry_dict['timestamp'])
                        entry = MemoryEntry(**entry_dict)
                        
                        # Apply filters
                        if entry_type and entry.entry_type != entry_type:
                            continue
                        if phase_id is not None and entry.phase_id != phase_id:
                            continue
                        
                        entries.append(entry)
        except FileNotFoundError:
            pass
        
        # Sort by timestamp (most recent first)
        entries.sort(key=lambda x: x.timestamp, reverse=True)
        
        if limit:
            entries = entries[:limit]
        
        return entries
    
    async def store_intermediate_result(self, result_name: str, data: Any):
        """Store intermediate results for later retrieval"""
        result_file = self.intermediate_results_dir / f"{result_name}.json"
        
        # Handle datetime serialization
        def json_serializer(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
        
        with open(result_file, 'w') as f:
            json.dump(data, f, indent=2, default=json_serializer)
    
    async def retrieve_intermediate_result(self, result_name: str) -> Optional[Any]:
        """Retrieve stored intermediate results"""
        result_file = self.intermediate_results_dir / f"{result_name}.json"
        
        try:
            with open(result_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return None
    
    async def log_progress(self, message: str, phase_id: Optional[int] = None):
        """Log progress information"""
        timestamp = datetime.now().isoformat()
        phase_info = f" [Phase {phase_id}]" if phase_id else ""
        log_entry = f"{timestamp}{phase_info}: {message}\n"
        
        with open(self.progress_file, 'a') as f:
            f.write(log_entry)
        
        # Also add to memory entries
        await self.add_memory_entry("progress", message, {"phase_id": phase_id}, phase_id)
    
    async def get_progress_log(self, limit: Optional[int] = None) -> List[str]:
        """Retrieve progress log entries"""
        try:
            with open(self.progress_file, 'r') as f:
                lines = f.readlines()
            
            if limit:
                lines = lines[-limit:]
            
            return [line.strip() for line in lines]
        except FileNotFoundError:
            return []
    
    async def clear_memory(self, keep_context: bool = True):
        """Clear memory entries and logs"""
        if not keep_context and self.context_file.exists():
            self.context_file.unlink()
        
        if self.progress_file.exists():
            self.progress_file.unlink()
        
        if self.memory_entries_file.exists():
            self.memory_entries_file.unlink()
        
        # Clear intermediate results
        if self.intermediate_results_dir.exists():
            for file in self.intermediate_results_dir.glob("*.json"):
                file.unlink()
    
    async def get_memory_stats(self) -> Dict[str, Any]:
        """Get statistics about memory usage"""
        stats = {
            "context_exists": self.context_file.exists(),
            "memory_entries_count": 0,
            "progress_entries_count": 0,
            "intermediate_results_count": 0,
            "total_memory_size_mb": 0
        }
        
        # Count memory entries
        if self.memory_entries_file.exists():
            with open(self.memory_entries_file, 'r') as f:
                stats["memory_entries_count"] = sum(1 for line in f if line.strip())
        
        # Count progress entries
        if self.progress_file.exists():
            with open(self.progress_file, 'r') as f:
                stats["progress_entries_count"] = sum(1 for line in f)
        
        # Count intermediate results
        if self.intermediate_results_dir.exists():
            stats["intermediate_results_count"] = len(list(self.intermediate_results_dir.glob("*.json")))
        
        # Calculate total size
        total_size = 0
        if self.memory_dir.exists():
            for file in self.memory_dir.rglob("*"):
                if file.is_file():
                    total_size += file.stat().st_size
        
        stats["total_memory_size_mb"] = round(total_size / (1024 * 1024), 2)
        
        return stats

