#!/bin/bash
# Deployment setup script
set -e

echo "Stopping any existing containers..."
docker-compose down -v

echo "Building and starting new containers..."
docker-compose up --build -d

echo "Deployment complete!"
echo -e "\nAccess the application at:"
echo "http://$(hostname -I | awk '{print $1}'):80"
echo -e "\nRun 'docker-compose logs -f' to view service logs"