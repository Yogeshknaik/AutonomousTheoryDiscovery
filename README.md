# Autonomous Theory Discovery Platform 🧪🤖

An end-to-end autonomous AI scientific discovery platform powered by **Foundation Models & NVIDIA NIM Reasoning LLMs** (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`).

The system implements a closed-loop scientific discovery pipeline:
$$\text{Problem Definition} \longrightarrow \text{Knowledge Indexing} \longrightarrow \text{Hypothesis Generation} \longrightarrow \text{Formal Theory} \longrightarrow \text{Symbolic Verification} \longrightarrow \text{ML Experimentation} \longrightarrow \text{Refinement}$$

---

## 🌟 Key Features

* **🤖 Autonomous Closed-Loop Discovery Pipeline**: Runs multi-iteration scientific discovery loops that automatically generate hypotheses, formulate theories, run data experiments, evaluate results, and refine candidates.
* **⚡ NVIDIA NIM Reasoning LLM Integration**: Powered by NVIDIA's high-throughput reasoning models (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`) with configurable reasoning budget and thinking capabilities.
* **📚 Literature Processing & Knowledge Graph**: Parses uploaded research PDFs and documents, extracts key domain concepts, and constructs structured Knowledge Graphs.
* **📐 Formal Symbolic Verification**: Formulates mathematical equations using **SymPy** for symbolic sanity checks and consistency verification.
* **📊 Data-Driven Automated ML Experiments**: Automatically executes empirical code on dataset files (CSV/DataFrames) using `scikit-learn`, `pandas`, and `numpy` to evaluate scientific hypotheses against ground-truth metrics.
* **🧠 Reflective Memory Engine**: Tracks empirical learnings, success/failure logs, and updates long-term research memory across iterations.
* **📑 Automated Report Generation**: Generates comprehensive scientific discovery reports complete with LaTeX mathematical formulations, experiment charts, and execution summaries.

---

## 🛠️ Technology Stack

### Backend
* **Framework**: FastAPI (Python 3.10+)
* **LLM Integration**: NVIDIA NIM REST API (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`), OpenAI SDK support, Google Gemini fallback
* **Symbolic Math**: SymPy
* **Data & Machine Learning**: Pandas, NumPy, Scikit-learn
* **Database & ORM**: SQLite & SQLAlchemy
* **Document Parsing**: PyPDF, Python-docx

### Frontend
* **Framework**: React 18 with TypeScript (Vite build system)
* **Styling**: Modern dark mode UI with glassmorphism, responsive grid layouts, custom CSS design tokens
* **Icons & Visuals**: Lucide React
* **State & Networking**: Fetch API / REST services

---

## 📁 Repository Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints (projects, discovery, reports, etc.)
│   │   ├── database/        # Database models & SQLite setup
│   │   ├── engine/          # Closed-loop Autonomous Discovery Engine
│   │   ├── schemas/         # Pydantic data schemas
│   │   ├── services/        # LLM service, hypothesis generator, ML runner, etc.
│   │   └── main.py          # FastAPI application entrypoint
│   ├── requirements.txt     # Backend Python dependencies
│   ├── .env                 # Real environment keys (NVIDIA_API_KEY, etc.)
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, and UI widgets
│   │   ├── pages/           # Dashboard, ProjectDetails, CreateProject, Reports
│   │   ├── services/        # API communication Layer
│   │   ├── App.tsx          # Router and view switching
│   │   └── main.tsx         # React app entrypoint
│   ├── package.json         # Frontend dependencies & scripts
│   └── vite.config.ts       # Vite configuration
├── .env                     # Root environment configuration
├── .env.example             # Root environment template
├── README.md                # Project Overview & Quickstart
└── USER_GUIDE.md            # Step-by-Step User Documentation
```

---

## 🚀 Quickstart & Setup

### Prerequisites
* **Python**: 3.10 or higher
* **Node.js**: v18 or higher (npm v9+)
* **NVIDIA API Key**: Obtain a key from [NVIDIA Integrated API Platform](https://build.nvidia.com)

---

### 1. Backend Setup

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and insert your NVIDIA API Key:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env`*:
   ```env
   NVIDIA_API_KEY=nvapi-your-key-here
   NVIDIA_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
   ```

5. **Start the FastAPI Backend Server**:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend API will be available at: `http://127.0.0.1:8000`  
   Interactive API docs (Swagger UI): `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at: `http://localhost:5173`

---

## 🔌 API Endpoints Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/projects/` | `GET` / `POST` | List or create research projects |
| `/api/projects/{id}` | `GET` / `DELETE` | View details or delete a project |
| `/api/documents/upload` | `POST` | Upload PDF/Doc literature files |
| `/api/discovery/run/{id}` | `POST` | Trigger closed-loop autonomous discovery |
| `/api/hypotheses/{project_id}` | `GET` | Retrieve generated scientific hypotheses |
| `/api/theories/{project_id}` | `GET` | View formulated mathematical theories |
| `/api/experiments/{project_id}` | `GET` | Inspect empirical ML experiment results |
| `/api/validation/{project_id}`| `GET` | View symbolic math & consistency logs |
| `/api/reports/{project_id}` | `GET` / `POST` | Generate and fetch scientific discovery reports |

---

## 📜 License

This project is open-source under the MIT License.
