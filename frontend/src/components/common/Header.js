import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleIssuesClick = (e) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event bubbling
    
    console.log('🔥 Issues button clicked!');
    console.log('Current user:', user);
    console.log('Navigate function:', typeof navigate);
    
    try {
      console.log('Attempting to navigate to /issues...');
      navigate('/issues');
      console.log('✅ Navigate called successfully');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo" onClick={() => navigate('/')}>
          <h1>Nakuru Polls</h1>
          <p>Your Voice, Our Future</p>
        </div>

        <nav className="header-nav">
          {user ? (
            <>
              <button 
                className="nav-btn"
                onClick={() => navigate('/dashboard')}
              >
                🏠 Dashboard
              </button>

              {/* DEBUG VERSION - Issues Button */}
              <button 
                className="nav-btn issues-btn-debug"
                onClick={handleIssuesClick}
                style={{ 
                  position: 'relative', 
                  zIndex: 9999,
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
              >
                📝 Issues (DEBUG)
              </button>

              {(user.role === 'admin' || user.role === 'super_admin') && (
                <button 
                  className="nav-btn admin-btn"
                  onClick={() => navigate('/admin')}
                >
                  👑 Admin Panel
                </button>
              )}

              <button 
                className="nav-btn logout-btn"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>

              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </>
          ) : (
            <>
              <button 
                className="nav-btn"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button 
                className="nav-btn primary"
                onClick={() => navigate('/register')}
              >
                Register
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;