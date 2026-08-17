# CiviNex — AI-Powered Civic Intelligence Platform

CiviNex is a modern civic intelligence platform prototype enabling citizens to report local problems (potholes, garbage, water leaks, broken streetlights) and receive instant mock AI severity analysis, while empowering municipal authorities to prioritize and resolve issues efficiently.

## Features
- **Role-Based Authentication**: Citizen and Authority registration & login via Firebase Auth.
- **Civic Problem Reporting**: Form with image upload, location input, and automated Mock AI severity & priority scoring.
- **Real-Time Status Tracking**: Interactive status progression timeline for reported issues.
- **Authority Intelligence Dashboard**: Filter high priority issues, update status, and track municipal metrics.
- **Analytics & Spatial Map**: Recharts analytics and priority-coded spatial issue map.

## Setup Instructions

1. Clone or navigate to the project directory:
   ```bash
   cd CiviNex
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase credentials to `.env`.

4. Run local development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```
