# 🍜 Street Food Review System — Project Functionalities Documentation

> **Project Type:** Full-Stack University Project  
> **Backend:** NestJS + Prisma + PostgreSQL (Supabase) + Cloudinary  
> **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS + React Query  
> **Deployment:** Vercel (serverless)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Authentication & Security](#4-authentication--security)
5. [Core Functionalities](#5-core-functionalities)
   - [User Management](#51-user-management)
   - [Store Management](#52-store-management)
   - [Food Menu Management](#53-food-menu-management)
   - [Review System](#54-review-system)
   - [Store Suggestions](#55-store-suggestions-workflow)
   - [Store Claims](#56-store-claims-workflow)
   - [Admin Dashboard](#57-admin-dashboard)
   - [Image Uploads](#58-image-upload-system)
6. [Database Schema](#6-database-schema)
7. [Frontend Implementation Status](#7-frontend-implementation-status)
8. [API Endpoint Summary](#8-api-endpoint-summary)
9. [Seed Data & Test Accounts](#9-seed-data--test-accounts)

---

## 1. Project Overview

The **Street Food Review System** is a location-based platform where users can discover nearby street food stores, read and write reviews, and suggest new stores. Store owners can manage their store profiles, menus, and respond to customer reviews. Admins moderate the platform by managing users, approving store suggestions and ownership claims.

### Key Features at a Glance

| Feature | Description |
|---------|-------------|
| **Location-based Store Discovery** | Find nearby food stalls using GPS coordinates and Haversine distance calculation |
| **Multi-role Platform** | Three distinct roles — User, Store Owner, Admin — each with specific capabilities |
| **Review System with Photos** | Users can rate stores (1-5 stars), write comments, and attach up to 3 photos |
| **Store Owner Dashboard** | Store owners manage their menu, gallery, and reply to reviews |
| **Store Suggestion & Claim Workflow** | Users suggest new stores; store owners claim unclaimed stores — both admin-moderated |
| **Cloudinary Image Management** | All images (profiles, stores, reviews) are stored on Cloudinary with full lifecycle management |
| **Cookie-based JWT Auth** | Secure httpOnly cookie authentication with Bearer token fallback |

---

## 2. System Architecture

```
┌──────────────────────┐     ┌───────────────────────────────┐
│   Frontend (Next.js) │────▶│   Backend API (NestJS)        │
│   - React 19         │     │   - REST API at /api/v1       │
│   - Tailwind CSS     │     │   - JWT Auth (Cookie + Bearer)│
│   - React Query      │     │   - Global Guards & Filters   │
│   - Axios            │     │   - Swagger Docs at /api/docs │
└──────────────────────┘     └──────────┬────────────────────┘
                                        │
                    ┌───────────────────┬┴──────────────────┐
                    ▼                   ▼                    ▼
           ┌──────────────┐   ┌──────────────┐    ┌──────────────┐
           │  PostgreSQL   │   │  Cloudinary   │    │   Supabase   │
           │  (via Prisma) │   │  (Images)     │    │   (DB Host)  │
           └──────────────┘   └──────────────┘    └──────────────┘
```

### Backend Architecture

- **Framework:** NestJS with modular architecture
- **ORM:** Prisma with PostgreSQL adapter (`@prisma/adapter-pg`)
- **API Prefix:** `/api/v1`
- **Global Pipeline (applied to all requests):**
  1. `JwtAuthGuard` — authenticates requests (skipped for `@Public` endpoints)
  2. `RolesGuard` — enforces role-based access (skipped if no `@Roles` declared)
  3. `ResponseInterceptor` — wraps all successful responses in `{ success, statusCode, message, data }`
  4. `HttpExceptionFilter` — wraps all errors in `{ success: false, statusCode, error, message, path, timestamp }`
- **Validation:** Global `ValidationPipe` with `whitelist: true` and `transform: true`

---

## 3. User Roles & Permissions

### Role: `user` (Regular User / Foodie)

| Capability | Details |
|------------|---------|
| Browse stores | View all public store listings and search by location |
| View store details | See store profile, menu, gallery, and reviews |
| Write reviews | Submit one review per store with rating (1-5), comment, and up to 3 photos |
| Edit/Delete own reviews | Modify rating, comment, add/remove photos on own reviews |
| Suggest new stores | Submit store suggestions for admin review |
| View own suggestions | See status (pending/approved/rejected) and admin notes |
| Edit profile | Update name, bio, and profile photo |

### Role: `store` (Store Owner)

| Capability | Details |
|------------|---------|
| Create a store | Register one store with name, description, category, location, and cover image |
| Edit store info | Update store details, cover image, and manage gallery (up to 6 photos) |
| Manage food menu | Add, edit, delete food items with name, description, price, and availability |
| Reply to reviews | Write one reply per review on own store; can edit replies |
| Claim unclaimed stores | Submit ownership claims for stores created via the suggestion workflow |
| View own store | See full store dashboard with menu, gallery, and reviews |
| Edit profile | Update name, bio, and profile photo |

### Role: `admin` (Platform Administrator)

| Capability | Details |
|------------|---------|
| View platform stats | Dashboard with totals for users, stores, reviews, pending items |
| Manage users | List all users (with role/pagination filters), view details, deactivate accounts |
| Manage stores | List all stores (with status filter), suspend, activate, or delete stores |
| Moderate suggestions | View all store suggestions, approve (auto-creates store) or reject with admin notes |
| Moderate claims | View all ownership claims, approve (links owner, auto-rejects competing claims) or reject |
| Delete reviews | Remove any review from the platform |

---

## 4. Authentication & Security

### Authentication Flow

```
1. User registers  →  POST /auth/register  →  Account created (must login separately)
2. User logs in    →  POST /auth/login     →  JWT set as httpOnly cookie (access_token)
3. Subsequent requests automatically include cookie
4. Session check   →  GET /auth/me         →  Returns current user or 401
5. User logs out   →  POST /auth/logout    →  Cookie cleared
```

### Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **JWT Storage** | httpOnly cookie (prevents XSS access to token) |
| **Cookie Settings** | `secure: true` in production, `sameSite: none` in prod / `lax` in dev |
| **Token Expiry** | 30-day max age on cookie |
| **CORS** | Origin-restricted with credentials enabled |
| **Bearer Fallback** | `Authorization: Bearer <token>` header support for non-browser clients |
| **Input Validation** | Global validation pipe strips unknown properties and enforces DTO rules |
| **Account Deactivation** | Inactive accounts are rejected at the guard level |
| **Password Rules** | Minimum 8 characters, at least 1 uppercase letter, at least 1 number |
| **File Upload Validation** | MIME type whitelist (jpeg/png/webp), size limits per endpoint |

---

## 5. Core Functionalities

---

### 5.1 User Management

#### Registration
- Users sign up with name, email, password, and chosen role (`user` or `store`)
- Email must be unique (409 Conflict on duplicate)
- Password is hashed before storage

#### Profile Management
- Any authenticated user can update their **name**, **bio** (max 500 chars), and **profile photo**
- Profile photo is uploaded to Cloudinary under `street-food/profiles/`
- Replacing a photo automatically deletes the previous one from Cloudinary

#### Admin User Management
- List all users with filtering by role and pagination
- View individual user details
- Deactivate user accounts (sets `is_active: false`)

---

### 5.2 Store Management

#### Store Creation (Store Owners)
- A store owner can create **one store** (enforced at the service level)
- Required fields: name, latitude, longitude
- Optional: description, category, address, cover image
- Cover image uploaded to Cloudinary under `street-food/stores/`
- Store is created as `active` and `claimed` with the owner linked

#### Store Gallery
- Store owners can upload up to **6 gallery images** (enforced in service)
- Images stored in Cloudinary under `street-food/stores/gallery/`
- Individual gallery images can be removed (deletes from both DB and Cloudinary)

#### Store Editing
- Only the store owner can edit their store
- Can update: name, description, category, address, coordinates, cover image
- Can remove gallery images via `gallery_remove` field (JSON array of Cloudinary public IDs)
- Replacing cover image deletes the old one from Cloudinary

#### Location-Based Search (Public)
- **Haversine formula** calculates distance between user coordinates and store locations
- Search by `lat`, `lng`, and optional `radius` (default 5 km)
- Returns only `active` stores sorted by distance (nearest first)
- Each result includes `distance_km` field

#### Store Detail (Public)
- Returns full store profile including:
  - Store info (name, description, category, address, coordinates, status)
  - Gallery images
  - Food menu items
  - Reviews with user info, photos, and store replies
  - Computed `averageRating` (rounded to 1 decimal) and `totalReviews`

#### Admin Store Management
- List all stores with status filter (`active`, `inactive`, `suspended`) and pagination
- Suspend a store (sets status to `suspended`)
- Activate a store (sets status to `active`)
- Delete a store (removes all Cloudinary images and cascades delete to related data)

---

### 5.3 Food Menu Management

#### Add Food Items (Store Owners)
- Store owners add items to their own store's menu
- Required: store_id, name, price (must be > 0)
- Optional: description, image_url, is_available (default: true)
- Ownership verification ensures only the store owner can add items

#### Edit Food Items
- Update any field (name, description, price, availability)
- Only the store owner can edit

#### Delete Food Items
- Permanent removal with ownership verification

#### View Menu (Public)
- Get all food items for a specific store
- Optional filter: `available=true` to show only available items
- Ordered newest first

---

### 5.4 Review System

#### Submit a Review (Users Only)
- One review per user per store (enforced via unique constraint)
- Rating: integer 1-5 (required)
- Comment: up to 1000 characters (optional)
- Images: up to 3 photos, max 3 MB each (optional)
- Review images uploaded to Cloudinary under `street-food/reviews/`

#### Edit a Review (Author Only)
- Can update rating and/or comment
- Can add new images (`images_add`) up to 3 total
- Can remove specific images (`images_remove` — JSON array of public IDs)
- Cloudinary images cleaned up on removal

#### Delete a Review
- **Author** can delete their own review
- **Admin** can delete any review
- All associated Cloudinary images are deleted

#### View Reviews (Public)
- Paginated review list for any store
- Each review includes: user info (name, avatar), rating, comment, timestamps, photos, and store replies

#### Store Reply System
- Store owners can write **one reply per review** on their own store
- Reply text: up to 1000 characters
- Replies can be edited by the store owner
- Ownership verification ensures only the reviewed store's owner can reply

---

### 5.5 Store Suggestions Workflow

This feature allows regular users to suggest new street food stores that they've discovered.

```
User submits suggestion  →  Status: PENDING
        │
        ▼
Admin reviews suggestion
        │
   ┌────┴────┐
   ▼         ▼
APPROVED   REJECTED
   │         │
   ▼         └── Admin note stored
   │
Auto-creates unclaimed store
(can be claimed by store owners)
```

#### User Actions
- **Submit suggestion:** name (required), description, address, latitude, longitude (all optional except name)
- **View own suggestions:** see all submitted suggestions with their status and admin notes

#### Admin Actions
- **View all suggestions:** filterable by status (`pending`, `approved`, `rejected`)
- **Approve:** Sets status to `approved`, records admin note, and **automatically creates an unclaimed store** from the suggestion data
- **Reject:** Sets status to `rejected` with optional admin note

---

### 5.6 Store Claims Workflow

Store owners can claim ownership of unclaimed stores (typically created from approved suggestions).

```
Store owner submits claim  →  Status: PENDING
        │
        ▼
Admin reviews claim
        │
   ┌────┴────┐
   ▼         ▼
APPROVED   REJECTED
   │         │
   ▼         └── Admin note stored
   │
Store linked to claimant (owner_id set)
is_claimed = true
Other pending claims for same store → auto-REJECTED
```

#### Claim Rules
- Target store must exist and be **unclaimed** (`owner_id = null`)
- One claim per user per store (unique constraint)
- Cannot claim an already-owned store

#### Admin Actions
- **View all claims:** filterable by status, shows store and claimant details
- **Approve:** Links store to claimant, marks store as claimed, **auto-rejects all other pending claims** for the same store
- **Reject:** Sets status to `rejected` with optional admin note

---

### 5.7 Admin Dashboard

#### Platform Statistics
Returns aggregated counts in a single API call:

| Metric | Description |
|--------|-------------|
| `totalUsers` | Total registered users |
| `totalStores` | Total stores on the platform |
| `totalReviews` | Total reviews submitted |
| `pendingSuggestions` | Suggestions awaiting admin review |
| `pendingClaims` | Claims awaiting admin review |
| `activeStores` | Stores with `active` status |

#### Moderation Actions
- Suspend/activate stores
- Approve/reject suggestions (with auto-store creation)
- Approve/reject claims (with auto-ownership linking)
- Deactivate user accounts
- Delete stores and reviews

---

### 5.8 Image Upload System

#### Cloudinary Integration
All images in the platform are managed through Cloudinary with full lifecycle support:

| Context | Folder | Max Size | Max Count |
|---------|--------|----------|-----------|
| Profile photos | `street-food/profiles/` | 3 MB | 1 per user |
| Store cover images | `street-food/stores/` | 5 MB | 1 per store |
| Store gallery | `street-food/stores/gallery/` | 5 MB each | 6 per store |
| Review photos | `street-food/reviews/` | 3 MB each | 3 per review |

#### Image Lifecycle
- **Upload:** Images streamed from memory buffer to Cloudinary
- **Replace:** Old image deleted from Cloudinary before new one saved
- **Delete:** Associated images cleaned up when parent entity (store/review) is deleted
- **Accepted formats:** JPEG, PNG, WebP only

#### Generic Upload Endpoint
- `POST /uploads/image` — utility endpoint for single image upload
- Requires `folder` parameter: `profiles`, `stores`, or `reviews`
- Returns Cloudinary URL and public ID

---

## 6. Database Schema

### Entity Relationship Overview

```
┌──────────┐     ┌───────────┐     ┌──────────────┐
│   User   │────▶│   Store   │────▶│ StoreGallery │
│          │     │           │     └──────────────┘
│  id      │     │  id       │
│  name    │     │  name     │────▶┌──────────────┐
│  email   │     │  owner_id │     │    Food      │
│  password│     │  lat/lng  │     └──────────────┘
│  role    │     │  status   │
│  bio     │     │ is_claimed│────▶┌──────────────┐
│  photo   │     └───────────┘     │   Review     │──▶ ReviewImage
│ is_active│                       │              │──▶ ReviewReply
└──────────┘                       └──────────────┘
     │
     │────▶ StoreSuggestion
     │────▶ StoreClaim
     │────▶ Review
```

### Tables & Key Fields

| Table | Key Fields | Constraints |
|-------|-----------|-------------|
| **users** | id, name, email, password_hash, role, bio, profile_photo, is_active | Unique email |
| **stores** | id, owner_id (FK→users), name, description, category, address, latitude, longitude, cover_image, status, is_claimed | owner_id nullable |
| **store_gallery** | id, store_id (FK→stores), image_url, public_id | Cascade delete with store |
| **foods** | id, store_id (FK→stores), name, description, price, image_url, is_available | Cascade delete with store |
| **reviews** | id, user_id (FK→users), store_id (FK→stores), rating, comment | Unique(user_id, store_id) |
| **review_images** | id, review_id (FK→reviews), image_url, public_id | Cascade delete with review |
| **review_replies** | id, review_id (FK→reviews), store_id (FK→stores), reply_text | Cascade delete with review |
| **store_suggestions** | id, suggested_by (FK→users), name, description, address, lat, lng, status, admin_note | Cascade delete with user |
| **store_claims** | id, store_id (FK→stores), claimed_by (FK→users), message, status, admin_note | Unique(store_id, claimed_by) |

### Cascade Behavior
- Deleting a **user** → cascades to their reviews, suggestions, and claims
- Deleting a **store** → cascades to gallery, foods, reviews, review replies, and claims
- Deleting a **review** → cascades to review images and review replies
- Deleting a store's **owner (user)** → sets `owner_id` to null (SET NULL)

---

## 7. Frontend Implementation Status

| Page / Feature | Route | Status | API Integration |
|----------------|-------|--------|-----------------|
| Login | `/login` | ✅ Implemented | ✅ POST /auth/login + GET /auth/me |
| Sign Up | `/signup` | ✅ Implemented | ✅ POST /auth/register |
| Auth Guard | Layout | ✅ Implemented | ✅ GET /auth/me on app load |
| Logout | Navbar | ✅ Implemented | ✅ POST /auth/logout |
| Profile View | `/profile` | ✅ UI Done | ⚠️ Uses cached auth data only |
| Settings | `/settings` | ✅ UI Done | ❌ No save/update wired |
| Home / Dashboard | `/` | ⚠️ Empty | ❌ No content |
| Store Listing | `/stores` | ⚠️ Static UI | ❌ No API call (hardcoded data) |
| Search | `/search` | ⚠️ Static UI | ❌ No API call |
| Reviews Feed | `/reviews` | ⚠️ Static UI | ❌ No API call (hardcoded data) |
| My Reviews | `/my-reviews` | ⚠️ Empty State | ❌ No API call |
| Popular Foods | `/popular` | ⚠️ Static UI | ❌ No API call (hardcoded data) |
| About | `/about` | ✅ Static Page | N/A |
| Contact | `/contact` | ✅ Static Page | N/A (form not wired) |
| Help / FAQ | `/help` | ✅ Static Page | N/A |
| Privacy Policy | `/privacy` | ✅ Static Page | N/A |
| Terms | `/terms` | ✅ Static Page | N/A |
| Store Detail | — | ❌ Not built | ❌ |
| Store Owner Dashboard | — | ❌ Not built | ❌ |
| Menu Management | — | ❌ Not built | ❌ |
| Gallery Management | — | ❌ Not built | ❌ |
| Review Submission | — | ❌ Not built | ❌ |
| Store Suggestions | — | ❌ Not built | ❌ |
| Store Claims | — | ❌ Not built | ❌ |
| Admin Dashboard | — | ❌ Not built | ❌ |
| Admin User Management | — | ❌ Not built | ❌ |
| Admin Store Management | — | ❌ Not built | ❌ |
| Admin Suggestions | — | ❌ Not built | ❌ |
| Admin Claims | — | ❌ Not built | ❌ |

---

## 8. API Endpoint Summary

### Auth (4 endpoints)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/auth/register` | Public | — | Register new account |
| POST | `/auth/login` | Public | — | Login, receive JWT cookie |
| POST | `/auth/logout` | Required | Any | Clear auth cookie |
| GET | `/auth/me` | Required | Any | Get current user profile |

### Users (4 endpoints)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| PATCH | `/users/profile` | Required | Any | Update own profile (multipart) |
| GET | `/users` | Required | Admin | List all users (paginated) |
| GET | `/users/:id` | Required | Admin | Get single user |
| PATCH | `/users/:id/deactivate` | Required | Admin | Deactivate user account |

### Stores (8 endpoints)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/stores` | Required | Store | Create new store (multipart) |
| POST | `/stores/:id/gallery` | Required | Store | Upload gallery images |
| GET | `/stores/search` | Public | — | Search stores by location |
| GET | `/stores/my-store` | Required | Store | Get own store |
| GET | `/stores/all` | Required | Admin | List all stores (paginated) |
| GET | `/stores/:id` | Public | — | Get store detail with menu/reviews |
| PATCH | `/stores/:id` | Required | Store | Update store info (multipart) |
| DELETE | `/stores/:id` | Required | Admin | Delete store |

### Foods (4 endpoints)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/foods` | Required | Store | Add food item |
| GET | `/foods/store/:storeId` | Public | — | Get store menu |
| PATCH | `/foods/:id` | Required | Store | Update food item |
| DELETE | `/foods/:id` | Required | Store | Delete food item |

### Reviews (6 endpoints)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/reviews` | Required | User | Submit review (multipart) |
| GET | `/reviews/store/:storeId` | Public | — | Get store reviews (paginated) |
| PATCH | `/reviews/:id` | Required | User | Update own review (multipart) |
| DELETE | `/reviews/:id` | Required | User/Admin | Delete review |
| POST | `/reviews/:reviewId/reply` | Required | Store | Reply to review |
| PATCH | `/reviews/:reviewId/reply` | Required | Store | Edit reply |

### Suggestions (5 endpoints)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/suggestions` | Required | User | Submit store suggestion |
| GET | `/suggestions/my` | Required | User | Get own suggestions |
| GET | `/suggestions` | Required | Admin | List all suggestions |
| PATCH | `/suggestions/:id/approve` | Required | Admin | Approve suggestion (auto-creates store) |
| PATCH | `/suggestions/:id/reject` | Required | Admin | Reject suggestion |

### Claims (4 endpoints)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/claims` | Required | Store | Submit ownership claim |
| GET | `/claims` | Required | Admin | List all claims |
| PATCH | `/claims/:id/approve` | Required | Admin | Approve claim (links owner) |
| PATCH | `/claims/:id/reject` | Required | Admin | Reject claim |

### Admin (3 endpoints)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/admin/stats` | Required | Admin | Platform statistics |
| PATCH | `/admin/stores/:id/suspend` | Required | Admin | Suspend a store |
| PATCH | `/admin/stores/:id/activate` | Required | Admin | Activate a store |

### Uploads (1 endpoint)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/uploads/image` | Required | Any | Upload single image |

**Total: 35 API endpoints**

---

## 9. Seed Data & Test Accounts

Run `npx prisma db seed` to populate the database.

### Seeded Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@streetfood.com | Admin@123456 |
| User | alice@example.com | User@1234 |
| User | bob@example.com | User@1234 |
| User | carol@example.com | User@1234 |
| Store Owner | ravi@momos.com | Store@1234 |
| Store Owner | priya@chaats.com | Store@1234 |

### Seeded Data
- **2 stores** (Momo Corner, Chaat Palace) — owned by store owners
- **8 food items** (4 per store)
- **4 reviews** from users on the stores

---

*Document generated on April 26, 2026 | Street Food Review System — University Project*
