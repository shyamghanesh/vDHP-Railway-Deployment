# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt /app/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app/

# Expose the port that the app runs on
EXPOSE 8000

# Run the application
# Using shell form to allow variable expansion if needed, but exec form is generally preferred.
# We use uvicorn directly.
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
