import { API_ENDPOINT as API_BASE_URL } from '@/config';

export interface ConsentStep {
    id?: string;
    workflow_id?: string;
    step_order: number;
    step_type: 'text' | 'input' | 'signature' | 'template';
    title: string;
    content: string;
    is_required: boolean;
}

export interface ConsentWorkflow {
    id: string;
    name: string;
    description?: string;
    created_by: string;
    created_at: string;
    is_active: boolean;
    steps: ConsentStep[];
}

export interface ConsentWorkflowCreate {
    name: string;
    description?: string;
    steps: Omit<ConsentStep, 'id' | 'workflow_id'>[];
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getConsentWorkflows = async (): Promise<ConsentWorkflow[]> => {
    const response = await fetch(`${API_BASE_URL}/api/consent`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch workflows');
    return response.json();
};

export const createConsentWorkflow = async (workflow: ConsentWorkflowCreate): Promise<ConsentWorkflow> => {
    const response = await fetch(`${API_BASE_URL}/api/consent`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(workflow)
    });
    if (!response.ok) throw new Error('Failed to create workflow');
    return response.json();
};

export const deleteConsentWorkflow = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/consent/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete workflow');
};
