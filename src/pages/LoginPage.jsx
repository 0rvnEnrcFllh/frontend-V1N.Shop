import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LogIn,
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { loginToBackend, decodeJwtPayload } from "../utils/auth";

export default function LoginPage({ user, token, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasi input
    if (!email || !password) {
      setError("Harap isi alamat email dan password.");
      return;
    }
    if (!email.includes("@")) {
      setError("Format email tidak valid (harus mengandung @).");
      return;
    }

    setIsSubmitting(true);
    try {
      const authResult = await loginToBackend(email, password);
      // Panggil callback onLogin dari App
      onLogin({
        token: authResult.token,
        user: authResult.user,
      });
      setIsSubmitting(false);
      navigate("/");
    } catch (err) {
      setIsSubmitting(false);
      console.error("Login error:", err);
      const serverMsg =
        err.response?.data?.message || err.response?.data?.error || err.message;
      if (serverMsg) {
        if (serverMsg === "user not found") {
          setError(
            "Pengguna tidak ditemukan. Silakan periksa kembali email Anda atau buat akun baru di menu Daftar.",
          );
        } else if (serverMsg.toLowerCase().includes("tidak cocok")) {
          setError(
            'Email atau kata sandi tidak cocok. Pastikan data sudah benar, atau gunakan tombol "Isi Otomatis" di bawah.',
          );
        } else {
          setError(serverMsg);
        }
      } else if (err.response && typeof err.response.data === "string") {
        setError(err.response.data);
      } else {
        setError("Gagal masuk. Silakan periksa email dan kata sandi Anda.");
      }
    }
  };

  const handleUseDemoAccount = () => {
    setEmail("orvnenrcfllh@gmail.com");
    setPassword("password123");
    setError("");
  };

  if (user) {
    const tokenPayload = decodeJwtPayload(
      token || localStorage.getItem("token"),
    );
    const expiryDate = tokenPayload?.exp
      ? new Date(tokenPayload.exp * 1000).toLocaleString("id-ID")
      : null;

    return (
      <div className="container py-5" id="login-success-container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 text-center">
              <div className="card-body">
                <div className="p-3 bg-success-subtle text-success rounded-circle d-inline-flex mb-3">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="card-title fw-bold text-dark mb-2">
                  Anda Sudah Masuk
                </h4>
                <p className="card-text text-muted mb-3 small">
                  Telah login sebagai <strong>{user.name || user.email}</strong>{" "}
                  ({user.email})
                </p>

                {expiryDate && (
                  <div className="badge bg-light text-muted border py-2 px-3 mb-4 small d-inline-flex align-items-center gap-1">
                    <KeyRound size={14} className="text-primary" />
                    <span>Token Valid hingga: {expiryDate}</span>
                  </div>
                )}

                <Link
                  to="/"
                  id="login-already-home-btn"
                  className="btn btn-primary w-100 py-2 d-inline-flex align-items-center justify-content-center gap-2"
                >
                  <span>Kembali ke Halaman Home</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" id="login-page-container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="mb-3">
            <Link
              to="/"
              id="login-back-home-link"
              className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Home</span>
            </Link>
          </div>

          <div className="card border-0 shadow-sm rounded-3 bg-white">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="p-3 bg-success-subtle text-success rounded-circle d-inline-flex mb-2">
                  <LogIn size={28} />
                </div>
                <h3 className="fw-bold text-dark mb-1">Masuk ke Akun</h3>
                <p className="text-muted small mb-0">
                  Gunakan email dan kata sandi yang terdaftar di sistem
                </p>
              </div>

              {/* Demo Quick Fill Helper */}
              <div className="mb-3 p-3 bg-light rounded border border-dashed">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="small">
                    <span className="fw-semibold text-dark d-block">
                      Akun Pengujian Demo:
                    </span>
                    <span className="text-muted font-monospace small">
                      orvnenrcfllh@gmail.com (sandi: password123)
                    </span>
                  </div>
                  <button
                    type="button"
                    id="login-fill-demo-btn"
                    onClick={handleUseDemoAccount}
                    className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
                  >
                    <Sparkles size={14} />
                    <span>Isi Otomatis</span>
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="alert alert-danger d-flex align-items-center gap-2 p-2 small mb-3"
                  role="alert"
                  id="login-error-alert"
                >
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} id="login-form">
                <div className="mb-3">
                  <label
                    htmlFor="login-email"
                    className="form-label small fw-semibold text-secondary"
                  >
                    Alamat Email
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      id="login-email"
                      className="form-control"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="login-password"
                    className="form-label small fw-semibold text-secondary"
                  >
                    Kata Sandi
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="login-password"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility-btn"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit-button"
                  disabled={isSubmitting}
                  className="btn btn-info text-light w-100 py-2 fw-medium d-flex align-items-center justify-content-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <span>Menghubungkan ke server...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      <span>Masuk (Login)</span>
                    </>
                  )}
                </button>
              </form>

              <hr className="my-4 text-muted" />

              <div className="text-center small">
                <span className="text-muted">Belum punya akun? </span>
                <Link
                  to="/register"
                  id="login-to-register-link"
                  className="text-decoration-none fw-semibold text-success"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
