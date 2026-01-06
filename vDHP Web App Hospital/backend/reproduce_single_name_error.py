from fhir.resources.humanname import HumanName
import json

def test_human_name():
    print("--- Testing HumanName Validation ---")
    
    # Case 1: Single word name
    name_str = "Doctor"
    name_parts = name_str.split(" ", 1)
    print(f"Split 'Doctor': {name_parts}")
    
    try:
        # Current logic in data_store.py
        family = name_parts[1] if len(name_parts) > 1 else ""
        print(f"Constructing: given=['{name_parts[0]}'], family='{family}'")
        
        human_name = HumanName(given=[name_parts[0]], family=family)
        print("SUCCESS: Created HumanName")
        print(human_name.json())
    except Exception as e:
        print(f"FAILED: {e}")

    # Case 2: Empty family
    try:
        print("\nTesting explicitly empty family...")
        human_name = HumanName(given=["Test"], family="")
        print("SUCCESS: Created HumanName with empty family")
    except Exception as e:
        print(f"FAILED: {e}")

    # Case 3: Missing family
    try:
        print("\nTesting missing family...")
        human_name = HumanName(given=["Test"])
        print("SUCCESS: Created HumanName without family")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_human_name()
