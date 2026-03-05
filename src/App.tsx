import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Navbar from './components/shared/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import DocView from './pages/DocView'
import SignPage from './pages/SignPage'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
          <Routes>
            {/* Public signing route — no navbar needed */}
            <Route path="/sign/:token" element={<SignPage />} />

            {/* Auth routes */}
            <Route path="/login" element={<><Navbar /><Login /></>} />
            <Route path="/register" element={<><Navbar /><Register /></>} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<><Navbar /><Dashboard /></>} />
              <Route path="/upload" element={<><Navbar /><Upload /></>} />
              <Route path="/doc/:id" element={<><Navbar /><DocView /></>} />
            </Route>

            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          pauseOnHover
          theme="dark"
          toastStyle={{
            backgroundColor: '#1e2135',
            border: '1px solid #2d3455',
            color: '#e2e8f0',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
