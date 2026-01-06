"""
Messaging and Communication Router
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.config.database import get_db
from backend.config.auth import get_current_patient
from backend.models import Message, Patient
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(tags=["Messages"])

class MessageCreate(BaseModel):
    recipient_id: str
    recipient_type: str = "provider"
    subject: Optional[str] = None
    message_text: str

class MessageResponse(BaseModel):
    id: str
    sender_name: str
    subject: Optional[str]
    message_text: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[MessageResponse])
async def get_messages(
    current_patient: Patient = Depends(get_current_patient),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get patient messages with pagination"""
    skip = (page - 1) * page_size
    
    messages = db.query(Message).filter(
        (Message.patient_id == current_patient.id)
    ).order_by(Message.created_at.desc()).offset(skip).limit(page_size).all()
    
    return messages

@router.post("", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db)
):
    """Send a message to provider"""
    new_message = Message(
        patient_id=current_patient.id,
        sender_type="patient",
        sender_id=current_patient.id,
        sender_name=f"{current_patient.first_name} {current_patient.last_name}",
        recipient_type=message.recipient_type,
        recipient_id=message.recipient_id,
        subject=message.subject,
        message_text=message.message_text
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message
