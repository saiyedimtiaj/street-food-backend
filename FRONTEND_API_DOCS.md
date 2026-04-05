# 🍜 Street Food Review System — Frontend API Documentation

**Base URL:** `http://localhost:3000/api/v1`
**Swagger UI:** `http://localhost:3000/api/docs`

---

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Format](#error-format)
- [Roles](#roles)
- [Endpoints](#endpoints)
  - [Auth](#1-auth)
  - [Users](#2-users)
  - [Stores](#3-stores)
  - [Foods](#4-foods)
  - [Reviews](#5-reviews)
  - [Suggestions](#6-suggestions)
  - [Claims](#7-claims)
  - [Admin](#8-admin)
  - [Uploads](#9-uploads)

---

## Authentication

The API uses **JWT stored in an httpOnly cookie** (`access_token`).

- On `POST /auth/login`, the server sets the cookie automatically.
- For browser-based frontends, **no manual token handling is needed** — the cookie is sent automatically with `credentials: 'include'`.
- For non-browser clients (Postman, mobile), use the `Authorization: Bearer <token>` header.

### CORS

The frontend origin must match `CORS_ORIGIN` env (default `http://localhost:3000`). All fetch calls must include:

```ts
fetch(url, {
  credentials: 'include', // Required for httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Description of result",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-04-05T12:00:00.000Z"
}
```

---

## Roles

| Role    | Description                                      |
| ------- | ------------------------------------------------ |
| `user`  | Can browse stores, write reviews, suggest stores |
| `store` | Can manage own store, menu, reply to reviews     |
| `admin` | Can moderate platform, approve/reject claims     |

---

## Endpoints

---

### 1. Auth

#### `POST /auth/register` — Public

Register a new account.

**Body (JSON):**

| Field      | Type   | Required | Rules                                         |
| ---------- | ------ | -------- | --------------------------------------------- |
| `name`     | string | ✅        | 2–100 chars                                   |
| `email`    | string | ✅        | Valid email                                    |
| `password` | string | ✅        | Min 8 chars, ≥1 uppercase letter, ≥1 number   |
| `role`     | string | ✅        | `"user"` or `"store"`                          |

**Example:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password1",
  "role": "user"
}
```

**Responses:**

| Status | Description             |
| ------ | ----------------------- |
| 201    | `{ data: { userId } }`  |
| 409    | Email already registered |

---

#### `POST /auth/login` — Public

Login and receive JWT cookie.

**Body (JSON):**

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅        |
| `password` | string | ✅        |

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

> The `access_token` httpOnly cookie is set automatically.

---

#### `POST /auth/logout` — Authenticated

Clears the auth cookie.

**Response (200):** `{ message: "Logged out successfully", data: null }`

---

#### `GET /auth/me` — Authenticated

Get current user profile.

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "profile_photo": "https://...",
    "bio": "Street food lover",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Users

#### `PATCH /users/profile` — Authenticated

Update own profile (name, bio, profile photo).

**Content-Type:** `multipart/form-data`

| Field           | Type   | Required | Notes                    |
| --------------- | ------ | -------- | ------------------------ |
| `name`          | string | ❌        | 2–100 chars              |
| `bio`           | string | ❌        | Max 500 chars            |
| `profile_photo` | file   | ❌        | jpg/png/webp, max 3 MB   |

**Response (200):** Updated user object.

---

#### `GET /users` — Admin only

List all users with pagination.

**Query params:**

| Param  | Type   | Default | Notes                          |
| ------ | ------ | ------- | ------------------------------ |
| `role` | string | —       | Filter: `user`, `store`, `admin` |
| `page` | number | 1       |                                |
| `limit`| number | 10      |                                |

**Response (200):**

```json
{
  "data": {
    "users": [ ... ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

#### `GET /users/:id` — Admin only

Get a single user by ID.

---

#### `PATCH /users/:id/deactivate` — Admin only

Deactivate a user account.

---

### 3. Stores

#### `POST /stores` — Store role only

Create a new store (one per owner).

**Content-Type:** `multipart/form-data`

| Field         | Type   | Required | Notes                     |
| ------------- | ------ | -------- | ------------------------- |
| `name`        | string | ✅        | Max 150 chars             |
| `description` | string | ❌        |                           |
| `category`    | string | ❌        |                           |
| `address`     | string | ❌        |                           |
| `latitude`    | number | ✅        | -90 to 90                 |
| `longitude`   | number | ✅        | -180 to 180               |
| `cover_image` | file   | ❌        | jpg/png/webp, max 5 MB    |

**Response (201):** Store object with `gallery: []`.

---

#### `POST /stores/:id/gallery` — Store role only

Upload gallery images (max 6 total).

**Content-Type:** `multipart/form-data`

| Field     | Type   | Required | Notes                           |
| --------- | ------ | -------- | ------------------------------- |
| `gallery` | files  | ✅        | Up to 6 images, max 5 MB each  |

---

#### `GET /stores/search` — Public

Search stores by location (Haversine radius).

**Query params:**

| Param    | Type   | Required | Default | Notes            |
| -------- | ------ | -------- | ------- | ---------------- |
| `lat`    | number | ✅        | —       | Latitude         |
| `lng`    | number | ✅        | —       | Longitude        |
| `radius` | number | ❌        | 5       | Radius in km     |

**Response (200):** Array of stores with `distance_km` field, sorted nearest first.

---

#### `GET /stores/my-store` — Store role only

Get own store profile with gallery.

---

#### `GET /stores/all` — Admin only

List all stores with pagination.

**Query params:**

| Param    | Type   | Default | Notes                                 |
| -------- | ------ | ------- | ------------------------------------- |
| `status` | string | —       | `active`, `inactive`, `suspended`     |
| `page`   | number | 1       |                                       |
| `limit`  | number | 10      |                                       |

**Response (200):** Paginated stores list.

---

#### `GET /stores/:id` — Public

Get store public profile with menu, gallery, reviews, and average rating.

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "name": "Momo Corner",
    "description": "...",
    "category": "Dumplings",
    "address": "...",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "cover_image": "https://...",
    "status": "active",
    "is_claimed": true,
    "gallery": [
      { "id": "uuid", "image_url": "https://...", "public_id": "..." }
    ],
    "foods": [
      { "id": "uuid", "name": "Steam Momo", "price": 120, "is_available": true }
    ],
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Amazing!",
        "user": { "id": "uuid", "name": "Alice", "profile_photo": "..." },
        "images": [ { "id": "uuid", "image_url": "..." } ],
        "replies": [ { "id": "uuid", "reply_text": "Thank you!" } ]
      }
    ],
    "averageRating": 4.5,
    "totalReviews": 12
  }
}
```

---

#### `PATCH /stores/:id` — Store role only

Update store info and cover image. Owner only.

**Content-Type:** `multipart/form-data`

| Field            | Type   | Required | Notes                                        |
| ---------------- | ------ | -------- | -------------------------------------------- |
| `name`           | string | ❌        | Max 150 chars                                |
| `description`    | string | ❌        |                                              |
| `category`       | string | ❌        |                                              |
| `address`        | string | ❌        |                                              |
| `latitude`       | number | ❌        | -90 to 90                                    |
| `longitude`      | number | ❌        | -180 to 180                                  |
| `cover_image`    | file   | ❌        | jpg/png/webp, max 5 MB                       |
| `gallery_remove` | string | ❌        | JSON array of public_ids to delete           |

**Example `gallery_remove`:** `'["street-food/stores/gallery/abc123"]'`

---

#### `DELETE /stores/:id` — Admin only

Delete a store and all associated Cloudinary images.

---

### 4. Foods

#### `POST /foods` — Store role only

Add a food item to your store.

**Body (JSON):**

| Field          | Type    | Required | Notes          |
| -------------- | ------- | -------- | -------------- |
| `store_id`     | UUID    | ✅        |                |
| `name`         | string  | ✅        | Max 150 chars  |
| `description`  | string  | ❌        |                |
| `price`        | number  | ✅        | Must be > 0    |
| `image_url`    | string  | ❌        |                |
| `is_available` | boolean | ❌        | Default: true  |

---

#### `GET /foods/store/:storeId` — Public

Get all foods for a store.

**Query params:**

| Param       | Type   | Notes                    |
| ----------- | ------ | ------------------------ |
| `available` | string | `"true"` to filter only available |

---

#### `PATCH /foods/:id` — Store role only

Update a food item (owner validation).

**Body (JSON):** Same fields as create, all optional.

---

#### `DELETE /foods/:id` — Store role only

Delete a food item (owner validation).

---

### 5. Reviews

#### `POST /reviews` — User role only

Submit a review for a store (max 1 per store per user).

**Content-Type:** `multipart/form-data`

| Field      | Type   | Required | Notes                    |
| ---------- | ------ | -------- | ------------------------ |
| `store_id` | UUID   | ✅        |                          |
| `rating`   | number | ✅        | 1–5 integer              |
| `comment`  | string | ❌        | Max 1000 chars           |
| `images`   | files  | ❌        | Up to 3, max 3 MB each   |

**Response (201):** Review object with `images` array.

---

#### `GET /reviews/store/:storeId` — Public

Get reviews for a store (paginated).

**Query params:**

| Param  | Default |
| ------ | ------- |
| `page` | 1       |
| `limit`| 10      |

**Response (200):**

```json
{
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Great!",
        "created_at": "...",
        "user": { "id": "uuid", "name": "Alice", "profile_photo": "..." },
        "images": [ { "id": "uuid", "image_url": "...", "public_id": "..." } ],
        "replies": [ { "id": "uuid", "reply_text": "Thanks!", "created_at": "..." } ]
      }
    ],
    "total": 24,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

#### `PATCH /reviews/:id` — User role only

Update own review.

**Content-Type:** `multipart/form-data`

| Field           | Type   | Required | Notes                            |
| --------------- | ------ | -------- | -------------------------------- |
| `rating`        | number | ❌        | 1–5                              |
| `comment`       | string | ❌        |                                  |
| `images_add`    | files  | ❌        | New images (max 3 total)         |
| `images_remove` | string | ❌        | JSON array of public_ids         |

---

#### `DELETE /reviews/:id` — User (own) or Admin

Delete a review and its Cloudinary images.

---

#### `POST /reviews/:reviewId/reply` — Store role only

Reply to a review on your store (1 reply per review).

**Body (JSON):**

| Field        | Type   | Required | Notes         |
| ------------ | ------ | -------- | ------------- |
| `reply_text` | string | ✅        | Max 1000 chars |

---

#### `PATCH /reviews/:reviewId/reply` — Store role only

Update your reply.

**Body (JSON):**

| Field        | Type   | Required |
| ------------ | ------ | -------- |
| `reply_text` | string | ❌        |

---

### 6. Suggestions

#### `POST /suggestions` — User role only

Submit a store suggestion for admin review.

**Body (JSON):**

| Field         | Type   | Required | Notes       |
| ------------- | ------ | -------- | ----------- |
| `name`        | string | ✅        |             |
| `description` | string | ❌        |             |
| `address`     | string | ❌        |             |
| `latitude`    | number | ❌        | -90 to 90   |
| `longitude`   | number | ❌        | -180 to 180 |

---

#### `GET /suggestions/my` — User role only

Get own submitted suggestions.

---

#### `GET /suggestions` — Admin only

Get all suggestions.

**Query params:**

| Param    | Notes                               |
| -------- | ----------------------------------- |
| `status` | `pending`, `approved`, `rejected`   |

---

#### `PATCH /suggestions/:id/approve` — Admin only

Approve a suggestion — automatically creates an unclaimed store.

**Body (JSON, optional):**

| Field        | Type   |
| ------------ | ------ |
| `admin_note` | string |

---

#### `PATCH /suggestions/:id/reject` — Admin only

Reject a suggestion.

**Body (JSON, optional):**

| Field        | Type   |
| ------------ | ------ |
| `admin_note` | string |

---

### 7. Claims

#### `POST /claims` — Store role only

Claim an unclaimed store.

**Body (JSON):**

| Field      | Type   | Required | Notes          |
| ---------- | ------ | -------- | -------------- |
| `store_id` | UUID   | ✅        |                |
| `message`  | string | ❌        | Max 1000 chars |

---

#### `GET /claims` — Admin only

List all claims.

**Query params:**

| Param    | Notes                               |
| -------- | ----------------------------------- |
| `status` | `pending`, `approved`, `rejected`   |

---

#### `PATCH /claims/:id/approve` — Admin only

Approve a claim — links the store to the claimant. Auto-rejects other pending claims for the same store.

**Body (JSON, optional):**

| Field        | Type   |
| ------------ | ------ |
| `admin_note` | string |

---

#### `PATCH /claims/:id/reject` — Admin only

Reject a claim.

**Body (JSON, optional):**

| Field        | Type   |
| ------------ | ------ |
| `admin_note` | string |

---

### 8. Admin

All admin endpoints require `admin` role.

#### `GET /admin/stats`

Platform dashboard statistics.

**Response (200):**

```json
{
  "data": {
    "totalUsers": 150,
    "totalStores": 42,
    "totalReviews": 380,
    "pendingSuggestions": 5,
    "pendingClaims": 3,
    "activeStores": 40
  }
}
```

---

#### `PATCH /admin/stores/:id/suspend`

Suspend a store.

---

#### `PATCH /admin/stores/:id/activate`

Reactivate a suspended store.

---

### 9. Uploads

#### `POST /uploads/image` — Authenticated

Upload a single image (utility endpoint).

**Content-Type:** `multipart/form-data`

| Field    | Type   | Required | Notes                              |
| -------- | ------ | -------- | ---------------------------------- |
| `file`   | file   | ✅        | jpg/png/webp, max 5 MB             |
| `folder` | string | ✅        | `profiles`, `stores`, or `reviews` |

**Response (201):**

```json
{
  "data": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "street-food/profiles/abc123"
  }
}
```

---

## Frontend Integration Cheatsheet

### Axios Setup

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true, // Required for httpOnly cookie auth
});

export default api;
```

### Fetch Setup

```ts
const API_BASE = 'http://localhost:3000/api/v1';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  return res.json();
}
```

### Common Patterns

**Login:**

```ts
const res = await api.post('/auth/login', { email, password });
// Cookie is set automatically — no token storage needed
const user = res.data.data.user;
```

**Get current user (on page load):**

```ts
const res = await api.get('/auth/me');
const user = res.data.data;
```

**Upload with file (multipart):**

```ts
const form = new FormData();
form.append('name', 'My Store');
form.append('latitude', '27.7172');
form.append('longitude', '85.3240');
form.append('cover_image', fileInput.files[0]);

const res = await api.post('/stores', form);
// Content-Type is set automatically by browser for FormData
```

**Search stores by location:**

```ts
const res = await api.get('/stores/search', {
  params: { lat: 27.7172, lng: 85.3240, radius: 5 },
});
const stores = res.data.data; // Array with distance_km
```

**Paginated list:**

```ts
const res = await api.get('/reviews/store/some-uuid', {
  params: { page: 1, limit: 10 },
});
const { reviews, total, totalPages } = res.data.data;
```

---

## Test Accounts (after seeding)

| Role        | Email                  | Password       |
| ----------- | ---------------------- | -------------- |
| Admin       | admin@streetfood.com   | Admin@123456   |
| User        | alice@example.com      | User@1234      |
| User        | bob@example.com        | User@1234      |
| User        | carol@example.com      | User@1234      |
| Store Owner | ravi@momos.com         | Store@1234     |
| Store Owner | priya@chaats.com       | Store@1234     |

Run `npx prisma db seed` to populate the database with seed data.

---

## HTTP Status Codes

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| 200  | Success                                      |
| 201  | Created                                      |
| 400  | Bad request / validation error               |
| 401  | Not authenticated                            |
| 403  | Forbidden (wrong role)                       |
| 404  | Resource not found                           |
| 409  | Conflict (duplicate email, review, claim)    |
| 500  | Internal server error                        |
