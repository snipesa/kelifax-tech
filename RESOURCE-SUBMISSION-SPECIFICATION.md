# Resource Submission Form Specification

## Overview
The resource submission process will be implemented as a **three-page progressive form** with client-side validation at each step. This approach ensures data quality and improves user experience by breaking down the submission into logical sections.

---

## 📋 Form Structure

### **Page 1: Submitter Information**
**Purpose**: Collect information about the person submitting the resource

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `firstName` | Text | ✅ Yes | Min 2 chars, max 50 chars, letters only |
| `lastName` | Text | ✅ Yes | Min 2 chars, max 50 chars, letters only |
| `company` | Text | ❌ Optional | Max 100 chars if provided |
| `phoneNumber` | Text | ❌ Optional | Valid phone format if provided |
| `companyEmail` | Email | ✅ Yes | Valid email format, business email preferred |

**Validation Rules**:
- All required fields must be filled
- Email must be valid format
- Phone number must follow international format if provided
- Names should only contain letters and common punctuation

---

### **Page 2: Basic Resource Information**
**Purpose**: Collect core information about the resource being submitted

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `resourceName` | Text | ✅ Yes | Min 3 chars, max 100 chars, unique name |
| `usagePurpose` | Textarea | ✅ Yes | Min 20 chars, max 500 chars |
| `resourceUrl` | URL | ✅ Yes | Valid URL format, must be accessible |
| `category` | Select | ✅ Yes | Must be from predefined categories |
| `logoImage` | File Upload | ❌ Optional | PNG only, max 2MB, square aspect ratio preferred |
| `tags` | Multi-select/Tags | ❌ Optional | Max 10 tags, each tag max 30 chars, **no pipe characters (\|)** |

**Special Processing Rules**:
- **Logo Image Naming**: If uploaded, the file will be renamed to `{resourceName}.png` where spaces in `resourceName` are replaced with underscores (`_`)
- **Example**: "Visual Studio Code" → `Visual_Studio_Code.png`
- **URL Validation**: Must be a working, publicly accessible URL
- **Category Options**: Must be one of the following predefined categories:
  - `development` - Development Tools & Frameworks
  - `design` - Design & UI/UX Tools  
  - `productivity` - Productivity & Organization Tools
  - `learning` - Learning & Education Platforms
  - `ai` - AI & Machine Learning Tools
  - `analytics` - Analytics & Data Tools
  - `other` - Other

---

### **Page 3: Extended Details**
**Purpose**: Collect detailed information that will be stored in structured format in the database

| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `keyFeatures` | Structured List | ✅ Yes | Min 3 features, max 10 features, each 10-200 chars, **no pipe characters (\|)** |
| `useCases` | Structured List | ✅ Yes | Min 2 use cases, max 8 use cases, each 15-300 chars, **no pipe characters (\|)** |
| `learningResources` | Structured List | ❌ Optional | Max 5 resources, each with title and URL, **no pipe characters (\|)** in title |

**Structured Format Requirements**:

#### Key Features
```json
"keyFeatures": [
  "Feature description 1 (10-200 characters, no | characters)",
  "Feature description 2 (10-200 characters, no | characters)",
  "Feature description 3 (10-200 characters, no | characters)"
]
```

#### Use Cases
```json
"useCases": [
  "Use case description 1 (15-300 characters, no | characters)",
  "Use case description 2 (15-300 characters, no | characters)"
]
```

#### Learning Resources (Optional)
```json
"learningResources": [
  {
    "title": "Resource title (max 100 chars, no | characters)",
    "url": "https://valid-url.com",
    "type": "documentation|tutorial|video|course"
  }
]
```

**⚠️ Critical Validation Rule**: The pipe character `|` is **forbidden** in all text inputs for Page 3 fields because it's used as a delimiter in the backend database storage.

---

## 🔍 Frontend Validation Strategy

### **Page-by-Page Validation**
1. **Real-time Validation**: Fields are validated as user types (debounced)
2. **Page Validation**: All fields on current page must pass validation before "Next" button is enabled
3. **Final Validation**: Complete form validation before submission
4. **Error Handling**: Clear, specific error messages for each validation failure

### **Validation Implementation**
- Use JavaScript/TypeScript for client-side validation
- Implement custom validation functions for each field type
- Visual feedback (red borders, error messages, success indicators)
- Progress indicator showing current page and completion status

