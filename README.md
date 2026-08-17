# Sabrang 2026 - College Festival Management Portal

A modern, high-performance web application built for **Sabrang 2026** — managing event registrations, interactive schedules, user passes, and admin controls with real-time Firebase backend integration and WebGL interactive visual effects.

---

## 🚀 Features

- **Twin WebGL Loader Screen**: Custom `ogl` WebGL procedural fire eyes with smooth pupil cursor tracking, synchronized blinking, and a responsive skip option.
- **Dynamic Tubes Cursor Trail**: WebGL interactive 3D tube light trail that follows user movement across the viewport.
- **Firebase Authentication**: User login/signup with role-based access control (Admin & Student roles).
- **Event Registration & Passes**: Real-time event catalog, ticket booking, and dynamic QR pass generation.
- **Admin Dashboard**: Event creation, QR Code ticket scanner, and attendee management.
- **SEO & Performance Optimized**: Built on Next.js 16 App Router with Tailwind CSS styling and clean modular components.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19, Turbopack)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Graphics & WebGL**: `ogl`, `three`, `threejs-components`
- **Backend & Database**: Firebase Auth, Cloud Firestore, Firebase Admin SDK
- **Animation & Utilities**: `framer-motion`, `gsap`, `lenis`, `zod`

---

## 📦 Getting Started

### 1. Prerequisites
Ensure you have Node.js 18+ installed on your system.

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/Devam759/Sabrang-26.git
cd Sabrang-26
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory using `.env.example` as a template:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK (Server Side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Running Locally
Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the Next.js local development server |
| `npm run build` | Compiles production build |
| `npm start` | Starts production server |
| `npm run lint` | Runs ESLint code quality checks |
| `npm run deploy` | Builds and deploys application to Firebase Hosting |

---

## 🛡️ License

Private project created for **Sabrang 2026**.
