import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

class TaskComplexity(Enum):
    SIMPLE = "simple"
    MEDIUM = "medium"
    COMPLEX = "complex"
    VERY_COMPLEX = "very_complex"

class PhaseStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class TaskPhase:
    id: int
    title: str
    description: str
    required_capabilities: List[str]
    estimated_duration: Optional[str]
    status: PhaseStatus
    dependencies: List[int]
    success_criteria: List[str]

@dataclass
class TaskPlan:
    goal: str
    complexity: TaskComplexity
    phases: List[TaskPhase]
    estimated_total_duration: str
    success_metrics: List[str]
    created_at: datetime
    updated_at: datetime

class TaskPlannerTool:
    """Advanced task planning tool implementing Manus-style decomposition"""
    
    def __init__(self, llm_client, memory_system):
        self.llm_client = llm_client
        self.memory_system = memory_system
        self.capability_map = self._initialize_capability_map()
    
    def _initialize_capability_map(self) -> Dict[str, List[str]]:
        """Initialize mapping of capabilities to tools"""
        return {
            "web_search": ["search_tool", "web_scraper", "api_caller"],
            "data_analysis": ["data_processor", "visualization_tool", "statistics_tool"],
            "code_generation": ["code_generator", "code_executor", "testing_tool"],
            "file_operations": ["file_manager", "document_processor", "archive_tool"],
            "communication": ["email_tool", "notification_tool", "report_generator"],
            "deployment": ["deployment_tool", "monitoring_tool", "scaling_tool"],
            "browser_automation": ["browser_navigator", "form_filler", "element_clicker"],
            "image_processing": ["image_generator", "image_editor", "image_analyzer"],
            "document_creation": ["pdf_generator", "presentation_creator", "report_writer"]
        }
    
    async def create_task_plan(self, user_request: str, context: Dict[str, Any] = None) -> TaskPlan:
        """Create a comprehensive task plan from user request"""
        if context is None:
            context = {}
        
        # Analyze task complexity
        complexity = await self._analyze_complexity(user_request)
        
        # Generate phases based on complexity
        phases = await self._generate_phases(user_request, complexity, context)
        
        # Estimate durations
        total_duration = await self._estimate_total_duration(phases)
        
        # Define success metrics
        success_metrics = await self._define_success_metrics(user_request, phases)
        
        task_plan = TaskPlan(
            goal=user_request,
            complexity=complexity,
            phases=phases,
            estimated_total_duration=total_duration,
            success_metrics=success_metrics,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Store the task plan
        await self.memory_system.store_intermediate_result("task_plan", {
            "goal": task_plan.goal,
            "complexity": task_plan.complexity.value,
            "phases": [
                {
                    "id": phase.id,
                    "title": phase.title,
                    "description": phase.description,
                    "required_capabilities": phase.required_capabilities,
                    "estimated_duration": phase.estimated_duration,
                    "status": phase.status.value,
                    "dependencies": phase.dependencies,
                    "success_criteria": phase.success_criteria
                }
                for phase in task_plan.phases
            ],
            "estimated_total_duration": task_plan.estimated_total_duration,
            "success_metrics": task_plan.success_metrics,
            "created_at": task_plan.created_at.isoformat(),
            "updated_at": task_plan.updated_at.isoformat()
        })
        
        await self.memory_system.log_progress(f"Created task plan with {len(phases)} phases")
        
        return task_plan
    
    async def _analyze_complexity(self, user_request: str) -> TaskComplexity:
        """Analyze the complexity of the user request"""
        request_lower = user_request.lower()
        
        # Simple complexity indicators
        simple_indicators = [
            "search for", "find", "look up", "what is", "define", "explain",
            "create a simple", "write a short", "basic"
        ]
        
        # Complex complexity indicators
        complex_indicators = [
            "build", "develop", "create a system", "implement", "deploy",
            "analyze data", "machine learning", "ai model", "full stack",
            "integrate", "automate", "workflow"
        ]
        
        # Very complex indicators
        very_complex_indicators = [
            "enterprise", "scalable", "production", "multi-step", "end-to-end",
            "comprehensive", "advanced", "sophisticated", "complex system"
        ]
        
        if any(indicator in request_lower for indicator in very_complex_indicators):
            return TaskComplexity.VERY_COMPLEX
        elif any(indicator in request_lower for indicator in complex_indicators):
            return TaskComplexity.COMPLEX
        elif any(indicator in request_lower for indicator in simple_indicators):
            return TaskComplexity.SIMPLE
        else:
            return TaskComplexity.MEDIUM
    
    async def _generate_phases(self, user_request: str, complexity: TaskComplexity, context: Dict[str, Any]) -> List[TaskPhase]:
        """Generate task phases based on request and complexity"""
        phases = []
        
        # Base phases that most tasks need
        base_phases = [
            {
                "title": "Planning and Analysis",
                "description": "Analyze requirements and create detailed execution plan",
                "required_capabilities": ["analysis", "planning"],
                "estimated_duration": "5-10 minutes"
            }
        ]
        
        # Add phases based on complexity
        if complexity == TaskComplexity.SIMPLE:
            phases.extend([
                {
                    "title": "Execution",
                    "description": "Execute the main task",
                    "required_capabilities": self._infer_capabilities(user_request),
                    "estimated_duration": "10-15 minutes"
                }
            ])
        elif complexity == TaskComplexity.MEDIUM:
            phases.extend([
                {
                    "title": "Research and Data Gathering",
                    "description": "Gather necessary information and resources",
                    "required_capabilities": ["web_search", "data_analysis"],
                    "estimated_duration": "15-20 minutes"
                },
                {
                    "title": "Implementation",
                    "description": "Implement the solution",
                    "required_capabilities": self._infer_capabilities(user_request),
                    "estimated_duration": "20-30 minutes"
                }
            ])
        elif complexity == TaskComplexity.COMPLEX:
            phases.extend([
                {
                    "title": "Research and Requirements",
                    "description": "Comprehensive research and requirement analysis",
                    "required_capabilities": ["web_search", "data_analysis", "document_creation"],
                    "estimated_duration": "20-30 minutes"
                },
                {
                    "title": "Design and Architecture",
                    "description": "Design the solution architecture",
                    "required_capabilities": ["code_generation", "file_operations"],
                    "estimated_duration": "30-45 minutes"
                },
                {
                    "title": "Implementation",
                    "description": "Implement the core functionality",
                    "required_capabilities": self._infer_capabilities(user_request),
                    "estimated_duration": "45-60 minutes"
                },
                {
                    "title": "Testing and Validation",
                    "description": "Test and validate the implementation",
                    "required_capabilities": ["code_generation", "browser_automation"],
                    "estimated_duration": "15-30 minutes"
                }
            ])
        else:  # VERY_COMPLEX
            phases.extend([
                {
                    "title": "Comprehensive Research",
                    "description": "In-depth research and analysis",
                    "required_capabilities": ["web_search", "data_analysis", "document_creation"],
                    "estimated_duration": "30-45 minutes"
                },
                {
                    "title": "System Design",
                    "description": "Design comprehensive system architecture",
                    "required_capabilities": ["code_generation", "file_operations", "document_creation"],
                    "estimated_duration": "45-60 minutes"
                },
                {
                    "title": "Core Implementation",
                    "description": "Implement core system components",
                    "required_capabilities": self._infer_capabilities(user_request),
                    "estimated_duration": "60-90 minutes"
                },
                {
                    "title": "Integration and Testing",
                    "description": "Integrate components and perform testing",
                    "required_capabilities": ["code_generation", "browser_automation", "deployment"],
                    "estimated_duration": "30-45 minutes"
                },
                {
                    "title": "Deployment and Documentation",
                    "description": "Deploy solution and create documentation",
                    "required_capabilities": ["deployment", "document_creation"],
                    "estimated_duration": "20-30 minutes"
                }
            ])
        
        # Add final phase
        phases.append({
            "title": "Completion and Delivery",
            "description": "Finalize deliverables and present results",
            "required_capabilities": ["communication", "document_creation"],
            "estimated_duration": "5-10 minutes"
        })
        
        # Convert to TaskPhase objects
        task_phases = []
        for i, phase_data in enumerate(phases, 1):
            task_phase = TaskPhase(
                id=i,
                title=phase_data["title"],
                description=phase_data["description"],
                required_capabilities=phase_data["required_capabilities"],
                estimated_duration=phase_data["estimated_duration"],
                status=PhaseStatus.PENDING,
                dependencies=[i-1] if i > 1 else [],
                success_criteria=self._generate_success_criteria(phase_data["title"], phase_data["description"])
            )
            task_phases.append(task_phase)
        
        return task_phases
    
    def _infer_capabilities(self, user_request: str) -> List[str]:
        """Infer required capabilities from user request"""
        request_lower = user_request.lower()
        capabilities = []
        
        capability_keywords = {
            "web_search": ["search", "find", "research", "information", "data"],
            "data_analysis": ["analyze", "data", "statistics", "chart", "graph", "visualization"],
            "code_generation": ["code", "program", "script", "develop", "build", "create"],
            "file_operations": ["file", "document", "pdf", "csv", "json", "save", "read"],
            "communication": ["email", "message", "notify", "report", "present"],
            "deployment": ["deploy", "publish", "host", "server", "production"],
            "browser_automation": ["browser", "web", "click", "form", "navigate", "scrape"],
            "image_processing": ["image", "picture", "photo", "generate", "edit", "visual"],
            "document_creation": ["document", "report", "presentation", "write", "create"]
        }
        
        for capability, keywords in capability_keywords.items():
            if any(keyword in request_lower for keyword in keywords):
                capabilities.append(capability)
        
        return capabilities if capabilities else ["general"]
    
    def _generate_success_criteria(self, title: str, description: str) -> List[str]:
        """Generate success criteria for a phase"""
        criteria = []
        
        if "planning" in title.lower():
            criteria = [
                "Requirements clearly defined",
                "Execution plan created",
                "Success metrics established"
            ]
        elif "research" in title.lower():
            criteria = [
                "Relevant information gathered",
                "Sources documented",
                "Key insights identified"
            ]
        elif "implementation" in title.lower() or "execution" in title.lower():
            criteria = [
                "Core functionality implemented",
                "Code/solution working as expected",
                "Basic testing completed"
            ]
        elif "testing" in title.lower():
            criteria = [
                "All tests passing",
                "Edge cases handled",
                "Performance acceptable"
            ]
        elif "deployment" in title.lower():
            criteria = [
                "Solution deployed successfully",
                "Public access confirmed",
                "Documentation updated"
            ]
        elif "completion" in title.lower():
            criteria = [
                "All deliverables ready",
                "Results presented to user",
                "Task marked as complete"
            ]
        else:
            criteria = [
                "Phase objectives met",
                "Quality standards satisfied",
                "Ready for next phase"
            ]
        
        return criteria
    
    async def _estimate_total_duration(self, phases: List[TaskPhase]) -> str:
        """Estimate total duration for all phases"""
        total_min_minutes = 0
        total_max_minutes = 0
        
        for phase in phases:
            if phase.estimated_duration:
                # Parse duration like "20-30 minutes"
                duration_parts = phase.estimated_duration.replace(" minutes", "").split("-")
                if len(duration_parts) == 2:
                    min_duration = int(duration_parts[0])
                    max_duration = int(duration_parts[1])
                    total_min_minutes += min_duration
                    total_max_minutes += max_duration
        
        if total_max_minutes > 60:
            min_hours = total_min_minutes // 60
            max_hours = total_max_minutes // 60
            min_remaining = total_min_minutes % 60
            max_remaining = total_max_minutes % 60
            
            if min_remaining == 0 and max_remaining == 0:
                return f"{min_hours}-{max_hours} hours"
            else:
                return f"{min_hours}h {min_remaining}m - {max_hours}h {max_remaining}m"
        else:
            return f"{total_min_minutes}-{total_max_minutes} minutes"
    
    async def _define_success_metrics(self, user_request: str, phases: List[TaskPhase]) -> List[str]:
        """Define overall success metrics for the task"""
        metrics = [
            "All phases completed successfully",
            "User requirements satisfied",
            "Deliverables meet quality standards"
        ]
        
        # Add specific metrics based on request type
        request_lower = user_request.lower()
        
        if "website" in request_lower or "web" in request_lower:
            metrics.append("Website functional and accessible")
        
        if "analysis" in request_lower or "data" in request_lower:
            metrics.append("Analysis results accurate and insightful")
        
        if "deploy" in request_lower or "production" in request_lower:
            metrics.append("Solution deployed and publicly accessible")
        
        if "document" in request_lower or "report" in request_lower:
            metrics.append("Documentation comprehensive and clear")
        
        return metrics
    
    async def advance_phase(self, task_plan_data: Dict[str, Any], current_phase_id: int) -> bool:
        """Advance to the next phase if dependencies are satisfied"""
        phases = task_plan_data.get("phases", [])
        
        # Find current phase
        current_phase = None
        for phase in phases:
            if phase["id"] == current_phase_id:
                current_phase = phase
                break
        
        if not current_phase:
            return False
        
        # Mark current phase as completed
        current_phase["status"] = PhaseStatus.COMPLETED.value
        
        # Find next phase
        next_phase_id = current_phase_id + 1
        next_phase = None
        for phase in phases:
            if phase["id"] == next_phase_id:
                next_phase = phase
                break
        
        if next_phase:
            # Check dependencies
            dependencies_satisfied = True
            for dep_id in next_phase.get("dependencies", []):
                dep_phase = next((p for p in phases if p["id"] == dep_id), None)
                if not dep_phase or dep_phase["status"] != PhaseStatus.COMPLETED.value:
                    dependencies_satisfied = False
                    break
            
            if dependencies_satisfied:
                next_phase["status"] = PhaseStatus.IN_PROGRESS.value
                
                # Update task plan
                task_plan_data["updated_at"] = datetime.now().isoformat()
                await self.memory_system.store_intermediate_result("task_plan", task_plan_data)
                
                await self.memory_system.log_progress(
                    f"Advanced to phase {next_phase_id}: {next_phase['title']}", 
                    next_phase_id
                )
                
                return True
        
        return False
    
    async def get_current_phase(self, task_plan_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get the current active phase"""
        phases = task_plan_data.get("phases", [])
        
        for phase in phases:
            if phase["status"] == PhaseStatus.IN_PROGRESS.value:
                return phase
        
        # If no phase is in progress, return the first pending phase
        for phase in phases:
            if phase["status"] == PhaseStatus.PENDING.value:
                return phase
        
        return None
    
    async def update_phase_status(self, task_plan_data: Dict[str, Any], phase_id: int, status: PhaseStatus) -> bool:
        """Update the status of a specific phase"""
        phases = task_plan_data.get("phases", [])
        
        for phase in phases:
            if phase["id"] == phase_id:
                phase["status"] = status.value
                task_plan_data["updated_at"] = datetime.now().isoformat()
                
                await self.memory_system.store_intermediate_result("task_plan", task_plan_data)
                await self.memory_system.log_progress(
                    f"Updated phase {phase_id} status to {status.value}", 
                    phase_id
                )
                
                return True
        
        return False