### **Critical Character Validation**
**⚠️ Pipe Character Restriction**: The following fields must NOT contain the pipe character `|`:
- **Page 3 - Key Features**: Each feature description
- **Page 3 - Use Cases**: Each use case description  
- **Page 3 - Learning Resources**: Resource title field
- **Page 2 - Tags**: Individual tag values (comma separation is fine)

**Frontend Validation Functions**:
```javascript
// Primary validation: No pipe characters
function validateNoPipeCharacter(value, fieldName) {
  if (value.includes('|')) {
    return `${fieldName} cannot contain the pipe character (|). Please use commas, dashes, or other separators instead.`;
  }
  return null; // Valid
}

// Additional validation: Clean text for better data quality
function validateCleanText(value, fieldName) {
  // Check for pipe character (critical)
  if (value.includes('|')) {
    return `${fieldName} cannot contain the pipe character (|)`;
  }
  
  // Check for excessive special characters that might break formatting
  const problematicChars = /[<>{}[\]\\]/;
  if (problematicChars.test(value)) {
    return `${fieldName} contains invalid characters. Please avoid using < > { } [ ] \\`;
  }
  
  return null; // Valid
}

// Usage for Page 3 fields:
keyFeatures.forEach((feature, index) => {
  const error = validateNoPipeCharacter(feature, `Key Feature ${index + 1}`);
  if (error) errors.push(error);
});

useCases.forEach((useCase, index) => {
  const error = validateNoPipeCharacter(useCase, `Use Case ${index + 1}`);
  if (error) errors.push(error);
});

learningResources.forEach((resource, index) => {
  const titleError = validateNoPipeCharacter(resource.title, `Learning Resource ${index + 1} Title`);
  if (titleError) errors.push(titleError);
});
```

### **Logo Upload Implementation**
- **Immediate S3 Upload**: Frontend uploads logo directly to S3 immediately when user selects file
- **File Processing**: Rename file to `{resourceName}.png` format before upload (or temporary name if resource name not yet entered)
- **Temporary Storage**: Upload to `uploads/temp/` prefix initially
- **Form Submission**: Only sends the uploaded filename, not the file itself
- **Error Handling**: Upload failures are shown immediately to user; provides cleanup mechanism for orphaned temp files
- **File Validation**: Validate file type (PNG only), size (max 2MB), and dimensions on client-side before upload

---

## 📊 Data Flow & Storage Structure

### **Complete Submission Data Structure**
```json
{
  "submitter": {
    "firstName": "John",
    "lastName": "Doe",
    "company": "Tech Corp", // optional
    "phoneNumber": "+1234567890", // optional
    "companyEmail": "john@techcorp.com"
  },
  "resource": {
    "resourceName": "Amazing Dev Tool",
    "usagePurpose": "This tool helps developers streamline their workflow by...",
    "resourceUrl": "https://amazingdevtool.com",
    "category": "development",
    "logoImage": "Amazing_Dev_Tool.png", // processed filename or null
    "tags": ["productivity", "development", "automation"] // optional
  },
  "details": {
    "keyFeatures": [
      "Automated code generation and refactoring",
      "Integrated debugging and testing tools",
      "Real-time collaboration features"
    ],
    "useCases": [
      "Rapid prototyping for startup development teams",
      "Enterprise application development and maintenance"
    ],
    "learningResources": [ // optional
      {
        "title": "Getting Started Guide",
        "url": "https://amazingdevtool.com/docs",
        "type": "documentation"
      }
    ]
  },
  "metadata": {
    "resourceSlug": "amazing-dev-tool", // Generated from resource name for DynamoDB primary key
    "submittedAt": "2025-10-25T10:30:00Z",
    "resourceStatus": "pending", // pending|approved|rejected
    "submissionId": "uuid-generated-id"
  }
}
```

---

## 🔧 Backend API Specification

### **Endpoint**: `POST /api/submit-resource`

#### **Request Headers**
```
Content-Type: application/json
Accept: application/json
```

#### **Request Body**
The complete JSON structure shown above in "Data Flow & Storage Structure"

#### **Response Structure**

**Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Resource submitted successfully",
  "data": {
    "resourceSlug": "amazing-dev-tool",
    "submissionId": "uuid-generated-id",
    "resourceStatus": "pending",
    "logoProcessed": true // Indicates if logo was moved from temp to pending
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Resource submission failed",
  "errors": {
    "resource.resourceSlug": "Resource with this name already exists",
    "resource.resourceUrl": "URL is not accessible or invalid"
  }
}
```

**Error Response (409 Conflict)** - Resource Already Exists:
```json
{
  "success": false,
  "message": "Resource already exists",
  "error": "A resource with this name already exists in the database"
}
```

### **Frontend Processing Steps**
*Note: Primary validation and initial file handling occurs at the frontend level*

1. **Client-side Validation**: Complete form validation before submission
2. **Logo Upload to S3**: If logo provided, upload directly to S3 `uploads/temp/` prefix
   - File renamed to `{resourceName}.png` (spaces → underscores)
   - Example: "Amazing Dev Tool" → `uploads/temp/Amazing_Dev_Tool.png`
3. **Submit Form Data**: Send complete form data to backend API

### **Backend Processing Steps**
*Backend Lambda function handles data persistence and file management*

1. **Validate Request**: Server-side validation to ensure all required fields are present and valid (secondary validation after frontend)
2. **Generate Resource Slug**: Create URL-friendly slug from resource name for use as primary key
   - Convert to lowercase, replace spaces/special chars with hyphens
   - Example: "Amazing Dev Tool" → "amazing-dev-tool"
3. **Check Duplicates**: Verify resource slug and URL are unique in the database
   - If slug exists, return error (frontend handles uniqueness)
4. **URL Verification**: Test that the resource URL is accessible and returns valid response
5. **Database Storage**: Store in DynamoDB with `resourceSlug` as primary key and pending status
   - **If this fails**: Return error response, leave logo in temp folder
6. **Logo File Management**: If database storage successful and logo exists
   - Move logo from `uploads/temp/Amazing_Dev_Tool.png` to `logos/pending/Amazing_Dev_Tool.png`
   - Delete original file from temp folder
7. **Notification**: Optional email notification to admin for review

### **Database Schema (DynamoDB)**
```
Table: SubmittedResources
Primary Key: resourceSlug (String) // URL-friendly slug generated from resource name

Global Secondary Index (GSI): ResourceStatusIndex
- Partition Key: resourceStatus (String) // For filtering by pending|approved|rejected
- Sort Key: submittedAt (String) // For chronological ordering

Additional Fields:
- submissionId (String) // UUID for tracking
- submitterInfo (Map)
- resourceInfo (Map)
- resourceDetails (Map)
- submittedAt (String - ISO Date)
- resourceStatus (String) // pending|approved|rejected
- approvedAt (String - ISO Date, nullable)
- rejectedAt (String - ISO Date, nullable)
- rejectionReason (String, nullable)
```

### **S3 Bucket Structure**
```
kelifax-resources-bucket/
├── logos/
│   ├── pending/           # Logos moved here after successful DB submission
│   │   └── Amazing_Dev_Tool.png
│   └── approved/          # Logos moved here after admin approval
│       └── Amazing_Dev_Tool.png
└── uploads/
    └── temp/              # Frontend uploads logos here initially
        └── Amazing_Dev_Tool.png
