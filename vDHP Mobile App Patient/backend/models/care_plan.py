"""
Care Plan and Task Models - FHIR CarePlan and Task
"""

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON, Enum
from sqlalchemy.sql import func
from backend.config.database import Base
import uuid
import enum

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CarePlan(Base):
    __tablename__ = "care_plans"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default='active')
    
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    created_by = Column(String(200), nullable=True)
    
    fhir_care_plan_resource = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    care_plan_id = Column(String(36), ForeignKey("care_plans.id"), nullable=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String(100), nullable=False)
    
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.PENDING)
    priority = Column(String(20), default='medium')
    
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    questionnaire_data = Column(JSON, nullable=True)
    response_data = Column(JSON, nullable=True)
    
    fhir_task_resource = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
