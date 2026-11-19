import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Head from 'next/head';

export default function LoginPage() {
  const { toast } = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { username, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <>
      <Head>
        <title>Sign In | Wise Digital Garage Management System</title>
      </Head>

      <div className="login-root min-vh-100 d-flex flex-column flex-lg-row">
        {/* Left Hero Section: PURE CLEAN GARAGE IMAGE (No text overlay) */}
        <div className="left-hero col-12 col-lg-6 d-none d-lg-block position-relative">
          {/* Subtle bottom badge indicator */}
          <div className="position-absolute bottom-0 start-0 m-4">
            <span
              className="badge px-3 py-2 rounded-pill shadow-lg d-inline-flex align-items-center gap-2"
              style={{
                backgroundColor: 'rgba(7, 14, 28, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(13, 110, 253, 0.4)',
                color: '#ffffff',
                fontSize: '0.78rem',
              }}
            >
              <i className="bi bi-gear-wide-connected text-primary"></i>
              <span className="fw-semibold">Wise Digital Garage</span>
            </span>
          </div>
        </div>

        {/* Right Form Section: MODERN BLUE THEME (Matching Reference Image Layout) */}
        <div className="right-panel col-12 col-lg-6 d-flex flex-column justify-content-between p-4 p-md-5">
          {/* Top Sun / Theme Indicator */}
          <div className="d-flex justify-content-end mb-3">
            <button
              type="button"
              className="btn btn-sm btn-icon theme-toggle-btn"
              title="System Active"
              onClick={() => {}}
            >
              <i className="bi bi-sun text-white-50 fs-5"></i>
            </button>
          </div>

          {/* Center Form Container */}
          <div className="form-container mx-auto w-100" style={{ maxWidth: '440px' }}>
            {/* Logo (Clean Typography: "Wise" white + "Digital" royal blue badge) */}
            <div className="text-center mb-4">
              <div className="brand-logo-container d-inline-flex align-items-center justify-content-center">
                <span className="brand-wise">Wise</span>
                <span className="brand-badge-box">Digital</span>
              </div>
              <div className="brand-subtitle mt-1">Garage Management System</div>
            </div>

            {error && (
              <div className="alert custom-alert d-flex align-items-center gap-2 mb-4 p-3 rounded-3" role="alert">
                <i className="bi bi-exclamation-octagon-fill text-danger fs-5"></i>
                <div className="small text-danger fw-semibold">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Field 1: Email or Phone / Username */}
              <div className="mb-4">
                <label className="form-label custom-label mb-2">Email, Phone, or Staff Username</label>
                <input
                  type="text"
                  className="form-control custom-input py-2 px-3"
                  placeholder="Enter staff username (e.g. admin, manager)..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {/* Field 2: Password */}
              <div className="mb-2">
                <label className="form-label custom-label mb-2">Password</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control custom-input py-2 px-3 pe-5"
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none pe-3 text-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash text-primary' : 'bi-eye text-secondary'}`}></i>
                  </button>
                </div>
              </div>

              {/* Forgot Password link */}
              <div className="text-end mb-4">
                <a
                  href="#"
                  className="forgot-link small"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Please contact the Garage System Administrator or Manager to reset your account password.');
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Log In Button (Royal Blue matching brand requirement) */}
              <button
                type="submit"
                className="btn btn-primary-blue w-100 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </form>

            {/* Quick Demo Switcher Section */}
            <div className="demo-roles-section mt-4 pt-3 border-top border-white border-opacity-10">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-white-50" style={{ fontSize: '0.72rem' }}>
                  Quick Demo Access:
                </span>
                <span className="badge bg-primary bg-opacity-25 text-info" style={{ fontSize: '0.65rem' }}>
                  1-Click Fill
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-role-pill"
                  onClick={() => handleQuickLogin('admin', 'admin123')}
                >
                  Admin
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-role-pill"
                  onClick={() => handleQuickLogin('manager', 'manager123')}
                >
                  Manager
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-role-pill"
                  onClick={() => handleQuickLogin('storekeeper', 'store123')}
                >
                  Storekeeper
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-role-pill"
                  onClick={() => handleQuickLogin('mechanic_daniel', 'admin123')}
                >
                  Mechanic
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-role-pill"
                  onClick={() => handleQuickLogin('cashier', 'cashier123')}
                >
                  Cashier
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="text-center text-secondary small mt-4" style={{ fontSize: '0.78rem' }}>
            <span>Wise Digital Garage System • TLS 256-Bit Encrypted</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-root {
          background-color: #070e1c;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          min-height: 100vh;
        }

        /* Left Hero Panel: PURE CRISP GARAGE PHOTOGRAPHY WITHOUT TEXT CLUTTER */
        .left-hero {
          background-image:
            linear-gradient(to right, rgba(0, 0, 0, 0.05) 70%, rgba(11, 20, 38, 0.95) 100%),
            url('/images/garage-workshop.jpg');
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          min-height: 100vh;
        }

        /* Right Panel (Clean Deep Blue Palette) */
        .right-panel {
          background-color: #0b1426;
        }

        .theme-toggle-btn {
          background: transparent;
          border: none;
          padding: 8px;
          cursor: pointer;
        }

        /* Logo Typography: "Wise" in bold white + "Digital" in Royal Blue Badge */
        .brand-logo-container {
          gap: 4px;
        }

        .brand-wise {
          font-size: 2.2rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .brand-badge-box {
          background-color: #0d6efd;
          color: #ffffff;
          font-size: 1.9rem;
          font-weight: 900;
          padding: 0px 10px;
          border-radius: 6px;
          letter-spacing: -0.02em;
          margin-left: 4px;
          box-shadow: 0 4px 14px rgba(13, 110, 253, 0.4);
        }

        .brand-subtitle {
          color: #60a5fa;
          font-size: 0.76rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Form Inputs (Deep Blue styled) */
        .custom-label {
          color: #cbd5e1;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .custom-input {
          background-color: #13223f;
          border: 1px solid #1e3a6e;
          color: #ffffff;
          border-radius: 8px;
          font-size: 0.92rem;
          transition: all 0.2s ease;
        }

        .custom-input:focus {
          background-color: #172a4e;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
          color: #ffffff;
        }

        .custom-input::placeholder {
          color: #64748b;
          font-size: 0.85rem;
        }

        .forgot-link {
          color: #60a5fa;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-link:hover {
          color: #93c5fd;
          text-decoration: underline;
        }

        /* Button: Vibrant Royal Blue (Matches brand requirement) */
        .btn-primary-blue {
          background-color: #0d6efd;
          color: #ffffff;
          border: none;
          font-size: 0.95rem;
          letter-spacing: 0.02em;
          transition: all 0.2s ease;
        }

        .btn-primary-blue:hover {
          background-color: #0b5ed7;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(13, 110, 253, 0.45);
        }

        .btn-role-pill {
          background-color: #11203d;
          border: 1px solid #1e3a6e;
          color: #93c5fd;
          border-radius: 20px;
          font-size: 0.74rem;
          padding: 3px 10px;
          transition: all 0.15s ease;
        }

        .btn-role-pill:hover {
          background-color: #0d6efd;
          border-color: #0d6efd;
          color: #ffffff;
        }

        .custom-alert {
          background-color: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      `}</style>
    </>
  );
}
