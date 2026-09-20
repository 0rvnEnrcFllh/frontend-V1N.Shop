import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { hasRole } from "../utils/auth";
import {
  Package,
  Search,
  Filter,
  Star,
  ShoppingCart,
  ArrowUpDown,
  Tag,
  Check,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Boxes,
  ShoppingBag,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  fetchProducts,
  fetchCategories,
  getAuthToken,
  getProductPhotoUrl,
  DEFAULT_PRODUCTS,
  DEFAULT_CATEGORIES,
} from "../utils/auth";
import { addToCart, getCartItems } from "../utils/cart";

export default function ProdukPage() {
  const isAdmin = hasRole("admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategoryParam = searchParams.get("kategori") || "all";

  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasToken, setHasToken] = useState(false);

  // Cart badge state
  const [cartCount, setCartCount] = useState(() =>
    getCartItems().reduce((acc, it) => acc + (Number(it.quantity) || 1), 0),
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({
    totalItems: DEFAULT_PRODUCTS.length,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [addedItem, setAddedItem] = useState(null);

  // Sync cart count with global events
  useEffect(() => {
    const handleCartUpdate = (e) => {
      const items = e.detail || getCartItems();
      const count = items.reduce(
        (acc, it) => acc + (Number(it.quantity) || 1),
        0,
      );
      setCartCount(count);
    };

    window.addEventListener("toko_cart_updated", handleCartUpdate);
    return () =>
      window.removeEventListener("toko_cart_updated", handleCartUpdate);
  }, []);

  // Load categories for filter tabs directly from database
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchCategories();
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn("Gagal memuat kategori:", err.message);
    }
  }, []);

  // Load products directly from database
  const loadProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      const token = getAuthToken();
      setHasToken(Boolean(token));

      try {
        // GET https://toko-online-backend-production-437f.up.railway.app/api/products?page=X&limit=10
        const res = await fetchProducts({
          page,
          limit: pageSize,
          token,
        });

        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setProducts(res.data);
          if (res.pagination) {
            setPaginationInfo(res.pagination);
            setCurrentPage(res.pagination.currentPage || page);
          } else {
            setPaginationInfo({
              totalItems: res.data.length,
              totalPages: Math.max(1, Math.ceil(res.data.length / pageSize)),
              currentPage: page,
              limit: pageSize,
            });
          }
        } else {
          setProducts(DEFAULT_PRODUCTS);
        }
      } catch (err) {
        console.warn(
          "Gagal memuat produk dari database, menggunakan data default:",
          err.message,
        );
        setError(
          err.message || "Gagal mengambil data produk dari database server.",
        );
        setProducts(DEFAULT_PRODUCTS);
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    loadCategories();
    loadProducts(1);
  }, [loadCategories, loadProducts]);

  const handleCategoryChange = (catId) => {
    if (catId === "all") {
      searchParams.delete("kategori");
    } else {
      searchParams.set("kategori", catId);
    }
    setSearchParams(searchParams);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedItem(product.name);
    setTimeout(() => {
      setAddedItem(null);
    }, 3500);
  };

  // Build category tabs dynamically from database categories
  const categoryTabs = useMemo(() => {
    const tabs = [{ id: "all", label: "Semua Produk" }];
    if (Array.isArray(categories) && categories.length > 0) {
      categories.forEach((c) => {
        tabs.push({
          id: c.slug || String(c.id),
          label: c.name,
        });
      });
    }
    return tabs;
  }, [categories]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        const itemCategorySlug = (
          item.category ||
          item.categoryRef?.slug ||
          ""
        ).toLowerCase();
        const itemCategoryName = (
          item.categoryName ||
          item.categoryRef?.name ||
          ""
        ).toLowerCase();
        const itemCategoryId = String(
          item.categoryId || item.categoryRef?.id || "",
        );
        const activeParam = activeCategoryParam.toLowerCase();

        const matchCategory =
          activeCategoryParam === "all" ||
          itemCategorySlug === activeParam ||
          itemCategoryName === activeParam ||
          itemCategoryName.includes(activeParam) ||
          itemCategoryId === activeParam;

        const matchSearch =
          (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          itemCategoryName.includes(searchTerm.toLowerCase());

        return matchCategory && matchSearch;
      })
      .sort((a, b) => {
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;
        const reviewsA = Number(a.reviews) || 0;
        const reviewsB = Number(b.reviews) || 0;

        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        if (sortBy === "rating-desc") return ratingB - ratingA;
        if (sortBy === "name-asc")
          return (a.name || "").localeCompare(b.name || "");
        return reviewsB - reviewsA; // default popular
      });
  }, [products, activeCategoryParam, searchTerm, sortBy]);

  const formatIDR = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  return (
    <div className="container py-4" id="produk-page-container">
      {/* Sub Menu Navigation Pills */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 mb-4 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="p-2 bg-info text-white rounded-3 d-inline-flex">
              <ShoppingBag size={22} />
            </span>
            <h1 className="h3 fw-bold text-dark mb-0">Katalog Produk</h1>
          </div>
          <p className="text-muted small mb-0">
            Jelajahi koleksi barang terbaik, filter berdasarkan kategori, atau
            kelola inventaris produk.
          </p>
        </div>

        {/* Sub-menu Tabs */}
        <div className="d-flex align-items-center gap-2">
          <div className="nav nav-pills bg-light p-1 rounded-3 border">
            {isAdmin && (
              <button
                type="button"
                className="nav-link active px-3 py-1.5 small fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
                id="submenu-katalog-active-btn"
              >
                <ShoppingBag size={16} />
                <span>Katalog Produk</span>
              </button>
            )}
            {isAdmin && (
              <Link
                to="/produk/kelola"
                className="nav-link px-3 py-1.5 text-secondary small fw-semibold d-inline-flex align-items-center gap-1.5 text-decoration-none"
                id="submenu-kelola-link"
              >
                <Boxes size={16} />
                <span>Kelola Produk (CRUD)</span>
              </Link>
            )}
          </div>

          {isAdmin && (
            <Link
              to="/produk/kelola"
              className="btn btn-info btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fw-semibold shadow-sm text-white text-decoration-none"
              id="btn-tambah-produk-shortcut"
            >
              <Plus size={15} />
              <span>Tambah Produk</span>
            </Link>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {addedItem && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1050 }}
        >
          <div
            className="toast show align-items-center bg-dark text-white border-0 shadow-lg rounded-3"
            role="alert"
          >
            <div className="d-flex align-items-center justify-content-between p-3 gap-3">
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <Check size={20} className="text-success flex-shrink-0" />
                <span className="small">
                  <strong>{addedItem}</strong> masuk keranjang!
                </span>
              </div>
              <Link
                to="/keranjang"
                className="btn btn-primary btn-sm px-2.5 py-1 text-nowrap d-inline-flex align-items-center gap-1 small fw-semibold flex-shrink-0 shadow-xs"
              >
                <span>Lihat Keranjang</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="card shadow-sm border-0 mb-4 bg-white rounded-3">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
            <div className="d-inline-flex align-items-center gap-2 badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill">
              <Package size={14} />
              <span className="fw-semibold">Katalog Produk Lengkap</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                id="btn-refresh-produk"
                onClick={() => loadProducts(currentPage)}
                disabled={loading}
                className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-1 px-3 py-1.5 rounded-pill"
                title="Muat Ulang Data Produk"
              >
                <RefreshCw
                  size={13}
                  className={loading ? "spin-animation" : ""}
                />
                <span>{loading ? "Memuat..." : "Refresh"}</span>
              </button>

              {cartCount > 0 && (
                <span className="badge bg-success text-white px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2">
                  <ShoppingCart size={14} />
                  <span>{cartCount} di Keranjang</span>
                </span>
              )}
            </div>
          </div>

          <h1 className="h2 fw-bold text-dark mb-3">
            Jelajahi Berbagai <span className="text-info">Produk Unggulan</span>
          </h1>

          <p className="text-muted lead fs-6 mb-4">
            Temukan barang berkualitas dengan harga terbaik, jaminan keaslian,
            dan pengiriman yang cepat.
          </p>

          {/* Alert Notice jika token belum ada */}
          {!hasToken && (
            <div className="alert alert-info d-flex align-items-center justify-content-between flex-wrap gap-2 py-2 px-3 mb-4 rounded-3 border-0 bg-info-subtle text-info-emphasis">
              <div className="d-flex align-items-center gap-2 small">
                <Lock size={16} />
                <span>
                  Masuk dengan akun Anda untuk mendapatkan harga khusus member
                  dan sinkronisasi pesanan.
                </span>
              </div>
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

          {/* Controls: Search & Sort */}
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-7">
              <div className="input-group shadow-xs">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  id="produk-search-input"
                  className="form-control border-start-0 ps-0"
                  placeholder="Cari produk berdasarkan nama atau deskripsi..."
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

            <div className="col-12 col-md-5">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small text-nowrap d-flex align-items-center gap-1">
                  <ArrowUpDown size={14} />
                  <span>Urutkan:</span>
                </span>
                <select
                  id="produk-sort-select"
                  className="form-select form-select-sm shadow-xs"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popular">Paling Populer</option>
                  <option value="rating-desc">Rating Tertinggi</option>
                  <option value="price-asc">
                    Harga: Terendah ke Tertinggi
                  </option>
                  <option value="price-desc">
                    Harga: Tertinggi ke Terendah
                  </option>
                  <option value="name-asc">Nama Produk (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div
        className="mb-4 d-flex flex-wrap gap-2 align-items-center"
        id="category-filter-pills"
      >
        <span className="text-muted small fw-semibold me-1 d-flex align-items-center gap-1">
          <Filter size={14} />
          <span>Filter:</span>
        </span>
        {categoryTabs.map((tab) => {
          const isActive = activeCategoryParam === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`filter-tab-${tab.id}`}
              onClick={() => handleCategoryChange(tab.id)}
              className={`btn btn-sm rounded-pill px-3 py-1 fw-medium transition-all ${
                isActive
                  ? "btn-dark shadow-sm"
                  : "btn-outline-secondary bg-white text-secondary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="row g-4" id="produk-loading">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm rounded-3 bg-white overflow-hidden">
                <div className="placeholder-glow">
                  {/* Photo skeleton */}
                  <div
                    className="placeholder w-100 bg-secondary-subtle"
                    style={{ height: "210px" }}
                  ></div>
                  <div className="p-4">
                    <div className="d-flex justify-content-between mb-3">
                      <span className="placeholder col-4 py-2 rounded-pill"></span>
                      <span className="placeholder col-3 py-2 rounded-pill"></span>
                    </div>
                    <span className="placeholder col-8 py-3 mb-2 d-block"></span>
                    <span className="placeholder col-6 py-2 mb-3 d-block"></span>
                    <span className="placeholder col-12 py-1 mb-1 d-block"></span>
                    <span className="placeholder col-10 py-1 mb-4 d-block"></span>
                    <span className="placeholder col-5 py-3 mb-3 d-block"></span>
                    <span className="placeholder col-12 py-3 rounded-2 d-block"></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Products Grid */
        <div className="row g-4" id="produk-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((prod) => {
              const categoryLabel =
                prod.categoryName ||
                prod.categoryRef?.name ||
                (prod.category ? prod.category.toUpperCase() : "Umum");
              const tagLabel =
                prod.tag ||
                (prod.rating >= 4.8
                  ? "Trending"
                  : prod.stock < 10
                    ? "Stok Terbatas"
                    : null);
              const photoUrl = getProductPhotoUrl(prod);

              return (
                <div key={prod.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-sm custom-card-hover rounded-3 bg-white d-flex flex-column overflow-hidden">
                    {/* Product Photo Header */}
                    <div
                      className="position-relative bg-light overflow-hidden"
                      style={{ height: "220px" }}
                    >
                      <img
                        src={photoUrl}
                        alt={prod.name || "Foto Produk"}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-100 h-100 object-fit-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
                        }}
                      />

                      {/* Overlay Category Pill */}
                      <div className="position-absolute top-0 start-0 m-3">
                        <span className="badge bg-white text-dark shadow-sm border border-light-subtle text-capitalize fw-semibold px-2.5 py-1.5 rounded-pill small d-inline-flex align-items-center gap-1">
                          <span
                            className="p-1 rounded-circle bg-info d-inline-block"
                            style={{ width: "6px", height: "6px" }}
                          ></span>
                          <span>{categoryLabel}</span>
                        </span>
                      </div>

                      {/* Overlay Tag Pill */}
                      {tagLabel && (
                        <div className="position-absolute top-0 end-0 m-3">
                          <span className="badge bg-warning text-dark shadow-sm fw-bold px-2.5 py-1.5 rounded-pill small d-inline-flex align-items-center gap-1">
                            <Tag size={11} />
                            <span>{tagLabel}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="card-body p-4 flex-grow-1 d-flex flex-column">
                      {/* Title */}
                      <h5 className="card-title fw-bold text-dark mb-2">
                        {prod.name}
                      </h5>

                      {/* Rating & Reviews */}
                      <div className="d-flex align-items-center gap-2 mb-3 small">
                        <div className="d-flex align-items-center text-warning">
                          <Star
                            size={14}
                            className="fill-warning"
                            fill="currentColor"
                          />
                          <span className="fw-bold text-dark ms-1">
                            {prod.rating || 4.5}
                          </span>
                        </div>
                        <span className="text-muted">
                          ({prod.reviews || 0} ulasan)
                        </span>
                        <span className="text-muted">•</span>
                        <span className="text-success small fw-medium">
                          Stok: {prod.stock ?? 0}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="card-text text-muted small mb-3 flex-grow-1">
                        {prod.description ||
                          "Deskripsi produk kualitas premium dengan performa dan daya tahan terbaik."}
                      </p>

                      {/* Price */}
                      <div className="mt-auto pt-2">
                        <div className="text-muted small">Harga Terbaik</div>
                        <div className="h4 fw-bold text-mutted mb-0">
                          {formatIDR(prod.price)}
                        </div>
                      </div>
                    </div>

                    {/* Action footer */}
                    <div className="card-footer bg-transparent border-top-0 p-4 pt-0">
                      <button
                        type="button"
                        id={`btn-beli-${prod.id}`}
                        onClick={() => handleAddToCart(prod)}
                        className="btn btn-dark btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                      >
                        <ShoppingCart size={16} />
                        <span>+ Tambah ke Keranjang</span>
                      </button>
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
                <h5 className="fw-bold text-dark">
                  Tidak Ada Produk yang Cocok
                </h5>
                <p className="text-muted small mb-3">
                  Coba ubah kata kunci pencarian atau pilih filter kategori
                  lainnya.
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      handleCategoryChange("all");
                    }}
                    className="btn btn-primary btn-sm px-3 d-inline-flex align-items-center gap-1"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Semua Filter</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls (jika total halaman > 1) */}
      {!loading && paginationInfo.totalPages > 1 && (
        <div
          className="d-flex justify-content-center align-items-center gap-2 mt-5"
          id="produk-pagination"
        >
          <button
            type="button"
            className="btn btn-outline-primary btn-sm px-3 d-inline-flex align-items-center gap-1"
            disabled={currentPage <= 1}
            onClick={() => loadProducts(currentPage - 1)}
          >
            <ChevronLeft size={14} />
            <span>Sebelumnya</span>
          </button>

          <span className="small text-muted px-2">
            Halaman {currentPage} dari {paginationInfo.totalPages}
          </span>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm px-3 d-inline-flex align-items-center gap-1"
            disabled={currentPage >= paginationInfo.totalPages}
            onClick={() => loadProducts(currentPage + 1)}
          >
            <span>Selanjutnya</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
