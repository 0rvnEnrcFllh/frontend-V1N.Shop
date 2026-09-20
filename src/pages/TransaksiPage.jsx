import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Receipt,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  CreditCard,
  User,
  MapPin,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  X,
  Printer,
  ShoppingBag,
} from "lucide-react";
import {
  fetchOrders,
  fetchOrderById,
  updateOrderStatus,
  formatRupiah,
  getProductPhotoUrl,
} from "../utils/auth";

export default function TransaksiPage({ user, token }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination & Filters State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(null);

  // Status & Payment Update States
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [confirmPayOrder, setConfirmPayOrder] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Handle opening pay confirmation
  const handleOpenConfirmPay = (order, e) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    setActionError("");
    setConfirmPayOrder(order);
  };

  // Execute changing order status to PAID
  const handleExecutePayment = async (orderId) => {
    if (!orderId) return;
    setUpdatingOrderId(orderId);
    setActionError("");
    setActionSuccess("");

    try {
      const response = await updateOrderStatus(
        orderId,
        {
          status: "PAID",
          payment_status: "PAID",
        },
        token,
      );

      if (response && (response.success || response.data)) {
        const updatedData = response.data || {};

        // Update list orders state
        setOrders((prevOrders) =>
          prevOrders.map((ord) => {
            if (ord.id === orderId || ord.id === Number(orderId)) {
              return {
                ...ord,
                ...updatedData,
                status: "PAID",
                payment_status: "PAID",
              };
            }
            return ord;
          }),
        );

        // Update selectedOrder if open in modal
        setSelectedOrder((prevSelected) => {
          if (
            prevSelected &&
            (prevSelected.id === orderId || prevSelected.id === Number(orderId))
          ) {
            return {
              ...prevSelected,
              ...updatedData,
              status: "PAID",
              payment_status: "PAID",
            };
          }
          return prevSelected;
        });

        const invoiceNo =
          updatedData.invoice_number ||
          (confirmPayOrder ? confirmPayOrder.invoice_number : `INV-${orderId}`);
        setActionSuccess(
          `Pesanan ${invoiceNo} berhasil diperbarui! Status pembayaran kini telah LUNAS (PAID).`,
        );
        setConfirmPayOrder(null);

        // Auto clear alert
        setTimeout(() => {
          setActionSuccess("");
        }, 6000);
      } else {
        throw new Error(
          response?.message || "Gagal memperbarui status pesanan.",
        );
      }
    } catch (err) {
      console.error("Error updating order to PAID:", err);
      setActionError(err.message || "Gagal mengubah transaksi menjadi lunas.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Load orders callback
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetchOrders({
        page,
        limit,
        status: statusFilter,
        payment_status: paymentStatusFilter,
        search: activeSearch,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (response && response.success) {
        setOrders(response.data || []);
        setTotalItems(response.totalItems || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        setOrders([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Gagal memuat data transaksi dari server.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    limit,
    statusFilter,
    paymentStatusFilter,
    activeSearch,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setPaymentStatusFilter("");
    setSearchInput("");
    setActiveSearch("");
    setSortBy("created_at");
    setSortOrder("DESC");
    setPage(1);
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedInvoice(text);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  const handleOpenDetail = async (orderItem) => {
    setSelectedOrder(orderItem);
    setIsLoadingDetail(true);
    try {
      // Optional fresh detail fetch
      const res = await fetchOrderById(orderItem.id);
      if (res && res.data) {
        setSelectedOrder(res.data);
      }
    } catch (e) {
      console.warn("Detail fresh fetch fallback to item cache:", e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return (
        new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(d) + " WIB"
      );
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (
      s === "PAID" ||
      s === "DELIVERED" ||
      s === "COMPLETED" ||
      s === "SUCCESS"
    ) {
      return (
        <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 d-inline-flex align-items-center gap-1">
          <CheckCircle2 size={13} />
          <span>
            {s === "PAID" ? "LUNAS" : s === "DELIVERED" ? "SELESAI" : s}
          </span>
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 d-inline-flex align-items-center gap-1">
          <Clock size={13} />
          <span>MENUNGGU</span>
        </span>
      );
    }
    if (s === "PROCESSING") {
      return (
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 d-inline-flex align-items-center gap-1">
          <RefreshCw size={13} />
          <span>DIPROSES</span>
        </span>
      );
    }
    if (s === "SHIPPED") {
      return (
        <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2.5 py-1 d-inline-flex align-items-center gap-1">
          <Truck size={13} />
          <span>DIKIRIM</span>
        </span>
      );
    }
    if (s === "CANCELLED" || s === "FAILED") {
      return (
        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 d-inline-flex align-items-center gap-1">
          <AlertCircle size={13} />
          <span>{s === "CANCELLED" ? "DIBATALKAN" : "GAGAL"}</span>
        </span>
      );
    }
    return (
      <span className="badge bg-light text-dark border px-2.5 py-1">
        {s || "-"}
      </span>
    );
  };

  const renderPaymentStatusBadge = (payStatus) => {
    const ps = String(payStatus || "").toUpperCase();
    if (ps === "PAID" || ps === "SUCCESS") {
      return (
        <span
          className="badge bg-success text-white px-2 py-0.5 small"
          style={{ fontSize: "11px" }}
        >
          Lunas
        </span>
      );
    }
    if (ps === "UNPAID") {
      return (
        <span
          className="badge bg-danger text-white px-2 py-0.5 small"
          style={{ fontSize: "11px" }}
        >
          Belum Dibayar
        </span>
      );
    }
    if (ps === "EXPIRED") {
      return (
        <span
          className="badge bg-secondary text-white px-2 py-0.5 small"
          style={{ fontSize: "11px" }}
        >
          Kedaluwarsa
        </span>
      );
    }
    return (
      <span
        className="badge bg-secondary text-white px-2 py-0.5 small"
        style={{ fontSize: "11px" }}
      >
        {ps || "-"}
      </span>
    );
  };

  return (
    <div className="container py-4" id="transaksi-page-root">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row md:items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="p-2 bg-info text-white rounded-3 d-inline-flex align-items-center justify-content-center shadow-sm">
              <Receipt size={22} />
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-0">
                Daftar Transaksi & Pesanan
              </h4>
              <p className="text-muted small mb-0">
                {user?.name
                  ? `Pantau riwayat transaksi, invoice, dan status pembayaran untuk akun ${user.name}`
                  : "Pantau riwayat transaksi, invoice, status pengiriman, dan pembayaran dari backend"}
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1.5 px-3 py-2 rounded-3 shadow-xs"
            onClick={loadOrders}
            disabled={isLoading}
            id="refresh-orders-btn"
            title="Muat Ulang Data"
          >
            <RefreshCw
              size={15}
              className={
                isLoading ? "spinner-border spinner-border-sm border-0" : ""
              }
            />
            <span>Refresh</span>
          </button>

          <Link
            to="/produk"
            className="btn btn-info btn-sm d-flex align-items-center gap-1.5 px-3 py-2 rounded-3 shadow-xs"
            id="belanja-lagi-btn"
          >
            <ShoppingBag size={15} />
            <span>Belanja Lagi</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card border-0 shadow-sm rounded-3 bg-white mb-4"
        id="filter-orders-card"
      >
        <div className="card-body p-3 p-md-4">
          <form
            onSubmit={handleSearchSubmit}
            className="row g-3 align-items-end"
          >
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <label
                htmlFor="search-order-input"
                className="form-label small fw-semibold text-muted mb-1"
              >
                Cari Invoice / Penerima
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  id="search-order-input"
                  className="form-control border-start-0 ps-0 bg-light"
                  placeholder="No. Invoice atau Nama..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="btn btn-light border border-start-0 text-muted"
                    onClick={() => {
                      setSearchInput("");
                      setActiveSearch("");
                      setPage(1);
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Status Pesanan */}
            <div className="col-6 col-md-2">
              <label
                htmlFor="filter-status-select"
                className="form-label small fw-semibold text-muted mb-1"
              >
                Status Pesanan
              </label>
              <select
                id="filter-status-select"
                className="form-select bg-light"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Status</option>
                <option value="PENDING">Pending (Menunggu)</option>
                <option value="PAID">Paid (Lunas)</option>
                <option value="PROCESSING">Processing (Diproses)</option>
                <option value="SHIPPED">Shipped (Dikirim)</option>
                <option value="DELIVERED">Delivered (Selesai)</option>
                <option value="CANCELLED">Cancelled (Batal)</option>
              </select>
            </div>

            {/* Filter Status Pembayaran */}
            <div className="col-6 col-md-2">
              <label
                htmlFor="filter-paystatus-select"
                className="form-label small fw-semibold text-muted mb-1"
              >
                Status Bayar
              </label>
              <select
                id="filter-paystatus-select"
                className="form-select bg-light"
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua</option>
                <option value="UNPAID">UNPAID (Belum)</option>
                <option value="PAID">PAID (Lunas)</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="col-6 col-md-2">
              <label
                htmlFor="filter-sort-select"
                className="form-label small fw-semibold text-muted mb-1"
              >
                Urutkan
              </label>
              <select
                id="filter-sort-select"
                className="form-select bg-light"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split("-");
                  setSortBy(sb);
                  setSortOrder(so);
                  setPage(1);
                }}
              >
                <option value="created_at-DESC">Terbaru Dibuat</option>
                <option value="created_at-ASC">Terlama Dibuat</option>
                <option value="grand_total-DESC">Total Tertinggi</option>
                <option value="grand_total-ASC">Total Terendah</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="col-6 col-md-2 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-info w-100 d-flex align-items-center justify-content-center gap-1 fw-semibold shadow-xs"
                id="submit-search-order"
              >
                <Search size={15} />
                <span>Cari</span>
              </button>
              {(statusFilter ||
                paymentStatusFilter ||
                activeSearch ||
                sortBy !== "created_at" ||
                sortOrder !== "DESC") && (
                <button
                  type="button"
                  className="btn btn-outline-secondary px-2.5"
                  onClick={handleResetFilters}
                  title="Reset Filter"
                  id="reset-filter-btn"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {/* Quick Stats Summary */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top text-muted small">
            <div>
              <span>Menampilkan: </span>
              <strong className="text-dark">{orders.length}</strong> dari{" "}
              <strong className="text-dark">{totalItems}</strong> transaksi
              ditemukan
              {activeSearch && (
                <span className="ms-2 badge bg-primary-subtle text-primary">
                  Kata kunci: &ldquo;{activeSearch}&rdquo;
                </span>
              )}
              {statusFilter && (
                <span className="ms-1 badge bg-light text-dark border">
                  Status: {statusFilter}
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="text-muted">Tampilkan:</span>
              <select
                className="form-select form-select-sm d-inline-block w-auto"
                style={{ paddingRight: "2rem" }}
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value="5">5 per hal</option>
                <option value="10">10 per hal</option>
                <option value="20">20 per hal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="alert alert-success alert-dismissible d-flex align-items-center justify-content-between p-3 rounded-3 shadow-xs mb-4">
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={18} className="text-success flex-shrink-0" />
            <span className="small fw-semibold">{actionSuccess}</span>
          </div>
          <button
            type="button"
            className="btn-close shadow-none"
            aria-label="Close"
            onClick={() => setActionSuccess("")}
          ></button>
        </div>
      )}

      {/* Action Error Alert */}
      {actionError && (
        <div className="alert alert-danger alert-dismissible d-flex align-items-center justify-content-between p-3 rounded-3 shadow-xs mb-4">
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={18} className="text-danger flex-shrink-0" />
            <span className="small fw-semibold">{actionError}</span>
          </div>
          <button
            type="button"
            className="btn-close shadow-none"
            aria-label="Close"
            onClick={() => setActionError("")}
          ></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 rounded-3 shadow-xs mb-4">
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={18} className="text-danger flex-shrink-0" />
            <span className="small fw-medium">{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={loadOrders}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center my-3">
          <div
            className="spinner-border text-primary mx-auto mb-3"
            role="status"
          >
            <span className="visually-hidden">Memuat...</span>
          </div>
          <p className="text-muted small mb-0">
            Sedang mengambil riwayat transaksi dari backend...
          </p>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div
          className="card border-0 shadow-sm rounded-3 bg-white p-5 text-center my-3"
          id="empty-orders-view"
        >
          <div className="p-3 bg-light rounded-circle d-inline-flex mx-auto mb-3 text-muted">
            <Receipt size={40} className="text-muted" />
          </div>
          <h5 className="fw-bold text-dark mb-1">
            Belum Ada Transaksi Ditemukan
          </h5>
          <p
            className="text-muted small mb-4"
            style={{ maxWidth: "420px", margin: "0 auto" }}
          >
            {activeSearch || statusFilter || paymentStatusFilter
              ? "Tidak ada pesanan yang sesuai dengan kriteria filter atau pencarian Anda. Silakan coba atur ulang filter."
              : "Anda belum memiliki riwayat transaksi atau pesanan. Silakan checkout produk dari keranjang belanja."}
          </p>
          <div className="d-flex justify-content-center gap-2">
            {activeSearch || statusFilter || paymentStatusFilter ? (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={handleResetFilters}
              >
                Reset Semua Filter
              </button>
            ) : (
              <Link to="/produk" className="btn btn-info btn-sm px-4">
                Mulai Belanja
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Orders List */
        <div className="d-flex flex-column gap-3" id="orders-list-container">
          {orders.map((order) => {
            const firstItem = order.items?.[0];
            const remainingItemsCount = (order.items?.length || 0) - 1;

            return (
              <div
                key={order.id}
                className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden"
                id={`order-card-${order.id}`}
              >
                {/* Card Header: Invoice & Status */}
                <div className="card-header bg-light border-bottom py-3 px-3 px-md-4 d-flex flex-column flex-md-row md:items-center justify-content-between gap-2">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <div className="p-1.5 bg-white border rounded text-success d-inline-flex align-items-center">
                      <Receipt size={16} />
                    </div>
                    <span
                      className="fw-bold text-dark font-monospace"
                      style={{ fontSize: "13.5px" }}
                    >
                      {order.invoice_number || `INV-${order.id}`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-muted hover:text-primary text-decoration-none"
                      title="Salin No Invoice"
                      onClick={() => handleCopy(order.invoice_number)}
                    >
                      {copiedInvoice === order.invoice_number ? (
                        <Check size={14} className="text-success" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <span className="text-muted d-none d-sm-inline">•</span>
                    <span className="text-muted small d-inline-flex align-items-center gap-1">
                      <Calendar size={13} />
                      {formatDateIndo(order.created_at)}
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {renderPaymentStatusBadge(order.payment_status)}
                    {renderStatusBadge(order.status)}
                  </div>
                </div>

                {/* Card Body: Items & Shipping details */}
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3">
                    {/* Left Column: Product Items preview */}
                    <div className="col-12 col-lg-7 border-lg-end pe-lg-4">
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="rounded-3 bg-light border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                          style={{ width: "64px", height: "64px" }}
                        >
                          {firstItem?.product?.photoUrl ||
                          firstItem?.product_photo_url ? (
                            <img
                              src={getProductPhotoUrl(
                                firstItem?.product?.photoUrl ||
                                  firstItem?.product_photo_url,
                              )}
                              alt={firstItem.product_name}
                              className="w-100 h-100 object-fit-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <Package size={28} className="text-secondary" />
                          )}
                        </div>

                        <div className="flex-grow-1 min-w-0">
                          <h6
                            className="fw-bold text-dark mb-1 text-truncate"
                            title={firstItem?.product_name || "Produk"}
                          >
                            {firstItem?.product_name || "Produk Belanja"}
                          </h6>
                          <div className="text-muted small mb-1">
                            <span>{firstItem?.quantity || 1} barang</span>{" "}
                            &times;{" "}
                            <span className="fw-semibold text-dark">
                              {formatRupiah(firstItem?.price || 0)}
                            </span>
                          </div>

                          {remainingItemsCount > 0 && (
                            <span className="badge bg-light text-secondary border small">
                              +{remainingItemsCount} produk lainnya
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recipient & Courier pill */}
                      <div className="mt-3 pt-3 border-top d-flex flex-wrap align-items-center gap-3 text-muted small">
                        <div
                          className="d-flex align-items-center gap-1.5"
                          title="Penerima"
                        >
                          <User size={14} className="text-secondary" />
                          <span className="text-dark fw-medium">
                            {order.recipient_name || "-"}
                          </span>
                          {order.recipient_phone && (
                            <span className="text-muted">
                              ({order.recipient_phone})
                            </span>
                          )}
                        </div>

                        <div
                          className="d-flex align-items-center gap-1.5"
                          title="Kurir Pengiriman"
                        >
                          <Truck size={14} className="text-secondary" />
                          <span className="badge bg-light text-dark border">
                            {order.shipping_courier || "Ekspedisi"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Pricing & Action */}
                    <div className="col-12 col-lg-5 ps-lg-4 d-flex flex-column justify-content-between">
                      <div className="bg-light p-3 rounded-3 mb-3">
                        <div className="d-flex justify-content-between text-muted small mb-1">
                          <span>Total Belanja:</span>
                          <span>{formatRupiah(order.total_amount)}</span>
                        </div>
                        <div className="d-flex justify-content-between text-muted small mb-1">
                          <span>Ongkos Kirim ({order.shipping_courier}):</span>
                          <span>{formatRupiah(order.shipping_cost)}</span>
                        </div>
                        {Number(order.discount_amount) > 0 && (
                          <div className="d-flex justify-content-between text-danger small mb-1">
                            <span>Diskon Voucher:</span>
                            <span>-{formatRupiah(order.discount_amount)}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                          <span className="fw-bold text-dark">
                            Grand Total:
                          </span>
                          <span className="fw-bold text-success fs-6">
                            {formatRupiah(order.grand_total)}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div className="small text-muted d-flex align-items-center gap-1">
                          <CreditCard size={14} />
                          <span>{order.payment_method || "Metode Bayar"}</span>
                        </div>

                        <div className="d-flex flex-wrap align-items-center gap-2">
                          {/* Tombol Ubah Transaksi Menjadi Lunas jika belum lunas */}
                          {String(order.payment_status || "").toUpperCase() !==
                            "PAID" && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 rounded-2 shadow-xs text-white"
                              onClick={(e) => handleOpenConfirmPay(order, e)}
                              disabled={updatingOrderId === order.id}
                              id={`btn-pay-order-${order.id}`}
                              title="Ubah status transaksi dari belum dibayar menjadi lunas"
                            >
                              {updatingOrderId === order.id ? (
                                <>
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                  <span>Memproses...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={14} />
                                  <span>Bayar (Set Lunas)</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm px-3 py-1.5 fw-semibold d-flex align-items-center gap-1 rounded-2 shadow-xs"
                            onClick={() => handleOpenDetail(order)}
                            id={`btn-detail-order-${order.id}`}
                          >
                            <span>Rincian Pesanan</span>
                            <ExternalLink size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="card border-0 shadow-sm rounded-3 bg-white mt-4 p-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <div className="text-muted small">
            Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>{" "}
            (Total {totalItems} transaksi)
          </div>

          <nav aria-label="Navigasi Halaman Transaksi">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={14} />
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p} className="d-inline-flex">
                      {showEllipsis && (
                        <span className="page-link disabled border-0">...</span>
                      )}
                      <li className={`page-item ${page === p ? "active" : ""}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    </span>
                  );
                })}

              <li
                className={`page-item ${page >= totalPages ? "disabled" : ""}`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={14} />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* ================= MODAL DETAIL TRANSAKSI ================= */}
      {selectedOrder && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(2px)",
            zIndex: 1060,
          }}
          id="order-detail-modal"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-3">
              {/* Modal Header */}
              <div className="modal-header bg-light border-bottom py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 bg-primary text-white rounded-2">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0 fs-6">
                      Rincian Transaksi:{" "}
                      {selectedOrder.invoice_number ||
                        `INV-${selectedOrder.id}`}
                    </h5>
                    <span className="text-muted small">
                      Dibuat pada {formatDateIndo(selectedOrder.created_at)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close shadow-none"
                  aria-label="Close"
                  onClick={() => setSelectedOrder(null)}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4">
                {isLoadingDetail && (
                  <div className="text-center py-2 mb-3">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    <span className="small text-muted">
                      Menyegarkan detail transaksi...
                    </span>
                  </div>
                )}

                {/* Banner Aksi Bayar Lunas jika transaksi belum dibayar */}
                {String(selectedOrder.payment_status || "").toUpperCase() !==
                  "PAID" && (
                  <div className="alert alert-warning border border-warning-subtle rounded-3 p-3 mb-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 shadow-xs">
                    <div className="d-flex align-items-start gap-2.5">
                      <Clock
                        size={20}
                        className="text-warning-emphasis flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <div className="fw-bold text-warning-emphasis small">
                          Status Pembayaran: Belum Dibayar (
                          {selectedOrder.payment_status || "UNPAID"})
                        </div>
                        <div
                          className="text-muted small"
                          style={{ fontSize: "12px" }}
                        >
                          Pesanan ini belum dibayar. Klik tombol di sebelah
                          kanan untuk mengubah status transaksi menjadi Lunas
                          (PAID) ke backend.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3 py-2 fw-semibold text-white d-flex align-items-center justify-content-center gap-1.5 flex-shrink-0 rounded-2 shadow-xs"
                      onClick={(e) => handleOpenConfirmPay(selectedOrder, e)}
                      disabled={updatingOrderId === selectedOrder.id}
                      id="modal-banner-pay-btn"
                    >
                      {updatingOrderId === selectedOrder.id ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Ubah Jadi Lunas</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Status Bar */}
                <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                  <div className="row g-3 text-center text-sm-start">
                    <div className="col-12 col-sm-4 border-sm-end">
                      <span className="text-muted small d-block mb-1">
                        Status Pesanan:
                      </span>
                      <div>{renderStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div className="col-12 col-sm-4 border-sm-end">
                      <span className="text-muted small d-block mb-1">
                        Status Pembayaran:
                      </span>
                      <div>
                        {renderPaymentStatusBadge(selectedOrder.payment_status)}
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <span className="text-muted small d-block mb-1">
                        Metode Bayar:
                      </span>
                      <strong className="text-dark small d-inline-flex align-items-center gap-1">
                        <CreditCard size={14} className="text-primary" />
                        {selectedOrder.payment_method || "-"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Shipping & Recipient Info */}
                <div className="card border rounded-3 p-3 mb-4">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2 small text-uppercase">
                    <MapPin size={16} className="text-primary" />
                    <span>Informasi Pengiriman & Penerima</span>
                  </h6>
                  <div className="row g-2 small">
                    <div className="col-12 col-sm-6">
                      <span className="text-muted">Nama Penerima: </span>
                      <strong className="text-dark">
                        {selectedOrder.recipient_name || "-"}
                      </strong>
                    </div>
                    <div className="col-12 col-sm-6">
                      <span className="text-muted">No. Telepon / WA: </span>
                      <strong className="text-dark">
                        {selectedOrder.recipient_phone || "-"}
                      </strong>
                    </div>
                    <div className="col-12 col-sm-6">
                      <span className="text-muted">Ekspedisi Kurir: </span>
                      <span className="badge bg-light text-dark border">
                        {selectedOrder.shipping_courier || "-"}
                      </span>
                    </div>
                    <div className="col-12 col-sm-6">
                      <span className="text-muted">No. Resi Pelacakan: </span>
                      <span className="text-dark font-monospace">
                        {selectedOrder.shipping_tracking_no ||
                          "(Belum diterbitkan)"}
                      </span>
                    </div>
                    <div className="col-12 mt-2 pt-2 border-top">
                      <span className="text-muted d-block mb-1">
                        Alamat Tujuan Lengkap:
                      </span>
                      <p className="mb-0 text-dark bg-light p-2 rounded">
                        {selectedOrder.shipping_address || "-"}
                      </p>
                    </div>
                    {selectedOrder.notes && (
                      <div className="col-12 mt-1">
                        <span className="text-muted">Catatan Pesanan: </span>
                        <span className="fst-italic text-dark">
                          {selectedOrder.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products Table */}
                <div className="card border rounded-3 overflow-hidden mb-4">
                  <div className="card-header bg-light border-bottom py-2.5 px-3">
                    <h6 className="fw-bold text-dark mb-0 small text-uppercase d-flex align-items-center gap-1.5">
                      <Package size={16} className="text-primary" />
                      <span>
                        Daftar Produk yang Dipesan (
                        {selectedOrder.items?.length || 0})
                      </span>
                    </h6>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light text-muted">
                        <tr>
                          <th style={{ width: "45%" }}>Produk</th>
                          <th className="text-center" style={{ width: "15%" }}>
                            Harga
                          </th>
                          <th className="text-center" style={{ width: "15%" }}>
                            Qty
                          </th>
                          <th className="text-end" style={{ width: "25%" }}>
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.items || []).map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded bg-light border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                                  style={{ width: "40px", height: "40px" }}
                                >
                                  {item.product?.photoUrl ||
                                  item.product_photo_url ? (
                                    <img
                                      src={getProductPhotoUrl(
                                        item.product?.photoUrl ||
                                          item.product_photo_url,
                                      )}
                                      alt={item.product_name}
                                      className="w-100 h-100 object-fit-cover"
                                    />
                                  ) : (
                                    <Package size={18} className="text-muted" />
                                  )}
                                </div>
                                <div>
                                  <div className="fw-semibold text-dark">
                                    {item.product_name}
                                  </div>
                                  {item.product?.categoryName && (
                                    <div
                                      className="text-muted"
                                      style={{ fontSize: "11px" }}
                                    >
                                      {item.product.categoryName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-center">
                              {formatRupiah(item.price)}
                            </td>
                            <td className="text-center fw-bold">
                              {item.quantity}
                            </td>
                            <td className="text-end fw-semibold text-dark">
                              {formatRupiah(
                                item.subtotal ||
                                  Number(item.price) * Number(item.quantity),
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="card bg-light border-0 rounded-3 p-3">
                  <h6 className="fw-bold text-dark mb-2 small text-uppercase">
                    Rincian Pembayaran
                  </h6>
                  <div className="d-flex justify-content-between text-muted small mb-1.5">
                    <span>Total Harga Barang:</span>
                    <span className="text-dark">
                      {formatRupiah(selectedOrder.total_amount)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between text-muted small mb-1.5">
                    <span>
                      Ongkos Kirim ({selectedOrder.shipping_courier || "Kurir"}
                      ):
                    </span>
                    <span className="text-dark">
                      {formatRupiah(selectedOrder.shipping_cost)}
                    </span>
                  </div>
                  {Number(selectedOrder.discount_amount) > 0 && (
                    <div className="d-flex justify-content-between text-success small mb-1.5">
                      <span>Potongan Diskon Voucher:</span>
                      <span>
                        -{formatRupiah(selectedOrder.discount_amount)}
                      </span>
                    </div>
                  )}
                  {Number(selectedOrder.tax_amount) > 0 && (
                    <div className="d-flex justify-content-between text-muted small mb-1.5">
                      <span>Pajak (PPN):</span>
                      <span>{formatRupiah(selectedOrder.tax_amount)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center pt-2.5 border-top mt-2">
                    <div>
                      <span className="fw-bold text-dark fs-6">
                        Grand Total:
                      </span>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        Metode: {selectedOrder.payment_method}
                      </div>
                    </div>
                    <span className="fw-bold text-primary fs-5">
                      {formatRupiah(selectedOrder.grand_total)}
                    </span>
                  </div>
                </div>

                {/* User Account Details */}
                {selectedOrder.user && (
                  <div className="mt-3 pt-2 text-muted small d-flex align-items-center gap-1.5">
                    <User size={14} />
                    <span>Dipesan oleh akun: </span>
                    <strong className="text-dark">
                      {selectedOrder.user.name}
                    </strong>{" "}
                    ({selectedOrder.user.email})
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light border-top py-2.5 px-4 d-flex flex-wrap justify-content-between gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer size={15} />
                  <span>Cetak Bukti</span>
                </button>

                <div className="d-flex align-items-center gap-2">
                  {String(selectedOrder.payment_status || "").toUpperCase() !==
                    "PAID" && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3 py-1.5 fw-semibold text-white d-flex align-items-center gap-1.5 rounded-2 shadow-xs"
                      onClick={(e) => handleOpenConfirmPay(selectedOrder, e)}
                      disabled={updatingOrderId === selectedOrder.id}
                      id="modal-footer-pay-btn"
                    >
                      {updatingOrderId === selectedOrder.id ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={15} />
                          <span>Ubah Jadi Lunas</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm px-4"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI PEMBAYARAN (SET LUNAS) ================= */}
      {confirmPayOrder && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.72)",
            backdropFilter: "blur(3px)",
            zIndex: 1080,
          }}
          id="confirm-pay-modal"
          onClick={() => !updatingOrderId && setConfirmPayOrder(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
              <div className="modal-header bg-success-subtle border-bottom py-3 px-4">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2 bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-xs">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-success-emphasis mb-0 fs-6">
                      Konfirmasi Pelunasan Transaksi
                    </h5>
                    <span
                      className="text-muted small"
                      style={{ fontSize: "12px" }}
                    >
                      Ubah status pembayaran dari Belum Dibayar ke Lunas (PAID)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  aria-label="Close"
                  onClick={() => !updatingOrderId && setConfirmPayOrder(null)}
                  disabled={updatingOrderId === confirmPayOrder.id}
                ></button>
              </div>

              <div className="modal-body p-4">
                <p className="text-dark small mb-3">
                  Apakah Anda yakin ingin menyelesaikan transaksi ini dan
                  merubah statusnya menjadi <strong>LUNAS (PAID)</strong>?
                </p>

                <div className="bg-light p-3 rounded-3 mb-3 border">
                  <div className="d-flex justify-content-between small mb-1.5">
                    <span className="text-muted">No. Invoice:</span>
                    <strong className="text-dark font-monospace">
                      {confirmPayOrder.invoice_number ||
                        `INV-${confirmPayOrder.id}`}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between small mb-1.5">
                    <span className="text-muted">Penerima:</span>
                    <span className="text-dark fw-medium">
                      {confirmPayOrder.recipient_name || "-"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between small mb-1.5">
                    <span className="text-muted">Metode Pembayaran:</span>
                    <span className="text-dark">
                      {confirmPayOrder.payment_method || "QRIS"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between small mb-1.5">
                    <span className="text-muted">Status Saat Ini:</span>
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                      {confirmPayOrder.payment_status || "UNPAID"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                    <span className="fw-bold text-dark small">
                      Total Tagihan:
                    </span>
                    <span className="fw-bold text-success fs-5">
                      {formatRupiah(confirmPayOrder.grand_total)}
                    </span>
                  </div>
                </div>

                <div className="small text-muted bg-white p-2.5 rounded border border-dashed">
                  <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark mb-1">
                    <RefreshCw size={13} className="text-primary" />
                    <span>Permintaan API ke Server:</span>
                  </div>
                  <code
                    className="text-primary d-block"
                    style={{ fontSize: "11px" }}
                  >
                    PUT /api/orders/{confirmPayOrder.id}
                  </code>
                  <div
                    className="text-secondary mt-1"
                    style={{ fontSize: "11px" }}
                  >
                    Payload: {`{"status": "PAID", "payment_status": "PAID"}`}{" "}
                    menggunakan header token otentikasi.
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light border-top py-2.5 px-4 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3"
                  onClick={() => setConfirmPayOrder(null)}
                  disabled={updatingOrderId === confirmPayOrder.id}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-4 fw-semibold text-white d-flex align-items-center gap-1.5 shadow-xs"
                  onClick={() => handleExecutePayment(confirmPayOrder.id)}
                  disabled={updatingOrderId === confirmPayOrder.id}
                  id="confirm-pay-execute-btn"
                >
                  {updatingOrderId === confirmPayOrder.id ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <span>Menyimpan ke Backend...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Ya, Selesaikan & Lunaskan</span>
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
