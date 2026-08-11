# 🚚 Delivery Challan & Inventory Management System

A full-stack enterprise web application for generating, tracking, and managing Delivery Challans, item snapshots, atomic inventory dispatches, and PDF generation.

---

## 🔗 Submission Links

- **Live Frontend Application:** `https://your-app.vercel.app`
- **Live Backend API Base URL:** `https://your-api.onrender.com`
- **GitHub Repository:** `https://github.com/your-username/delivery-challan-system`

---

## 🔐 Test Login Credentials

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@challan.com` | `AdminPass@123` | Full access (Create, Confirm, Cancel, Delete, User Management) |
| **WAREHOUSE** | `warehouse@challan.com` | `WhPass@123` | Confirm dispatches, update physical stock counts |
| **SALES** | `sales@challan.com` | `SalesPass@123` | Draft new challans, view status, export PDFs |
| **ACCOUNTS** | `accounts@challan.com` | `AccPass@123` | View-only audit trail, export PDFs |

---

## 🏗️ Architecture Explanation

The application follows a **Decoupled Architecture**:
- **Frontend:** React, TypeScript, Tailwind CSS, Axios, and React Router hosted on **Vercel**.
- **Backend:** Node.js, Express, TypeScript, Zod schema validation, and PDFKit binary streaming hosted on **Render**.
- **Database:** PostgreSQL hosted on **Supabase** or **Neon PostgreSQL**, managed using **Prisma ORM**.
- **Storage (Optional):** AWS S3 for product thumbnail images.

─────────────────┐      HTTP / JSON      ┌──────────────────────┐
│  React Frontend ├──────────────────────►│  Node.js Express API │
│   (Vercel)      │◄──────────────────────┤     (Render)         │
└─────────────────┘      PDF Stream       └──────────┬───────────┘
│
Prisma ORM  │
▼
┌──────────────────┐
│ Supabase Postgres│
└──────────────────┘

---

## 🛠️ Local Setup & Execution

### Prerequisites
- Node.js (v18+)
- PostgreSQL local instance or Docker
- npm or yarn

### 1. Clone & Install
```bash
git clone [https://github.com/your-username/delivery-challan-system.git](https://github.com/your-username/delivery-challan-system.git)
cd delivery-challan-system
npm install