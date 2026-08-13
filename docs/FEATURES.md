# CiviNex — Feature Specifications

## 1. Authentication & User Management
- [x] Firebase Email/Password Registration (Name, Email, Password, Role selection).
- [x] Firebase Login & Logout.
- [x] Firestore User Profile setup (`users/{userId}` storing name, email, role, createdAt).
- [x] Role-Based Access Control (`Citizen` vs `Authority`).
- [x] Protected Route components preventing unauthorized access.

## 2. Citizen Portal
- [ ] **Citizen Dashboard**: Displays personal stats (Total, Pending, In Progress, Resolved), high-priority reports, and recent activity.
- [ ] **Report Problem Form**: Form capturing category (Road Damage, Garbage, Water Leakage, Flooding, Streetlight, Traffic, Other), description, location, and photo upload.
- [ ] **Firebase Storage Integration**: Secure photo upload & URL generation.
- [ ] **Local Mock AI Analysis**: Instant client-side generation of Severity (Low, Medium, High, Critical), Priority Score (0-100), and AI Insight.
- [ ] **My Reports**: Dedicated view for citizen to filter and view status of submitted reports.
- [ ] **Report Details Page**: Complete detail view including image preview, location map/coords, AI analysis score, status timeline (`Report Submitted` → `AI Analysis` → `Under Review` → `In Progress` → `Resolved`).

## 3. Authority Portal
- [ ] **Authority Dashboard**: Comprehensive overview of all civic reports, critical issue highlights, category & status breakdowns.
- [ ] **Status Workflow Management**: Authority users update report status (`Under Review`, `In Progress`, `Resolved`, `Rejected`) synced to Firestore.
- [ ] **High Priority Issue Queue**: Automatically surface highest priority score reports.

## 4. Analytics & Map Interface
- [ ] **Interactive Analytics Charts**: Recharts visualizations for Category distribution, Status distribution, Priority distribution, and Issues over time.
- [ ] **Civic Map View**: Clean map-style interface displaying report coordinates with color-coded priority markers (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low).
