# FabZone Marketplace — Comprehensive Testing Manual

This testing manual provides step-by-step instructions to verify the marketplace workflows for **FabZone**. It covers account registration, Indian compliance collection, real-time status transitions, administrative approval, catalog image constraints, and the delivery lifecycle.

---

## 🛠️ Step 1: Database & System Preparation

Before initiating manual testing, ensure the database schema cache is fresh and email constraints are relaxed for smooth test account creation.

### 1.1 Reload Supabase Schema Cache
Because the database relationships have been modified, you must notify the PostgREST server to reload the schema:
1. Open your **Supabase Dashboard**.
2. Go to the **SQL Editor**.
3. Create a new query, paste the following SQL, and click **Run**:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### 1.2 Bypass Email Verification for Testing
To quickly register test accounts without waiting for real verification emails:
1. In the **Supabase Dashboard**, navigate to **Authentication** -> **Providers** -> **Email**.
2. Locate the **Confirm email** toggle.
3. Turn **Confirm email** **OFF** and save changes.
> [!NOTE]
> Turning off email confirmation allows you to register buyers, sellers, and delivery partners using any arbitrary dummy email and login instantly.

---

## 🧪 Phase A: Seller Onboarding & Real-Time Approval

This scenario tests the seller sign-up wizard, document collection, database state constraints, and real-time dashboard updates via Supabase channels.

### Scenario A.1: Seller Registration & Onboarding
1. Launch the Expo mobile app and navigate to **Create Account** (`RegisterScreen`).
2. Toggle the role to **Seller**.
3. Enter a new email (e.g., `test.seller@fabzone.dev`), name, and password, then tap **Create Seller Account**.
4. Upon successful registration and login, the app will inspect the `profiles` table. Since the user role is `seller` and they do not have a record in `seller_profiles`, they will be automatically redirected to the **Seller Onboarding wizard** (`SellerRegistrationScreen`).
5. Complete the onboarding pages with the following details:
   - **Business Name:** *Vastra Loom*
   - **GSTIN:** *27AAAAA0000A1Z5* (Valid Indian format: 15 characters)
   - **PAN:** *ABCDE1234F* (Valid Indian format: 10 characters)
   - **Aadhaar:** *1234 5678 9012* (12 digits)
   - **Bank Account Number:** *918273645019*
   - **IFSC:** *SBIN0001234* (11 alphanumeric characters)
6. Tap **Submit Onboarding Details**. 

### Scenario A.2: Awaiting Admin Approval
1. Once onboarding details are submitted, the seller profile is created in a `pending` state.
2. The `RootNavigator` immediately updates and routes the seller to the **Seller Pending Screen** (`SellerPendingScreen`).
3. You will see a clean, professional status indicator stating: *"Awaiting Administration Review..."*.
4. **Leave the mobile screen open** on this view for the next step.

### Scenario A.3: Admin Review & Real-Time UI Transition
1. Open a terminal, navigate to the `admin` folder, and start the admin panel:
   ```bash
   npm run dev
   ```
2. Open your browser and go to [http://localhost:3000](http://localhost:3000).
3. Select the **Sellers** tab from the sidebar. You will see your newly registered seller (*Vastra Loom*) listed as `pending`.
4. Click **Approve**.
5. **Watch the mobile screen:** The moment you click Approve, the Supabase real-time listener triggers on the `seller_profiles` table, the mobile app refreshes the seller profile state, and the UI automatically slides transition from the **Pending Screen** to the active **Seller Dashboard** (`SellerTabs`) without requiring a manual refresh!

---

## 📸 Phase B: Product Catalog & Image Constraints

This scenario tests the client-side media validation constraints, ensuring image quantity and size rules match the design specifications.

### Scenario B.1: Uploading Images (Maximum of 5)
1. Go to the active **Seller Dashboard** on your mobile device.
2. Tap on the **Products** tab, then tap **Add Product** or edit an existing one.
3. Tap the **+ Add Image** button.
4. Pick images from your camera roll. 
5. Attempt to add a 6th image. The app must block the picker and launch a native dialog:
   > [!WARNING]
   > **Limit Reached:** *You can upload a maximum of 5 images per product.*

### Scenario B.2: Upload Size Constraint (5MB Limit)
1. In the photo selector, select a large high-resolution image exceeding 5MB.
2. Select it for upload. The app must catch the file size check and trigger the following warning dialog:
   > [!CAUTION]
   > **File Too Large:** *Image size must be under 5MB.*

---

## 🚚 Phase C: Order Fulfillment & Delivery OTP Validation

This scenario tests the buyer checkout flow, delivery assignment, and the failure/retry loop for customer OTP generation.

### Scenario C.1: Placing a Buyer Order
1. Log out from the seller account in the mobile app.
2. Log in using a buyer account (use `buyer.demo@fabzone.dev` / `demobuyer1` or register a new buyer).
3. Search for a product, add it to your cart, select an address, and proceed through checkout to create an order.

### Scenario C.2: Delivery Assignment & OTP Generation
1. In the Supabase dashboard or your Admin UI, update the order's `delivery_partner_id` to link it to the delivery partner account (`delivery.demo@fabzone.dev`).
2. Update the order status to `out_for_delivery`.
3. Open the **Buyer App**, navigate to **Order History** -> select the active order. You must see the 6-digit OTP displayed on the timeline.
> [!TIP]
> The database automatically creates a `delivery_otps` record linked to this order with a 24-hour expiration window.

### Scenario C.3: Verification and Customer-Unavailable Loop
1. Log in to the mobile app as the Delivery Partner (`delivery.demo@fabzone.dev` / `demodelivery1`).
2. You will see the active assignment under **My Deliveries**. Select it.
3. **Test Failure Case:** Tap **Mark Customer Unavailable**. The order status updates, the delivery status flags as `failed`, and the OTP expires.
4. **Test Retry Case:** Tap **Retry Delivery**. The status reverts to `out_for_delivery`, and a **new** 6-digit OTP is automatically generated for the buyer.
5. **Test Complete Case:** Obtain the new 6-digit OTP from the Buyer app, enter it in the Delivery Partner app, and tap **Verify OTP**. The order immediately advances to `delivered`.

---

## 📋 Manual Test Checklist

Use this table to check off features as you test them:

| ID | Test Scenario | Expected Outcome | Pass/Fail |
|---|---|---|---|
| 1 | Database Reload | Cache reloaded successfully. | |
| 2 | Seller Signup | Automatically opens Onboarding Screen. | |
| 3 | Documentation check | Rejects invalid Aadhaar/PAN formats. | |
| 4 | Pending Screen | Renders details and shows "reviewing" state. | |
| 5 | Real-Time Transition | App transitions to active tabs instantly on Admin Approval. | |
| 6 | Max 5 Images | Alerts user and blocks additional selections. | |
| 7 | Max 5MB Size | Prevents upload of files over 5MB. | |
| 8 | OTP Visibility | 6-digit OTP visible only to authenticated buyer. | |
| 9 | Redelivery Retry | Generates a new OTP on retry attempt. | |
| 10 | OTP Verification | Deliveries update to `completed` upon correct OTP entry. | |
