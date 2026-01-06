-- ============================================================================
-- V1__Initial_Schema.sql
-- vDHP Unified Database Schema - FHIR Compliant
-- Creates all tables for both Mobile App Patient and Hospital Web App backends
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE USER MANAGEMENT
-- ============================================================================

-- Unified Users Table (shared between both backends)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(255),
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'patient', -- patient, doctor, provider, admin
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    biometric_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Invitations Table (Hospital creates, Patients use)
CREATE TABLE IF NOT EXISTS invitations (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    invitation_code VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    hospital_id VARCHAR(36) NOT NULL,
    patient_mrn VARCHAR(100),
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by_user_id VARCHAR(36) REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) REFERENCES users(id),
    invite_metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_hospital ON invitations(hospital_id);

-- ============================================================================
-- PATIENT DATA (Mobile App Primary)
-- ============================================================================

-- Patients Table (linked to user accounts)
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mrn VARCHAR(100) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    -- Address fields
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    -- Preferences
    preferred_language VARCHAR(20) DEFAULT 'en',
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_email VARCHAR(255),
    -- Insurance
    insurance_provider VARCHAR(200),
    insurance_member_id VARCHAR(100),
    insurance_group_number VARCHAR(100),
    -- Profile
    profile_photo_url VARCHAR(500),
    -- FHIR Compliance
    fhir_patient_resource JSONB,
    -- Accessibility
    accessibility_font_size VARCHAR(20) DEFAULT 'base',
    accessibility_high_contrast BOOLEAN DEFAULT FALSE,
    accessibility_voice_guidance BOOLEAN DEFAULT FALSE,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);

