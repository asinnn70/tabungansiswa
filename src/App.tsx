import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';

import { User } from './types';

const PrivateRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/students" element={
          <PrivateRoute roles={['admin']}>
            <Layout>
              <Students />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/transactions" element={
          <PrivateRoute roles={['admin']}>
            <Layout>
              <Transactions />
            </Layout>
          </PrivateRoute>
        } />
        
        <Route path="/reports" element={
          <PrivateRoute roles={['admin']}>
            <Layout>
              <Reports />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <Layout>
              <Profile />
            </Layout>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
