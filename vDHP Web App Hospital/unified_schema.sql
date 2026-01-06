-- Unified Database Schema for CareAI (FHIR Compliant)
-- Uses JSONB to store FHIR resources

-- ==========================================
-- 0. AUTHENTICATION & USERS
-- ==========================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'patient', 'doctor', 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    biometric_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 1. FHIR RESOURCES
-- ==========================================

-- Patient Resource
CREATE TABLE fhir_patients (
    id VARCHAR(36) PRIMARY KEY, -- Logical ID
    resource JSONB NOT NULL, -- The full FHIR Patient resource
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Search Parameters (Indexed for performance)
    active BOOLEAN,
    gender VARCHAR(20),
    birth_date DATE
);

-- Practitioner Resource (Doctors)
CREATE TABLE fhir_practitioners (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Search Parameters
    active BOOLEAN,
    name_family VARCHAR(100)
);

-- Organization Resource (Providers/Hospitals)
CREATE TABLE fhir_organizations (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Search Parameters
    active BOOLEAN,
    name VARCHAR(255)
);

-- Appointment Resource
CREATE TABLE fhir_appointments (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Search Parameters
    status VARCHAR(50),
    start_date TIMESTAMP,
    patient_id VARCHAR(36), -- Reference to Patient
    practitioner_id VARCHAR(36) -- Reference to Practitioner
);

-- Encounter Resource (Visits)
CREATE TABLE fhir_encounters (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Search Parameters
    status VARCHAR(50),
    patient_id VARCHAR(36),
    practitioner_id VARCHAR(36)
);

-- Observation Resource (Vitals, Labs)
CREATE TABLE fhir_observations (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Search Parameters
    status VARCHAR(50),
    category VARCHAR(50), -- vital-signs, laboratory, etc.
    code VARCHAR(100), -- LOINC code
    patient_id VARCHAR(36),
    effective_date TIMESTAMP
);

-- Condition Resource (Diagnoses, Problems)
CREATE TABLE fhir_conditions (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Search Parameters
    clinical_status VARCHAR(50),
    patient_id VARCHAR(36)
);

-- MedicationRequest Resource (Prescriptions)
CREATE TABLE fhir_medication_requests (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Search Parameters
    status VARCHAR(50),
    intent VARCHAR(50), -- order, plan, etc.
    patient_id VARCHAR(36),
    requester_id VARCHAR(36) -- Practitioner
);

-- ==========================================
-- 2. INDEXES (GIN for JSONB)
-- ==========================================
CREATE INDEX idx_patient_resource ON fhir_patients USING GIN (resource);
CREATE INDEX idx_practitioner_resource ON fhir_practitioners USING GIN (resource);
CREATE INDEX idx_observation_resource ON fhir_observations USING GIN (resource);

-- ==========================================
-- 3. CONSENT WORKFLOWS
-- ==========================================

CREATE TABLE consent_workflows (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(36) NOT NULL, -- Reference to Practitioner
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE consent_steps (
    id VARCHAR(36) PRIMARY KEY,
    workflow_id VARCHAR(36) NOT NULL,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'text', 'input', 'signature', 'template'
    title VARCHAR(255) NOT NULL,
    content TEXT, -- Markdown content for text steps, or JSON config
    is_required BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (workflow_id) REFERENCES consent_workflows(id) ON DELETE CASCADE
);
