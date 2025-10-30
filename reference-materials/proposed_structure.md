kelifax/
├── public/                               # Public static assets (copied directly to /dist)
│   ├── favicon.ico
│   ├── logo.png
│   ├── robots.txt
│   ├── sitemap.xml
│   └── manifest.json
│
├── src/                                  # Frontend source code (Astro)
│   ├── components/                       # Reusable UI components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ResourceCard.astro
│   │   └── SearchBar.astro
│   │
│   ├── layouts/                          # Layout wrappers for pages
│   │   └── MainLayout.astro
│   │
│   ├── pages/                            # Site pages (routed automatically by Astro)
│   │   ├── index.astro                   # Homepage
│   │   ├── about.astro                   # About page
│   │   └── resources/
│   │       ├── index.astro               # Resource list page
│   │       └── [slug].astro              # Individual resource details page
│   │
│   │
│   ├── styles/                           # Tailwind or custom CSS
│   │   └── global.css
│   │
│   └── utils/                            # Frontend helper scripts
│       └── api.js                        # Helper for calling Lambda via API Gateway
│
├── lambda_functions/                     # Serverless backend (AWS Lambda)
│   ├── dev-get-resources/
│   │   └── handler.py                    # Returns curated resource list
│   └── dev-submit-contact/
│       └── handler.py                    # Handles contact form submissions
│
├── infra/                                # Infrastructure as Code (IaC)
│   ├── cloudformation-template.yml       # CloudFormation template for Lambda + API Gateway
│   └── parameters.json                   # Parameters for stack deployment
│
├── dist/                                 # ⚙️ Auto-generated build output (after `npm run build`)
│   └── ...                               # Deployed to S3 (do not version-control this)
│
├── .gitignore                            # Ignore build artifacts, node_modules, etc.
├── astro.config.mjs                      # Astro configuration
├── tailwind.config.mjs                   # Tailwind setup
├── tsconfig.json                         # (Optional) TypeScript configuration
├── package.json                          # Node dependencies & scripts
├── README.md                             # Project documentation
└── LICENSE                               # (Recommended) Open-source license file
