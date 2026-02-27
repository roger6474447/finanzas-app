# FinanzasApp 💰

App de control de finanzas personales - Backend + Frontend

## Tech Stack
- **Frontend**: React + Tailwind + Chart.js
- **Backend**: Node.js + Express + MySQL

## Desarrollo Local

```bash
# Backend
cd backend
cp .env.example .env  # Configurar DB
npm install
npm run dev

# Frontend
cd frontend
cp .env.example .env  # Cambiar REACT_APP_API_URL=http://localhost:3001/api
npm install
npm start
```

## Despliegue en Render

### Opción 1: Blueprint (Recomendado)
1. Conectá tu repo de GitHub a Render
2. New → Blueprint
3. Seleccioná el archivo `render.yaml`
4. Completá los datos y deploy

### Opción 2: Manual

**Backend:**
1. New → Web Service
2. Repo: tu-repo/finanzas-app
3. Root Directory: `backend`
4. Build: `npm install`
5. Start: `npm start`
6. Agregar variables de entorno:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD` (de MySQL)
   - `DB_NAME=finanzas_db`

**Frontend:**
1. New → Static Site
2. Repo: tu-repo/finanzas-app
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Publish Directory: `build`
6. Agregar variable: `REACT_APP_API_URL=https://tu-backend.onrender.com/api`

## Base de datos

La primera vez, llamá a `https://tu-backend.onrender.com/api/init` para crear las tablas.
