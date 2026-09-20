import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Grid,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Lock,
  Tag,
  FolderPlus,
  Terminal,
  Code2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Layers,
  Database,
} from "lucide-react";
import {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAuthToken,
  getStoredAuth,
  DEFAULT_CATEGORIES,
  CATEGORIES_API_URL,
} from "../utils/auth";

export default function KelolaKategoriPage() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // View mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState("table");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected Category
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRawResponse, setDetailRawResponse] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  // API Tester state
  const [apiTab, setApiTab] = useState("list"); // 'list' | 'api-docs'
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);

  // Helper to generate slug
  const generateSlug = (text) => {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Load Categories from Database
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = getAuthToken();
    const storedAuth = getStoredAuth();
    setHasToken(Boolean(token));
    setCurrentUser(storedAuth.isValid ? storedAuth.user : null);

    try {
      // Calls GET /api/categories (cc.getCategories)
      const res = await fetchCategories(token);
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.warn("Gagal memuat kategori:", err.message);
      setError(err.message || "Gagal memuat daftar kategori dari database.");
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle URL params e.g. ?action=create
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      handleOpenCreateModal();
    }
  }, [searchParams]);

  // Flash message auto dismiss
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const nameMatch = (cat.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const slugMatch = (cat.slug || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const descMatch = (cat.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const idMatch = String(cat.id || "").includes(searchTerm);
      return nameMatch || slugMatch || descMatch || idMatch;
    });
  }, [categories, searchTerm]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
    });
    setAutoSlug(true);
    setFormError("");
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat) => {
    setSelectedCategory(cat);
    setFormData({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
    });
    setAutoSlug(false);
    setFormError("");
    setIsEditModalOpen(true);
  };

  // Open Detail Modal (Calls GET /:id -> cc.getCategoryById)
  const handleOpenDetailModal = async (cat) => {
    setSelectedCategory(cat);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailRawResponse(null);

    const token = getAuthToken();
    try {
      const res = await fetchCategoryById(cat.id, token);
      setDetailRawResponse(res);
      if (res.data) {
        setSelectedCategory(res.data);
      }
    } catch (err) {
      console.warn("Gagal memuat detail kategori:", err.message);
      setDetailRawResponse({
        error: err.message,
        fallbackData: cat,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (cat) => {
    setSelectedCategory(cat);
    setIsDeleteModalOpen(true);
  };

  // Handle Form Change with Slug Auto-Gen
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "name" && autoSlug) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // CREATE (POST /api/categories -> cc.createCategory)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Nama kategori wajib diisi.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");
    const token = getAuthToken();

    try {
      const res = await createCategory(
        {
          name: formData.name.trim(),
          slug: formData.slug.trim() || generateSlug(formData.name),
          description: formData.description.trim(),
        },
        token,
      );

      setActionSuccess(
        `Kategori "${formData.name}" berhasil dibuat (POST /api/categories).`,
      );
      setIsCreateModalOpen(false);

      // Update local state smoothly
      const newCategory = res.data || {
        id: Date.now(),
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        description: formData.description.trim(),
      };
      setCategories((prev) => [newCategory, ...prev]);

      // Re-fetch to ensure sync with server
      loadCategories();
    } catch (err) {
      console.error("Error create category:", err);
      setFormError(
        err.message || "Gagal menambahkan kategori baru ke database.",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // UPDATE (PUT /api/categories/:id -> cc.updateCategory)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return;
    if (!formData.name.trim()) {
      setFormError("Nama kategori tidak boleh kosong.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");
    const token = getAuthToken();

    try {
      const res = await updateCategory(
        selectedCategory.id,
        {
          name: formData.name.trim(),
          slug: formData.slug.trim() || generateSlug(formData.name),
          description: formData.description.trim(),
        },
        token,
      );

      setActionSuccess(
        res.message ||
          `Kategori #${selectedCategory.id} "${formData.name}" berhasil diperbarui (PUT /api/categories/${selectedCategory.id}).`,
      );
      setIsEditModalOpen(false);

      // Update local state
      setCategories((prev) =>
        prev.map((item) =>
          item.id === selectedCategory.id
            ? {
                ...item,
                ...formData,
                slug: formData.slug || generateSlug(formData.name),
              }
            : item,
        ),
      );

      // Re-fetch for backend sync
      loadCategories();
    } catch (err) {
      console.error("Error update category:", err);
      setFormError(err.message || "Gagal memperbarui kategori di database.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // DELETE (DELETE /api/categories/:id -> cc.deleteCategory)
  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    setFormSubmitting(true);
    const token = getAuthToken();

    try {
      await deleteCategory(selectedCategory.id, token);
      setActionSuccess(
        `Kategori #${selectedCategory.id} "${selectedCategory.name}" berhasil dihapus dari database.`,
      );
      setIsDeleteModalOpen(false);

      // Remove from state
      setCategories((prev) =>
        prev.filter((item) => item.id !== selectedCategory.id),
      );
      setSelectedCategory(null);
    } catch (err) {
      console.error("Error delete category:", err);
      setError(err.message || "Gagal menghapus kategori dari database.");
      setIsDeleteModalOpen(false);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Test API endpoint live
  const handleTestApi = async (routeType) => {
    setApiTestLoading(true);
    setApiTestResult(null);

    const token = getAuthToken();
    const startTime = performance.now();

    try {
      let resultData;
      let endpointUrl = CATEGORIES_API_URL;
      let method = "GET";
      let payloadSent = null;

      if (routeType === "GET_ALL") {
        method = "GET";
        endpointUrl = `${CATEGORIES_API_URL}`;
        resultData = await fetchCategories(token);
      } else if (routeType === "GET_BY_ID") {
        method = "GET";
        const targetId = categories[0]?.id || 1;
        endpointUrl = `${CATEGORIES_API_URL}/${targetId}`;
        resultData = await fetchCategoryById(targetId, token);
      } else if (routeType === "POST") {
        method = "POST";
        endpointUrl = `${CATEGORIES_API_URL}`;
        payloadSent = {
          name: `Kategori Uji ${Math.floor(Math.random() * 900 + 100)}`,
          slug: `uji-${Date.now()}`,
          description: "Kategori testing otomatis via Endpoint Inspector",
        };
        resultData = await createCategory(payloadSent, token);
        loadCategories();
      } else if (routeType === "PUT") {
        const targetId = categories[0]?.id || 1;
        method = "PUT";
        endpointUrl = `${CATEGORIES_API_URL}/${targetId}`;
        payloadSent = {
          name: `${categories[0]?.name || "Elektronik"} (Updated)`,
          slug: categories[0]?.slug || "elektronik",
          description: "Pembaruan data via Live Inspector Test",
        };
        resultData = await updateCategory(targetId, payloadSent, token);
        loadCategories();
      }

      const endTime = performance.now();
      setApiTestResult({
        success: true,
        method,
        endpointUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization: token
            ? `Bearer ${token.substring(0, 15)}...`
            : "(none)",
        },
        payloadSent,
        latencyMs: Math.round(endTime - startTime),
        response: resultData,
      });
    } catch (err) {
      const endTime = performance.now();
      setApiTestResult({
        success: false,
        error: err.message,
        latencyMs: Math.round(endTime - startTime),
      });
    } finally {
      setApiTestLoading(false);
    }
  };

  return (
    <div className="container py-4 py-md-5" id="kelola-kategori-container">
      {/* Top Breadcrumb & Actions */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 small">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none text-muted">
                Home
              </Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/kategori" className="text-decoration-none text-muted">
                Kategori
              </Link>
            </li>
            <li
              className="breadcrumb-item active text-primary fw-semibold"
              aria-current="page"
            >
              Kelola Kategori (CRUD)
            </li>
          </ol>
        </nav>

        <div className="d-flex align-items-center gap-2">
          <Link
            to="/kategori"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3"
          >
            <Grid size={15} />
            <span>Lihat Katalog</span>
          </Link>

          <button
            type="button"
            id="btn-tambah-kategori-top"
            onClick={handleOpenCreateModal}
            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3.5 py-1.5 rounded-3 shadow-xs fw-semibold"
          >
            <Plus size={16} />
            <span>Tambah Kategori</span>
          </button>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 bg-white mb-4 overflow-hidden">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div className="d-inline-flex align-items-center gap-2 badge bg-info-subtle text-info border border-primary-subtle px-3 py-2 rounded-pill">
              <Layers size={15} />
              <span className="fw-semibold">
                Submenu Kategori & Database CRUD
              </span>
            </div>

            {/* Authentication & Security Badge */}
            <div className="d-flex align-items-center gap-2">
              {hasToken ? (
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>
                    {currentUser?.email
                      ? `${currentUser.email} (Authenticated)`
                      : "Authenticated: Bearer Token Active"}
                  </span>
                </span>
              ) : (
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5">
                  <Lock size={14} />
                  <span>Mode Publik (Login Diperlukan untuk Save Backend)</span>
                </span>
              )}
            </div>
          </div>

          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h1 className="h2 fw-bold text-dark mb-2">
                Kelola <span className="text-info">Kategori</span> V1N.Shop
              </h1>
              {/* <p className="text-muted lead fs-6 mb-3">
                Manajemen inventaris kategori dengan implementasi lengkap REST
                API backend:
                <code className="mx-1 px-1.5 py-0.5 bg-light rounded text-dark small">
                  GET /
                </code>
                ,
                <code className="mx-1 px-1.5 py-0.5 bg-light rounded text-dark small">
                  GET /:id
                </code>
                ,
                <code className="mx-1 px-1.5 py-0.5 bg-light rounded text-dark small">
                  POST /
                </code>
                ,
                <code className="mx-1 px-1.5 py-0.5 bg-light rounded text-dark small">
                  PUT /:id
                </code>
                , dan
                <code className="mx-1 px-1.5 py-0.5 bg-light rounded text-dark small">
                  DELETE /:id
                </code>{" "}
                yang diproteksi middleware autentikasi.
              </p> */}

              <div className="d-flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  id="btn-tambah-kategori-hero"
                  onClick={handleOpenCreateModal}
                  className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 py-2 rounded-3 shadow-xs fw-semibold"
                >
                  <FolderPlus size={17} />
                  <span>Buat Kategori Baru</span>
                </button>

                <button
                  type="button"
                  id="btn-refresh-kategori"
                  onClick={loadCategories}
                  disabled={loading}
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3.5 py-2 rounded-3"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "spin-animation" : ""}
                  />
                  <span>
                    {loading ? "Menyinkronkan..." : "Refresh Database"}
                  </span>
                </button>

                {/* <button
                  type="button"
                  onClick={() =>
                    setApiTab(apiTab === "list" ? "api-docs" : "list")
                  }
                  className={`btn ${apiTab === "api-docs" ? "btn-dark" : "btn-outline-dark"} d-inline-flex align-items-center gap-2 px-3.5 py-2 rounded-3`}
                >
                  <Terminal size={15} />
                  <span>
                    {apiTab === "api-docs"
                      ? "Tutup API Inspector"
                      : "API Route Inspector"}
                  </span>
                </button> */}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="bg-light p-3.5 rounded-3 border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span
                    className="small text-muted fw-semibold text-uppercase"
                    style={{ fontSize: "11px" }}
                  >
                    Ringkasan Kategori
                  </span>
                  <Database size={15} className="text-primary" />
                </div>
                <div className="d-flex align-items-baseline gap-2 mb-2">
                  <span className="display-6 fw-bold text-dark">
                    {categories.length}
                  </span>
                  <span className="text-muted small">Kategori Terdaftar</span>
                </div>
                <div className="small text-muted border-top pt-2 mt-2 d-flex justify-content-between">
                  <span>Status Koneksi:</span>
                  <span className="text-success fw-medium d-flex align-items-center gap-1">
                    <span className="p-1 bg-success rounded-circle d-inline-block"></span>{" "}
                    Terhubung
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {actionSuccess && (
        <div className="alert alert-success d-flex align-items-center justify-content-between py-3 px-4 rounded-3 border-0 bg-success-subtle text-success-emphasis mb-4 shadow-xs">
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={19} className="flex-shrink-0 text-success" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            className="btn-close shadow-none"
            onClick={() => setActionSuccess("")}
            aria-label="Tutup"
          ></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between py-3 px-4 rounded-3 border-0 bg-danger-subtle text-danger-emphasis mb-4">
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={19} className="flex-shrink-0 text-danger" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn-close shadow-none"
            onClick={() => setError("")}
            aria-label="Tutup"
          ></button>
        </div>
      )}

      {!hasToken && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between flex-wrap gap-2 py-3 px-4 rounded-3 border-0 bg-warning-subtle text-warning-emphasis mb-4">
          <div className="d-flex align-items-center gap-2">
            <Lock size={18} />
            <div>
              <strong>Autentikasi Diperlukan:</strong> Backend route kategori
              menggunakan <code>router.use(authenticate)</code>. Silakan login
              untuk menyimpan data secara permanen ke server database.
            </div>
          </div>
          <Link
            to="/login"
            className="btn btn-sm btn-warning text-dark fw-semibold px-3.5 py-1.5 rounded-3"
          >
            Login Sekarang
          </Link>
        </div>
      )}

      {/* API ROUTE INSPECTOR TAB */}
      {apiTab === "api-docs" && (
        <div className="card border-0 shadow-sm rounded-4 bg-white mb-4 overflow-hidden">
          <div className="card-header bg-dark text-white p-3.5 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Code2 size={18} className="text-warning" />
              <span className="fw-semibold">
                Backend Route Specification & Live Endpoint Tester
              </span>
            </div>
            <button
              type="button"
              onClick={() => setApiTab("list")}
              className="btn btn-outline-light btn-sm px-2.5 py-0.5 rounded-2 small"
            >
              Tutup Inspector
            </button>
          </div>

          <div className="card-body p-4">
            <div className="mb-3">
              <span className="badge bg-secondary-subtle text-secondary border px-2.5 py-1 rounded-2 mb-2 font-monospace small">
                Route Structure (Express.js)
              </span>
              <pre className="bg-dark text-success p-3 rounded-3 font-monospace small mb-0">
                {`router.use(authenticate);

router.get('/', cc.getCategories);
router.get('/:id', cc.getCategoryById);
router.post('/', cc.createCategory);
router.put('/:id', cc.updateCategory);
router.delete('/:id', cc.deleteCategory);

module.exports = router;`}
              </pre>
            </div>

            <h6 className="fw-bold text-dark mt-4 mb-3">
              Live Endpoint Interactive Tester:
            </h6>
            <div className="d-flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                id="test-btn-get-all"
                onClick={() => handleTestApi("GET_ALL")}
                disabled={apiTestLoading}
                className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3"
              >
                <span className="badge bg-primary text-white">GET</span>
                <span>/api/categories</span>
              </button>

              <button
                type="button"
                id="test-btn-get-by-id"
                onClick={() => handleTestApi("GET_BY_ID")}
                disabled={apiTestLoading}
                className="btn btn-outline-info btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3"
              >
                <span className="badge bg-info text-dark">GET</span>
                <span>/api/categories/:id</span>
              </button>

              <button
                type="button"
                id="test-btn-post"
                onClick={() => handleTestApi("POST")}
                disabled={apiTestLoading}
                className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3"
              >
                <span className="badge bg-success text-white">POST</span>
                <span>/api/categories</span>
              </button>

              <button
                type="button"
                id="test-btn-put"
                onClick={() => handleTestApi("PUT")}
                disabled={apiTestLoading}
                className="btn btn-outline-warning btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3"
              >
                <span className="badge bg-warning text-dark">PUT</span>
                <span>/api/categories/:id</span>
              </button>
            </div>

            {/* Test Output Box */}
            {apiTestLoading && (
              <div className="p-3 bg-light rounded-3 text-muted small d-flex align-items-center gap-2">
                <RefreshCw size={15} className="spin-animation text-primary" />
                <span>Mengirim HTTP request ke server backend Railway...</span>
              </div>
            )}

            {apiTestResult && !apiTestLoading && (
              <div className="border rounded-3 p-3 bg-light">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge ${apiTestResult.success ? "bg-success" : "bg-danger"}`}
                    >
                      {apiTestResult.success ? "200 OK / Success" : "Error"}
                    </span>
                    <span className="font-monospace small fw-bold text-dark">
                      {apiTestResult.method}
                    </span>
                    <span className="font-monospace small text-muted">
                      {apiTestResult.endpointUrl}
                    </span>
                  </div>
                  <span className="badge bg-dark-subtle text-dark font-monospace small">
                    {apiTestResult.latencyMs} ms
                  </span>
                </div>

                <div
                  className="bg-dark text-white p-3 rounded-2 overflow-auto"
                  style={{ maxHeight: "250px" }}
                >
                  <pre className="mb-0 text-success small font-monospace">
                    {JSON.stringify(apiTestResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Table / Grid Container */}
      <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
        {/* Controls Toolbar */}
        <div className="card-header bg-white border-bottom p-3.5">
          <div className="row g-3 align-items-center justify-content-between">
            <div className="col-md-6 col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  id="search-kategori-input"
                  className="form-control bg-light border-start-0 ps-0 shadow-none"
                  placeholder="Cari kategori (nama, slug, ID, atau deskripsi)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="btn btn-light border-start-0 text-muted"
                    onClick={() => setSearchTerm("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-6 col-lg-7 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
              <div
                className="btn-group shadow-none"
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === "table" ? "btn-info" : "btn-outline-secondary"}`}
                  onClick={() => setViewMode("table")}
                  title="Tampilan Tabel"
                >
                  Tabel Data
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === "grid" ? "btn-info" : "btn-outline-secondary"}`}
                  onClick={() => setViewMode("grid")}
                  title="Tampilan Kartu Grid"
                >
                  Kartu Grid
                </button>
              </div>

              <button
                type="button"
                id="btn-tambah-kategori-table"
                onClick={handleOpenCreateModal}
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1 px-3 py-1.5 rounded-3 fw-semibold shadow-xs"
              >
                <Plus size={15} />
                <span>Tambah Kategori</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-primary mb-3"
                role="status"
              ></div>
              <p className="text-muted small">
                Memuat data kategori dari database...
              </p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div className="p-3 bg-light text-muted rounded-circle d-inline-flex mb-3">
                <Tag size={32} />
              </div>
              <h5 className="fw-bold text-dark">Kategori Tidak Ditemukan</h5>
              <p className="text-muted small mb-3">
                {searchTerm
                  ? `Tidak ada kategori yang cocok dengan kata kunci "${searchTerm}".`
                  : "Belum ada data kategori yang tersimpan di database."}
              </p>
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="btn btn-outline-secondary btn-sm px-3"
                >
                  Reset Pencarian
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="btn btn-primary btn-sm px-3"
                >
                  Buat Kategori Pertama
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <div className="table-responsive">
              <table
                className="table table-hover align-middle mb-0"
                id="kategori-crud-table"
              >
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th style={{ width: "70px" }} className="ps-4">
                      ID
                    </th>
                    <th>Nama Kategori</th>
                    <th>Slug URL</th>
                    <th>Deskripsi</th>
                    <th style={{ width: "130px" }} className="text-center">
                      Aksi (CRUD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat, index) => (
                    <tr key={cat.id || index}>
                      <td className="ps-4 fw-semibold text-muted">#{cat.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-2 bg-primary-subtle text-primary rounded-2 d-inline-flex">
                            <Tag size={16} />
                          </div>
                          <div>
                            <span className="fw-bold text-dark d-block">
                              {cat.name}
                            </span>
                            {/* <span
                              className="text-muted small"
                              style={{ fontSize: "11px" }}
                            >
                              Endpoint: <code>/api/categories/{cat.id}</code>
                            </span> */}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-monospace px-2.5 py-1 rounded-2">
                          {cat.slug || generateSlug(cat.name)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="text-muted small text-truncate d-inline-block"
                          style={{ maxWidth: "300px" }}
                        >
                          {cat.description || "Tidak ada deskripsi."}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          {/* Detail Button (GET /:id) */}
                          <button
                            type="button"
                            className="btn btn-light btn-sm p-1.5 text-secondary rounded-2"
                            onClick={() => handleOpenDetailModal(cat)}
                            title="Lihat Detail (GET /:id)"
                            id={`btn-detail-${cat.id}`}
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Button (PUT /:id) */}
                          <button
                            type="button"
                            className="btn btn-light btn-sm p-1.5 text-primary rounded-2"
                            onClick={() => handleOpenEditModal(cat)}
                            title="Edit Kategori (PUT /:id)"
                            id={`btn-edit-${cat.id}`}
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete Button (DELETE /:id) */}
                          <button
                            type="button"
                            className="btn btn-light btn-sm p-1.5 text-danger rounded-2"
                            onClick={() => handleOpenDeleteModal(cat)}
                            title="Hapus Kategori (DELETE /:id)"
                            id={`btn-delete-${cat.id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View Mode */
            <div className="p-4">
              <div className="row g-3">
                {filteredCategories.map((cat, index) => (
                  <div className="col-sm-6 col-lg-4" key={cat.id || index}>
                    <div className="card h-100 border rounded-3 p-3.5 bg-white shadow-none hover-shadow transition-all">
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="p-2.5 bg-primary-subtle text-primary rounded-3">
                          <Tag size={20} />
                        </div>
                        <span className="badge bg-light text-muted border font-monospace small">
                          ID: #{cat.id}
                        </span>
                      </div>

                      <h5 className="fw-bold text-dark mb-1">{cat.name}</h5>
                      <div className="mb-2">
                        <code className="badge bg-light text-primary border font-monospace small">
                          slug: {cat.slug || generateSlug(cat.name)}
                        </code>
                      </div>

                      <p className="text-muted small flex-grow-1 mb-3">
                        {cat.description ||
                          "Tidak ada deskripsi yang disertakan untuk kategori ini."}
                      </p>

                      <div className="border-top pt-2.5 d-flex align-items-center justify-content-between">
                        <Link
                          to={`/produk?kategori=${encodeURIComponent(cat.slug || cat.name)}`}
                          className="btn btn-link btn-sm p-0 text-decoration-none small text-primary d-inline-flex align-items-center gap-1"
                        >
                          <span>Katalog Produk</span>
                          <ArrowRight size={12} />
                        </Link>

                        <div className="d-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-light btn-sm p-1 text-secondary rounded"
                            onClick={() => handleOpenDetailModal(cat)}
                            title="Lihat Detail (GET /:id)"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-light btn-sm p-1 text-primary rounded"
                            onClick={() => handleOpenEditModal(cat)}
                            title="Edit (PUT /:id)"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-light btn-sm p-1 text-danger rounded"
                            onClick={() => handleOpenDeleteModal(cat)}
                            title="Hapus (DELETE /:id)"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="card-footer bg-white border-top p-3 text-muted small d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>
            Menampilkan {filteredCategories.length} dari total{" "}
            {categories.length} kategori
          </span>
          <span>
            Route: <code>router.use(authenticate)</code> — Protected CRUD
          </span>
        </div>
      </div>

      {/* CREATE MODAL (POST /api/categories -> cc.createCategory) */}
      {isCreateModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white p-3.5">
                <div className="d-flex align-items-center gap-2">
                  <FolderPlus size={20} />
                  <h5 className="modal-title fw-bold fs-6 mb-0">
                    Tambah Kategori Baru (POST /)
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white shadow-none"
                  onClick={() => setIsCreateModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Nama Kategori <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="input-create-category-name"
                      className="form-control rounded-3"
                      placeholder="Contoh: Perlengkapan Olahraga"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-semibold text-dark mb-0">
                        Slug URL <span className="text-danger">*</span>
                      </label>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="autoSlugSwitch"
                          checked={autoSlug}
                          onChange={(e) => setAutoSlug(e.target.checked)}
                        />
                        <label
                          className="form-check-label small text-muted"
                          htmlFor="autoSlugSwitch"
                          style={{ fontSize: "11px" }}
                        >
                          Auto Slug
                        </label>
                      </div>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted small font-monospace">
                        /
                      </span>
                      <input
                        type="text"
                        name="slug"
                        id="input-create-category-slug"
                        className="form-control rounded-end-3 font-monospace small"
                        placeholder="perlengkapan-olahraga"
                        value={formData.slug}
                        onChange={(e) => {
                          setAutoSlug(false);
                          handleFormChange(e);
                        }}
                        required
                      />
                    </div>
                    <div
                      className="form-text text-muted small"
                      style={{ fontSize: "11px" }}
                    >
                      Slug unik untuk parameter rute URL katalog produk.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Deskripsi Kategori
                    </label>
                    <textarea
                      name="description"
                      id="input-create-category-desc"
                      className="form-control rounded-3"
                      rows="3"
                      placeholder="Keterangan singkat mengenai produk dalam kategori ini..."
                      value={formData.description}
                      onChange={handleFormChange}
                    ></textarea>
                  </div>

                  <div className="p-2.5 bg-light rounded-3 border small text-muted">
                    <div className="fw-semibold text-dark mb-1">
                      Preview Payload (JSON):
                    </div>
                    <pre
                      className="mb-0 font-monospace small text-primary"
                      style={{ fontSize: "11px" }}
                    >
                      {JSON.stringify(
                        {
                          name: formData.name || "(kosong)",
                          slug:
                            formData.slug ||
                            generateSlug(formData.name) ||
                            "(kosong)",
                          description: formData.description || "",
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3.5 py-1.5 rounded-3"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={formSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-create-category"
                    className="btn btn-primary btn-sm px-4 py-1.5 rounded-3 fw-semibold d-inline-flex align-items-center gap-1.5"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <RefreshCw size={14} className="spin-animation" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Simpan Kategori (POST)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (PUT /api/categories/:id -> cc.updateCategory) */}
      {isEditModalOpen && selectedCategory && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-warning text-dark p-3.5">
                <div className="d-flex align-items-center gap-2">
                  <Edit2 size={20} />
                  <h5 className="modal-title fw-bold fs-6 mb-0">
                    Edit Kategori #{selectedCategory.id} (PUT /:id)
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setIsEditModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleUpdateSubmit}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Nama Kategori <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="input-edit-category-name"
                      className="form-control rounded-3"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Slug URL <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted small font-monospace">
                        /
                      </span>
                      <input
                        type="text"
                        name="slug"
                        id="input-edit-category-slug"
                        className="form-control rounded-end-3 font-monospace small"
                        value={formData.slug}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Deskripsi Kategori
                    </label>
                    <textarea
                      name="description"
                      id="input-edit-category-desc"
                      className="form-control rounded-3"
                      rows="3"
                      value={formData.description}
                      onChange={handleFormChange}
                    ></textarea>
                  </div>

                  <div className="p-2.5 bg-light rounded-3 border small text-muted">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold text-dark">
                        HTTP Request:
                      </span>
                      <code className="text-warning-emphasis font-monospace small">
                        PUT /api/categories/{selectedCategory.id}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light p-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3.5 py-1.5 rounded-3"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={formSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-edit-category"
                    className="btn btn-warning btn-sm px-4 py-1.5 rounded-3 fw-semibold d-inline-flex align-items-center gap-1.5"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <RefreshCw size={14} className="spin-animation" />
                        <span>Memperbarui...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Simpan Perubahan (PUT)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (GET /api/categories/:id -> cc.getCategoryById) */}
      {isDetailModalOpen && selectedCategory && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            role="document"
          >
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white p-3.5">
                <div className="d-flex align-items-center gap-2">
                  <Eye size={20} className="text-info" />
                  <h5 className="modal-title fw-bold fs-6 mb-0">
                    Detail Kategori #{selectedCategory.id} (GET /:id)
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white shadow-none"
                  onClick={() => setIsDetailModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                {detailLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    <span className="text-muted small">
                      Memuat detail dari API backend...
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3 border h-100">
                          <span className="text-muted small d-block mb-1">
                            Nama Kategori
                          </span>
                          <h5 className="fw-bold text-dark mb-0">
                            {selectedCategory.name}
                          </h5>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3 border h-100">
                          <span className="text-muted small d-block mb-1">
                            Slug URL
                          </span>
                          <code className="text-primary fw-bold font-monospace fs-6">
                            /
                            {selectedCategory.slug ||
                              generateSlug(selectedCategory.name)}
                          </code>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="p-3 bg-light rounded-3 border">
                          <span className="text-muted small d-block mb-1">
                            Deskripsi
                          </span>
                          <p className="mb-0 text-dark small">
                            {selectedCategory.description ||
                              "Tidak ada deskripsi tambahan."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                      <Terminal size={16} className="text-primary" />
                      <span>
                        Raw API Response Payload (GET /api/categories/
                        {selectedCategory.id}):
                      </span>
                    </h6>
                    <div
                      className="bg-dark text-white p-3 rounded-3 overflow-auto"
                      style={{ maxHeight: "200px" }}
                    >
                      <pre className="mb-0 text-success small font-monospace">
                        {JSON.stringify(
                          detailRawResponse || selectedCategory,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light p-3 border-top d-flex justify-content-between">
                <Link
                  to={`/produk?kategori=${encodeURIComponent(selectedCategory.slug || selectedCategory.name)}`}
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3"
                >
                  <ExternalLink size={14} />
                  <span>Lihat Produk Terkait</span>
                </Link>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm d-inline-flex align-items-center gap-1 px-3"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditModal(selectedCategory);
                    }}
                  >
                    <Edit2 size={14} />
                    <span>Edit (PUT)</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm px-3"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (DELETE /api/categories/:id -> cc.deleteCategory) */}
      {isDeleteModalOpen && selectedCategory && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white p-3.5">
                <div className="d-flex align-items-center gap-2">
                  <Trash2 size={20} />
                  <h5 className="modal-title fw-bold fs-6 mb-0">
                    Konfirmasi Hapus Kategori (DELETE /:id)
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white shadow-none"
                  onClick={() => setIsDeleteModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <p className="text-dark mb-3">
                  Apakah Anda yakin ingin menghapus kategori berikut dari
                  database?
                </p>

                <div className="p-3 bg-danger-subtle text-danger-emphasis border border-danger-subtle rounded-3 mb-3">
                  <div className="fw-bold fs-6">{selectedCategory.name}</div>
                  <div className="small font-monospace">
                    ID: #{selectedCategory.id} | Slug: {selectedCategory.slug}
                  </div>
                </div>

                <div className="alert alert-warning py-2 px-3 small rounded-3 mb-0 d-flex align-items-center gap-2">
                  <AlertCircle
                    size={16}
                    className="flex-shrink-0 text-warning-emphasis"
                  />
                  <span>
                    Tindakan ini akan memanggil endpoint{" "}
                    <code>DELETE /api/categories/{selectedCategory.id}</code>.
                  </span>
                </div>
              </div>

              <div className="modal-footer bg-light p-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3.5 py-1.5 rounded-3"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-category"
                  className="btn btn-danger btn-sm px-4 py-1.5 rounded-3 fw-semibold d-inline-flex align-items-center gap-1.5"
                  onClick={handleDeleteConfirm}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw size={14} className="spin-animation" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>Hapus Permanen (DELETE)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
