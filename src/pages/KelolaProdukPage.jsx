import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Upload,
  UploadCloud,
  Camera,
  FileCheck,
} from "lucide-react";
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductPhotoUrl,
  getAuthToken,
  formatRupiah,
} from "../utils/auth";

const PRESET_PHOTOS = [
  {
    name: "Smartphone Flagship",
    url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80",
    category: "Elektronik",
  },
  {
    name: "Laptop Ultra Slim",
    url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&auto=format&fit=crop&q=80",
    category: "Elektronik",
  },
  {
    name: "Keyboard Mechanical RGB",
    url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80",
    category: "Elektronik",
  },
  {
    name: "Headphone Wireless Bass",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
    category: "Elektronik",
  },
  {
    name: "Kamera Mirrorless 4K",
    url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&auto=format&fit=crop&q=80",
    category: "Kamera & Fotografi",
  },
  {
    name: "Jaket Casual Denim",
    url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&auto=format&fit=crop&q=80",
    category: "Pakaian & Fashion",
  },
  {
    name: "Kopi Arabika Premium",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&auto=format&fit=crop&q=80",
    category: "Makanan & Minuman",
  },
  {
    name: "Buku Pemrograman Web",
    url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&auto=format&fit=crop&q=80",
    category: "Buku & Alat Tulis",
  },
];

const INITIAL_FORM = {
  name: "",
  categoryId: "1",
  price: "",
  stock: "",
  tag: "Baru",
  rating: 4.8,
  reviews: 5,
  photoUrl: "",
  description: "",
};

