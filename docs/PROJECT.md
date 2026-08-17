# CiviNex — AI-Powered Civic Intelligence Platform

## Problem Statement
Urban and local communities frequently encounter unresolved civic issues such as potholes, improper garbage disposal, water leakage, flooding, broken streetlights, and traffic congestion. Citizens lack a quick, transparent platform to report these issues, while municipal authorities struggle with prioritizing problems based on urgency, severity, and resource availability.

## Proposed Solution
**CiviNex** is a simple, intuitive AI-powered civic intelligence prototype platform.
- **Citizens** can quickly register, submit civic problem reports with photo proof, geolocation data, and description, and receive instant automated severity & priority scoring.
- **Authorities** can monitor incoming reports, filter high-priority/critical issues, view analytics and spatial maps, and update resolution statuses in real time.

## Target Users & Roles
1. **Citizen**: Submits civic issues, tracks report status, views severity scores and AI insights.
2. **Authority**: Manages municipal reports, updates resolution workflow, reviews analytics and problem hotspots.

## Tech Stack
- **Frontend Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Modern SaaS Glassmorphism Aesthetics
- **Routing**: React Router v6
- **Database & Auth & Storage**: Firebase Web SDK (Authentication, Firestore, Storage)
- **Analytics & Visualizations**: Recharts
- **Icons**: Lucide React

## Project Workflow
1. User registration & login with role selection (Citizen or Authority).
2. Citizens submit reports (with image upload, category, description, location).
3. Local Mock AI engine evaluates severity (0-100), assigns priority score, and generates actionable AI insights.
4. Firestore stores report record with status `Under Review`.
5. Authority reviews dashboard, prioritizes high-impact issues, and updates status to `In Progress` / `Resolved`.
6. Citizens track real-time progress on custom timelines.
