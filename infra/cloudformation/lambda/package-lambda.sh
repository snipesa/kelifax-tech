#!/bin/zsh
# Package and upload Lambda function to S3

# Configuration
ENVIRONMENT=${1:-dev}  # Default to dev if not provided
FUNCTION_PREFIX="kelifax"
BUCKET_NAME="cf-kelifax-deployment-bucket"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LAMBDA_PREFIX="lambda-zip-${ENVIRONMENT}"  # For Lambda code
CF_PREFIX="cloudformation-${ENVIRONMENT}"   # For CloudFormation templates
ZIP_NAME="lambda-function-${TIMESTAMP}.zip"
SOURCE_DIR="../../src/lambda"
STACK_NAME="kelifax-lambda-stack-${ENVIRONMENT}"
echo "📦 Packaging Lambda function for $ENVIRONMENT environment..."
echo "📝 Using timestamped zip file: $ZIP_NAME"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "🗂 Created temporary directory: $TEMP_DIR"

# Copy Lambda code to temp directory
cp -r $SOURCE_DIR/* $TEMP_DIR/
echo "📄 Copied Lambda code to temporary directory"

# Save the current directory
ORIGINAL_DIR=$(pwd)

# Install dependencies
echo "🔧 Installing dependencies..."
cd $TEMP_DIR
python3 -m pip install -r requirements.txt -t .

# Remove unnecessary files
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type f -name "*.dist-info" | xargs rm -rf
rm -f requirements.txt

# Create zip file
echo "🗜 Creating zip file..."
zip -r $ZIP_NAME ./*

# Upload to S3
echo "☁️ Uploading Lambda ZIP to S3..."
# Create a temporary directory for sync
SYNC_DIR=$(mktemp -d)
mv $ZIP_NAME $SYNC_DIR/
# Sync with --delete to remove old zip files
aws s3 sync $SYNC_DIR s3://$BUCKET_NAME/$LAMBDA_PREFIX/ --delete
# Clean up sync directory
rm -rf $SYNC_DIR

# Return to original directory before cleanup
cd $ORIGINAL_DIR

# Cleanup
echo "🧹 Cleaning up..."
rm -rf $TEMP_DIR

echo "✅ Lambda function packaged and uploaded to s3://$BUCKET_NAME/$LAMBDA_PREFIX/$ZIP_NAME"
echo ""

# Deploy CloudFormation stack
echo "🚀 Deploying CloudFormation stack..."
echo "Stack name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Deployment bucket: $BUCKET_NAME"

# Ask for confirmation before deployment
read -q "REPLY?Do you want to deploy the CloudFormation stack now? (y/n) "
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📝 Deploying CloudFormation stack..."
  
  # Get the authorizer zip file name from SSM Parameter Store
  echo "🔍 Retrieving authorizer zip file name from SSM Parameter Store..."
  AUTH_ZIP_FILE=$(aws ssm get-parameter \
    --region us-east-1 \
    --name "/kelifax/lambda-authorizer" \
    --query "Parameter.Value" \
    --output text 2>/dev/null)
  
  if [ $? -eq 0 ] && [ -n "$AUTH_ZIP_FILE" ]; then
    echo "✅ Retrieved authorizer zip file: $AUTH_ZIP_FILE"
  else
    echo "❌ Failed to retrieve authorizer zip file from SSM Parameter Store"
    exit 1
  fi
  
  # Deploy CloudFormation stack
  aws cloudformation deploy \
    --template-file main.yaml \
    --stack-name $STACK_NAME \
    --s3-bucket $BUCKET_NAME \
    --s3-prefix $CF_PREFIX \
    --parameter-overrides \
      Environment=$ENVIRONMENT \
      FunctionPrefix=$FUNCTION_PREFIX \
      DeploymentBucket=$BUCKET_NAME \
      S3ZipFile=$ZIP_NAME \
      AuthZipFile=$AUTH_ZIP_FILE \
    --capabilities CAPABILITY_IAM
  
  # Check the status of the deployment
  if [ $? -eq 0 ]; then
    echo "✅ CloudFormation stack deployment successful!"
    echo ""
    echo "🔍 Stack outputs:"
    aws cloudformation describe-stacks \
      --stack-name $STACK_NAME \
      --query "Stacks[0].Outputs[].{Key:OutputKey,Value:OutputValue}" \
      --output text
    echo "✨ Deployment process completed successfully."
    exit 0
  else
    echo "❌ CloudFormation stack deployment failed!"
    exit 1
  fi
else
  echo "⏭ Skipping CloudFormation deployment."
  echo ""
  echo "📝 You can deploy later using this command:"
  echo "aws cloudformation deploy \\"
  echo "  --template-file main.yaml \\"
  echo "  --stack-name $STACK_NAME \\"
  echo "  --s3-bucket $BUCKET_NAME \\"
  echo "  --s3-prefix $CF_PREFIX \\"
  echo "  --parameter-overrides \\"
  echo "    Environment=$ENVIRONMENT \\"
  echo "    FunctionPrefix=$FUNCTION_PREFIX \\"
  echo "    S3ZipFile=$ZIP_NAME \\"
  echo "    DeploymentBucket=$BUCKET_NAME \\"
  echo "    AuthZipFile=\$AUTH_ZIP_FILE \\"
  echo "  --capabilities CAPABILITY_IAM"
  
  echo " get the authorizer zip file name from SSM Parameter Store"
  # Even if skipped deployment, packaging was successful
  echo "✨ Lambda packaging process completed successfully."
  exit 0
fi
