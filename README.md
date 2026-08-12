# 🚚 Delivery Challan & Inventory Management System

A full-stack enterprise web application for generating, tracking, and managing Delivery Challans, item snapshots, atomic inventory dispatches, and PDF generation.

---

## 🔗 Submission Links

- **Live Frontend Application:** `[https://your-app.vercel.app](https://mini-erp-crm-operations-portal-deli-tau.vercel.app/)`
- **Live Backend API Base URL:** `[https://your-api.onrender.com](https://mini-erp-crm-operations-portal-delivery.onrender.com)`
- **GitHub Repository:** `[https://github.com/your-username/delivery-challan-system](https://github.com/shivamspartn/Mini-ERP-CRM-Operations-Portal-Delivery-Challan-System-)`

---

🔑 Test Login Credentials (RBAC)Default Password for All Accounts: PASSWORD123!RoleEmail AddressAccess & CapabilitiesAdminadmin@minierp.comFull system access, global audit logs, user management, analyticsSalessales@minierp.comCustomer CRM directory, lead creation, sales follow-upsWarehousewarehouse@minierp.comInventory management, stock adjustments, delivery challan creationAccountsaccounts@minierp.comFinancial records, dispatch approvals, invoicing summaries🏛️ System ArchitectureThe application is structured following a modern decoupled architecture:Plaintext  [ Client (Browser) ]
           │
           ▼
 [ React + TypeScript UI ]  ── (Vercel Edge Hosting)
           │
           │ REST API / JSON Tokens
           ▼
  [ Express.js Backend ]    ── (Render Cloud Web Service)
           │
           │ Prisma ORM / Connection Pooling (Port 6543)
           ▼
 [ Supabase PostgreSQL DB ] ── (Hosted Cloud Database)
Architecture HighlightsFrontend (Vercel): Single Page Application (SPA) built with React, TypeScript, and Tailwind CSS. Features dynamic auth contexts, role-guarded routes, and centralized Axios interceptors.Backend (Render): RESTful Node.js/Express service built with a modular controller-service-middleware layer pattern.Database & ORM (Supabase & Prisma): Relational database powered by PostgreSQL. Managed using Prisma ORM with connection pooling for low-latency queries.Security & Authentication: Role-Based Access Control (RBAC) powered by JWT (JSON Web Tokens) with hashed password verification.🛠️ Tech StackFrontend: React.js, TypeScript, Tailwind CSS, Lucide Icons, Axios, ViteBackend: Node.js, Express.js, TypeScript, JWT (jsonwebtoken), bcryptDatabase & ORM: PostgreSQL (Supabase), Prisma ORMDeployment: Vercel (Frontend), Render (Backend)🚀 Local Development SetupPrerequisitesNode.js (v18 or higher)npm or yarnPostgreSQL instance or Supabase account1. Clone RepositoryBashgit clone https://github.com/shivampartn/Mini-ERP-CRM-Operations-Portal-Delivery-Challan-System-.git
cd Mini-ERP-CRM-Operations-Portal-Delivery-Challan-System-


2. Backend SetupBashcd backend
npm install
Create a .env file in the backend/ directory:Code snippetPORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres?sslmode=require"
JWT_SECRET="super_secret_jwt_key_2026"
NODE_ENV="development"
Sync database schema and run seed script:Bashnpx prisma db push
npx prisma db seed
Start backend development server:Bashnpm run dev


4. Frontend SetupOpen a new terminal tab and navigate to the frontend directory:Bashcd frontend
npm install
Create a .env file in the frontend/ directory:Code snippetVITE_API_BASE_URL="http://localhost:5000/api"
Start frontend development server:Bashnpm run dev
📡 Key API EndpointsAuthenticationPOST /api/auth/login - Authenticate user & issue JWTDelivery ChallansGET /api/challans - Fetch all delivery challansPOST /api/challans - Create new delivery challanGET /api/challans/:id - Fetch detailed challan infoInventory & CRMGET /api/inventory - Monitor stock levelsGET /api/customers - Fetch CRM customer list
