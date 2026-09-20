import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import KategoriPage from "./pages/KategoriPage";
import KelolaKategoriPage from "./pages/KelolaKategoriPage";
import ProdukPage from "./pages/ProdukPage";
import KelolaProdukPage from "./pages/KelolaProdukPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import KeranjangPage from "./pages/KeranjangPage";
import TransaksiPage from "./pages/TransaksiPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { AlertCircle } from "lucide-react";
import {
  getStoredAuth,
  saveAuthData,
  clearAuthData,
  isTokenValid,
} from "./utils/auth";
import Footer from "./components/Footer";

function NotFound() {
  return (
    <div className="container py-5 text-center" id="not-found-container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
            <div className="card-body">
              <div className="p-3 bg-warning-subtle text-warning-emphasis rounded-circle d-inline-flex mb-3">
                <AlertCircle size={36} />
              </div>
              <h3 className="fw-bold text-dark mb-2">
                Halaman Tidak Ditemukan (404)
              </h3>
              <p className="text-muted mb-4 small">
                Rute URL yang Anda tuju tidak ditemukan di aplikasi ini.
              </p>
              <Link
                to="/"
                id="not-found-back-home"
                className="btn btn-primary px-4 py-2"
              >
                Kembali ke Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const auth = getStoredAuth();
    return auth.isValid ? auth.user : null;
  });
  const [token, setToken] = useState(() => {
    const auth = getStoredAuth();
    return auth.isValid ? auth.token : null;
  });

  // Periksa validitas token secara berkala
  useEffect(() => {
    const checkTokenValidity = () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        if (!isTokenValid(storedToken)) {
          console.warn("Sesi login telah berakhir karena token kedaluwarsa.");
          clearAuthData();
          setUser(null);
          setToken(null);
        }
      }
    };

    checkTokenValidity();
    const interval = setInterval(checkTokenValidity, 30000); // periksa setiap 30 detik
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (authData) => {
    // authData can be { token, user } or just user
    const receivedToken = authData?.token || localStorage.getItem("token");
    const receivedUser = authData?.user || authData;

    setUser(receivedUser);
    setToken(receivedToken);
    saveAuthData(receivedToken, receivedUser);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    clearAuthData();
  };

  return (
    <BrowserRouter>
      <div
        className="d-flex flex-column min-vh-100 bg-light"
        id="app-root-layout"
      >
        {/* Navbar Bootstrap */}
        <Navbar user={user} onLogout={handleLogout} />

        {/* Main Content Area */}
        <main className="flex-grow-1">
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage user={user} token={token} />} />
            <Route path="/kategori" element={<KategoriPage />} />
            <Route path="/categories" element={<KategoriPage />} />
            <Route path="/produk" element={<ProdukPage />} />
            <Route path="/products" element={<ProdukPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/keranjang" element={<KeranjangPage user={user} />} />
            <Route path="/cart" element={<KeranjangPage user={user} />} />
            <Route path="/checkout" element={<KeranjangPage user={user} />} />
            <Route
              path="/transaksi"
              element={<TransaksiPage user={user} token={token} />}
            />
            <Route
              path="/orders"
              element={<TransaksiPage user={user} token={token} />}
            />
            <Route
              path="/pesanan"
              element={<TransaksiPage user={user} token={token} />}
            />
            <Route
              path="/login"
              element={
                <LoginPage user={user} token={token} onLogin={handleLogin} />
              }
            />
            <Route path="/register" element={<RegisterPage user={user} />} />

            {/* Khusus admin */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/kategori/kelola" element={<KelolaKategoriPage />} />
              <Route path="/kategori/crud" element={<KelolaKategoriPage />} />
              <Route
                path="/categories/manage"
                element={<KelolaKategoriPage />}
              />
              <Route path="/produk/kelola" element={<KelolaProdukPage />} />
              <Route path="/produk/crud" element={<KelolaProdukPage />} />
              <Route path="/products/manage" element={<KelolaProdukPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}
