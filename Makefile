.PHONY: help install setup dev build start stop restart logs clean test

# Default target
help:
	@echo "FamilyToDo - Visual Task Management for iPad"
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make setup      - Initial setup (directories, DB, etc.)"
	@echo "  make dev        - Start development servers"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production with Docker"
	@echo "  make stop       - Stop Docker containers"
	@echo "  make restart    - Restart Docker containers"
	@echo "  make logs       - View Docker logs"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make test       - Run tests"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Setup project
setup:
	@echo "Setting up FamilyToDo..."
	chmod +x scripts/*.sh
	./scripts/setup.sh

# Development mode
dev:
	@echo "Starting development servers..."
	./scripts/start.sh dev

# Build for production
build:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Building Docker image..."
	docker-compose build

# Start production
start:
	@echo "Starting FamilyToDo in production..."
	docker-compose up -d
	@echo "FamilyToDo is running at http://localhost:4000"

# Stop production
stop:
	@echo "Stopping FamilyToDo..."
	docker-compose down

# Restart production
restart: stop start

# View logs
logs:
	docker-compose logs -f

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	docker-compose down -v

# Run tests (placeholder)
test:
	@echo "Running tests..."
	cd backend && npm test
	cd frontend && npm test