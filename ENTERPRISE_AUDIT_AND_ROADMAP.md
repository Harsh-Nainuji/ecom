# Enterprise E-Commerce Audit & Production Roadmap

## Executive Overview
This document provides a comprehensive end-to-end audit of the **FabZone E-Commerce Ecosystem** across its three core pillars: **Database Architecture**, **Application Logic & Backend API Integration**, and **UI / UX Presentation**.

The system currently comprises a multi-role React Native (Expo) Mobile & Web application (Buyers, Sellers, Delivery Partners) and a Next.js 16 Admin Control Panel, backed by Supabase (PostgreSQL, Storage, Auth, and Edge Functions).

Below is the complete analysis of the current state, identified security/performance loopholes, architectural risks, and a prioritized production-grade execution roadmap required to scale to enterprise standards.

---

## 1. Database Architecture & Data Integrity Audit

### Current Condition
- **Core Schema**: Tables defined for `profiles`, `seller_profiles`, `delivery_accounts`, `categories`, `products`, `product_images`, `product_variants`, `wishlists`, `cart_items`, `addresses`, `orders`, `order_items`, `delivery_otps`, `reviews`, `commission_settings`, `sponsored_listings`, `home_banners`.
- **Enum Types**: Defined for `user_role`, `seller_status`, `product_status`, `order_status`, `payment_status`, `delivery_state`.
- **Security Definer Functions**: `create_order_with_items`, `handle_out_for_delivery_otp`, `get_database_size_bytes`.

### Critical Bugs & Vulnerabilities
1. **Non-Atomic Inventory Deduction (Race Condition)**:
   - `create_order_with_items` inserts into `orders` and `order_items`, then empties `cart_items`.
   - **Risk**: It does **NOT** decrement `product_variants.stock` or verify `stock >= quantity` within a database row lock (`SELECT FOR UPDATE`). Concurrent checkouts for high-demand items will result in negative inventory and overselling.
2. **Missing Database Indexes for Core Query Paths**:
   - `cart_items(buyer_id)` lacks a secondary index.
   - `product_variants(product_id)` lacks an index.
   - `order_items(variant_id)` lacks an index.
   - `orders(payment_status, order_status)` lacks composite index for admin analytics.
3. **Hard Delete Cascades**:
   - Deleting a seller or product cascades and hard-deletes associated records. In production e-commerce, financial compliance requires **soft deletes** (`deleted_at timestamptz`) so historical tax records, invoices, and analytics remain immutable.
4. **Missing Idempotency & Webhook Tables**:
   - No `webhook_events` or `payment_transactions` table to track Razorpay event IDs (e.g. `evt_...`), leading to risk of duplicate processing on webhook retries.

---

## 2. Application Logic, API Routes & Business Logic Audit

### Current Condition
- **Mobile API Layer (`mobile/src/lib/api/*`)**: Handles auth, catalog browsing, wishlist, cart, address management, order creation, seller product management, and delivery partner tracking.
- **Admin App (`admin/app/*`)**: Manages seller approvals, product moderation, global commission rates, order dispatching, banner promotion, and system stats.
- **Next.js Server API Routes (`admin/app/api/*`)**: Exposes `/api/variants`, `/api/cart`, `/api/cart/items` with Service Role privilege.

### Critical Bugs & Vulnerabilities
1. **Hardcoded Environment URLs in Mobile Codebase**:
   - Mobile helper scripts explicitly reference `http://localhost:3000/api/...`.
   - **Risk**: Breaks immediately when tested on physical iOS/Android devices or deployed to production staging URLs. All API routes must use configurable environment variables (`EXPO_PUBLIC_API_BASE_URL`).
2. **Lack of Guest Cart & Storage Sync**:
   - Non-authenticated users cannot add items to cart before sign-in.
   - **Fix Required**: Local AsyncStore guest cart state that automatically merges into the Supabase database cart upon login.
3. **Razorpay Webhook & Payment Idempotency**:
   - Razorpay payment signature is verified client-side in Edge Function, but lacks asynchronous server-to-server webhook confirmation for dropped connections or UPI delayed authorizations.
4. **Input Sanitization & Validation**:
   - Address inputs, seller registration fields (GST/PAN numbers), and review comments rely primarily on front-end checks without Zod schema validation on API routes.

---

## 3. UI / UX Presentation & Visual Alignment Audit

### Current Condition
- Modern curated color palette (`C.rose`, `C.pink`, `C.card0..3`) with Lucide icons and rounded containers (`R.lg`, `R.full`).
- Dual mobile/web rendering via Expo Web and Next.js Admin dashboard.

