
# Claimly

AI-powered product claims assistant.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Python, FastAPI
- Voice AI: ElevenLabs (planned)
- Video: Chert (planned)
- Domain: GoDaddy (planned)

## Prerequisites

- Node.js and npm
- Python 3.10+
- Git

## Getting Started

### 1. Clone the Repository

git clone https://github.com/USERNAME/claimly.git
cd claimly

### 2. Start the Frontend

cd frontend
npm install
cp .env.example .env.local
npm run dev

Frontend: http://localhost:3000

### 3. Start the Backend

Open a second terminal in the repository root.

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

Backend: http://localhost:8000
API docs: http://localhost:8000/docs

For Windows, activate the virtual environment
using .venv\Scripts\activate.

## Git Workflow

1. Pull the latest main branch.
2. Create your own feature branch.
3. Make changes and commit.
4. Push your branch to GitHub.
5. Open a pull request into main.

Never commit API keys or .env files.
