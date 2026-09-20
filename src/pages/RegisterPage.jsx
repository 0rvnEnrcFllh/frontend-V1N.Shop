import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Sparkles,
  LogIn,
} from "lucide-react";
import { registerToBackend } from "../utils/auth";

export default function RegisterPage({ user }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasi input di sisi klien
    if (!name.trim() || !email.trim() || !password) {
      setError(
        "Harap lengkapi semua kolom: Nama Lengkap, Email, dan Kata Sandi.",
      );
      return;
    }

    if (!email.includes("@")) {
      setError("Format email tidak valid (harus mengandung @).");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal terdiri dari 6 karakter.");
      return;
    }

    setIsSubmitting(true);

    try {
      // POST ke https://toko-online-backend-production-437f.up.railway.app/auth/register
      const result = await registerToBackend(name, email, password, "1");
      setSuccessData(result);
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      console.error("Register error:", err);
      if (err.message) {
        setError(err.message);
      } else {
        setError("Pendaftaran gagal. Silakan coba beberapa saat lagi.");
      }
    }
  };

  const handleUseDemoAccount = () => {
    setName("Enrico");
    setEmail("zenoef03@gmail.com");
    setPassword("12345678");
    setError("");
  };

  if (user) {
    return (
      <div className="container py-5" id="register-already-login-container">
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
                <p className="card-text text-muted mb-4 small">
                  Telah login dengan akun: <strong>{user.email}</strong>
                </p>
                <Link
                  to="/"
                  id="register-already-home-btn"
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

  // Tampilan Sukses Registrasi dengan Alert Cek Email
  if (successData) {
    return (
      <div className="container py-5" id="register-success-container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
              {/* Header Sukses */}
              <div className="bg-success bg-opacity-10 border-bottom border-success-subtle p-4 text-center">
                <div className="p-3 bg-success text-white rounded-circle d-inline-flex mb-3 shadow-sm">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="fw-bold text-success mb-1">
                  Pendaftaran Berhasil!
                </h3>
                <p className="text-muted small mb-0">
                  Akun Anda telah berhasil didaftarkan ke sistem.
                </p>
              </div>

              <div className="card-body p-4 p-md-5">
                {/* Alert Instruksi Cek Email */}
                <div
                  className="alert alert-warning border-warning-subtle d-flex align-items-start gap-3 p-3 mb-4 rounded-3"
                  role="alert"
                  id="register-email-activation-alert"
                >
                  <Send
                    size={24}
                    className="text-warning-emphasis flex-shrink-0 mt-1"
                  />
                  <div>
                    <h6 className="fw-bold text-warning-emphasis mb-1">
                      Silakan Cek Email untuk Aktivasi
                    </h6>
                    <p className="small text-dark mb-0">
                      Tautan verifikasi aktivasi telah dikirimkan ke alamat
                      email:{" "}
                      <strong className="text-decoration-underline">
                        {successData.email}
                      </strong>
                      . Silakan buka kotak masuk (inbox) atau folder spam email
                      Anda dan klik tautan aktivasi untuk mengaktifkan akun
                      sebelum login.
                    </p>
                  </div>
                </div>

                {/* Ringkasan Data Akun */}
                <div className="bg-light p-3 rounded-3 border mb-4 small">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">ID Pengguna:</span>
                    <span className="fw-semibold text-dark">
                      #{successData.id}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Nama:</span>
                    <span className="fw-semibold text-dark">
                      {successData.name}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Email:</span>
                    <span className="fw-semibold text-dark">
                      {successData.email}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">Pesan Backend:</span>
                    <span className="badge bg-success-subtle text-success text-wrap text-start">
                      {successData.message}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="d-grid gap-2">
                  <Link
                    to="/login"
                    id="register-go-to-login-btn"
                    className="btn btn-primary py-2 d-flex align-items-center justify-content-center gap-2"
                  >
                    <LogIn size={18} />
                    <span>Lanjut ke Halaman Login</span>
                  </Link>

                  <button
                    type="button"
                    id="register-another-account-btn"
                    className="btn btn-outline-secondary py-2"
                    onClick={() => {
                      setSuccessData(null);
                      setName("");
                      setEmail("");
                      setPassword("");
                      setError("");
                    }}
                  >
                    Daftar Akun Lain
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" id="register-page-container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link
              to="/"
              id="register-back-home-link"
              className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Home</span>
            </Link>

            <button
              type="button"
              id="register-quick-fill-btn"
              onClick={handleUseDemoAccount}
              className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-1"
              title="Isi contoh data pendaftaran otomatis"
            >
              <Sparkles size={14} />
              <span>Isi Contoh Data</span>
            </button>
          </div>

          <div className="card border-0 shadow-sm rounded-3 bg-white">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="p-3 bg-success-subtle text-success rounded-circle d-inline-flex mb-2">
                  <UserPlus size={28} />
                </div>
                <h3 className="fw-bold text-dark mb-1">Daftar Akun Baru</h3>
                <p className="text-muted small mb-0">
                  Lengkapi data berikut untuk mendaftar ke server Toko Online
                </p>
              </div>

              {error && (
                <div
                  className="alert alert-danger d-flex align-items-center gap-2 p-2 small mb-3"
                  role="alert"
                  id="register-alert-error"
                >
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} id="register-form">
                {/* Input Nama Lengkap */}
                <div className="mb-3">
                  <label
                    htmlFor="register-name"
                    className="form-label small fw-semibold text-secondary"
                  >
                    Nama Lengkap
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      id="register-name"
                      className="form-control"
                      placeholder="Masukkan nama lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Input Email */}
                <div className="mb-3">
                  <label
                    htmlFor="register-email"
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
                      id="register-email"
                      className="form-control"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div className="mb-4">
                  <label
                    htmlFor="register-password"
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
                      id="register-password"
                      className="form-control"
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      id="toggle-register-password-visibility-btn"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="form-text text-muted small mt-1">
                    Gunakan minimal 6 karakter.
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="register-submit-button"
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
                      <span>Mendaftarkan akun...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Daftar Sekarang (Register)</span>
                    </>
                  )}
                </button>
              </form>

              <hr className="my-4 text-muted" />

              <div className="text-center small">
                <span className="text-muted">Sudah punya akun? </span>
                <Link
                  to="/login"
                  id="register-to-login-link"
                  className="text-decoration-none fw-semibold text-success"
                >
                  Masuk ke Akun
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
