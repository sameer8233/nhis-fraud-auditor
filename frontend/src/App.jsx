import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ClaimsList from './pages/ClaimsList'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">NHIS Fraud Auditor Dashboard</h1>
              <div className="space-x-4">
                <Link to="/" className="hover:underline">Dashboard</Link>
                <Link to="/claims" className="hover:underline">Claims Review</Link>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/claims" element={<ClaimsList />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
