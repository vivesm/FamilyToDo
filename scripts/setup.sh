#!/bin/bash

# Setup script for FamilyToDo

echo "🔧 Setting up FamilyToDo..."

# Create necessary directories
echo "Creating directories..."
mkdir -p data uploads backend/data backend/uploads

# Copy environment file
if [ ! -f backend/.env ]; then
    echo "Creating .env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update backend/.env with your configuration"
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Initialize database
echo "Initializing database..."
npm run init-db

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

# Make scripts executable
cd ..
chmod +x scripts/*.sh

echo "✅ Setup complete!"
echo ""
echo "To start in development mode: ./scripts/start.sh dev"
echo "To start in production mode: ./scripts/start.sh"