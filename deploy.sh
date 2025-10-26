#!/bin/bash

# Kelifax Deployment Script
# Usage: ./deploy.sh -dev or ./deploy.sh -prod
# This script handles environment-specific builds and deployments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [-dev|-prod]"
    echo ""
    echo "Options:"
    echo "  -dev     Deploy to development environment (kelifax-dev-project)"
    echo "  -prod    Deploy to production environment (kelifax.com-website)"
    echo ""
    echo "Examples:"
    echo "  $0 -dev      # Deploy to development"
    echo "  $0 -prod     # Deploy to production"
    exit 1
}

# Function to check if AWS CLI is installed and configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
}

# Function to backup current .env file
backup_env() {
    if [ -f .env ]; then
        cp .env .env.backup
        print_status "Backed up current .env file"
    fi
}

# Function to restore .env file
restore_env() {
    if [ -f .env.backup ]; then
        mv .env.backup .env
        print_status "Restored original .env file"
    fi
}

# Function to deploy to specific environment
deploy_to_env() {
    local env=$1
    local env_file=$2
    local s3_bucket=$3
    
    print_status "Starting deployment to $env environment..."
    
    # Check if environment file exists
    if [ ! -f "$env_file" ]; then
        print_error "Environment file $env_file not found!"
        exit 1
    fi
    
    # Backup current .env and switch to target environment
    backup_env
    cp "$env_file" .env
    print_success "Switched to $env environment configuration"
    
    # Clean previous build and cache
    print_status "Cleaning previous build and cache..."
    rm -rf ./dist .astro
    
    # Extract environment variables from the env file
    print_status "Loading environment variables from $env_file..."
    export PUBLIC_USE_API=$(grep "^PUBLIC_USE_API=" "$env_file" | cut -d'=' -f2)
    export PUBLIC_API_URL=$(grep "^PUBLIC_API_URL=" "$env_file" | cut -d'=' -f2)
    export PUBLIC_API_KEY=$(grep "^PUBLIC_API_KEY=" "$env_file" | cut -d'=' -f2)
    export PUBLIC_CONTACT_EMAIL=$(grep "^PUBLIC_CONTACT_EMAIL=" "$env_file" | cut -d'=' -f2)
    
    # Display the configuration being used
    print_status "Building with configuration:"
    print_status "  - API URL: $PUBLIC_API_URL"
    print_status "  - Use API: $PUBLIC_USE_API"
    print_status "  - Contact Email: $PUBLIC_CONTACT_EMAIL"
    
    # Build the project with explicit environment variables
    print_status "Building project for $env..."
    if npm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed!"
        restore_env
        exit 1
    fi
    
    # Deploy to S3
    print_status "Deploying to S3 bucket: $s3_bucket"
    if aws s3 sync ./dist "s3://$s3_bucket" --delete; then
        print_success "Successfully deployed to S3"
    else
        print_error "S3 deployment failed!"
        restore_env
        exit 1
    fi
    
    # Restore original environment
    restore_env
    
    print_success "🚀 Deployment to $env completed successfully!"
    print_status "Your site should be available shortly."
}

# Main script logic
main() {
    # Check if no arguments provided
    if [ $# -eq 0 ]; then
        print_error "No environment specified!"
        show_usage
    fi
    
    # Check AWS CLI
    check_aws_cli
    
    # Parse command line arguments
    case $1 in
        -dev|--dev|dev)
            print_status "🔧 Deploying to DEVELOPMENT environment"
            deploy_to_env "development" ".env.development" "kelifax-dev-project"
            ;;
        -prod|--prod|prod)
            print_status "🚀 Deploying to PRODUCTION environment"
            print_warning "You are about to deploy to PRODUCTION!"
            read -p "Are you sure you want to continue? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                deploy_to_env "production" ".env.production" "kelifax.com-website"
            else
                print_status "Deployment cancelled."
                exit 0
            fi
            ;;
        -h|--help|help)
            show_usage
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            ;;
    esac
}

# Cleanup function for graceful exit
cleanup() {
    if [ -f .env.backup ]; then
        restore_env
        print_status "Cleaned up backup files"
    fi
}

# Set trap for cleanup on script exit
trap cleanup EXIT

# Run main function with all arguments
main "$@"