```

### **Logo File Flow**
1. **Frontend**: Upload logo → `uploads/temp/Amazing_Dev_Tool.png`
2. **Backend Success**: Move logo → `logos/pending/Amazing_Dev_Tool.png`
3. **Admin Approval**: Move logo → `logos/approved/Amazing_Dev_Tool.png`
4. **Backend Error**: Logo remains in `uploads/temp/` for cleanup

---

## 🚀 Implementation Phases

### **Phase 1: Frontend Form**
1. Create three-page form component
2. Implement client-side validation
3. Add progress indicator and navigation
4. Style with Tailwind CSS
5. Test user experience flow

### **Phase 2: Backend API**
1. Create Lambda function for resource submission
2. Implement validation logic
3. Set up DynamoDB table
4. Configure S3 bucket and permissions
5. Add URL verification functionality

### **Phase 3: Integration & Testing**
1. Connect frontend to backend API
2. Test complete submission flow
3. Add error handling and user feedback
4. Implement admin review interface
5. Add email notifications

---

## 📝 User Experience Considerations

### **Form Navigation**
- Previous/Next buttons on pages 2 and 3
- Breadcrumb or step indicator
- Save progress (optional - for longer forms)
- Clear field labels and help text

### **Error Handling**
- Inline validation messages
- Summary of errors at page level
- Prevent submission with validation errors
- Graceful handling of network errors

### **Success Flow**
- Confirmation page after successful submission
- Email confirmation to submitter
- Clear next steps and timeline expectations

---

## ✅ Validation Summary

This specification ensures:
- **Data Quality**: Comprehensive validation at multiple levels
- **User Experience**: Progressive disclosure and clear feedback
- **Backend Efficiency**: Structured data format for easy processing
- **Scalability**: Clean separation between form logic and data processing
- **Maintainability**: Clear specification for future enhancements

The three-page approach reduces cognitive load while ensuring all necessary information is collected in a structured, validated manner that supports both user experience and backend data processing requirements.

---

## 🚀 Implementation Status

### ✅ Frontend Implementation Complete

The resource submission form has been **fully implemented** as a three-page progressive form with all specified features:

#### **Completed Features**
- **✅ Three-Page Progressive Form**: Submitter Info → Resource Info → Extended Details
- **✅ Client-Side Validation**: Real-time validation with all specified rules including pipe character restrictions
- **✅ S3 Logo Upload**: Direct upload to `uploads/temp/` with automatic file renaming
- **✅ Dynamic Form Elements**: Add/remove features, use cases, and learning resources
- **✅ Modern UI/UX**: Progress indicator, animations, loading states, responsive design
- **✅ Form Data Structure**: Generates exact JSON format specified above

#### **File Structure Created**
```
src/
├── components/
│   ├── SubmitterInfoForm.astro     # Page 1: Personal details
│   ├── ResourceInfoForm.astro      # Page 2: Resource info + logo upload  
│   ├── ExtendedDetailsForm.astro   # Page 3: Features, use cases, learning resources
│   └── ProgressIndicator.astro     # Step-by-step progress visualization
├── pages/
│   └── submit.astro                # Main form orchestrator with navigation
├── utils/
│   ├── form-validation.js          # Complete validation logic
│   ├── s3-upload.js               # S3 upload with mock fallback
│   └── api.js                     # Backend integration (placeholder ready)
└── styles/
    └── global.css                 # Form animations and styling
```

#### **AWS S3 Configuration**
Environment variables added to `.env`:
```bash
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
PUBLIC_AWS_REGION=us-east-1
PUBLIC_S3_BUCKET_NAME=kelifax-resources-bucket
```

**Development Mode**: Form uses mock S3 upload when AWS credentials not configured.

#### **Testing**
- Form accessible at: `http://localhost:4321/submit`
- All validation rules implemented and tested
- Logo upload with file preview and validation
- Complete form submission flow with loading states

#### **Backend Integration Ready**
- Placeholder API function `submitResourceSubmission()` in `src/utils/api.js`
- Form generates complete submission data structure as specified
- Ready to connect to Lambda backend when implemented

### ✅ Backend Implementation Complete

The backend API endpoint `/submit-resource` has been **fully implemented** with:

#### **Completed Backend Features**
- **✅ Server-side Validation**: Complete validation of all required fields and data structure
- **✅ Resource Slug Generation**: URL-friendly slug generation with uniqueness checking
- **✅ DynamoDB Storage**: Full implementation matching the DynamoDB schema specification
- **✅ Duplicate Prevention**: Checks for existing resource slugs before insertion
- **✅ Structured Data Storage**: Stores data in optimized format with pipe/comma separators
- **✅ Search Text Generation**: Creates searchable text from multiple resource fields
- **✅ Error Handling**: Comprehensive error responses for validation and database issues

#### **Backend Implementation Details**
- **Lambda Function**: `infra/src/lambda/app/submit_resource.py` handles complete form processing
- **DynamoDB Schema**: Follows the recommended schema from `DYNAMODB-SCHEMA-RECOMMENDATION.md`
- **API Endpoint**: `POST /submit-resource` accepts the exact JSON structure from frontend
- **Validation**: Server-side validation mirrors frontend validation rules
- **Response Format**: Returns structured success/error responses with submission details

#### **Still Pending**
- **URL Accessibility Verification**: Optional server-side URL checking
- **Logo File Management**: Move from `uploads/temp/` to `logos/pending/` (S3 integration)
- **Admin Notifications**: Email/notification system for new submissions

---
