import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { hasRole } from "../utils/auth";
import {
  Grid,
  Search,
  ArrowRight,
  Shirt,
  Home as HomeIcon,
  BookOpen,
  Coffee,
  Dumbbell,
  Laptop,
  Tag,
  Camera,
  Package,
  RefreshCw,
  AlertCircle,
  Lock,
  Sparkles,
  Layers,
} from "lucide-react";
import { fetchCategories, getAuthToken } from "../utils/auth";

const ICON_MAP = {
  Laptop,
  Tag,
  Camera,
  Shirt,
  Coffee,
  BookOpen,
  Book: BookOpen,
  Dumbbell,
  Home: HomeIcon,
  Grid,
  Package,
};

const DEFAULT_COLOR_CLASSES = [
  "bg-primary-subtle text-primary border-primary-subtle",
  "bg-info-subtle text-info-emphasis border-info-subtle",
  "bg-success-subtle text-success border-success-subtle",
  "bg-warning-subtle text-warning-emphasis border-warning-subtle",
  "bg-danger-subtle text-danger border-danger-subtle",
  "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle",
];

function getCategoryIconComponent(iconName) {
  if (!iconName) return Tag;
  if (typeof iconName === "function" || typeof iconName === "object")
    return iconName;
  if (typeof iconName === "string") {
    const found = ICON_MAP[iconName] || ICON_MAP[iconName.trim()];
    if (found) return found;
  }
  return Tag;
}

