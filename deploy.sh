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
    echo "Usage: $0 [-dev|-prod] [options]"
    echo ""
    echo "Options:"
    echo "  -dev     Deploy to development environment (kelifax-dev-project)"
    echo "  -prod    Deploy to production environment (kelifax.com-website)"
    echo "  --dry-run  Build only, don't deploy to S3"
    echo "  -h, --help Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -dev         # Build and deploy to development"
    echo "  $0 -prod        # Build and deploy to production"
    echo "  $0 -dev --dry-run # Build for dev but don't deploy"
    exit 1
}

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    print_status "AWS CLI found. Authentication will be handled by your configured credentials/SSO."
}

# Function to check if required environment files exist
check_env_files() {
    # Check for env.dev.config
    if [ ! -f "env.dev.config" ]; then
        print_error "env.dev.config file not found!"
        print_error "Please create env.dev.config with your development configuration"
        exit 1
    fi
    
    # Check for env.prod.config
    if [ ! -f "env.prod.config" ]; then
        print_error "env.prod.config file not found!"
        print_error "Please create env.prod.config with your production configuration"
        exit 1
    fi
    
    print_status "Environment config files found"
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
    local dry_run=${4:-false}
    
    print_status "Starting deployment to $env environment..."
     # Check if environment config file exists
    if [ ! -f "$env_file" ]; then
        print_error "Environment config file $env_file not found!"
        exit 1
    fi

    # Backup current .env and copy from config file
    backup_env
    cp "$env_file" .env
    print_success "Copied $env_file to .env for $env environment"
    
    # Clean previous build and cache
    print_status "Cleaning previous build and cache..."
    rm -rf ./dist .astro
    
    # Extract and export environment variables from the env file
    print_status "Loading environment variables from $env_file..."
    
    # Source all environment variables from the file
    set -a  # automatically export all variables
    source "$env_file"
    set +a  # disable automatic export
    
    # Validate required environment variables
    if [ -z "$PUBLIC_API_URL" ] || [ -z "$PUBLIC_USE_API" ]; then
        print_error "Required environment variables missing in $env_file"
        print_error "Please ensure PUBLIC_API_URL and PUBLIC_USE_API are set"
        restore_env
        exit 1
    fi
    
    # Display the configuration being used
    print_status "Building with configuration:"
    print_status "  - Environment: $env"
    print_status "  - API URL: $PUBLIC_API_URL"
    print_status "  - Use API: $PUBLIC_USE_API"
    if [ -n "$PUBLIC_API_KEY" ]; then
        print_status "  - API Key: ${PUBLIC_API_KEY:0:10}..." # Show only first 10 chars for security
    fi
    print_status "  - Contact Email: $PUBLIC_CONTACT_EMAIL"
    
    # Build the project with environment variables
    print_status "Building project for $env..."
    if npm run build; then
        print_success "Build completed successfully"
        
        # Show build output info
        if [ -d "./dist" ]; then
            build_size=$(du -sh ./dist | cut -f1)
            file_count=$(find ./dist -type f | wc -l | tr -d ' ')
            print_status "Build output: $build_size ($file_count files)"
        fi
    else
        print_error "Build failed!"
        restore_env
        exit 1
    fi
    
    # Handle dry run
    if [ "$dry_run" = true ]; then
        print_success "🏗️  Dry run completed successfully!"
        print_status "Build files are ready in ./dist"
        print_status "To deploy, run the same command without --dry-run"
        restore_env
        return 0
    fi
    
    # Confirmation before S3 deployment
    print_warning "Ready to deploy to S3 bucket: $s3_bucket"
    print_status "This will:"
    print_status "  - Upload all files from ./dist to S3"
    print_status "  - Delete files in S3 that are not in ./dist"
    print_status "  - Make the site live immediately"
    echo
    read -p "Do you want to proceed with the S3 deployment? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled. Build files are ready in ./dist"
        restore_env
        exit 0
    fi
    
    # Deploy to S3
    print_status "Deploying to S3 bucket: $s3_bucket..."
    if aws s3 sync ./dist "s3://$s3_bucket" --delete --exact-timestamps; then
        print_success "Successfully deployed to S3"
        
        # Show deployment summary
        uploaded_files=$(aws s3 ls "s3://$s3_bucket" --recursive 2>/dev/null | wc -l | tr -d ' ')
        print_status "Deployment summary: $uploaded_files files in S3 bucket"
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
    
    # Check and create environment files if needed
    check_env_files
    
    # Parse command line arguments
    local env_type=""
    local dry_run=false
    
    # Process all arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -dev|--dev|dev)
                env_type="dev"
                shift
                ;;
            -prod|--prod|prod)
                env_type="prod"
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            -h|--help|help)
                show_usage
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                ;;
        esac
    done
    
    # Check if environment type was specified
    if [ -z "$env_type" ]; then
        print_error "No environment specified!"
        show_usage
    fi
    
    # Execute based on environment type
    case $env_type in
        dev)
            if [ "$dry_run" = true ]; then
                print_status "🏗️  Building for DEVELOPMENT environment (dry run)"
            else
                print_status "🔧 Deploying to DEVELOPMENT environment"
            fi
            deploy_to_env "development" "env.dev.config" "kelifax-dev-project" "$dry_run"
            ;;
        prod)
            if [ "$dry_run" = true ]; then
                print_status "🏗️  Building for PRODUCTION environment (dry run)"
            else
                print_status "🚀 Deploying to PRODUCTION environment"
                print_warning "⚠️  PRODUCTION DEPLOYMENT WARNING ⚠️"
                print_warning "This will deploy to the live website (kelifax.com-website)"
                print_warning "Make sure you have tested everything in development first!"
                echo
                read -p "Are you absolutely sure you want to deploy to PRODUCTION? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_status "Production deployment cancelled."
                    exit 0
                fi
            fi
            deploy_to_env "production" "env.prod.config" "kelifax.com-website" "$dry_run"
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
