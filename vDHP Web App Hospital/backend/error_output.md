Error creating test data: 1 validation error for Observation
effectiveDateTime
  Value error, Datetime must be timezone aware if it has a time component. [type=value_error, input_value='2025-11-29T15:13:21.599043', input_type=str]
    For further information visit https://errors.pydantic.dev/2.10/v/value_error
Validation errors:
{'type': 'value_error', 'loc': ('effectiveDateTime',), 'msg': 'Value error, Datetime must be timezone aware if it has a time component.', 'input': '2025-11-29T15:13:21.599043', 'ctx': {'error': ValueError('Datetime must be timezone aware if it has a time component.')}, 'url': 'https://errors.pydantic.dev/2.10/v/value_error'}
Traceback (most recent call last):
  File "C:\Users\DWARAKESH\Downloads\vDHP-POC\backend\create_test_data.py", line 36, in <module>
    created = ds.create_patient(patient)
  File "C:\Users\DWARAKESH\Downloads\vDHP-POC\backend\data_store.py", line 215, in create_patient
    return self._map_fhir_patient_to_response(fhir_patient, db)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^
  File "C:\Users\DWARAKESH\Downloads\vDHP-POC\backend\data_store.py", line 117, in _map_fhir_patient_to_response
    obs_resource = Observation(**latest_obs.resource)
  File "C:\Users\DWARAKESH\Python\Lib\site-packages\fhir_core\fhirabstractmodel.py", line 92, in __init__
    BaseModel.__init__(self, **data)
    ~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^
  File "C:\Users\DWARAKESH\Python\Lib\site-packages\pydantic\main.py", line 214, in __init__
    validated_self = self.__pydantic_validator__.validate_python(data, self_instance=self)
pydantic_core._pydantic_core.ValidationError: 1 validation error for Observation
effectiveDateTime
  Value error, Datetime must be timezone aware if it has a time component. [type=value_error, input_value='2025-11-29T15:13:21.599043', input_type=str]
    For further information visit https://errors.pydantic.dev/2.10/v/value_error
