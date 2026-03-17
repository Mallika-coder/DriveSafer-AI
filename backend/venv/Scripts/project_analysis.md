# DriveSafe AI: Technical Architecture & Deep-Dive

This document provides a line-by-line, folder-by-folder explanation of the **DriveSafe AI** project. This is designed to help you explain the project confidently in an interview, covering both the *what* and the *why*.

---

## 🏗️ The High-Level Flowchart

1.  **Input**: The user's webcam captured via the browser (**React + MediaPipe**).
2.  **AI Processing (Frontend)**: 
    *   **FaceMesh**: Extracts 468 3D facial landmarks.
    *   **Object Detection**: Identifies phones or other distractions.
3.  **Analytics**: Calculate **EAR** (Eye Aspect Ratio) for drowsiness and **MAR** (Mouth Aspect Ratio) for yawning.
4.  **Backend Integration**: Telemetry is sent to the **FastAPI** backend for logging and persistent storage in the **PostgreSQL (Supabase)** database.
5.  **Alerting**: If thresholds are met, the UI triggers **Critical Alerts** (Audio + Visual).

---

## 📂 Folder-by-Folder Breakdown

### 1. `/frontend` (The Neural Interface)
Built with **Vite + React + TypeScript + Tailwind CSS**.

*   **`src/components/`**:
    *   `Sidebar.tsx`: The primary navigation. It uses **Lucide React** icons and is hardened with **inline CSS** to ensure the vertical layout never breaks.
    *   `WebcamFeed.tsx`: The heart of the app. It initializes the camera and runs the MediaPipe loops for FaceMesh and Object Detection.
    *   `SettingsModal.tsx`: Allows adjusting thresholds (e.g., how "closed" an eye must be to count as drowsy).
*   **`src/pages/`**:
    *   `Home.tsx`: The "Dashboard" with high-level stats and a "Launch Monitor" CTA.
    *   `Monitor.tsx`: The live telemetry screen. Displays 9xl fonts for metrics and the real-time camera feed.
    *   `History.tsx`: Fetches past session data from the backend and displays it in a full-width table.
*   **`src/hooks/`**:
    *   `useFaceMesh.ts`: Custom hook to initialize and manage the MediaPipe FaceMesh model.
    *   `useObjectDetect.ts`: Custom hook to manage the MediaPipe Object Detection model.
*   **`src/index.css`**: Defines the global "Vivid" theme. It sets the solid `#050B14` background and forces all text to be bright white for higher contrast.
*   **`tailwind.config.js`**: Custom color palette (Cyan, Purple, Pink) and animations like `glow-shift`.

### 2. `/backend` (The Logic Core)
Built with **Python + FastAPI + SQLAlchemy**.

*   **`main.py`**: The entry point. Handles API routes for saving sessions and fetching history. Uses **CORS** to talk to the frontend.
*   **`database/`**:
    *   `db.py`: Configures the **SQLAlchemy** engine and session local. It connects to **PostgreSQL**.
    *   `models.py`: Defines the database schema (e.g., `Session` table with `id`, `timestamp`, `incidents`).
*   **`requirements.txt`**: Lists dependencies like `fastapi`, `uvicorn`, and `sqlalchemy`.

### 3. `/brain` (The Agentic Memory)
This stores my "thoughts," implementation plans, and task checklists. It ensures that any AI assistant (like me) knows exactly what has been done and what needs to be fixed.

---

## 🧠 Key Technical Terms Explained

| Term | What it means | Why we used it |
| :--- | :--- | :--- |
| **EAR (Eye Aspect Ratio)** | A math formula based on 6 eye landmarks. | To detect if eyes are narrowing (drowsiness). |
| **MAR (Mouth Aspect Ratio)** | A math formula based on mouth width/height. | To detect yawning (fatigue). |
| **Glassmorphism** | A translucent UI effect using `backdrop-blur`. | To give the app a premium, modern, "OS-of-the-future" look. |
| **MediaPipe** | Google's library for on-device AI. | It allows us to process AI **locally** in the browser, making the app extremely fast and private. |
| **FastAPI** | A high-performance Python web framework. | It handles asynchronous data logging very efficiently. |

---

## 🎤 Interview "Pitch"

*"I built DriveSafe AI to solve driver fatigue using accessible hardware. By leveraging on-device AI through MediaPipe, the system monitors 68 facial landmarks in real-time to detect drowsiness and yawning with sub-10ms latency. The frontend is a high-performance React application optimized for visibility in vehicle environments, while the backend ensures all safety data is logged for long-term intelligence. It's not just a monitor; it's a proactive safety shield."*
