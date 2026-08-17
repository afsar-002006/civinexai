# CivicLens Firebase Backend Setup

This document explains the setup of the Firebase backend for CivicLens.

## Project Structure
The Firebase configuration is located in `firebase.json` and uses the `firebase` directory for configuration files:
* `firebase/firestore.rules`: Security rules for Cloud Firestore
* `firebase/firestore.indexes.json`: Cloud Firestore indexes
* `firebase/storage.rules`: Security rules for Cloud Storage
* `functions/`: Cloud Functions directory (TypeScript)

## How to Initialize (If you haven't already)
If you need to link this directory to a Firebase project, run:
```bash
firebase login
firebase use --add
```
Select your Firebase project ID, and alias it as `default`.

## Development
To start the Cloud Functions locally, run:
```bash
cd functions
npm install
npm run serve
```

## Deployment
To deploy all Firebase services (Firestore rules, Storage rules, and Functions):
```bash
firebase deploy
```
To deploy only specific services:
```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```
