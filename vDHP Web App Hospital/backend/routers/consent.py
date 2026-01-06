from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

# Logic to handle relative imports if run as script vs module
try:
    from backend import models, sql_models
    from backend.database import get_db
    from backend.routers.auth import get_current_user
except ImportError:
    import models, sql_models
    from database import get_db
    from routers.auth import get_current_user

router = APIRouter(tags=["Consent Workflows"])

@router.post("", response_model=models.ConsentWorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_consent_workflow(
    workflow: models.ConsentWorkflowCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new consent workflow with steps.
    Only doctors (practitioners) can create workflows.
    """
    # Verify doctor role
    if current_user.get('role') != 'doctor':
        raise HTTPException(status_code=403, detail="Only doctors can create workflows")

    db_workflow = sql_models.ConsentWorkflow(
        id=str(uuid.uuid4()),
        name=workflow.name,
        description=workflow.description,
        created_by=current_user['id'], # This should be the doctor ID
        is_active=True
    )
    db.add(db_workflow)
    
    # Add steps
    for step in workflow.steps:
        db_step = sql_models.ConsentStep(
            id=str(uuid.uuid4()),
            workflow_id=db_workflow.id,
            step_order=step.step_order,
            step_type=step.step_type,
            title=step.title,
            content=step.content,
            is_required=step.is_required
        )
        db.add(db_step)
    
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

@router.get("", response_model=List[models.ConsentWorkflowResponse])
def get_consent_workflows(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all consent workflows.
    Visible to both doctors and patients (patients might need to select one).
    """
    return db.query(sql_models.ConsentWorkflow).all()

@router.get("/{workflow_id}", response_model=models.ConsentWorkflowResponse)
def get_consent_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific workflow by ID.
    """
    workflow = db.query(sql_models.ConsentWorkflow).filter(sql_models.ConsentWorkflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_consent_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a consent workflow.
    Only the creator or admin should be able to delete.
    """
    if current_user.get('role') != 'doctor':
         raise HTTPException(status_code=403, detail="Only doctors can delete workflows")

    workflow = db.query(sql_models.ConsentWorkflow).filter(sql_models.ConsentWorkflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    db.delete(workflow)
    db.commit()
    return None
