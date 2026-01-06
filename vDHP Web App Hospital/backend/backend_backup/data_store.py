"""
Step 2: Data Store with PostgreSQL Persistence (FHIR Compliant)
=========================================
This file acts as our "database" interface using SQLAlchemy and PostgreSQL.
It stores data as FHIR resources in JSONB columns.

Mappings:
- Patient -> FHIR Patient
- Doctor -> FHIR Practitioner
- Provider -> FHIR Organization
- Appointment -> FHIR Appointment
- MedicalRecord -> FHIR Encounter + Condition + Observation
- Prescription -> FHIR MedicationRequest
"""

from typing import Dict, List, Optional
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import SessionLocal
import sql_models as DB
from models import (
    PatientResponse, PatientCreate, PatientUpdate,
    DoctorResponse, DoctorCreate,
    ProviderResponse, ProviderCreate,
    AppointmentResponse, AppointmentCreate,
    PrescriptionResponse, PrescriptionCreate,
    MedicalRecordResponse, MedicalRecordCreate,
    RiskLevel, Vitals, Location, EmergencyContact
)
import uuid
import json
import base64

# FHIR Imports
from fhir.resources.patient import Patient
from fhir.resources.practitioner import Practitioner
from fhir.resources.organization import Organization
from fhir.resources.appointment import Appointment
from fhir.resources.encounter import Encounter
from fhir.resources.observation import Observation
from fhir.resources.condition import Condition
from fhir.resources.medicationrequest import MedicationRequest
from fhir.resources.humanname import HumanName
from fhir.resources.address import Address
from fhir.resources.contactpoint import ContactPoint
from fhir.resources.reference import Reference
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from fhir.resources.attachment import Attachment