export default function KategoriPage() {
  const isAdmin = hasRole("admin");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasToken, setHasToken] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = getAuthToken();
    setHasToken(Boolean(token));

    try {
      // GET https://toko-online-backend-production-437f.up.railway.app/api/categories
      const res = await fetchCategories(token);
      if (res && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn("Gagal memuat kategori dari database:", err.message);
      setError(err.message || "Gagal memuat data kategori dari database.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = categories.filter((cat) => {
    const nameMatch = (cat.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const descMatch = (cat.description || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const slugMatch = (cat.slug || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return nameMatch || descMatch || slugMatch;
  });

  return (
    <div className="container py-5" id="kategori-page-container">
      {/* Header Banner */}
      <div className="card shadow-sm border-0 mb-4 bg-white rounded-3">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div className="d-inline-flex align-items-center gap-2 badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill">
              <Grid size={14} />
              <span className="fw-semibold">Katalog Kategori Database</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1">
                <Sparkles size={13} />
                <span>Live Database ({categories.length} Kategori)</span>
              </span>

              {isAdmin && (
                <Link
                  to="/kategori/kelola"
                  id="btn-link-kelola-kategori"
                  className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-xs fw-semibold"
                >
                  <Layers size={13} />
                  <span>Kelola Kategori (CRUD)</span>
                </Link>
              )}

              <button
                type="button"
                id="btn-refresh-kategori"
                onClick={loadCategories}
                disabled={loading}
                className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-1 px-3 py-1.5 rounded-pill"
                title="Muat Ulang Data Kategori"
              >
                <RefreshCw
                  size={13}
                  className={loading ? "spin-animation" : ""}
                />
                <span>{loading ? "Memuat..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          <h1 className="h2 fw-bold text-dark mb-3">
            Daftar <span className="text-info">Kategori</span> Produk
          </h1>

          <p className="text-muted lead fs-6 mb-4">
            Jelajahi berbagai pilihan kategori produk yang tersedia untuk
            menemukan barang sesuai kebutuhan Anda dengan mudah.
          </p>

          {/* Alert Notice jika token belum ada atau error */}
          {!hasToken && (
            <div className="alert alert-info d-flex align-items-center justify-content-between flex-wrap gap-2 py-2 px-3 mb-4 rounded-3 border-0 bg-info-subtle text-info-emphasis">
              <div className="d-flex align-items-center gap-2 small">
                <Lock size={16} />
                <span>
                  Anda belum login. Login terlebih dahulu untuk sinkronisasi
                  kategori dengan hak akses penuh akun Anda.
                </span>
              </div>
              <Link to="/login" className="btn btn-sm btn-info text-white px-3">
                Login Sekarang
              </Link>
            </div>
          )}

          {error && (
            <div className="alert alert-warning d-flex align-items-center gap-2 py-2 px-3 mb-4 rounded-3 border-0 bg-warning-subtle text-warning-emphasis small">
              <AlertCircle size={16} className="flex-shrink-0" />
              <div className="flex-grow-1">
                <strong>Catatan API:</strong> {error}
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="input-group shadow-xs">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  id="kategori-search-input"
                  className="form-control border-start-0 ps-0"
                  placeholder="Cari nama kategori, deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSearchTerm("")}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton / Spinner */}
      {loading ? (
        <div className="row g-4" id="kategori-loading">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm rounded-3 bg-white p-4">
                <div className="placeholder-glow">
                  <div className="d-flex justify-content-between mb-3">
                    <span className="placeholder col-3 py-3 rounded-3"></span>
                    <span className="placeholder col-2 py-2 rounded-pill"></span>
                  </div>
                  <span className="placeholder col-8 py-2 mb-2 d-block"></span>
                  <span className="placeholder col-12 py-1 mb-1 d-block"></span>
                  <span className="placeholder col-6 py-1 mb-4 d-block"></span>
                  <span className="placeholder col-12 py-3 rounded-2 d-block"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid of Categories */
        <div className="row g-4" id="kategori-grid">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat, idx) => {
              const IconComponent = getCategoryIconComponent(cat.icon);
              const colorClass =
                cat.colorClass ||
                DEFAULT_COLOR_CLASSES[idx % DEFAULT_COLOR_CLASSES.length];
              const totalItems =
                cat.productCount ??
                cat.itemCount ??
                (cat.products ? cat.products.length : 0);

              return (
                <div
                  key={cat.id || cat.slug || idx}
                  className="col-md-6 col-lg-4"
                >
                  <div className="card h-100 border-0 shadow-sm custom-card-hover rounded-3 bg-white d-flex flex-column">
                    <div className="card-body p-4 flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div
                          className={`p-3 rounded-3 border d-inline-flex ${colorClass}`}
                        >
                          <IconComponent size={26} />
                        </div>
                        <span className="badge bg-light text-secondary border px-2 py-1">
                          {totalItems} Produk
                        </span>
                      </div>

                      <h5 className="card-title fw-bold text-dark mb-2">
                        {cat.name}
                      </h5>

                      <p className="card-text text-muted small mb-3">
                        {cat.description ||
                          "Koleksi produk berkualitas tinggi pilihan terbaik untuk kategori ini."}
                      </p>

                      {cat.popularItem && (
                        <div className="small text-secondary mb-3">
                          <span className="fw-semibold">Populer: </span>
                          <span className="text-muted">{cat.popularItem}</span>
                        </div>
                      )}

                      {/* Display sample products badge if available in API response */}
                      {Array.isArray(cat.products) &&
                        cat.products.length > 0 && (
                          <div className="mb-2">
                            <div className="text-muted small fw-semibold mb-1">
                              Contoh Produk:
                            </div>
                            <div className="d-flex flex-wrap gap-1">
                              {cat.products.slice(0, 2).map((p) => (
                                <span
                                  key={p.id || p.name}
                                  className="badge bg-light text-dark border small fw-normal"
                                >
                                  {p.name}
                                </span>
                              ))}
                              {cat.products.length > 2 && (
                                <span className="badge bg-light text-muted border small fw-normal">
                                  +{cat.products.length - 2} lainnya
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="card-footer bg-transparent border-top-0 p-4 pt-0">
                      <Link
                        to={`/produk?kategori=${cat.slug || cat.id}`}
                        id={`btn-kategori-${cat.id || cat.slug}`}
                        className="btn btn-outline-dark btn-sm w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                      >
                        <span>
                          Lihat Produk {(cat.name || "").split(" ")[0]}
                        </span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-12 text-center py-5">
              <div className="card border-0 bg-white shadow-sm p-5 rounded-3">
                <div className="p-3 bg-secondary-subtle text-secondary rounded-circle d-inline-flex mx-auto mb-3">
                  <Search size={32} />
                </div>
                <h5 className="fw-bold text-dark">Kategori Tidak Ditemukan</h5>
                <p className="text-muted small mb-3">
                  Tidak ada kategori yang cocok dengan kata kunci &quot;
                  {searchTerm}&quot;.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="btn btn-primary btn-sm px-3"
                  >
                    Tampilkan Semua Kategori
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
