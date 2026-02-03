# use an official Python runtime as a parent image
FROM python:3.10-slim

# set the working directory in the container
WORKDIR /app

# install system dependencies required for psycopg2 and other libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# copy the dependencies file to the working directory
COPY requirements.txt .

# install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# copy the rest of the application's code
COPY ./app ./app

# expose port 8000 to the outside world
EXPOSE 8000

# command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
