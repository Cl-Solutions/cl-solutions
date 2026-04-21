import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import Tasks from './pages/Tasks'
import Finanzen from './pages/Finanzen'
import Wissensbibliothek from './pages/Wissensbibliothek'
import QuickLinks from './pages/QuickLinks'
import Ideen from './pages/Ideen'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="finanzen" element={<Finanzen />} />
          <Route path="wissen" element={<Wissensbibliothek />} />
          <Route path="links" element={<QuickLinks />} />
          <Route path="ideen" element={<Ideen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