export default function KelolaProdukPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("id-desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Photo Upload States
  const [photoInputMode, setPhotoInputMode] = useState("upload"); // 'upload' | 'url'
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoFilePreview, setPhotoFilePreview] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [productToView, setProductToView] = useState(null);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (photoFilePreview && photoFilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoFilePreview);
      }
    };
  }, [photoFilePreview]);

  // Load Categories & Products from Database
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getAuthToken();
      const [prodRes, catRes] = await Promise.allSettled([
        fetchProducts({ page: 1, limit: 100, token }),
        fetchCategories(token),
      ]);

      if (
        prodRes.status === "fulfilled" &&
        prodRes.value &&
        Array.isArray(prodRes.value.data)
      ) {
        setProducts(prodRes.value.data);
      } else if (prodRes.status === "rejected") {
        setError(
          prodRes.reason?.message || "Gagal memuat produk dari database.",
        );
      }

      if (
        catRes.status === "fulfilled" &&
        catRes.value &&
        Array.isArray(catRes.value.data)
      ) {
        setCategories(catRes.value.data);
      } else if (catRes.status === "rejected") {
        setError((prev) =>
          prev ? `${prev} | ${catRes.reason?.message}` : catRes.reason?.message,
        );
      }
    } catch (err) {
      console.warn("Gagal memuat data dari database:", err);
      setError(err.message || "Gagal memuat data dari database server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Flash message timer
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle Photo File Selection & Validation
  const processSelectedFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError(
        "File yang dipilih harus berupa format gambar (JPG, PNG, WEBP, GIF).",
      );
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Ukuran file foto terlalu besar. Maksimal 5MB.");
      return;
    }

    setFormError("");
    if (photoFilePreview && photoFilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoFilePreview);
    }

    const preview = URL.createObjectURL(file);
    setSelectedPhotoFile(file);
    setPhotoFilePreview(preview);
    setFormData((prev) => ({ ...prev, photoUrl: "" }));
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDropFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleClearSelectedPhoto = () => {
    if (photoFilePreview && photoFilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoFilePreview);
    }
    setSelectedPhotoFile(null);
    setPhotoFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setCurrentEditId(null);
    setFormData(INITIAL_FORM);
    handleClearSelectedPhoto();
    setExistingPhotoUrl("");
    setPhotoInputMode("upload");
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product) => {
    setIsEditMode(true);
    setCurrentEditId(product.id);
    const existingPhoto =
      product.photo ||
      product.photoUrl ||
      product.photo_url ||
      product.image ||
      "";
    setExistingPhotoUrl(existingPhoto ? getProductPhotoUrl(product) : "");
    handleClearSelectedPhoto();
    setPhotoInputMode("upload");
    setFormData({
      name: product.name || "",
      categoryId: String(product.categoryId || product.categoryRef?.id || "1"),
      price: product.price ?? "",
      stock: product.stock ?? "",
      tag: product.tag || "Baru",
      rating: product.rating || 4.8,
      reviews: product.reviews || 0,
      photoUrl: product.photoUrl || "",
      description: product.description || "",
    });
    setFormError("");
    setIsFormModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetailModal = (product) => {
    setProductToView(product);
    setIsDetailModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name || !formData.name.trim()) {
      setFormError("Nama produk wajib diisi.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setFormError("Harga produk harus berupa angka lebih dari 0.");
      return;
    }

    if (formData.stock === "" || Number(formData.stock) < 0) {
      setFormError("Jumlah stok produk harus berupa angka 0 atau lebih.");
      return;
    }

    setFormSubmitting(true);

    try {
      const selectedCat =
        categories.find((c) => String(c.id) === String(formData.categoryId)) ||
        categories[0];
      const payload = {
        ...formData,
        categoryId: Number(formData.categoryId) || 1,
        categoryName: selectedCat ? selectedCat.name : "Elektronik & Gadget",
        price: Number(formData.price),
        stock: Number(formData.stock),
        rating: Number(formData.rating) || 4.8,
        reviews: Number(formData.reviews) || 0,
        photo: selectedPhotoFile || undefined, // File object for Multer upload.single('photo')
      };

      if (isEditMode && currentEditId) {
        const res = await updateProduct(currentEditId, payload);
        const updatedItem = res.data || { ...payload, id: currentEditId };
        setProducts((prev) =>
          prev.map((p) =>
            String(p.id) === String(currentEditId)
              ? { ...p, ...updatedItem }
              : p,
          ),
        );
        setSuccessMessage(
          res.message ||
            "Data produk dan foto berhasil diperbarui di database!",
        );
      } else {
        const res = await createProduct(payload);
        const newItem = res.data || payload;
        setProducts((prev) => [
          newItem,
          ...prev.filter((p) => String(p.id) !== String(newItem.id)),
        ]);
        setSuccessMessage(
          res.message ||
            "Produk dan foto baru berhasil ditambahkan ke database!",
        );
      }

      handleClearSelectedPhoto();
      setIsFormModalOpen(false);
      setFormData(INITIAL_FORM);
      // Synchronize in background with database
      loadData();
    } catch (err) {
      setFormError(
        err.message || "Terjadi kesalahan saat menyimpan produk ke database.",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deleteProduct(productToDelete.id);
      setProducts((prev) =>
        prev.filter((p) => String(p.id) !== String(productToDelete.id)),
      );
      setSuccessMessage(res.message || "Produk berhasil dihapus!");
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      // Synchronize in background
      loadData();
    } catch (err) {
      alert("Gagal menghapus produk: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search Logic
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      (prod.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (prod.tag || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      String(prod.categoryId) === String(selectedCategory) ||
      (prod.category || "").toLowerCase() === selectedCategory.toLowerCase() ||
      (prod.categoryName || "").toLowerCase() ===
        selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Sort Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
    if (sortBy === "name-asc")
      return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "name-desc")
      return (b.name || "").localeCompare(a.name || "");
    if (sortBy === "stock-asc") return (a.stock || 0) - (b.stock || 0);
    if (sortBy === "stock-desc") return (b.stock || 0) - (a.stock || 0);
    return (b.id || 0) - (a.id || 0);
  });

  // Pagination slice
  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / itemsPerPage),
  );
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Statistics calculation
  const totalStock = products.reduce(
    (acc, curr) => acc + (Number(curr.stock) || 0),
    0,
  );
  const totalInventoryValue = products.reduce(
    (acc, curr) => acc + (Number(curr.price) || 0) * (Number(curr.stock) || 0),
    0,
  );

  return (
    <div className="container py-4" id="kelola-produk-page">
      {/* Sub Menu Navigation Pills */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 mb-4 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="p-2 bg-info text-white rounded-3 d-inline-flex">
              <Boxes size={22} />
            </span>
            <h1 className="h3 fw-bold text-dark mb-0">Kelola Produk (CRUD)</h1>
          </div>
          <p className="text-muted small mb-0">
            Kelola data produk, tambah inventaris baru, edit harga/stok, atau
            hapus produk.
          </p>
        </div>

        {/* Sub-menu Tabs */}
        <div className="nav nav-pills bg-light p-1 rounded-3 border">
          <Link
            to="/produk"
            className="nav-link px-3 py-1.5 text-secondary small fw-semibold d-inline-flex align-items-center gap-1.5 text-decoration-none"
            id="submenu-katalog-link"
          >
            <ShoppingBag size={16} />
            <span>Katalog Produk</span>
          </Link>
          <button
            type="button"
            className="nav-link active px-3 py-1.5 small fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm"
            id="submenu-kelola-active-btn"
          >
            <Boxes size={16} />
            <span>Kelola Produk (CRUD)</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 shadow-sm rounded-3 mb-4"
          role="alert"
        >
          <CheckCircle2 size={18} className="text-success flex-shrink-0" />
          <span className="flex-grow-1 small fw-medium">{successMessage}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          className="alert alert-danger d-flex align-items-center gap-2 shadow-sm rounded-3 mb-4"
          role="alert"
        >
          <AlertCircle size={18} className="text-danger flex-shrink-0" />
          <span className="flex-grow-1 small">{error}</span>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={loadData}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="row g-3 mb-4" id="crud-stat-cards">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">
                  Total Produk
                </span>
                <h4 className="fw-bold text-dark mb-0">
                  {products.length} Items
                </h4>
              </div>
              <div className="p-2.5 bg-primary-subtle text-primary rounded-3">
                <Package size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">
                  Total Stok Inventaris
                </span>
                <h4 className="fw-bold text-dark mb-0">{totalStock} Unit</h4>
              </div>
              <div className="p-2.5 bg-warning-subtle text-warning rounded-3">
                <Boxes size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">
                  Nilai Inventaris
                </span>
                <h4 className="fw-bold text-dark mb-0">
                  {formatRupiah(totalInventoryValue)}
                </h4>
              </div>
              <div className="p-2.5 bg-success-subtle text-success-emphasis rounded-3">
                <DollarSign size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-3 bg-white p-3 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small d-block mb-1">
                  Total Kategori
                </span>
                <h4 className="fw-bold text-dark mb-0">
                  {categories.length || 5} Kategori
                </h4>
              </div>
              <div className="p-2.5 bg-info-subtle text-info rounded-3">
                <Layers size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control & Search Toolbar */}
      <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Cari nama, tag, deskripsi..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  id="crud-search-input"
                />
                {searchTerm && (
                  <button
                    className="btn btn-light border border-start-0 text-muted"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">
                  <Filter size={14} />
                </span>
                <select
                  className="form-select bg-light"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  id="crud-category-filter"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Filter */}
            <div className="col-6 col-md-2">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">
                  <ArrowUpDown size={14} />
                </span>
                <select
                  className="form-select bg-light"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  id="crud-sort-filter"
                >
                  <option value="id-desc">ID Terbaru</option>
                  <option value="name-asc">Nama (A-Z)</option>
                  <option value="name-desc">Nama (Z-A)</option>
                  <option value="price-asc">Harga Terendah</option>
                  <option value="price-desc">Harga Tertinggi</option>
                  <option value="stock-desc">Stok Terbanyak</option>
                  <option value="stock-asc">Stok Tersedikit</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="col-12 col-md-3 d-flex gap-2 justify-content-md-end">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={loadData}
                disabled={loading}
                title="Muat Ulang Data"
                id="crud-refresh-btn"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="d-none d-sm-inline">Refresh</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm fw-semibold"
                onClick={handleOpenCreateModal}
                id="crud-add-product-btn"
              >
                <Plus size={16} />
                <span>Tambah Produk</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / Product List */}
      <div
        className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden mb-4"
        id="crud-product-table-card"
      >
        <div className="table-responsive">
          <table
            className="table table-hover align-middle mb-0"
            id="crud-product-table"
          >
            <thead className="table-light">
              <tr className="small text-muted text-uppercase">
                <th scope="col" style={{ width: "70px" }} className="ps-4">
                  Foto
                </th>
                <th scope="col">Nama & Kategori</th>
                <th scope="col">Harga</th>
                <th scope="col">Stok</th>
                <th scope="col">Rating</th>
                <th scope="col" className="text-end pe-4">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <div
                      className="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    ></div>
                    <span>Memuat data produk...</span>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="py-4">
                      <Package
                        size={40}
                        className="text-muted mb-2 opacity-50"
                      />
                      <h6 className="fw-bold text-dark">
                        Tidak ada data produk ditemukan
                      </h6>
                      <p className="text-muted small mb-3">
                        {searchTerm || selectedCategory !== "all"
                          ? "Coba ganti kata kunci pencarian atau filter kategori Anda."
                          : "Belum ada produk yang tersimpan. Silakan klik tombol Tambah Produk."}
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                        onClick={handleOpenCreateModal}
                      >
                        <Plus size={14} />
                        <span>Tambah Produk Baru</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  const photoUrl = getProductPhotoUrl(prod);
                  const categoryName =
                    prod.categoryName ||
                    prod.categoryRef?.name ||
                    (prod.category ? prod.category.toUpperCase() : "Umum");
                  const isLowStock = prod.stock > 0 && prod.stock <= 5;
                  const isOutOfStock = prod.stock <= 0;

                  return (
                    <tr key={prod.id} id={`product-row-${prod.id}`}>
                      {/* Product Thumbnail */}
                      <td className="ps-4">
                        <div
                          className="rounded-2 overflow-hidden bg-light border position-relative cursor-pointer shadow-2xs"
                          style={{ width: "52px", height: "52px" }}
                          onClick={() => handleOpenDetailModal(prod)}
                          title="Klik untuk melihat foto"
                        >
                          <img
                            src={photoUrl}
                            alt={prod.name}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-100 h-100 object-fit-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
                            }}
                          />
                        </div>
                      </td>

                      {/* Product Name & Category */}
                      <td>
                        <div className="d-flex flex-column">
                          <div className="d-flex align-items-center gap-1.5 mb-1 flex-wrap">
                            <span className="fw-bold text-dark text-decoration-none">
                              {prod.name}
                            </span>
                            {prod.tag && (
                              <span
                                className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle py-0.5 px-1.5 rounded small"
                                style={{ fontSize: "11px" }}
                              >
                                {prod.tag}
                              </span>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2 small text-muted">
                            <span className="badge bg-light text-secondary border">
                              {categoryName}
                            </span>
                            <span
                              className="text-muted"
                              style={{ fontSize: "12px" }}
                            >
                              ID: #{prod.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td>
                        <span className="fw-bold text-success">
                          {formatRupiah(prod.price)}
                        </span>
                      </td>

                      {/* Stock */}
                      <td>
                        {isOutOfStock ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            Habis (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
                            Sisa {prod.stock} unit
                          </span>
                        ) : (
                          <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1">
                            {prod.stock} unit
                          </span>
                        )}
                      </td>

                      {/* Rating */}
                      <td>
                        <div className="d-flex align-items-center gap-1 small">
                          <Star
                            size={14}
                            className="text-warning fill-warning"
                          />
                          <span className="fw-semibold text-dark">
                            {prod.rating || 4.8}
                          </span>
                          <span
                            className="text-muted"
                            style={{ fontSize: "11px" }}
                          >
                            ({prod.reviews || 0})
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenDetailModal(prod)}
                            title="Lihat Detail Produk"
                            id={`btn-detail-${prod.id}`}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleOpenEditModal(prod)}
                            title="Edit Produk"
                            id={`btn-edit-${prod.id}`}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleOpenDeleteModal(prod)}
                            title="Hapus Produk"
                            id={`btn-delete-${prod.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        {sortedProducts.length > 0 && (
          <div className="card-footer bg-white border-top py-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
            <span className="small text-muted">
              Menampilkan{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                sortedProducts.length,
              )}{" "}
              - {Math.min(currentPage * itemsPerPage, sortedProducts.length)}{" "}
              dari {sortedProducts.length} produk
            </span>

            {totalPages > 1 && (
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      className={`btn ${p === currentPage ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL TAMBAH / EDIT PRODUK ================= */}
      {isFormModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1055,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            overflowY: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) {
              setIsFormModalOpen(false);
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered w-100"
            style={{
              maxWidth: "760px",
              margin: "auto",
              maxHeight: "min(92vh, 820px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
              style={{
                maxHeight: "min(92vh, 820px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Modal Header (Fixed at top) */}
              <div className="modal-header bg-light border-bottom px-4 py-3 flex-shrink-0">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className={`p-2 rounded-3 ${isEditMode ? "bg-primary-subtle text-primary" : "bg-success-subtle text-success"}`}
                  >
                    {isEditMode ? <Edit size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      {isEditMode
                        ? `Edit Produk #${currentEditId}`
                        : "Tambah Produk Baru"}
                    </h5>
                    <small className="text-muted" style={{ fontSize: "12px" }}>
                      {isEditMode
                        ? "Perbarui informasi produk di database"
                        : "Isi formulir untuk menambahkan produk baru ke database"}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={formSubmitting}
                  aria-label="Tutup"
                ></button>
              </div>

              {/* Form with Flex Layout for Full Scroll Support */}
              <form
                onSubmit={handleSubmitForm}
                id="crud-product-form"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: "1 1 auto",
                  minHeight: 0,
                  overflow: "hidden",
                  margin: 0,
                }}
              >
                {/* Modal Body with Vertical Scroll */}
                <div
                  className="modal-body p-4"
                  style={{
                    overflowY: "auto",
                    flex: "1 1 auto",
                    minHeight: 0,
                    overscrollBehavior: "contain",
                  }}
                >
                  {formError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 py-2 px-3 small rounded-3 border-danger-subtle">
                      <AlertCircle
                        size={16}
                        className="text-danger flex-shrink-0"
                      />
                      <span className="fw-medium">{formError}</span>
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Nama Produk */}
                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-semibold text-dark">
                        Nama Produk <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: Laptop Ultra Slim Core i7"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        id="form-product-name"
                      />
                    </div>

                    {/* Kategori */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Kategori <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formData.categoryId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categoryId: e.target.value,
                          })
                        }
                        id="form-product-category"
                      >
                        {categories.length > 0 ? (
                          categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))
                        ) : (
                          <option value="1">Elektronik & Gadget</option>
                        )}
                      </select>
                    </div>

                    {/* Harga (Rp) */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Harga Produk (Rp) <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted">
                          Rp
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Contoh: 12500000"
                          min="1"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                          required
                          id="form-product-price"
                        />
                      </div>
                    </div>

                    {/* Stok Unit */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Jumlah Stok (Unit){" "}
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Contoh: 25"
                        min="0"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        required
                        id="form-product-stock"
                      />
                    </div>

                    {/* Tag Badge */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Label / Tag Khusus
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: Best Seller, Promo, Baru"
                        value={formData.tag}
                        onChange={(e) =>
                          setFormData({ ...formData, tag: e.target.value })
                        }
                        id="form-product-tag"
                      />
                    </div>

                    {/* Rating */}
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Rating (1.0 - 5.0)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        className="form-control"
                        value={formData.rating}
                        onChange={(e) =>
                          setFormData({ ...formData, rating: e.target.value })
                        }
                        id="form-product-rating"
                      />
                    </div>

                    {/* Reviews Count */}
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-dark">
                        Jumlah Ulasan
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={formData.reviews}
                        onChange={(e) =>
                          setFormData({ ...formData, reviews: e.target.value })
                        }
                        id="form-product-reviews"
                      />
                    </div>

                    {/* ================= FOTO PRODUK (UPLOAD & EDIT) ================= */}
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <label className="form-label small fw-semibold text-dark mb-0 d-flex align-items-center gap-1.5">
                          <Camera size={16} className="text-primary" />
                          <span>Foto Produk</span>
                          <span className="text-muted fw-normal small">
                            (Database Upload)
                          </span>
                        </label>

                        {/* Mode Selector Tabs */}
                        <div
                          className="btn-group btn-group-sm p-0.5 bg-light rounded-pill border"
                          role="group"
                        >
                          <button
                            type="button"
                            className={`btn btn-xs rounded-pill px-2.5 py-1 fw-medium ${
                              photoInputMode === "upload"
                                ? "btn-primary text-white shadow-sm"
                                : "btn-light text-muted"
                            }`}
                            style={{ fontSize: "11.5px" }}
                            onClick={() => setPhotoInputMode("upload")}
                          >
                            <Upload size={12} className="me-1" />
                            Unggah Berkas
                          </button>
                          <button
                            type="button"
                            className={`btn btn-xs rounded-pill px-2.5 py-1 fw-medium ${
                              photoInputMode === "url"
                                ? "btn-primary text-white shadow-sm"
                                : "btn-light text-muted"
                            }`}
                            style={{ fontSize: "11.5px" }}
                            onClick={() => setPhotoInputMode("url")}
                          >
                            <ImageIcon size={12} className="me-1" />
                            URL / Preset
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: UPLOAD FILE (upload.single('photo')) */}
                      {photoInputMode === "upload" && (
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileInputChange}
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                            className="d-none"
                            id="product-file-upload-input"
                          />

                          {/* State A: User selected a new file */}
                          {selectedPhotoFile && photoFilePreview ? (
                            <div className="p-3 border rounded-3 bg-light d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
                              <div className="d-flex align-items-center gap-3 w-100 overflow-hidden">
                                <div
                                  className="rounded-3 overflow-hidden border bg-white flex-shrink-0 position-relative shadow-sm"
                                  style={{ width: "72px", height: "72px" }}
                                >
                                  <img
                                    src={photoFilePreview}
                                    alt="Selected Preview"
                                    className="w-100 h-100 object-fit-cover"
                                  />
                                </div>
                                <div className="overflow-hidden">
                                  <div className="d-flex align-items-center gap-1.5 text-success small fw-semibold mb-0.5">
                                    <FileCheck size={14} />
                                    <span>Foto baru siap disimpan</span>
                                  </div>
                                  <span
                                    className="fw-semibold text-dark text-truncate d-block"
                                    style={{ fontSize: "13px" }}
                                  >
                                    {selectedPhotoFile.name}
                                  </span>
                                  <span
                                    className="text-muted small"
                                    style={{ fontSize: "11.5px" }}
                                  >
                                    {(selectedPhotoFile.size / 1024).toFixed(1)}{" "}
                                    KB • {selectedPhotoFile.type || "image"}
                                  </span>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <RefreshCw size={13} />
                                  <span>Ganti</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                                  onClick={handleClearSelectedPhoto}
                                  title="Hapus pilihan foto"
                                >
                                  <Trash2 size={13} />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* State B: Drag and drop dropzone */
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDropFile}
                              onClick={() => fileInputRef.current?.click()}
                              className={`p-4 border-2 border-dashed rounded-3 text-center cursor-pointer transition-all ${
                                isDraggingFile
                                  ? "border-primary bg-primary-subtle text-primary"
                                  : "border-secondary-subtle bg-light hover:border-primary"
                              }`}
                              style={{ cursor: "pointer" }}
                            >
                              {/* Existing photo info in edit mode */}
                              {isEditMode && existingPhotoUrl && (
                                <div className="mb-3 p-2 bg-white rounded-2 border d-inline-flex align-items-center gap-2.5 text-start shadow-xs">
                                  <img
                                    src={existingPhotoUrl}
                                    alt="Foto saat ini"
                                    className="rounded object-fit-cover border"
                                    style={{ width: "40px", height: "40px" }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src =
                                        "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
                                    }}
                                  />
                                  <div className="pe-2">
                                    <span
                                      className="d-block text-muted"
                                      style={{ fontSize: "11px" }}
                                    >
                                      Foto Saat Ini di Database:
                                    </span>
                                    <span
                                      className="fw-semibold text-dark"
                                      style={{ fontSize: "12px" }}
                                    >
                                      Klik di bawah untuk mengunggah foto baru
                                      pengganti
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="d-flex flex-column align-items-center justify-content-center">
                                <div className="p-3 bg-white text-primary rounded-circle shadow-xs mb-2 border">
                                  <UploadCloud size={24} />
                                </div>
                                <span className="fw-semibold text-dark small mb-1">
                                  {isEditMode
                                    ? "Klik untuk memilih foto baru atau seret file ke sini"
                                    : "Klik untuk memilih foto produk atau seret file ke sini"}
                                </span>
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "12px" }}
                                >
                                  Mendukung format JPG, PNG, WEBP, GIF (Maksimal
                                  5MB)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MODE 2: URL / PRESET */}
                      {photoInputMode === "url" && (
                        <div>
                          <div className="input-group">
                            <span className="input-group-text bg-light text-muted">
                              <ImageIcon size={16} />
                            </span>
                            <input
                              type="url"
                              className="form-control"
                              placeholder="https://images.unsplash.com/..."
                              value={formData.photoUrl}
                              onChange={(e) => {
                                handleClearSelectedPhoto();
                                setFormData({
                                  ...formData,
                                  photoUrl: e.target.value,
                                });
                              }}
                              id="form-product-photo-url"
                            />
                            {formData.photoUrl && (
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() =>
                                  setFormData({ ...formData, photoUrl: "" })
                                }
                              >
                                Hapus
                              </button>
                            )}
                          </div>

                          {/* Preset Photo Selector */}
                          <div className="mt-2">
                            <span
                              className="text-muted small d-block mb-1.5"
                              style={{ fontSize: "12px" }}
                            >
                              Pilih Cepat Foto Preset Kualitas Tinggi:
                            </span>
                            <div className="d-flex flex-wrap gap-1.5">
                              {PRESET_PHOTOS.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`btn btn-xs py-1 px-2 text-capitalize border rounded-pill small ${
                                    formData.photoUrl === preset.url
                                      ? "btn-primary text-white"
                                      : "btn-light text-secondary"
                                  }`}
                                  style={{ fontSize: "11px" }}
                                  onClick={() => {
                                    handleClearSelectedPhoto();
                                    setFormData({
                                      ...formData,
                                      photoUrl: preset.url,
                                    });
                                  }}
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Live Image Preview */}
                          {formData.photoUrl && (
                            <div className="mt-2 p-2 border rounded-3 bg-light d-flex align-items-center gap-3">
                              <div
                                className="rounded overflow-hidden border bg-white flex-shrink-0"
                                style={{ width: "64px", height: "64px" }}
                              >
                                <img
                                  src={formData.photoUrl}
                                  alt="Preview"
                                  className="w-100 h-100 object-fit-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
                                  }}
                                />
                              </div>
                              <div className="small text-muted overflow-hidden">
                                <span className="fw-semibold text-dark d-block">
                                  Preview Foto URL
                                </span>
                                <span
                                  className="text-truncate d-inline-block w-100"
                                  style={{ maxWidth: "380px" }}
                                >
                                  {formData.photoUrl}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Deskripsi Produk */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">
                        Deskripsi Produk
                      </label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Tuliskan spesifikasi, keunggulan, dan deskripsi lengkap produk..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        id="form-product-description"
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Modal Footer (Sticky / Always visible at bottom) */}
                <div className="modal-footer bg-light border-top px-4 py-3 flex-shrink-0 d-flex justify-content-between align-items-center">
                  <span className="text-muted small d-none d-sm-inline">
                    <span className="text-danger">*</span> Wajib diisi
                  </span>
                  <div className="d-flex align-items-center gap-2 ms-auto">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3"
                      onClick={() => setIsFormModalOpen(false)}
                      disabled={formSubmitting}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-4 fw-semibold shadow-sm"
                      disabled={formSubmitting}
                      id="form-product-submit-btn"
                    >
                      {formSubmitting ? (
                        <>
                          <div
                            className="spinner-border spinner-border-sm"
                            role="status"
                          ></div>
                          <span>Menyimpan ke Database...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={17} />
                          <span>
                            {isEditMode
                              ? "Simpan Perubahan"
                              : "Simpan Produk Baru"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {isDeleteModalOpen && productToDelete && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1055,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            overflowY: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setIsDeleteModalOpen(false);
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered w-100"
            style={{ maxWidth: "480px", margin: "auto" }}
          >
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-body p-4 text-center">
                <div className="p-3 bg-danger-subtle text-danger rounded-circle d-inline-flex mb-3">
                  <Trash2 size={32} />
                </div>
                <h5 className="fw-bold text-dark mb-2">Hapus Produk Ini?</h5>
                <p className="text-muted small mb-3">
                  Apakah Anda yakin ingin menghapus produk{" "}
                  <strong className="text-dark">
                    "{productToDelete.name}"
                  </strong>
                  ? Data yang dihapus akan dihilangkan dari katalog database.
                </p>

                <div className="p-3 bg-light rounded-3 text-start small mb-4 border">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">ID Produk:</span>
                    <span className="fw-semibold text-dark">
                      #{productToDelete.id}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Harga:</span>
                    <span className="fw-semibold text-primary">
                      {formatRupiah(productToDelete.price)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Sisa Stok:</span>
                    <span className="fw-semibold text-dark">
                      {productToDelete.stock} unit
                    </span>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 d-inline-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    id="btn-confirm-delete"
                  >
                    {isDeleting ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></div>
                        <span>Menghapus...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        <span>Ya, Hapus Produk</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL PRODUK ================= */}
      {isDetailModalOpen && productToView && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1055,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            overflowY: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDetailModalOpen(false);
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered w-100"
            style={{
              maxWidth: "740px",
              margin: "auto",
              maxHeight: "min(90vh, 750px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
              style={{
                maxHeight: "min(90vh, 750px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="modal-header bg-light border-bottom px-4 py-3 flex-shrink-0">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  Detail Produk #{productToView.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsDetailModalOpen(false)}
                ></button>
              </div>

              <div
                className="modal-body p-4"
                style={{
                  overflowY: "auto",
                  flex: "1 1 auto",
                  minHeight: 0,
                  overscrollBehavior: "contain",
                }}
              >
                <div className="row g-4">
                  {/* Photo Left */}
                  <div className="col-12 col-md-5">
                    <div
                      className="rounded-3 overflow-hidden border shadow-sm position-relative bg-white"
                      style={{ height: "240px" }}
                    >
                      <img
                        src={getProductPhotoUrl(productToView)}
                        alt={productToView.name}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                  </div>

                  {/* Info Right */}
                  <div className="col-12 col-md-7 d-flex flex-column">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                        {productToView.categoryName ||
                          productToView.categoryRef?.name ||
                          "Umum"}
                      </span>
                      {productToView.tag && (
                        <span className="badge bg-warning text-dark fw-bold">
                          {productToView.tag}
                        </span>
                      )}
                    </div>

                    <h4 className="fw-bold text-dark mb-2">
                      {productToView.name}
                    </h4>
                    <h3 className="fw-bold text-primary mb-3">
                      {formatRupiah(productToView.price)}
                    </h3>

                    <div className="d-flex align-items-center gap-3 mb-3 small">
                      <div className="d-flex align-items-center gap-1 text-warning">
                        <Star size={16} className="fill-warning" />
                        <span className="fw-bold text-dark">
                          {productToView.rating || 4.8}
                        </span>
                        <span className="text-muted">
                          ({productToView.reviews || 0} reviews)
                        </span>
                      </div>
                      <div className="text-muted">•</div>
                      <div>
                        <span className="text-muted">Stok: </span>
                        <span className="fw-bold text-dark">
                          {productToView.stock} unit
                        </span>
                      </div>
                    </div>

                    <p className="text-muted small mb-4 flex-grow-1">
                      {productToView.description ||
                        "Tidak ada deskripsi rinci untuk produk ini."}
                    </p>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5 flex-grow-1 justify-content-center fw-semibold"
                        onClick={() => {
                          setIsDetailModalOpen(false);
                          handleOpenEditModal(productToView);
                        }}
                      >
                        <Edit size={16} />
                        <span>Edit Produk</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 fw-semibold"
                        onClick={() => {
                          setIsDetailModalOpen(false);
                          handleOpenDeleteModal(productToView);
                        }}
                      >
                        <Trash2 size={16} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light border-top px-4 py-3 flex-shrink-0">
                <button
                  type="button"
                  className="btn btn-secondary px-4 ms-auto"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
