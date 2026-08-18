import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtp() {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Signup and Login (on a 403 "not verified" response) both send the user
  // here with the email either as a ?email= query param or as route state —
  // accept either so a page refresh (which keeps the query param) still works.
  const email = searchParams.get('email') || location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  // A code is always sent right before this screen is reached (by signup, or
  // by a prior resend), so the resend cooldown starts pre-armed rather than
  // letting the user fire an immediate resend that the server would just
  // reject with 429.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setVerifying(true);
    try {
      await verifyOtp(email, otp);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    setResending(true);
    try {
      const data = await api.resendOtp(email);
      setInfo(data?.message || 'Verification code sent');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="brand-mark-lg">◆</div>
          <h1 className="brand-title">Momentum</h1>
          <p className="auth-subtitle">We couldn&apos;t find an email to verify.</p>
          <p className="auth-switch">
            <Link to="/signup">Back to sign up</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand-mark-lg">◆</div>
        <h1 className="brand-title">Momentum</h1>
        <p className="auth-subtitle">
          Enter the 6-digit code we sent to <strong>{email}</strong>. It expires in 10 minutes.
        </p>
        <form className="auth-form" onSubmit={handleVerify}>
          <label className="field">
            <span>Verification code</span>
            <input
              className="otp-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              maxLength={6}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          {info && <p className="form-success">{info}</p>}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={verifying || otp.length !== 6}
          >
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        </form>
        <p className="auth-switch">
          {cooldown > 0 ? (
            <span className="form-hint">Resend code in {cooldown}s</span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </p>
        <p className="auth-switch">
          Wrong email? <Link to="/signup">Sign up again</Link>
        </p>
      </div>
    </div>
  );
}
