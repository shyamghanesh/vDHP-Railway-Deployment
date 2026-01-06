
const consent = {
  resourceType: "Consent",
  id: "consent-001",
  status: "active",
  subject: { reference: "Patient/john123" },
  date: "2025-11-14",
  period: { start: "2025-11-14", end: "2026-11-14" },
  grantor: [{ reference: "Patient/john123" }],
  grantee: [{ reference: "Organization/hospital" }],
  controller: [{ reference: "Organization/hospital" }],
  regulatoryBasis: [{ coding: [
    { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "HIPAA-Auth" }
  ]}],
  decision: "permit",
  provision: [{
    period: { start: "2025-11-14", end: "2026-11-14" },
    action: [{ coding: [
      { system: "http://terminology.hl7.org/CodeSystem/consentaction",
        code: "access" }
    ]}],
    purpose: [{ 
      system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
      code: "TREAT" 
    }],
    resourceType: [
      { system: "http://hl7.org/fhir/resource-types", code: "Medication" },
      { system: "http://hl7.org/fhir/resource-types", code: "Observation" }
    ]
  }]
};

fetch('https://fhir-server/Consent', {
  method: 'POST',
  body: JSON.stringify(consent),
  headers: { 'Content-Type': 'application/json' }
});

// This is complicated! Use a library instead.