-- Patient Consents
CREATE TABLE IF NOT EXISTS consents (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    consent_text TEXT NOT NULL,
    is_agreed BOOLEAN DEFAULT FALSE,
    agreed_at TIMESTAMP WITH TIME ZONE,
    signature_data TEXT,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    fhir_consent_resource JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consents_patient ON consents(patient_id);

-- Medical History
CREATE TABLE IF NOT EXISTS medical_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergies JSONB,
    current_medications JSONB,
    chronic_conditions JSONB,
    past_surgeries JSONB,
    family_history JSONB,
    immunizations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_history_patient ON medical_history(patient_id);

-- ============================================================================
-- CARE MANAGEMENT
-- ============================================================================

-- Care Plans (Hospital creates, Patient views)
CREATE TABLE IF NOT EXISTS care_plans (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, completed, cancelled, on-hold
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(36) REFERENCES users(id),
    fhir_care_plan_resource JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_care_plans_patient ON care_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_status ON care_plans(status);

-- Tasks (Hospital creates, Patient completes)
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    care_plan_id VARCHAR(36) REFERENCES care_plans(id) ON DELETE SET NULL,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(100) NOT NULL, -- medication, exercise, appointment, questionnaire
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    questionnaire_data JSONB,
    response_data JSONB,
    fhir_task_resource JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_patient ON tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_care_plan ON tasks(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ============================================================================
-- COMMUNICATION
-- ============================================================================

-- Messages (bidirectional between patients and providers)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- patient, doctor, provider
    sender_id VARCHAR(36) NOT NULL,
    sender_name VARCHAR(200) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    subject VARCHAR(255),
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, attachment, system
    attachments JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    fhir_communication_resource JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);

-- ============================================================================
-- VITALS & OBSERVATIONS
-- ============================================================================

-- Vitals (Patient records, Hospital views)
CREATE TABLE IF NOT EXISTS vitals (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(36) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    vitals_type VARCHAR(50) NOT NULL, -- blood_pressure, blood_sugar, heart_rate, weight, temperature, oxygen_saturation
    -- Blood Pressure
    systolic INTEGER,
    diastolic INTEGER,
    -- Blood Sugar
    blood_sugar_value FLOAT,
    blood_sugar_unit VARCHAR(10) DEFAULT 'mg/dL',
    blood_sugar_type VARCHAR(20), -- fasting, postprandial, random
    -- Generic value
    value FLOAT,
    unit VARCHAR(20),
    -- Metadata
    notes VARCHAR(500),
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fhir_observation_resource JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_type ON vitals(vitals_type);
CREATE INDEX IF NOT EXISTS idx_vitals_measured ON vitals(measured_at);

-- ============================================================================
-- FHIR RESOURCES (Hospital Web App Primary)
-- ============================================================================

-- FHIR Patients (JSONB storage for full FHIR compliance)
CREATE TABLE IF NOT EXISTS fhir_patients (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN,
    gender VARCHAR(20),
    birth_date DATE,
    -- Link to unified patients table
    patient_id VARCHAR(36) REFERENCES patients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fhir_patients_active ON fhir_patients(active);

-- FHIR Practitioners (Doctors)
CREATE TABLE IF NOT EXISTS fhir_practitioners (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN,
    name_family VARCHAR(100),
    -- Link to users table
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fhir_practitioners_active ON fhir_practitioners(active);

-- FHIR Organizations (Healthcare Providers)
CREATE TABLE IF NOT EXISTS fhir_organizations (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN,
    name VARCHAR(255),
    -- Link to users table
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fhir_organizations_active ON fhir_organizations(active);

-- FHIR Appointments
CREATE TABLE IF NOT EXISTS fhir_appointments (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    start_date TIMESTAMP WITH TIME ZONE,
    patient_id VARCHAR(36),
    practitioner_id VARCHAR(36)
);

CREATE INDEX IF NOT EXISTS idx_fhir_appointments_patient ON fhir_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_fhir_appointments_practitioner ON fhir_appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_fhir_appointments_start ON fhir_appointments(start_date);

-- FHIR Encounters
CREATE TABLE IF NOT EXISTS fhir_encounters (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    patient_id VARCHAR(36),
    practitioner_id VARCHAR(36)
);

CREATE INDEX IF NOT EXISTS idx_fhir_encounters_patient ON fhir_encounters(patient_id);

-- FHIR Observations (Clinical observations - Hospital side)
CREATE TABLE IF NOT EXISTS fhir_observations (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    category VARCHAR(50),
    code VARCHAR(100),
    patient_id VARCHAR(36),
    effective_date TIMESTAMP WITH TIME ZONE,
    -- Link to vitals table
    vitals_id VARCHAR(36) REFERENCES vitals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fhir_observations_patient ON fhir_observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_fhir_observations_category ON fhir_observations(category);

-- FHIR Conditions
CREATE TABLE IF NOT EXISTS fhir_conditions (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    clinical_status VARCHAR(50),
    patient_id VARCHAR(36)
);

CREATE INDEX IF NOT EXISTS idx_fhir_conditions_patient ON fhir_conditions(patient_id);

-- FHIR Medication Requests (Prescriptions)
CREATE TABLE IF NOT EXISTS fhir_medication_requests (
    id VARCHAR(36) PRIMARY KEY,
    resource JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    intent VARCHAR(50),
    patient_id VARCHAR(36),
    requester_id VARCHAR(36)
);

CREATE INDEX IF NOT EXISTS idx_fhir_medication_requests_patient ON fhir_medication_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_fhir_medication_requests_requester ON fhir_medication_requests(requester_id);

-- ============================================================================
-- CONSENT WORKFLOWS (Hospital Web App)
-- ============================================================================

CREATE TABLE IF NOT EXISTS consent_workflows (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS consent_steps (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    workflow_id VARCHAR(36) NOT NULL REFERENCES consent_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_required BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_consent_steps_workflow ON consent_steps(workflow_id);

-- ============================================================================
-- AUDIT LOG (HIPAA Compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(36),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consents_updated_at BEFORE UPDATE ON consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vitals_updated_at BEFORE UPDATE ON vitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
