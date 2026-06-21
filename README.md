# BusinessOS AI™
> **Run Your Business. Powered by AI.**

Welcome to **BusinessOS AI™**, an autonomous business intelligence and operations platform designed to merge core enterprise resource planning (ERP) workflows with predictive machine learning networks, rule-based agentic automations, real-time alert notifications, and a conversational AI Business Consultant.

---

## 🚀 Key Features

*   **SAP-Inspired Visual ERP Flow**: Instantly visualize the core lifecycle of your operations:
    `Procurement ➔ Inventory ➔ Sales Shop ➔ Finance Ledger`
*   **AI Business Consultant Chatbot**: A floating conversational agent powered by live database statistics to perform diagnostics (e.g., explaining why profit margins dropped).
*   **Predictive ML Intelligence**: Zero-dependency algorithms trained on historical data:
    *   **Customer Churn Probability**: Identifies at-risk buyers with interactive modal reasons.
    *   **Sales Forecast Projections**: Predicts next month's sales velocity.
*   **AI Agentic Control Center**: Audit active AI operational agents (Sales, Inventory, Finance, Support) and toggle custom IF-THEN automation rules (e.g., auto-restocking).
*   **Real-Time Notification Hub**: Interactive header bell dropdown showing warnings (low stock alerts), new orders, and invoice details.
*   **Multi-Role Access Control**: Dynamic menu layout filtering based on user role (Owner, Operations Manager, Sales Exec, Finance Officer, Warehouse Staff, B2B Vendor, Buyer).
*   **Executive PDF Report Generator**: One-click calculations that compile corporate statistics into an official PDF report.

---

## 🛠️ Project Structure

```
Autonomous ai/
├── backend/
│   ├── instance/               # SQLite database location (aierp.db)
│   ├── temp_reports/           # Generated PDF report downloads
│   ├── app.py                  # Flask Main Application & REST API router
│   ├── config.py               # Application configurations
│   ├── database.py             # SQLite table initialization & seeder
│   ├── ml_models.py            # ML predictors & forecasting algorithms
│   ├── models.py               # SQLAlchemy schemas & user profiles
│   ├── reports.py              # ReportLab PDF summary layout generator
│   └── test_api.py             # Automated unit tests (10 verification scenarios)
└── frontend/
    ├── public/                 # Static assets
    └── src/
        ├── components/         # React UI modules (Dashboard, Portals, Analytics)
        ├── App.jsx             # Shell layout, state, & notification center
        ├── index.css           # Premium dark-mode glassmorphism stylesheet
        ├── main.jsx            # React mounting entrypoint
        └── mockApi.js          # [NEW] Client-side fetch interceptor for GitHub Pages
```

---

## 💻 Local Setup & Quickstart

Follow these instructions to run the full stack locally:

### 1. Backend Server Setup (Flask)
Navigate to the `backend` folder:
```bash
cd backend
```

Create a Python virtual environment and activate it:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install the required dependencies:
```bash
pip install -r requirements.txt
```

Run the application:
```bash
python app.py
```
*The backend API will run on `http://127.0.0.1:5000`.*

### 2. Frontend Development Server Setup (React + Vite)
Navigate to the `frontend` folder:
```bash
cd ../frontend
```

Install the npm packages:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*The frontend web app will run on `http://localhost:5173/`.*

---

## 🧪 Automated Testing
Verify the integrity of all database actions, ML algorithms, authentication checks, and PDF report routing by running the unit tests:
```bash
cd backend
.\venv\Scripts\activate
python -m unittest test_api.py
```
## Credentials to Admin

Email: admin@aierp.com
Password : admin123
---

## 🌐 Publishing to GitHub Pages

BusinessOS AI™ is equipped with a **Client-side Mock API Interceptor** ([mockApi.js](frontend/src/mockApi.js)) that automatically activates when hosted on GitHub Pages (`*.github.io`). This allows users to experience a fully interactive demo of the application (complete with user login, data additions, and PO approvals saved to browser `localStorage`) without needing to deploy a Python backend server!

### How to publish:
1. Make sure you set the repository base path in [vite.config.js](frontend/vite.config.js) (already configured for the repository `businessos-ai`).
2. Build the production files:
   ```bash
   cd frontend
   npm run build
   ```
3. Deploy the compiled `frontend/dist/` folder contents to your `gh-pages` branch on GitHub.
4. Enable GitHub Pages in your repository settings pointing to the branch. Your site will be live at `https://<your-username>.github.io/businessos-ai/`!

---

## 👤 Developer
Developed with ❤️ by **Aswin Karthik Vijayakumar**
