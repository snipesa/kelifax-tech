kelifax/
├── public/                               # Public static assets (copied directly to /dist)
│   ├── favicon.svg
│   ├── manifest.json
│   ├── robots.txt
│   ├── client-api.js                     # Client-side API helper
│   ├── resource-loader.js                # Dynamic resource loading
│   ├── test-api.html                     # API testing page
│   ├── data/                             # Static data files
│   └── logos/                            # Resource logos and images
│       ├── canva.png
│       ├── coursera.png
│       ├── figma.png
│       ├── github.png
│       ├── kelifax.png
│       ├── kelifax-og.png
│       ├── notion.png
│       ├── slack.png
│       ├── stackoverflow.png
│       ├── unsplash.png
│       ├── vscode.png
│       └── ...
│
├── src/                                  # Frontend source code (Astro)
│   ├── components/                       # Reusable UI components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ResourceCard.astro
│   │   ├── EnhancedResourceCard.astro
│   │   ├── SearchBar.astro
│   │   ├── AdvancedFilters.astro
│   │   ├── BookmarkManager.astro
│   │   ├── LoadingSpinner.astro
│   │   ├── Newsletter.astro
│   │   ├── ProgressIndicator.astro
│   │   ├── ResourceInfoForm.astro
│   │   ├── SubmitterInfoForm.astro
│   │   └── ExtendedDetailsForm.astro
│   │
│   ├── layouts/                          # Layout wrappers for pages
│   │   └── MainLayout.astro
│   │
│   ├── pages/                            # Site pages (routed automatically by Astro)
│   │   ├── index.astro                   # Homepage
│   │   ├── about.astro                   # About page
│   │   ├── contact.astro                 # Contact page
│   │   ├── resources.astro               # Resource list page
│   │   ├── submit.astro                  # Resource submission page
│   │   ├── 404.astro                     # 404 error page
│   │   ├── sitemap.xml.astro             # Dynamic sitemap generation
│   │   └── resource/
│   │       └── [slug].astro              # Individual resource details page
│   │
│   ├── data/                             # Data schemas and examples
│   │   └── resource.example.json         # Example resource structure
│   │
│   ├── styles/                           # Tailwind or custom CSS
│   │   └── global.css
│   │
│   └── utils/                            # Frontend helper scripts
│       ├── api.js                        # Helper for calling Lambda via API Gateway
│       ├── config.js                     # Configuration utilities
│       ├── form-validation.js            # Form validation helpers
│       ├── resources.js                  # Resource management utilities
│       ├── resources-page.js             # Resources page functionality
│       └── s3-upload.js                  # S3 file upload utilities
│
├── infra/                                # Infrastructure as Code (IaC)
│   ├── parameters.json                   # Parameters for stack deployment
│   ├── cloudformation/
│   │   └── lambda/
│   │       ├── main.yaml                 # CloudFormation template for Lambda + API Gateway
│   │       ├── package-lambda.sh         # Lambda packaging and deployment script
│   │       ├── README.md
│   │       └── samconfig.toml
│   └── src/
│       ├── dynamodb/
│       │   ├── data.json                 # DynamoDB seed data
│       │   ├── upload-resources.sh       # Script to upload resources to DynamoDB
│       │   └── README.md
│       └── lambda/                       # Serverless backend (AWS Lambda)
│           ├── requirements.txt
│           └── app/
│               ├── lambda_function.py    # Main Lambda handler
│               ├── requirements.txt
│               ├── admin_auth.py          # Admin authentication
│               ├── get_approved_resources.py  # Get approved resources
│               ├── get_resource.py        # Get single resource
│               ├── get_submitted_resources.py # Get submitted resources
│               ├── submit_resource.py     # Submit new resource
│               ├── update_resource.py     # Update existing resource
│               ├── delete_resource.py     # Delete resource
│               └── utils.py              # Utility functions
│
├── reference-materials/                  # Project documentation and references
│   ├── proposed_structure.md             # This file - project structure overview
│   ├── dev-RoadMap.docx                  # Development roadmap
│   └── SRS-kelifax.docx                  # Software Requirements Specification
│
├── dist/                                 # ⚙️ Auto-generated build output (after `npm run build`)
│   └── ...                               # Deployed to S3 (do not version-control this)
│
├── .env.development                      # Development environment variables
├── .env.production                       # Production environment variables
├── .gitignore                            # Ignore build artifacts, node_modules, etc.
├── astro.config.mjs                      # Astro configuration
├── tailwind.config.mjs                   # Tailwind setup
├── tsconfig.json                         # TypeScript configuration
├── package.json                          # Node dependencies & scripts
├── deploy.sh                             # Deployment script for dev/prod environments
├── README.md                             # Project documentation
├── DEVELOPMENT.md                        # Development guide
├── KELIFAX-GUIDE.md                      # Project guide
├── DYNAMODB-SCHEMA-RECOMMENDATION.md     # DynamoDB schema documentation
└── RESOURCE-SUBMISSION-SPECIFICATION.md # Resource submission specifications
