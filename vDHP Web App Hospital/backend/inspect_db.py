import sqlite3
import json

def inspect_db(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        schema_info = {}
        
        for table in tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            
            schema_info[table_name] = {
                "columns": [{"name": col[1], "type": col[2], "notnull": col[3], "pk": col[5]} for col in columns],
                "row_count": row_count
            }
            
        with open("db_schema.json", "w") as f:
            json.dump(schema_info, f, indent=2)
        print("Schema written to db_schema.json")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db("vdhp_care_compass.db")