class DataStore:
    """
    Centralized data store interface using PostgreSQL with FHIR resources.
    """
    
    def __init__(self):
        pass
    
    def _get_db(self):
        """Helper to get a database session"""
        return SessionLocal()

    # ===== USER METHODS =====
    def create_user(self, user_data: dict) -> DB.User:
        db = self._get_db()
        try:
            user = DB.User(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        finally:
            db.close()

    def get_user_by_email(self, email: str) -> Optional[DB.User]:
        db = self._get_db()
        try:
            return db.query(DB.User).filter(DB.User.email == email).first()
        finally:
            db.close()

    def update_user_last_login(self, email: str) -> bool:
        """
        Updates last_login timestamp. 
        Returns True if this was the first login (last_login was None), False otherwise.
        """
        db = self._get_db()
        try:
            user = db.query(DB.User).filter(DB.User.email == email).first()
            if user:
                is_first = user.last_login is None
                user.last_login = datetime.now(timezone.utc)
                db.commit()
                return is_first
            return False
        finally:
            db.close()

    # ===== HELPER METHODS =====
    def _create_fhir_reference(self, resource_type: str, resource_id: str) -> Reference:
        return Reference(reference=f"{resource_type}/{resource_id}")

    # ===== PATIENT METHODS =====
    def _map_fhir_patient_to_response(self, fhir_patient: Patient, db: Session) -> PatientResponse:
        """Map FHIR Patient to PatientResponse"""
        pid = fhir_patient.id
        
        # Name
        name = "Unknown"
        if fhir_patient.name:
            given = " ".join(fhir_patient.name[0].given) if fhir_patient.name[0].given else ""
            family = fhir_patient.name[0].family or ""
            name = f"{given} {family}".strip()

        # DOB & Age
        dob = fhir_patient.birthDate
        age = 0
        if dob:
            today = date.today()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        # Location
        loc = Location(address="", city="", state="", zipCode="", country="United States")
        if fhir_patient.address:
            addr = fhir_patient.address[0]
            loc = Location(
                address=addr.line[0] if addr.line else "",
                city=addr.city or "",
                state=addr.state or "",
                zipCode=addr.postalCode or "",
                country=addr.country or "United States"
            )

        # Contact (Phone/Email)
        phone = None
        email = None
        if fhir_patient.telecom:
            for t in fhir_patient.telecom:
                if t.system == 'phone':
                    phone = t.value
                elif t.system == 'email':
                    email = t.value

        # Vitals (Fetch latest Observation)
        # We need to find Observations for this patient with category 'vital-signs'
        # For simplicity in this POC, we'll query the latest Observation linked to this patient
        latest_obs = db.query(DB.FhirObservation)\
            .filter(DB.FhirObservation.patient_id == pid)\
            .order_by(desc(DB.FhirObservation.effective_date))\
            .first()
            
        vitals = Vitals(heartRate=0, bloodPressure="120/80", temperature=98.6, oxygenSat=98.0)
        if latest_obs:
            try:
                # Sanitize effectiveDateTime if it's naive
                res_data = latest_obs.resource.copy()
                if 'effectiveDateTime' in res_data:
                    edt = res_data['effectiveDateTime']
                    if isinstance(edt, str) and not edt.endswith('Z') and '+' not in edt:
                        # Check if it looks like a datetime
                        if 'T' in edt:
                             res_data['effectiveDateTime'] = edt + 'Z'
                
                obs_resource = Observation(**res_data)
                # Parse components if available, or valueQuantity
                # This is a simplification. Real FHIR vitals are complex.
                # We assume we stored them in a specific way in _create_vitals_observation
                if obs_resource.component:
                    for comp in obs_resource.component:
                        if not comp.code or not comp.code.coding: continue
                        code = comp.code.coding[0].code
                        if not comp.valueQuantity: continue
                        val = comp.valueQuantity.value
                        
                        if code == '8867-4': # Heart rate
                            vitals.heartRate = float(val)
                        elif code == '8310-5': # Body temperature
                            vitals.temperature = float(val)
                        elif code == '2708-6': # Oxygen saturation
                            vitals.oxygenSat = float(val)
                        elif code == '85354-9': # Blood pressure
                            pass
                    
                    # Handle BP specifically if we stored it as components
                    sys = next((c.valueQuantity.value for c in obs_resource.component if c.code and c.code.coding and c.code.coding[0].code == '8480-6' and c.valueQuantity), 120)
                    dia = next((c.valueQuantity.value for c in obs_resource.component if c.code and c.code.coding and c.code.coding[0].code == '8462-4' and c.valueQuantity), 80)
                    vitals.bloodPressure = f"{int(sys)}/{int(dia)}"
            except Exception as e:
                print(f"Error parsing vitals for patient {pid}: {e}")

        # Condition/Risk
        # Fetch active Conditions
        condition_str = "Unknown"
        # ... (Implementation omitted for brevity, would query FhirCondition)

        return PatientResponse(
            id=pid,
            name=name,
            age=age,
            condition=condition_str,
            riskLevel=RiskLevel.LOW, # Placeholder
            lastVisit=date.today(),
            location=loc,
            vitals=vitals,
            createdAt=datetime.now(timezone.utc), # Should come from meta.lastUpdated
            updatedAt=datetime.now(timezone.utc),
            phone=phone,
            email=email,
            dateOfBirth=dob.isoformat() if dob else None,
            gender=fhir_patient.gender,
            insuranceProvider=None, # Extension needed
            insuranceNumber=None
        )

    def create_patient(self, patient_data: PatientCreate) -> PatientResponse:
        db = self._get_db()
        try:
            pid = patient_data.id or str(uuid.uuid4())
            
            # Name
            name_parts = patient_data.name.split(" ", 1)
            human_name = HumanName(given=[name_parts[0]], family=name_parts[1] if len(name_parts) > 1 else "")
            
            # Address
            address = Address(
                line=[patient_data.location.address],
                city=patient_data.location.city,
                state=patient_data.location.state,
                postalCode=patient_data.location.zipCode,
                country=patient_data.location.country
            )
            
            # Telecom
            telecoms = []
            if patient_data.phone:
                telecoms.append(ContactPoint(system='phone', value=patient_data.phone, use='mobile'))
            if patient_data.email:
                telecoms.append(ContactPoint(system='email', value=patient_data.email, use='home'))

            # Create FHIR Patient
            fhir_patient = Patient(
                id=pid,
                active=True,
                name=[human_name],
                gender=patient_data.gender.lower() if patient_data.gender else None,
                birthDate=date.today(), # Placeholder, should parse patient_data.dateOfBirth
                address=[address],
                telecom=telecoms
            )
            
            # Save to DB
            db_patient = DB.FhirPatient(
                id=pid,
                resource=fhir_patient.model_dump(mode='json'),
                active=True,
                gender=fhir_patient.gender,
                birth_date=fhir_patient.birthDate
            )
            db.add(db_patient)
            
            # Create Initial Vitals Observation
            self._create_vitals_observation(db, pid, patient_data.vitals)
            
            db.commit()
            return self._map_fhir_patient_to_response(fhir_patient, db)
        finally:
            db.close()

    def _create_vitals_observation(self, db: Session, patient_id: str, vitals: Vitals):
        oid = str(uuid.uuid4())
        
        # BP Split
        bp_parts = vitals.bloodPressure.split('/')
        systolic = float(bp_parts[0]) if len(bp_parts) > 0 else 120
        diastolic = float(bp_parts[1]) if len(bp_parts) > 1 else 80

        # Components
        components = [
            {"code": {"coding": [{"system": "http://loinc.org", "code": "8867-4", "display": "Heart rate"}]}, "valueQuantity": {"value": vitals.heartRate, "unit": "beats/minute"}},
            {"code": {"coding": [{"system": "http://loinc.org", "code": "8310-5", "display": "Body temperature"}]}, "valueQuantity": {"value": vitals.temperature, "unit": "F"}},
            {"code": {"coding": [{"system": "http://loinc.org", "code": "2708-6", "display": "Oxygen saturation in Arterial blood"}]}, "valueQuantity": {"value": vitals.oxygenSat, "unit": "%"}},
            {"code": {"coding": [{"system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure"}]}, "valueQuantity": {"value": systolic, "unit": "mmHg"}},
            {"code": {"coding": [{"system": "http://loinc.org", "code": "8462-4", "display": "Diastolic blood pressure"}]}, "valueQuantity": {"value": diastolic, "unit": "mmHg"}}
        ]

        obs = Observation(
            id=oid,
            status='final',
            category=[{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}],
            code={"coding": [{"system": "http://loinc.org", "code": "85354-9", "display": "Blood pressure panel with all children optional"}]},
            subject={"reference": f"Patient/{patient_id}"},
            effectiveDateTime=datetime.now(timezone.utc),
            component=components
        )
        
        db_obs = DB.FhirObservation(
            id=oid,
            resource=obs.model_dump(mode='json'),
            status='final',
            category='vital-signs',
            code='85354-9',
            patient_id=patient_id,
            effective_date=datetime.now(timezone.utc)
        )
        db.add(db_obs)

    def get_patient(self, patient_id: str) -> Optional[PatientResponse]:
        db = self._get_db()
        try:
            p = db.query(DB.FhirPatient).filter(DB.FhirPatient.id == patient_id).first()
            if p:
                return self._map_fhir_patient_to_response(Patient(**p.resource), db)
            return None
        finally:
            db.close()

    def get_all_patients(self) -> List[PatientResponse]:
        db = self._get_db()
        try:
            patients = db.query(DB.FhirPatient).all()
            results = []
            for p in patients:
                try:
                    # Ensure resource is a dict
                    resource = p.resource
                    if isinstance(resource, str):
                        resource = json.loads(resource)
                    
                    fhir_p = Patient(**resource)
                    results.append(self._map_fhir_patient_to_response(fhir_p, db))
                except Exception as e:
                    print(f"Error loading patient {p.id}: {e}")
                    continue
            return results
        finally:
            db.close()

    # ===== DOCTOR METHODS =====
    def create_doctor(self, doctor_data: DoctorCreate) -> DoctorResponse:
        db = self._get_db()
        try:
            did = str(uuid.uuid4())
            
            name_parts = doctor_data.name.split(" ", 1)
            if len(name_parts) > 1:
                human_name = HumanName(given=[name_parts[0]], family=name_parts[1])
            else:
                # Handle single word name: use it as family name (required usually) and given name
                # or just family name. Let's use it as family name and empty given?
                # Or better: given=[name], family=name to ensure it appears in both places if needed.
                # Actually, let's just use the name as family, and given as empty list if needed,
                # but to be safe against "1 validation error", we ensure both are present.
                human_name = HumanName(given=[doctor_data.name], family=doctor_data.name)
            
            practitioner = Practitioner(
                id=did,
                active=True,
                name=[human_name],
                telecom=[
                    ContactPoint(system='email', value=doctor_data.email),
                    ContactPoint(system='phone', value=doctor_data.phone)
                ] if doctor_data.email or doctor_data.phone else None,
                gender=doctor_data.gender.lower() if doctor_data.gender else None,
                birthDate=doctor_data.birthDate,
                photo=[Attachment(data=doctor_data.photo.encode('utf-8'))] if doctor_data.photo else None,
                address=[Address(text=doctor_data.address)] if doctor_data.address else None
            )
            
            db_doc = DB.FhirPractitioner(
                id=did,
                resource=practitioner.model_dump(mode='json'),
                active=True,
                name_family=human_name.family
            )
            db.add(db_doc)
            db.commit()
            
            return DoctorResponse(
                id=did,
                name=doctor_data.name,
                specialty=doctor_data.specialty, # Specialty should be stored in 'qualification' or 'role', skipping for brevity
                email=doctor_data.email,
                phone=doctor_data.phone,
                licenseNumber=doctor_data.licenseNumber,
                hospital=doctor_data.hospital,
                photo=doctor_data.photo,
                gender=doctor_data.gender,
                birthDate=doctor_data.birthDate,
                address=doctor_data.address,
                bio=doctor_data.bio,
                createdAt=datetime.now(timezone.utc)
            )
        finally:
            db.close()

    def get_doctor(self, doctor_id: str) -> Optional[DoctorResponse]:
        db = self._get_db()
        try:
            d = db.query(DB.FhirPractitioner).filter(DB.FhirPractitioner.id == doctor_id).first()
            if d:
                res = Practitioner(**d.resource)
                name = "Unknown"
                if res.name:
                    given = " ".join(res.name[0].given or [])
                    family = res.name[0].family or ""
                    if given == family:
                        name = given
                    else:
                        name = f"{given} {family}".strip()
                return DoctorResponse(
                    id=res.id,
                    name=name,
                    specialty="General", # Placeholder
                    hospital=None, # Placeholder
                    photo=base64.b64encode(res.photo[0].data).decode('utf-8') if res.photo and res.photo[0].data else None,
                    gender=res.gender,
                    birthDate=res.birthDate,
                    address=res.address[0].text if res.address else None,
                    bio=None, # Not standard FHIR, maybe extension? For now skipping or using text
                    createdAt=datetime.now(timezone.utc)
                )
            return None
        finally:
            db.close()

    def update_doctor(self, doctor_id: str, doctor_data: DoctorCreate) -> Optional[DoctorResponse]:
        db = self._get_db()
        try:
            d = db.query(DB.FhirPractitioner).filter(DB.FhirPractitioner.id == doctor_id).first()
            if not d:
                return None
            
            # Parse existing resource
            res_dict = d.resource
            if isinstance(res_dict, str):
                res_dict = json.loads(res_dict)
            
            practitioner = Practitioner(**res_dict)
            
            # Update Name
            name_parts = doctor_data.name.split(" ", 1)
            if len(name_parts) > 1:
                human_name = HumanName(given=[name_parts[0]], family=name_parts[1])
            else:
                human_name = HumanName(given=[doctor_data.name], family=doctor_data.name)
            practitioner.name = [human_name]
            
            # Update Telecom (Email/Phone)
            telecoms = []
            if doctor_data.email:
                telecoms.append(ContactPoint(system='email', value=doctor_data.email))
            if doctor_data.phone:
                telecoms.append(ContactPoint(system='phone', value=doctor_data.phone))
            if telecoms:
                practitioner.telecom = telecoms
            
            # Update Other Fields
            if doctor_data.gender:
                practitioner.gender = doctor_data.gender.lower()
            if doctor_data.birthDate:
                practitioner.birthDate = doctor_data.birthDate
            if doctor_data.photo:
                practitioner.photo = [Attachment(data=doctor_data.photo.encode('utf-8'))]
            if doctor_data.address:
                practitioner.address = [Address(text=doctor_data.address)]
            
            # Bio is tricky, let's store it in extension or just ignore for now if strict FHIR
            # Or use 'text' field of DomainResource?
            # practitioner.text = {"status": "generated", "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\">{doctor_data.bio}</div>"}
                
            # Update DB record
            d.resource = practitioner.model_dump(mode='json')
            d.name_family = human_name.family
            d.last_updated = datetime.now(timezone.utc)
            
            db.commit()
            
            return DoctorResponse(
                id=d.id,
                name=doctor_data.name,
                specialty=doctor_data.specialty,
                email=doctor_data.email,
                phone=doctor_data.phone,
                licenseNumber=doctor_data.licenseNumber,
                hospital=doctor_data.hospital,
                photo=doctor_data.photo,
                gender=doctor_data.gender,
                birthDate=doctor_data.birthDate,
                address=doctor_data.address,
                bio=doctor_data.bio,
                createdAt=datetime.now(timezone.utc) # Should be original creation time, but fine for now
            )
        finally:
            db.close()

    def get_doctor_by_email(self, email: str) -> Optional[DoctorResponse]:
        """
        Find a doctor by email.
        Note: In a real app, we should have an indexed email column or a separate mapping table.
        For this POC, we'll scan the practitioners.
        """
        db = self._get_db()
        try:
            # This is inefficient for large datasets but fine for POC
            practitioners = db.query(DB.FhirPractitioner).all()
            for p in practitioners:
                try:
                    # Ensure resource is a dict
                    resource = p.resource
                    if isinstance(resource, str):
                        resource = json.loads(resource)
                        
                    res = Practitioner(**resource)
                    # Check telecom for email
                    if res.telecom:
                        for t in res.telecom:
                            if t.system == 'email' and t.value == email:
                                # Found match!
                                name = "Unknown"
                                if res.name:
                                    given = " ".join(res.name[0].given or [])
                                    family = res.name[0].family or ""
                                    if given == family:
                                        name = given
                                    else:
                                        name = f"{given} {family}".strip()
                                return DoctorResponse(
                                    id=res.id,
                                    name=name,
                                    specialty="General",
                                    photo=base64.b64encode(res.photo[0].data).decode('utf-8') if res.photo and res.photo[0].data else None,
                                    gender=res.gender,
                                    birthDate=res.birthDate,
                                    address=res.address[0].text if res.address else None,
                                    createdAt=datetime.now(timezone.utc)
                                )
                except Exception:
                    continue
            return None
        finally:
            db.close()

    def get_all_doctors(self) -> List[DoctorResponse]:
        # Similar implementation to get_doctor
        return []

    # ===== PROVIDER METHODS =====
    def create_provider(self, provider_data: ProviderCreate) -> ProviderResponse:
        # Map to Organization
        return ProviderResponse(id="1", name=provider_data.name, createdAt=datetime.now(timezone.utc))

    def get_all_providers(self) -> List[ProviderResponse]:
        return []

    # ===== APPOINTMENT METHODS =====
    def create_appointment(self, appointment_data: AppointmentCreate) -> AppointmentResponse:
        db = self._get_db()
        try:
            aid = str(uuid.uuid4())
            
            appt = Appointment(
                id=aid,
                status='booked',
                description=appointment_data.reason,
                start=datetime.combine(appointment_data.scheduledDate, datetime.strptime(appointment_data.scheduledTime, "%H:%M").time()),
                participant=[
                    {"actor": {"reference": f"Patient/{appointment_data.patientId}"}, "status": "accepted"},
                    {"actor": {"reference": f"Practitioner/{appointment_data.doctorId}"}, "status": "accepted"}
                ]
            )
            
            db_appt = DB.FhirAppointment(
                id=aid,
                resource=appt.model_dump(mode='json'),
                status='booked',
                start_date=appt.start,
                patient_id=appointment_data.patientId,
                practitioner_id=appointment_data.doctorId
            )
            db.add(db_appt)
            db.commit()
            
            return AppointmentResponse(
                id=aid,
                patientId=appointment_data.patientId,
                doctorId=appointment_data.doctorId,
                scheduledDate=appointment_data.scheduledDate,
                scheduledTime=appointment_data.scheduledTime,
                reason=appointment_data.reason,
                createdAt=datetime.now(timezone.utc),
                updatedAt=datetime.now(timezone.utc)
            )
        finally:
            db.close()

    def get_appointments_by_patient(self, patient_id: str) -> List[AppointmentResponse]:
        # Query FhirAppointment where patient_id matches
        return []

    def get_appointments_by_doctor(self, doctor_id: str) -> List[AppointmentResponse]:
        return []

    # ===== MEDICAL RECORD METHODS =====
    def create_medical_record(self, record_data: MedicalRecordCreate) -> MedicalRecordResponse:
        db = self._get_db()
        try:
            eid = str(uuid.uuid4())
            
            # Create Encounter
            encounter = Encounter(
                id=eid,
                status='finished',
                class_={"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB", "display": "ambulatory"},
                subject={"reference": f"Patient/{record_data.patientId}"},
                participant=[{"individual": {"reference": f"Practitioner/{record_data.doctorId}"}}],
                period={"start": datetime.combine(record_data.visitDate or date.today(), datetime.min.time())}
            )
            
            db_enc = DB.FhirEncounter(
                id=eid,
                resource=encounter.model_dump(mode='json'),
                status='finished',
                patient_id=record_data.patientId,
                practitioner_id=record_data.doctorId
            )
            db.add(db_enc)
            
            # Create Condition (Diagnosis)
            if record_data.diagnosis:
                cid = str(uuid.uuid4())
                cond = Condition(
                    id=cid,
                    clinicalStatus={"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]},
                    code={"text": record_data.diagnosis},
                    subject={"reference": f"Patient/{record_data.patientId}"},
                    encounter={"reference": f"Encounter/{eid}"}
                )
                db_cond = DB.FhirCondition(
                    id=cid,
                    resource=cond.model_dump(mode='json'),
                    clinical_status='active',
                    patient_id=record_data.patientId
                )
                db.add(db_cond)

            db.commit()
            
            return MedicalRecordResponse(
                id=eid,
                patientId=record_data.patientId,
                doctorId=record_data.doctorId,
                diagnosis=record_data.diagnosis,
                notes=record_data.notes,
                visitDate=record_data.visitDate,
                treatment=record_data.treatment,
                followUpRequired=record_data.followUpRequired,
                createdAt=datetime.now(timezone.utc)
            )
        finally:
            db.close()

    def get_medical_records_by_patient(self, patient_id: str) -> List[MedicalRecordResponse]:
        # Query FhirEncounter
        return []

    # ===== PRESCRIPTION METHODS =====
    def create_prescription(self, prescription_data: PrescriptionCreate) -> PrescriptionResponse:
        # Map to MedicationRequest
        return PrescriptionResponse(
            id="1", 
            patientId=prescription_data.patientId, 
            doctorId=prescription_data.doctorId,
            medication=prescription_data.medication,
            dosage=prescription_data.dosage,
            instructions=prescription_data.instructions,
            createdAt=datetime.now(timezone.utc)
        )

    def get_prescriptions_by_patient(self, patient_id: str) -> List[PrescriptionResponse]:
        return []

# Create a global instance
data_store = DataStore()
