import React from 'react';
import { useAuth } from '../hooks/useAuth';

const AdminPanelDebug = () => {
  const { user } = useAuth();
  
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL;
  
  console.log('AdminPanelDebug - User data:', user);
  console.log('AdminPanelDebug - User email:', user?.email);
  console.log('AdminPanelDebug - Email comparison:', isAdmin);
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid red',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <strong>Admin Debug Info:</strong><br/>
      <strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}<br/>
      <strong>Email:</strong> {user?.email || 'No email'}<br/>
      <strong>Admin Email:</strong> {ADMIN_EMAIL || 'Not Set'}<br/>
      <strong>Is Admin:</strong> {isAdmin ? 'YES' : 'NO'}<br/>
      <strong>User Object:</strong> {JSON.stringify(user, null, 2)}
    </div>
  );
};

export default AdminPanelDebug;
