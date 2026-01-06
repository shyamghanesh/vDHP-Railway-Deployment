"""
Communication and Messaging Models - FHIR Communication
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from backend.config.database import Base
import uuid

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    
    sender_type = Column(String(50), nullable=False)
    sender_id = Column(String(36), nullable=False)
    sender_name = Column(String(200), nullable=False)
    
    recipient_type = Column(String(50), nullable=False)
    recipient_id = Column(String(36), nullable=False)
    
    subject = Column(String(255), nullable=True)
    message_text = Column(Text, nullable=False)
    message_type = Column(String(50), default='text')
    
    attachments = Column(JSON, nullable=True)
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    fhir_communication_resource = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
