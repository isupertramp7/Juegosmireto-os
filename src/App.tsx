import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'

// El panel solo lo carga quien entra a /admin, no todas las visitas del sitio.
const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/admin"
          element={
            <Suspense
              fallback={
                <div className="grid min-h-screen place-items-center bg-slate-900 text-white">
                  <p className="animate-pulse font-bold">Cargando panel…</p>
                </div>
              }
            >
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
