# Bulk Volunteer Import Module

A full-stack feature built for admins to upload, map, validate, and import bulk volunteer records via CSV/Excel. This project was engineered with a focus on memory efficiency, database query optimization, and a seamless user experience.

<img width="1116" height="557" alt="step-1-upload" src="https://github.com/user-attachments/assets/16105851-2aff-4921-9f21-1894053f3094" />

<img width="1122" height="785" alt="step-2-field-mapper" src="https://github.com/user-attachments/assets/2a6e8a87-aee5-4010-8b82-6852a5c6da71" />

<img width="1112" height="857" alt="step-3-validation" src="https://github.com/user-attachments/assets/c3e54fe0-0799-425a-a92a-7b224d407c2c" />

<img width="1127" height="842" alt="step-4-success" src="https://github.com/user-attachments/assets/19274b05-2ca9-4dea-b1c7-00804b6c0a91" />


## 🚀 Tech Stack
* **Frontend:** React (Vite), Tailwind CSS, Axios
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas, Mongoose
* **File Handling:** Multer (Upload), ExcelJS (Streaming), native `readline` (CSV)

## ⚡ Key Performance & Architecture Decisions
* **Memory Flatlining (Constraint 1):** Utilized the ExcelJS streaming API (`WorkbookReader`) and Node's native file streams. The entire file is never loaded into memory, ensuring the server remains stable regardless of file size.
* **Optimized DB Queries (Constraint 2):** Avoided the N+1 query problem. The validation engine extracts all emails and phone numbers during the mapping phase and hits MongoDB with exactly one `$in` query to check for duplicates.
* **Temp File Lifecycle (Constraint 3):** The uploaded file is saved to disk once, assigned a UUID, and reused across the validation and execution endpoints before being automatically deleted.
* **Client-Side Blob Generation (Constraint 5):** The final error report is generated entirely in the browser using `Blob` and `URL.createObjectURL`, saving server bandwidth and eliminating unnecessary round-trips.

---

## 🛠️ Local Setup Instructions

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine. 

### 2. Backend Setup
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server

2. Install dependencies:   
    ```bash
    npm install

3. Database Configuration: The project is pre-configured to connect to a free MongoDB Atlas cluster for easy testing. No local MongoDB installation is required.

4. Start the backend server:
    ```bash
    node server.js
*The server will run on http://localhost:5000.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the client folder:
    ```bash
    cd client

2. Install dependencies:
    ```bash
    npm install

3. Start the Vite development server:
    ```bash
    npm run dev
*The client will run on http://localhost:5173.*


---

## 🧪 Testing the Application
A sample test file named intentional_errors_test.csv is included in the root directory. This file contains intentional errors (missing required fields, duplicate emails, invalid phone lengths) so you can test the validation engine and the client-side error CSV download feature.

---

Author: Jatin Sharma
