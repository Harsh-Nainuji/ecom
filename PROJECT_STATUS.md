# FabZone v1 — Project Status Tracker

Status of the first version (v1) Android marketplace application against the agreed scope.

> **Last updated:** 18 Jul 2026
>
> **v1 Readiness: ~80% complete** — 54 of 67 tracked items are fully implemented and wired to Supabase; 3 are partially built; 10 remain open (revenue features, redelivery, product edit/delete, Play Store publishing).

## Legend

- `[x]` Implemented and wired to Supabase (or functional for the use case).
- `[~]` Partially implemented / needs more work.
- `[ ]` Not implemented yet.

---

## Buyer Panel

| Feature | Status | Notes |
|---|---|---|
| User Registration | [x] | Email/password signup via Supabase; buyer/seller role selected at registration. |
| User Login | [x] | Supabase auth sign-in. |
| Forgot Password | [x] | Sends Supabase password-reset email. |
| Home Screen | [x] | Live categories and featured products; gradient hero banner, iconography, and refined product cards. |
| Product Categories | [x] | Fetched from Supabase; filterable on home screen. |
| Product Search | [x] | Search by name with category filter. |
| Product Details | [x] | Live product + variants + description. |
| Product Images | [x] | Supabase Storage pipeline + display in home, detail, cart, wishlist, seller list. |
| Product Description | [x] | Shown on product detail screen. |
| Available Sizes | [x] | Product variants supported. |
| Available Colors | [x] | Product variants supported. |
| Product Ratings & Reviews | [x] | Aggregate rating/count shown in listings; full review list and submission UI built. |
| Wishlist | [x] | Add/remove from product cards and detail screen. |
| Shopping Cart | [x] | Live cart with quantity updates and removal. |
| Checkout | [x] | Address selection + Razorpay payment + order creation. |
| Delivery Address | [x] | Existing addresses can be selected at checkout; address book supports add/edit/delete/set default. |
| Order History | [x] | Buyer orders list with status filters. |
| Order Tracking | [x] | Order detail timeline + OTP display. |
| Order Cancellation (before shipment) | [x] | Cancel button available in buyer order detail while order is pending/paid. |
| Product Reviews after delivery | [x] | Post-delivery review form per item in order detail. |
| Seller identity hidden from buyers | [x] | Orders/products do not expose seller personal details to buyers. |

---

## Seller Panel

| Feature | Status | Notes |
|---|---|---|
| Seller Registration (full profile fields) | [~] | Basic signup sets role to `seller`; `seller_profiles` details (GST, bank, address, terms) not collected during registration. |
| Seller approval by Admin | [x] | `seller_profiles.status` enum supports pending/approved/rejected/suspended; admin can approve/reject/suspend sellers. |
| Add Products | [x] | Seller can add a product from the product list. |
| Edit Products | [~] | Status toggle (activate/deactivate) only; no full edit form. |
| Delete Products | [ ] | No delete action. |
| Manage Stock | [x] | +/- stock adjustment on first variant from product list. |
| View Orders | [x] | Seller orders screen with status filters. |
| Update Order Status | [x] | Seller can advance order status. |
| Product fields (name, desc, category, price, sizes, colors, qty) | [x] | Supported via products + variants. |
| Max 5 images / 5 MB per product | [ ] | Storage pipeline exists; client-side enforcement not implemented. |
| Seller suspension/ban by Admin | [x] | Admin can block/unblock any user from buyers and sellers pages. |

---

## Delivery Partner Panel

| Feature | Status | Notes |
|---|---|---|
| Login | [x] | Same Supabase auth flow. |
| View assigned deliveries | [x] | Live assignments list. |
| View delivery information | [x] | Order, customer, address, phone, maps link. |
| Verify delivery using in-app OTP | [x] | Delivery partner enters customer OTP; backend validates and marks delivered. |
| Mark delivery as completed | [x] | Verified via OTP flow. |
| Mark customer unavailable | [ ] | No “customer unavailable” action. |
| Request redelivery | [ ] | No redelivery flow; redelivery OTP regeneration not handled. |

---

## Delivery OTP System

