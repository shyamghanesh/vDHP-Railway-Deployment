"""
Care Plan and Task Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class CarePlanResponse(BaseModel):
    id: str
    patient_id: str
    title: str
    description: Optional[str]
    status: str
    start_date: datetime
    end_date: Optional[datetime]
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    id: str
    care_plan_id: Optional[str]
    patient_id: str
    title: str
    description: Optional[str]
    task_type: str
    status: str
    priority: str
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class TaskCompleteRequest(BaseModel):
    response_data: Optional[Dict[str, Any]] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
