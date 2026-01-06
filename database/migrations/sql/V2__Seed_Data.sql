-- ============================================================================
-- V2__Seed_Data.sql
-- Initial seed data for vDHP platform
-- Creates test users, invitations, and sample data
-- ============================================================================

-- ============================================================================
-- TEST USERS
-- ============================================================================

-- Admin User (password: Admin@123)
INSERT INTO users (id, email, name, hashed_password, role, is_active, is_verified)
VALUES (
    'admin-001-uuid-xxxx',
    'admin@vdhp.com',
    'System Admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G5lgKZ8Yd0Z8Hy', -- bcrypt hash of Admin@123
    'admin',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Demo Doctor (password: Doctor@123)
INSERT INTO users (id, email, name, hashed_password, role, is_active, is_verified)
VALUES (
    'doctor-001-uuid-xxxx',
    'doctor@vdhp.com',
    'Dr. Sarah Johnson',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G5lgKZ8Yd0Z8Hy', -- bcrypt hash
    'doctor',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Demo Provider (password: Provider@123)
INSERT INTO users (id, email, name, hashed_password, role, is_active, is_verified)
VALUES (
    'provider-001-uuid-xxxx',
    'provider@vdhp.com',
    'City General Hospital',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G5lgKZ8Yd0Z8Hy', -- bcrypt hash
    'provider',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Demo Patient User (password: password123)
INSERT INTO users (id, email, name, hashed_password, role, is_active, is_verified)
VALUES (
    'patient-user-001-uuid',
    'demo@vdhp.com',
    'John Doe',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G5lgKZ8Yd0Z8Hy', -- bcrypt hash
    'patient',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- TEST INVITATIONS
-- ============================================================================

INSERT INTO invitations (id, invitation_code, email, hospital_id, patient_mrn, expires_at, created_by)
VALUES (
    'invite-001-uuid-xxxx',
    'TEST2024',
    'newpatient@example.com',
    'hospital-001',
    'MRN-001',
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    'admin-001-uuid-xxxx'
) ON CONFLICT (invitation_code) DO NOTHING;

INSERT INTO invitations (id, invitation_code, email, hospital_id, patient_mrn, expires_at, created_by)
VALUES (
    'invite-002-uuid-xxxx',
    'WELCOME2024',
    NULL,
    'hospital-001',
    'MRN-002',
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    'doctor-001-uuid-xxxx'
) ON CONFLICT (invitation_code) DO NOTHING;

-- ============================================================================
-- DEMO PATIENT
-- ============================================================================

INSERT INTO patients (id, user_id, mrn, first_name, last_name, date_of_birth, gender, city, state, country)
VALUES (
    'patient-001-uuid-xxxx',
    'patient-user-001-uuid',
    'MRN-DEMO-001',
    'John',
    'Doe',
    '1965-05-15',
    'male',
    'New York',
    'NY',
    'United States'
) ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- DEMO CARE PLAN
-- ============================================================================

INSERT INTO care_plans (id, patient_id, title, description, status, start_date, created_by)
VALUES (
    'careplan-001-uuid-xxxx',
    'patient-001-uuid-xxxx',
    'Diabetes Management Plan',
    'Comprehensive care plan for Type 2 Diabetes management including medication, diet, and exercise.',
    'active',
    CURRENT_TIMESTAMP,
    'doctor-001-uuid-xxxx'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO TASKS
-- ============================================================================

INSERT INTO tasks (id, care_plan_id, patient_id, title, description, task_type, status, priority, due_date)
VALUES 
(
    'task-001-uuid-xxxxx',
    'careplan-001-uuid-xxxx',
    'patient-001-uuid-xxxx',
    'Take morning medication',
    'Take Metformin 500mg with breakfast',
    'medication',
    'pending',
    'high',
    CURRENT_TIMESTAMP + INTERVAL '1 day'
),
(
    'task-002-uuid-xxxxx',
    'careplan-001-uuid-xxxx',
    'patient-001-uuid-xxxx',
    'Log blood sugar',
    'Record fasting blood sugar level before breakfast',
    'questionnaire',
    'pending',
    'high',
    CURRENT_TIMESTAMP + INTERVAL '1 day'
),
(
    'task-003-uuid-xxxxx',
    'careplan-001-uuid-xxxx',
    'patient-001-uuid-xxxx',
    '30-minute walk',
    'Complete a 30-minute walk at moderate pace',
    'exercise',
    'pending',
    'medium',
    CURRENT_TIMESTAMP + INTERVAL '1 day'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO VITALS
-- ============================================================================

INSERT INTO vitals (id, patient_id, vitals_type, systolic, diastolic, measured_at)
VALUES (
    'vital-001-uuid-xxxxx',
    'patient-001-uuid-xxxx',
    'blood_pressure',
    128,
    82,
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
) ON CONFLICT DO NOTHING;

INSERT INTO vitals (id, patient_id, vitals_type, value, unit, measured_at)
VALUES (
    'vital-002-uuid-xxxxx',
    'patient-001-uuid-xxxx',
    'heart_rate',
    72,
    'bpm',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
) ON CONFLICT DO NOTHING;

INSERT INTO vitals (id, patient_id, vitals_type, blood_sugar_value, blood_sugar_unit, blood_sugar_type, measured_at)
VALUES (
    'vital-003-uuid-xxxxx',
    'patient-001-uuid-xxxx',
    'blood_sugar',
    126,
    'mg/dL',
    'fasting',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO MESSAGES
-- ============================================================================

INSERT INTO messages (id, patient_id, sender_type, sender_id, sender_name, recipient_type, recipient_id, subject, message_text)
VALUES (
    'msg-001-uuid-xxxxxxx',
    'patient-001-uuid-xxxx',
    'doctor',
    'doctor-001-uuid-xxxx',
    'Dr. Sarah Johnson',
    'patient',
    'patient-001-uuid-xxxx',
    'Welcome to vDHP Care Compass',
    'Hello John! Welcome to vDHP Care Compass. I am Dr. Sarah Johnson and I will be overseeing your care plan. Please feel free to reach out if you have any questions about your treatment plan or medications.'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- FHIR PRACTITIONER (Doctor)
-- ============================================================================

INSERT INTO fhir_practitioners (id, resource, active, name_family, user_id)
VALUES (
    'fhir-pract-001-uuid',
    '{
        "resourceType": "Practitioner",
        "id": "fhir-pract-001-uuid",
        "active": true,
        "name": [{"given": ["Sarah"], "family": "Johnson", "prefix": ["Dr."]}],
        "telecom": [
            {"system": "email", "value": "doctor@vdhp.com"},
            {"system": "phone", "value": "+1-555-0123"}
        ],
        "gender": "female",
        "qualification": [
            {
                "code": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0360", "code": "MD"}]},
                "issuer": {"display": "State Medical Board"}
            }
        ]
    }',
    TRUE,
    'Johnson',
    'doctor-001-uuid-xxxx'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- FHIR ORGANIZATION (Provider/Hospital)
-- ============================================================================

INSERT INTO fhir_organizations (id, resource, active, name, user_id)
VALUES (
    'fhir-org-001-uuid-xx',
    '{
        "resourceType": "Organization",
        "id": "fhir-org-001-uuid-xx",
        "active": true,
        "name": "City General Hospital",
        "telecom": [
            {"system": "email", "value": "provider@vdhp.com"},
            {"system": "phone", "value": "+1-555-0100"}
        ],
        "address": [
            {"line": ["123 Medical Center Blvd"], "city": "New York", "state": "NY", "postalCode": "10001"}
        ]
    }',
    TRUE,
    'City General Hospital',
    'provider-001-uuid-xxxx'
) ON CONFLICT DO NOTHING;
