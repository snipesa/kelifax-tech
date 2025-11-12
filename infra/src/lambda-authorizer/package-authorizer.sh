#!/bin/bash

# Lambda Authorizer Packaging and Upload Script
# Usage: ./package-authorizer.sh [dev|prod]

set -e

# Configuration
FUNCTION_NAME="lambda_function_auth"
BUCKET_NAME="cf-kelifax-deployment-bucket"
LAMBDA_DIR="./app"
REQUIREMENTS_FILE="./requirements.txt"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment argument is provided
if [ $# -eq 0 ]; then
    print_error "Environment argument is required"
    echo "Usage: $0 [dev|prod]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment argument
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    print_error "Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

# Set S3 prefix based on environment
S3_PREFIX="api-lambda-auth-${ENVIRONMENT}"
S3_PATH="s3://${BUCKET_NAME}/${S3_PREFIX}/"

print_status "Packaging Lambda function for ${ENVIRONMENT} environment"
print_status "S3 destination: ${S3_PATH}"

# Check if lambda function exists
if [ ! -f "${LAMBDA_DIR}/lambda_function.py" ]; then
    print_error "Lambda function not found at ${LAMBDA_DIR}/lambda_function.py"
    exit 1
fi

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="${TEMP_DIR}/package"
mkdir -p "${PACKAGE_DIR}"

print_status "Created temporary directory: ${TEMP_DIR}"

# Copy lambda function to package directory
cp "${LAMBDA_DIR}/lambda_function.py" "${PACKAGE_DIR}/"
print_status "Copied lambda function to package directory"

# Install dependencies if requirements.txt exists and is not empty
if [ -f "${REQUIREMENTS_FILE}" ] && [ -s "${REQUIREMENTS_FILE}" ]; then
    print_status "Installing dependencies from ${REQUIREMENTS_FILE}"
    
    # Try different pip commands in order of preference
    if command -v pip3 &> /dev/null; then
        pip3 install -r "${REQUIREMENTS_FILE}" -t "${PACKAGE_DIR}/" --quiet
    elif command -v python3 &> /dev/null; then
        python3 -m pip install -r "${REQUIREMENTS_FILE}" -t "${PACKAGE_DIR}/" --quiet
    elif command -v pip &> /dev/null; then
        pip install -r "${REQUIREMENTS_FILE}" -t "${PACKAGE_DIR}/" --quiet
    else
        print_error "No pip command found. Please install pip or python3-pip"
        exit 1
    fi
    
    print_status "Dependencies installed successfully"
    
    # Show what was installed
    print_status "Installed packages:"
    ls -la "${PACKAGE_DIR}" | grep -E "(PyJWT|jwt)" || echo "  PyJWT library and dependencies"
else
    print_warning "No requirements.txt found or file is empty. Skipping dependency installation."
fi

# Create zip file
ZIP_FILE="${FUNCTION_NAME}.zip"
print_status "Creating zip file: ${ZIP_FILE}"

cd "${PACKAGE_DIR}"
zip -r "../${ZIP_FILE}" . -q
cd - > /dev/null

# Move zip file to current directory
mv "${TEMP_DIR}/${ZIP_FILE}" "./"

# Get file size for verification
FILE_SIZE=$(ls -lh "${ZIP_FILE}" | awk '{print $5}')
print_status "Package created successfully (Size: ${FILE_SIZE})"

# Upload to S3
print_status "Uploading to S3: ${S3_PATH}${ZIP_FILE}"

if aws s3 cp "${ZIP_FILE}" "${S3_PATH}${ZIP_FILE}" --no-progress; then
    print_status "Upload completed successfully"
    
    # Get S3 object information
    S3_URI="${S3_PATH}${ZIP_FILE}"
    print_status "S3 URI: ${S3_URI}"
    
    # Verify upload
    if aws s3 ls "${S3_URI}" > /dev/null 2>&1; then
        print_status "Upload verified successfully"
    else
        print_warning "Could not verify upload"
    fi
else
    print_error "Upload failed"
    exit 1
fi

# Cleanup
rm -rf "${TEMP_DIR}"
rm -f "${ZIP_FILE}"
print_status "Cleanup completed"

print_status "Lambda function packaging and upload completed successfully!"
print_status "CloudFormation can reference: ${S3_URI}"

# Display CloudFormation reference example
echo ""
echo "CloudFormation Code Property Example:"
echo "Code:"
echo "  S3Bucket: ${BUCKET_NAME}"
echo "  S3Key: ${S3_PREFIX}/${ZIP_FILE}"