"""
Care Plans and Tasks Router
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.config.database import get_db
from backend.config.auth import get_current_patient
from backend.schemas.care_plan import (
    CarePlanResponse,
    TaskResponse,
    TaskCompleteRequest,
    PaginatedResponse,
)
from backend.models import CarePlan, Task, TaskStatus, Patient
from typing import List
from datetime import datetime

router = APIRouter(tags=["Care Plans"])

@router.get("", response_model=List[CarePlanResponse])
async def get_care_plans(
    current_patient: Patient = Depends(get_current_patient),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get patient care plans with pagination"""
    skip = (page - 1) * page_size
    
    care_plans = db.query(CarePlan).filter(
        CarePlan.patient_id == current_patient.id
    ).offset(skip).limit(page_size).all()
    
    return care_plans

@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    current_patient: Patient = Depends(get_current_patient),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get patient tasks with pagination and filtering"""
    skip = (page - 1) * page_size
    
    query = db.query(Task).filter(Task.patient_id == current_patient.id)
    
    if status:
        query = query.filter(Task.status == status)
    
    tasks = query.order_by(Task.due_date.asc()).offset(skip).limit(page_size).all()
    
    return tasks

@router.put("/tasks/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: str,
    request: TaskCompleteRequest,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Complete a task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.patient_id == current_patient.id
    ).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.utcnow()
    
    if request.response_data:
        task.response_data = request.response_data
    
    db.commit()
    db.refresh(task)
    
    return task
