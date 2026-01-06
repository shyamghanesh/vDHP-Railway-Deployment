import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    FileText,
    CheckSquare,
    PenTool,
    Trash2,
    Save,
    ArrowLeft,
    GripVertical,
    LayoutTemplate
} from 'lucide-react';
import {
    getConsentWorkflows,
    createConsentWorkflow,
    deleteConsentWorkflow,
    type ConsentWorkflow,
    type ConsentStep
} from '@/services/consentService';

export const ConsentWorkflowBuilder: React.FC = () => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [workflows, setWorkflows] = useState<ConsentWorkflow[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        setLoading(true);
        try {
            const data = await getConsentWorkflows();
            setWorkflows(data);
        } catch (error) {
            console.error("Failed to load workflows", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this workflow?")) return;
        try {
            await deleteConsentWorkflow(id);
            loadWorkflows();
        } catch (error) {
            console.error("Failed to delete workflow", error);
        }
    };

    const handleCreateSuccess = () => {
        setView('list');
        loadWorkflows();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {view === 'list' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-medical-text">Consent Workflows</h2>
                            <p className="text-medical-muted">Manage digital consent forms and workflows.</p>
                        </div>
                        <Button onClick={() => setView('create')} className="bg-medical-primary hover:bg-medical-primary/90">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Workflow
                        </Button>
                    </div>

                    <Card className="bg-medical-card border-none shadow-soft">
                        <CardContent className="p-6">
                            {loading ? (
                                <div className="text-center py-10">Loading...</div>
                            ) : workflows.length === 0 ? (
                                <div className="text-center py-10 text-medical-muted">
                                    No workflows found. Create one to get started.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {workflows.map(workflow => (
                                        <Card key={workflow.id} className="border border-border hover:border-medical-primary/50 transition-colors cursor-pointer group">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-lg truncate">{workflow.name}</CardTitle>
                                                    <Badge variant={workflow.is_active ? "default" : "secondary"}>
                                                        {workflow.is_active ? 'Active' : 'Draft'}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="line-clamp-2 h-10">
                                                    {workflow.description || "No description provided."}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex justify-between items-center text-sm text-medical-muted mt-2">
                                                    <span>{workflow.steps?.length || 0} Steps</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(workflow.id); }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {view === 'create' && (
                <WorkflowEditor onCancel={() => setView('list')} onSuccess={handleCreateSuccess} />
            )}
        </div>
    );
};

// Sub-component for editing/creating
const WorkflowEditor: React.FC<{ onCancel: () => void, onSuccess: () => void }> = ({ onCancel, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState<Omit<ConsentStep, 'id' | 'workflow_id'>[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

    const addStep = (type: ConsentStep['step_type']) => {
        const newStep: Omit<ConsentStep, 'id' | 'workflow_id'> = {
            step_order: steps.length,
            step_type: type,
            title: type === 'text' ? 'New Information' : type === 'signature' ? 'Signature Required' : 'Question',
            content: '',
            is_required: true
        };
        setSteps([...steps, newStep]);
        setSelectedStepIndex(steps.length); // Select the new step
    };

    const updateStep = (index: number, updates: Partial<ConsentStep>) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], ...updates };
        setSteps(newSteps);
    };

    const removeStep = (index: number) => {
        const newSteps = steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, step_order: i }));
        setSteps(newSteps);
        if (selectedStepIndex === index) setSelectedStepIndex(null);
        if (selectedStepIndex !== null && selectedStepIndex > index) setSelectedStepIndex(selectedStepIndex - 1);
    };

    const handleSave = async () => {
        if (!name) return alert("Please enter a workflow name");
        if (steps.length === 0) return alert("Please add at least one step");

        setIsSubmitting(true);
        try {
            await createConsentWorkflow({
                name,
                description,
                steps
            });
            onSuccess();
        } catch (error) {
            alert("Failed to save workflow");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
            {/* Header */}
            <div className="flex items-center justify-between bg-medical-card p-4 rounded-lg shadow-sm border border-border">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Workflow Name (e.g., General Surgery Consent)"
                            className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                        />
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description..."
                            className="text-sm text-medical-muted border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Saving...' : 'Save Workflow'}
                    </Button>
                </div>
            </div>

            {/* Builder Board */}
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left: Component Toolbox */}
                <Card className="w-64 flex flex-col border-border shadow-soft">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase text-medical-muted tracking-wider">Toolbox</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <ToolboxButton
                            icon={FileText}
                            label="Information Text"
                            onClick={() => addStep('text')}
                            description="Static text for reading"
                        />
                        <ToolboxButton
                            icon={CheckSquare}
                            label="Yes/No Question"
                            onClick={() => addStep('input')}
                            description="Simple boolean choice"
                        />
                        <ToolboxButton
                            icon={PenTool}
                            label="Signature"
                            onClick={() => addStep('signature')}
                            description="Digital signature block"
                        />
                        <ToolboxButton
                            icon={LayoutTemplate}
                            label="Template"
                            onClick={() => addStep('template')}
                            description="Import existing form"
                        />
                    </CardContent>
                </Card>

                {/* Middle: Canvas */}
                <div className="flex-1 flex flex-col bg-medical-card/50 rounded-lg border border-dashed border-border overflow-y-auto p-8 items-center space-y-4">
                    {steps.length === 0 ? (
                        <div className="text-center text-medical-muted mt-20">
                            <p className="mb-2">Your workflow is empty.</p>
                            <p className="text-sm">Click items from the Toolbox to add steps.</p>
                        </div>
                    ) : (
                        steps.map((step, index) => (
                            <div
                                key={index}
                                onClick={() => setSelectedStepIndex(index)}
                                className={`w-full max-w-2xl p-4 rounded-lg border transition-all cursor-pointer relative group
                                    ${selectedStepIndex === index
                                        ? 'bg-white border-medical-primary ring-1 ring-medical-primary shadow-md'
                                        : 'bg-white border-border hover:border-medical-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-medical-muted cursor-move">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {GetIconForType(step.step_type)}
                                            <span className="font-medium text-sm text-medical-text">
                                                {step.title || 'Untitled Step'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-medical-muted mt-1 truncate">
                                            {step.step_type === 'text' && (step.content || "No content...")}
                                            {step.step_type === 'input' && "User selection required"}
                                            {step.step_type === 'signature' && "Signature capture"}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={(e) => { e.stopPropagation(); removeStep(index); }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right: Properties Panel */}
                <Card className="w-80 border-border shadow-soft flex flex-col">
                    <CardHeader className="border-b">
                        <CardTitle className="text-sm">Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedStepIndex !== null && steps[selectedStepIndex] ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Step Title</Label>
                                    <Input
                                        value={steps[selectedStepIndex].title}
                                        onChange={(e) => updateStep(selectedStepIndex, { title: e.target.value })}
                                    />
                                </div>

                                {steps[selectedStepIndex].step_type === 'text' && (
                                    <div className="space-y-2">
                                        <Label>Content</Label>
                                        <Textarea
                                            value={steps[selectedStepIndex].content}
                                            onChange={(e) => updateStep(selectedStepIndex, { content: e.target.value })}
                                            rows={8}
                                            placeholder="Enter the consent text here..."
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4">
                                    <Label>Required Step</Label>
                                    <Switch
                                        checked={steps[selectedStepIndex].is_required}
                                        onCheckedChange={(checked) => updateStep(selectedStepIndex, { is_required: checked })}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-medical-muted text-sm text-center mt-10">
                                Select a step to edit properties
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ToolboxButton = ({ icon: Icon, label, onClick, description }: any) => (
    <Button
        variant="outline"
        className="w-full justify-start h-auto py-3 px-4 hover:bg-slate-50 border-dashed"
        onClick={onClick}
    >
        <Icon className="w-5 h-5 mr-3 text-medical-primary" />
        <div className="text-left">
            <div className="font-medium text-medical-text">{label}</div>
            <div className="text-xs text-medical-muted font-normal">{description}</div>
        </div>
    </Button>
);

const GetIconForType = (type: string) => {
    switch (type) {
        case 'text': return <FileText className="w-4 h-4 text-blue-500" />;
        case 'input': return <CheckSquare className="w-4 h-4 text-green-500" />;
        case 'signature': return <PenTool className="w-4 h-4 text-orange-500" />;
        default: return <FileText className="w-4 h-4" />;
    }
};
