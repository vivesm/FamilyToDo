#!/bin/bash

# Start script for FamilyToDo

echo "🚀 Starting FamilyToDo..."

# Check if running in development or production
if [ "$1" = "dev" ]; then
    echo "Starting in development mode..."
    
    # Start backend
    echo "Starting backend..."
    cd backend
    npm install
    npm run dev &
    BACKEND_PID=$!
    
    # Start frontend
    echo "Starting frontend..."
    cd ../frontend
    npm install
    npm run dev &
    FRONTEND_PID=$!
    
    echo "✅ Development servers started!"
    echo "Backend: http://localhost:4000"
    echo "Frontend: http://localhost:5173"
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
    
else
    echo "Starting in production mode with Docker..."
    
    # Build and start with docker-compose
    docker-compose up --build -d
    
    echo "✅ FamilyToDo is running!"
    echo "Access at: http://localhost:4000"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
fi