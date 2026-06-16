# 🌾 Farmlink SL

> **A Mobile Commerce Marketplace connecting Farmers and Buyers in Sierra Leone**

Built with **React Native (Expo)** · **Firebase** · **Monime Payment Gateway**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Payment Integration](#payment-integration)
- [Screens](#screens)
- [Assessment Info](#assessment-info)

---

## 🌍 Overview

**Farmlink SL** is a full-stack mobile commerce application developed for **TECH 307 – Mobile Commerce System** at Limkokwing University of Creative Technology, Sierra Leone.

The platform digitally connects local farmers directly with buyers, enabling:

- ✅ Transparent product pricing
- ✅ Secure Mobile Money payments via **Monime**
- ✅ Real-time order tracking
- ✅ Farmer product management dashboard
- ✅ Cross-platform support (Android, iOS, Web)

---

## ✨ Features

### 👨‍🌾 Farmer Features
| Feature | Description |
|---|---|
| Register / Login | Email or Google Sign-In |
| Product Management | Add, Edit, Delete products with images and categories |
| Stock Control | Quick toggle in/out of stock per product |
| Inventory Dashboard | Live stats: total products & inventory value |
| Active Orders | View incoming orders, contact buyers directly (call/email) |
| Order History | See all fulfilled orders with revenue earned |
| Profile | Edit name, change password, view live revenue stats |

### 🛒 Buyer Features
| Feature | Description |
|---|---|
| Register / Login | Email or Google Sign-In |
| Marketplace | Browse products with category filters and sorting |
| Search | Real-time product search |
| Product Details | Full product info, stock status, add to cart |
| Cart | Manage cart items, view subtotals |
| Checkout | Secure payment via Monime (Mobile Money) |
| Payment Confirmation | Enter SMS code generated only after verified payment |
| Active Orders | Live order status timeline (Processing → Delivering → Delivered) |
| Order History | View past orders, Re-order with one tap |
| Profile | Edit name, change password, view total spending |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React Native, Expo SDK |
| **Language** | TypeScript |
| **Navigation** | React Navigation (Stack + Tab) |
| **Backend** | Firebase (Cloud Firestore) |
| **Authentication** | Firebase Auth (Email/Password + Google OAuth) |
| **Payment Gateway** | Monime API (Mobile Money – Orange / Africell) |
| **Image Handling** | Expo Image Picker (Base64 stored in Firestore) |
| **Icons** | @expo/vector-icons (Ionicons) |
| **State Management** | React Context API (AuthContext, CartContext) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo Go app on your phone (for mobile testing)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/farmlink-sl.git

# 2. Navigate to the project folder
cd FarmerMarketplace

# 3. Install dependencies
npm install

# 4. Start the development server
npx expo start
```

### Running the App

| Platform | Command |
|---|---|
| **Android / iOS** | Scan the QR code with Expo Go |
| **Web Browser** | Press `w` in the terminal |
| **Android Emulator** | Press `a` in the terminal |

---

## 📁 Project Structure

```
FarmerMarketplace/
├── assets/                     # App icons and splash screen
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx      # Authentication state & functions
│   │   └── CartContext.tsx      # Shopping cart state
│   ├── navigation/
│   │   └── AppNavigator.tsx     # All navigation (tabs & stacks)
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── BuyerHomeScreen.tsx
│   │   ├── ProductDetailsScreen.tsx
│   │   ├── CartScreen.tsx
│   │   ├── CheckoutScreen.tsx
│   │   ├── BuyerActiveOrdersScreen.tsx
│   │   ├── OrderHistoryScreen.tsx
│   │   ├── FarmerDashboardScreen.tsx
│   │   ├── AddEditProductScreen.tsx
│   │   ├── FarmerOrdersScreen.tsx
│   │   ├── FarmerDeliveredScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/
│   │   └── firebase.ts          # Firebase config & exports
│   └── types.ts                 # TypeScript interfaces
├── app.json                     # Expo configuration
├── package.json
└── README.md
```

---

## 🔐 Environment Setup

### Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project and enable:
   - **Authentication** (Email/Password + Google)
   - **Firestore Database**
3. Copy your config into `src/services/firebase.ts`:

```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### Google Sign-In (Expo Auth Session)

Add your Expo client ID and web client ID from Google Cloud Console in `LoginScreen.tsx` and `RegisterScreen.tsx`:

```ts
const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: 'YOUR_EXPO_CLIENT_ID',
  webClientId: 'YOUR_WEB_CLIENT_ID',
});
```

---

## 💳 Payment Integration

Farmlink SL uses **Monime** – a Sierra Leone payment gateway supporting Mobile Money.

### Payment Flow

```
1. Buyer clicks "Proceed to Payment"
        ↓
2. App calls Monime API → creates Checkout Session
        ↓
3. In-app browser opens Monime payment page
   (Buyer dials USSD code: e.g., *715*83068#)
        ↓
4. Browser closes → App queries Monime for session status
        ↓
5. If status = "completed" → 6-digit code generated & shown
   If status = "pending/failed" → Error shown, NO code sent
        ↓
6. Buyer enters code → Order saved to Firestore
        ↓
7. Redirect to Home Screen ✅
```

### Monime Configuration (in `CheckoutScreen.tsx`)

```ts
const MONIME_API_KEY = 'YOUR_MONIME_API_KEY';
const MONIME_SPACE_ID = 'YOUR_MONIME_SPACE_ID';
```

---

## 📱 Screens

| Screen | Role | Description |
|---|---|---|
| Login | Both | Email or Google Sign-In |
| Register | Both | Create account, select role |
| Home / Marketplace | Buyer | Browse, filter, sort products |
| Product Details | Buyer | Full product info, add to cart |
| Cart | Buyer | Review items, proceed to checkout |
| Checkout | Buyer | Monime payment + code confirmation |
| Active Orders | Buyer | Live timeline tracker |
| Order History | Buyer | Past orders + Re-order button |
| My Products (Dashboard) | Farmer | Manage listings + stats |
| Add / Edit Product | Farmer | Create or update products |
| Active Orders | Farmer | Incoming orders + customer contact |
| Delivered Orders | Farmer | Completed orders + revenue |
| Profile | Both | Edit name, password, stats, settings |

---

## 📊 Assessment Info

**Module:** TECH 307 – Mobile Commerce System  
**University:** Limkokwing University of Creative Technology, Sierra Leone  
**Examiner:** Lansana Kabba  
**Weight:** 35% of total module mark  

| Criteria | Marks |
|---|---|
| Functionality (Core Features Working) | 20 |
| UI/UX Design | 10 |
| Backend & Database Implementation | 15 |
| Payment Integration | 10 |
| Code Quality & Structure | 10 |
| System Demo & Presentation | 10 |
| Individual Performance | 20 |
| Documentation | 5 |
| **Total** | **100** |

---

## 👥 Group Members

| Name | Role |
|---|---|
| _(ALPHA HAMIDU JALLOH)_ | _(BUYER)_ |
| _(NOAH TARAWALIE)_ | _(FARMER)_ |
| _(ELIZABETH ROY KARGBBO)_ | _(FARMER)_ |

---

## 📄 License

This project was developed for academic purposes at Limkokwing University of Creative Technology, Sierra Leone.

© 2025 Farmlink SL. All rights reserved.

---

> 🇸🇱 *Built with pride in Sierra Leone*