| Feature | Status | Notes |
|---|---|---|
| OTP generated when order is Out for Delivery | [x] | DB trigger `trg_generate_delivery_otp` creates/regenerates OTP on status change. |
| OTP visible only in customer app | [x] | Buyer order detail shows OTP when `out_for_delivery`. |
| Delivery partner must obtain OTP from customer | [x] | OTP verification UI on delivery detail screen. |
| OTP valid up to 24 hours | [~] | Trigger currently sets 2-hour expiry; can be changed to 24 hours in schema. |
| OTP expires after successful delivery | [x] | Marked `used = true` on verification. |
| New OTP for every redelivery attempt | [ ] | Trigger only regenerates on `out_for_delivery` transition; redelivery path not built. |
| OTP not sent through SMS | [x] | In-app only. |

---

## Admin Panel (Next.js)

| Feature | Status | Notes |
|---|---|---|
| View Buyers | [x] | `/buyers` lists users with block/unblock action. |
| View Sellers | [x] | `/sellers` lists sellers with approve/reject/suspend/block actions. |
| Approve Seller Registrations | [x] | Approve action in `/sellers`. |
| Reject Seller Registrations | [x] | Reject action in `/sellers`. |
| Suspend or Ban Sellers | [x] | Suspend and block actions in `/sellers`. |
| View Products | [x] | `/products` lists products with remove action. |
| Remove Products | [x] | Remove action in `/products` deletes product. |
| View Orders | [x] | Dashboard shows live recent orders. |
| Track Order Status | [x] | Dashboard shows live fulfillment statuses. |
| View Customer Reviews | [x] | `/reviews` lists customer reviews. |
| Remove Spam/Abusive Reviews | [x] | Remove action in `/reviews` deletes review. |
| Block Users | [x] | Block/unblock action on buyers and sellers pages. |

---

## Shipping & Logistics

| Feature | Status | Notes |
|---|---|---|
| Third-party logistics integration | [ ] | Out of developer responsibility per agreement; only in-app status tracking is implemented. |

---

## Revenue Features

| Feature | Status | Notes |
|---|---|---|
| Platform Commission Management | [ ] | `commission_settings` table exists; no UI or automatic commission logic. |
| Sponsored Product Listings | [ ] | `sponsored_listings` table exists; no UI or purchase flow. |

---

## Technical / Non-Functional

| Item | Status | Notes |
|---|---|---|
| Supabase backend + RLS | [x] | Tables, enums, RLS policies, and triggers in place; schema SQL pushed to remote project. Admin embeds use explicit FK names to avoid ambiguous relationships. |
| Mobile TypeScript passes | [x] | `mobile/node_modules/.bin/tsc --noEmit --skipLibCheck -p mobile/tsconfig.json` exits 0. |
| Admin TypeScript passes | [x] | `admin/node_modules/.bin/tsc --noEmit --skipLibCheck -p admin/tsconfig.json` exits 0. |
| Push notifications | [ ] | Not in v1 scope. |
| Play Store publishing | [ ] | Final step after completion. |

---

## Next Recommended Work

1. **Seller product edit/delete** — full edit form and delete action.
2. **Delivery redelivery / customer-unavailable** — delivery partner actions + OTP regeneration.
3. **Revenue features** — commission settings UI and sponsored listing flow (if required before v1 freeze).

---

## Demo Accounts & Credentials

Seed & reset script: `admin/scripts/seed_demo.js` (create users + data), `admin/scripts/reset_demo_passwords.js` (reset passwords).

| Role | Email | Password | Notes |
|---|---|---|---|
| Buyer | `buyer.demo@fabzone.dev` | `demobuyer1` | Sample buyer with cart, address, and orders. |
| Buyer 2 | `buyer.second@fabzone.dev` | `demobuyer2` | Secondary buyer with a delivered order. |
| Seller | `seller.demo@fabzone.dev` | `demoseller1` | Approved seller “Ira Collections” with products. |
| Seller 2 | `seller.handloom@fabzone.dev` | `demoseller2` | Approved seller “Handloom Stories” with products. |
| Delivery Partner | `delivery.demo@fabzone.dev` | `demodelivery1` | Delivery partner assigned to one order. |

Use these accounts to test login across the buyer, seller, and delivery apps. If Expo was running before the credentials changed, restart it with `npx expo start --clear`.
