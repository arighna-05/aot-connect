# AOT Connect - Campus Networking Platform

A modern, functional, and community-driven networking platform designed specifically for students and faculty of **Academy of Technology (AOT)**.

![AOT Connect Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🚀 Overview

AOT Connect aims to bridge the gap between students across different departments and years. It provides a centralized space for official announcements, departmental discussions, interest-based clubs, and peer-to-peer messaging.

### Key Features

-   **Community Hubs**: Join global, departmental, or year-specific communities.
-   **Dynamic Feed**: Stay updated with announcements, questions, and discussions.
-   **Anonymous Posting**: Express yourself freely in a safe, moderated environment.
-   **Direct Messaging**: Connect with peers for academic or personal collaborations.
-   **Rich Profiles**: Showcase your skills, interests, and academic journey.
-   **Admin Dashboard**: Powerful tools for campus administrators to manage communities and users.

## 🛠 Tech Stack

-   **Frontend**: React, TypeScript, Vite, React Router, Tailwind CSS.
-   **Backend**: Node.js, Express, PostgreSQL, Socket.io.
-   **Authentication**: JWT-based secure authentication.
-   **Database**: PostgreSQL for robust data management.

## 📥 Getting Started

### Prerequisites

-   Node.js (v16+)
-   PostgreSQL installed and running

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd aot-connect
    ```

2.  **Install dependencies**:
    ```bash
    # Install frontend dependencies
    npm install

    # Install backend dependencies
    cd backend
    npm install
    cd ..
    ```

3.  **Database Setup**:
    -   Create a PostgreSQL database named `aot_connect`.
    -   Run the schema script located at `backend/schema.sql` in your PostgreSQL query editor.

4.  **Environment Variables**:
    -   Configure `.env.local` in the root directory for frontend (e.g., `GEMINI_API_KEY`).
    -   Configure `backend/.env` with your database credentials and `JWT_SECRET`.

### Running the App

1.  **Start the Backend**:
    ```bash
    cd backend
    npm run dev
    ```

2.  **Start the Frontend**:
    ```bash
    # In a new terminal
    npm run dev
    ```

## 📂 Project Structure

-   `/backend`: Node.js/Express server logic and database schema.
-   `/components`: Reusable UI components.
-   `/pages`: Main application views (Home, Profile, Communities, etc.).
-   `/services`: API and storage logic.
-   `/types.ts`: TypeScript interface definitions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for any bugs or feature requests.

---

Built with ❤️ for AOTians.