### Critical Bugs & UI Defects
1. **Expo Web Desktop Width Constraints**:
   - When viewed on large desktop monitor screens (e.g. Expo Web at `localhost:8081`), product detail and home screens stretch across 1080p/4K without maximum container bounds (`maxWidth: 1200, alignSelf: 'center'`).
2. **Loading State Experience**:
   - Cart, wishlist, and product detail screens use standard `ActivityIndicator` spinners.
   - **Fix Required**: Implement skeleton layout shimmer animations (`react-native-reanimated` / SVG skeletons) to elevate perceive performance to enterprise standards.
3. **Cart Item Feedback & Multi-variant Selection**:
   - Single-variant products display "Default". When multiple variants exist, variant chips wrap nicely but lack visual swatch indicators for colors.
4. **Toast / Notification System**:
   - Currently relies on native `Alert.alert()`. Native alerts halt execution and look dated on web.
   - **Fix Required**: Replace native `Alert` calls with non-blocking Floating Banner/Toast notifications.

---

## 4. Master Feature Gap & Enterprise Roadmap Matrix

| Feature Module | Current State | Defect / Loophole | Enterprise Remediation Plan | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Inventory Management** | Basic stock integer in `product_variants` | No atomic stock lock (`SELECT FOR UPDATE`) during checkout | Add PL/pgSQL atomic stock reduction trigger & inventory reservation timeout | 🔴 Critical |
| **Environment Config** | Hardcoded `http://localhost:3000` | Fails on physical mobile devices & staging builds | Centralize base URLs into `EXPO_PUBLIC_API_BASE_URL` with fallback detection | 🔴 Critical |
| **RLS Policies** | Added basic public read policies | Admin functions rely on Service Role override without explicit RBAC policies in DB | Harden RLS with explicit `is_admin()` policy grants on all tables | 🟠 High |
| **Checkout & Payments** | Razorpay direct flow | No server webhook handler or payment retry state | Build `/api/webhooks/razorpay` with HMAC verification & transaction log | 🟠 High |
| **UI Responsiveness** | Full screen stretched on web | Unbound width on desktop viewports | Enforce responsive breakpoint wrappers (`max-width: 1200px`) for Expo Web | 🟠 High |
| **Search & Discovery** | Name string matching | No fuzzy search, price range sliders, or sorting (Price Low-High, Rating) | Implement Postgres `pg_trgm` full-text search API with multi-facet filters | 🟡 Medium |
| **Order History & Invoicing** | Basic list view | Missing downloadable PDF invoice and itemized tax breakdown | Build server-side PDF invoice generator endpoint | 🟡 Medium |
| **Push Notifications** | Push token column stored in `profiles` | Expo Push service trigger not attached to order status changes | Trigger Expo Push Notifications via database webhooks when order status changes | 🟡 Medium |
| **Analytics & Reporting** | Basic SQL counts in admin | Lacks revenue trend charts, best-selling SKUs, and seller commission payouts | Implement aggregated analytical views & Chart.js dashboard widgets | 🟢 Enhancement |

---

## 5. Phased Execution Action Plan

### Phase 1: Database & Order Safety (Atomic Inventory & Soft Deletes)
1. Write database migration for atomic stock reduction inside `create_order_with_items`:
   ```sql
   -- Verify stock & decrement atomically inside PL/pgSQL function
   UPDATE public.product_variants
   SET stock = stock - v_item_qty
   WHERE id = v_variant_id AND stock >= v_item_qty;
   ```
2. Add missing indexes on `cart_items(buyer_id)`, `product_variants(product_id)`, `orders(payment_status, order_status)`.
3. Add `deleted_at timestamptz` column to `products` and `seller_profiles` for soft-deletion.

### Phase 2: Production API & Environment Standardization
1. Create unified environment helper `mobile/src/lib/config.ts` to dynamically switch between local dev (`http://<IP>:3000`) and production backend.
2. Implement Razorpay webhook endpoint (`admin/app/api/webhooks/razorpay/route.ts`) to handle asynchronous payment success/failed events safely.

### Phase 3: UI/UX Refinement & Enterprise Polish
1. Enforce max-width layout wrapper (`<ScreenContainer>`) across all mobile web screens.
2. Add Skeleton Shimmer loaders for `BuyerHomeScreen`, `ProductDetailScreen`, and `CartScreen`.
3. Replace native `Alert.alert` with customizable Toast notifications.

### Phase 4: Enterprise Multi-Seller Features
1. Implement seller payout balance tracking and commission ledger.
2. Add downloadable PDF Invoice generation for buyers.
3. Integrate push notifications for order state changes (Shipped, Out for Delivery, Delivered).

---
*Document generated as part of the Enterprise E-Commerce Audit for FabZone.*
