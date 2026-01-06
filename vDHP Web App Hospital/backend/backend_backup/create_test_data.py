from data_store import DataStore
from models import PatientCreate, Vitals

ds = DataStore()

try:
    from models import PatientCreate, Vitals, Location, EmergencyContact

    # Create a test patient
    patient = PatientCreate(
        name="Test Patient",
        age=30,
        condition="Healthy",
        location=Location(
            address="123 Test St",
            city="Test City",
            state="TS",
            zipCode="12345",
            country="Test Country"
        ),
        gender="Male",
        phone="555-0123",
        emergencyContact=EmergencyContact(
            name="Emergency Contact",
            relationship="Sibling",
            phone="555-9999"
        ),
        vitals=Vitals(
            heartRate=72,
            bloodPressure="120/80",
            temperature=98.6,
            oxygenSat=98.0
        )
    )
    
    created = ds.create_patient(patient)
    print(f"Successfully created patient: {created.name} (ID: {created.id})")
    
    # Verify retrieval
    retrieved = ds.get_patient(created.id)
    if retrieved:
        print("Successfully retrieved patient from DB")
    else:
        print("Failed to retrieve patient")

except Exception as e:
    import traceback
    with open("error_output.md", "w", encoding="utf-8") as f:
        f.write(f"Error creating test data: {e}\n")
        if hasattr(e, 'errors'):
            f.write("Validation errors:\n")
            for err in e.errors():
                f.write(f"{err}\n")
        f.write(traceback.format_exc())
    print("Error written to error_output.md")
