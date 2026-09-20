import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
  QrCode,
  Tag,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  Building,
  FileText,
  Copy,
  Check,
  Receipt,
} from "lucide-react";
import {
  getCartItems,
  updateCartQuantity,
  toggleCartItemSelection,
  toggleSelectAllCart,
  removeFromCart,
  clearCart,
  clearSelectedCartItems,
  calculateCartSummary,
  saveOrderToHistory,
} from "../utils/cart";
import axios from "axios";
import {
  formatRupiah,
  getProductPhotoUrl,
  ORDERS_API_URL,
  getCurrentUserId,
} from "../utils/auth";

const EXPEDITIONS = [
  {
    id: "free",
    name: "Free Shipping (Gratis Ongkir)",
    cost: 0,
    logo: "🎉",
    desc: "Pengiriman hemat bebas biaya ongkir (3-5 Hari)",
    badge: "Gratis",
  },
  {
    id: "jne",
    name: "JNE Reguler (2-3 Hari)",
    cost: 18000,
    logo: "📦",
    desc: "Estimasi pengiriman 2-3 hari kerja",
  },
  {
    id: "sicepat",
    name: "SiCepat BEST (1-2 Hari)",
    cost: 22000,
    logo: "⚡",
    desc: "Estimasi pengiriman cepat 1-2 hari",
  },
  {
    id: "jnt",
    name: "J&T Express (2-3 Hari)",
    cost: 19000,
    logo: "🚚",
    desc: "Estimasi pengiriman 2-3 hari kerja",
  },
  {
    id: "gosend",
    name: "GoSend Instant (3 Jam)",
    cost: 35000,
    logo: "🛵",
    desc: "Pengiriman instan tiba dalam 3 jam",
  },
  {
    id: "pos",
    name: "POS Indonesia Kilat Khusus",
    cost: 15000,
    logo: "📬",
    desc: "Pengiriman pos kilat khusus nasional",
  },
];

const PAYMENT_METHODS = [
  {
    id: "midtrans",
    name: "Midtrans Payment Gateway",
    category: "Payment Gateway",
    icon: ShieldCheck,
    desc: "Otomatis terverifikasi (Kartu Kredit/Debit, GoPay, ShopeePay, Virtual Account & Minimarket)",
  },
  {
    id: "qris",
    name: "QRIS (GoPay, OVO, DANA, BCA)",
    category: "E-Wallet & QR",
    icon: QrCode,
    desc: "Scan instan otomatis terverifikasi 24/7",
  },
  {
    id: "bca_va",
    name: "BCA Virtual Account",
    category: "Virtual Account",
    icon: CreditCard,
    desc: "Bayar melalui m-BCA atau KlikBCA",
    vaNumber: "8801289192837461",
  },
  {
    id: "mandiri_va",
    name: "Mandiri Virtual Account",
    category: "Virtual Account",
    icon: CreditCard,
    desc: "Bayar melalui Livin by Mandiri",
    vaNumber: "8902201928384752",
  },
  {
    id: "bri_va",
    name: "BRI Virtual Account (BRIVA)",
    category: "Virtual Account",
    icon: CreditCard,
    desc: "Bayar melalui BRImo atau ATM",
    vaNumber: "8019382716253412",
  },
  {
    id: "cod",
    name: "COD (Bayar di Tempat)",
    category: "Tunai",
    icon: Truck,
    desc: "Bayar tunai langsung saat kurir mengantar paket",
  },
];

export default function KeranjangPage({ user }) {
  const [cartItems, setCartItems] = useState(() => getCartItems());
  const [currentStep, setCurrentStep] = useState("cart"); // 'cart' | 'checkout' | 'success'

  // Promo Vouchers
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState({ type: "", text: "" });

  // Shipping & Delivery Form State
  const [shippingData, setShippingData] = useState({
    recipientName: user?.name || "",
    phone: "",
    address: "",
    city: "Jakarta Selatan",
    postalCode: "12190",
    notes: "",
    expeditionId: "jne",
  });

  // Payment Method State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("qris");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Sync cart items with localStorage events
  useEffect(() => {
    const handleCartSync = () => {
      setCartItems(getCartItems());
    };

    window.addEventListener("toko_cart_updated", handleCartSync);
    window.addEventListener("storage", handleCartSync);
    return () => {
      window.removeEventListener("toko_cart_updated", handleCartSync);
      window.removeEventListener("storage", handleCartSync);
    };
  }, []);

  // Sinkronkan nama penerima jika user baru login atau berubah
  useEffect(() => {
    if (user?.name && !shippingData.recipientName) {
      setShippingData((prev) => ({
        ...prev,
        recipientName: user.name,
      }));
    }
  }, [user, shippingData.recipientName]);

  // Selected expedition cost
  const selectedExpedition = useMemo(() => {
    return (
      EXPEDITIONS.find((e) => e.id === shippingData.expeditionId) ||
      EXPEDITIONS[0]
    );
  }, [shippingData.expeditionId]);

  // Cart Calculations
  const summary = useMemo(() => {
    const shippingCost =
      currentStep === "checkout" || currentStep === "success"
        ? selectedExpedition.cost
        : 0;
    return calculateCartSummary(cartItems, appliedPromo, shippingCost);
  }, [cartItems, appliedPromo, selectedExpedition, currentStep]);

  const allSelected = useMemo(() => {
    return cartItems.length > 0 && cartItems.every((item) => item.selected);
  }, [cartItems]);

  const someSelected = useMemo(() => {
    return cartItems.some((item) => item.selected);
  }, [cartItems]);

  // Handlers for cart actions
  const handleQuantityChange = (productId, newQty) => {
    const updated = updateCartQuantity(productId, newQty);
    setCartItems(updated);
  };

  const handleToggleSelect = (productId) => {
    const updated = toggleCartItemSelection(productId);
    setCartItems(updated);
  };

  const handleSelectAll = () => {
    const targetState = !allSelected;
    const updated = toggleSelectAllCart(targetState);
    setCartItems(updated);
  };

  const handleRemove = (productId) => {
    const updated = removeFromCart(productId);
    setCartItems(updated);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin mengosongkan seluruh isi keranjang?",
      )
    ) {
      const updated = clearCart();
      setCartItems(updated);
    }
  };

  // Promo code handler
  const handleApplyPromo = (e) => {
    e?.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoMessage({
        type: "danger",
        text: "Masukkan kode voucher terlebih dahulu.",
      });
      return;
    }

    if (code === "DISKON10") {
      setAppliedPromo(code);
      setPromoMessage({
        type: "success",
        text: "Voucher DISKON10 berhasil digunakan! Diskon 10% diterapkan.",
      });
    } else if (code === "HEMAT20") {
      setAppliedPromo(code);
      setPromoMessage({
        type: "success",
        text: "Voucher HEMAT20 berhasil digunakan! Potongan Rp 20.000 diterapkan.",
      });
    } else if (code === "GRATISONGKIR") {
      setAppliedPromo(code);
      setPromoMessage({
        type: "success",
        text: "Voucher GRATISONGKIR berhasil digunakan! Diskon ongkir hingga Rp 15.000.",
      });
    } else {
      setPromoMessage({
        type: "danger",
        text: "Kode voucher tidak valid atau sudah kedaluwarsa.",
      });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo("");
    setPromoInput("");
    setPromoMessage({ type: "", text: "" });
  };

  // Process Final Order Checkout
  const handleProcessCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError("");

    if (summary.selectedItems.length === 0) {
      setCheckoutError(
        "Silakan pilih minimal 1 produk di keranjang untuk checkout.",
      );
      return;
    }

    if (!shippingData.recipientName.trim()) {
      setCheckoutError("Nama lengkap penerima wajib diisi.");
      return;
    }

    if (!shippingData.phone.trim()) {
      setCheckoutError("Nomor telepon/WhatsApp penerima wajib diisi.");
      return;
    }

    if (!shippingData.address.trim()) {
      setCheckoutError("Alamat lengkap tujuan pengiriman wajib diisi.");
      return;
    }

    // Ambil user_id sesuai akun pengguna yang sedang login
    const activeUserId = getCurrentUserId(user);
    if (!activeUserId) {
      setCheckoutError(
        "Anda belum login. Silakan masuk (login) terlebih dahulu untuk memproses pesanan.",
      );
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const paymentMethodObj =
        PAYMENT_METHODS.find((p) => p.id === selectedPaymentMethod) ||
        PAYMENT_METHODS[0];

      // Format nama kurir ekspedisi (contoh: Free Shipping, JNE, SiCepat, J&T, GoSend, POS)
      const courierMap = {
        free: "Free Shipping",
        jne: "JNE",
        sicepat: "SiCepat",
        jnt: "J&T",
        gosend: "GoSend",
        pos: "POS Indonesia",
      };
      const courierName =
        courierMap[selectedExpedition.id] ||
        selectedExpedition.name.split(" ")[0] ||
        "Free Shipping";

      // Format nama metode pembayaran (contoh: Midtrans Payment Gateway, QRIS, BCA Virtual Account, COD)
      const paymentMethodMap = {
        midtrans: "Midtrans Payment Gateway",
        qris: "QRIS",
        bca_va: "BCA Virtual Account",
        mandiri_va: "Mandiri Virtual Account",
        bri_va: "BRI Virtual Account",
        cod: "COD",
      };
      const paymentMethodName =
        paymentMethodMap[selectedPaymentMethod] ||
        paymentMethodObj.name ||
        "Midtrans Payment Gateway";

      // Alamat pengiriman gabungan lengkap
      const fullShippingAddress = [
        shippingData.address.trim(),
        shippingData.city,
        shippingData.postalCode,
      ]
        .filter(Boolean)
        .join(", ");

      // Format item list sesuai spesifikasi backend
      const orderItems = summary.selectedItems.map((item) => ({
        product_id: Number(item.id || item.productId),
        product_name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));

      // Siapkan payload JSON sesuai format endpoint backend
      const payloadData = {
        recipient_name: shippingData.recipientName.trim(),
        recipient_phone: shippingData.phone.trim(),
        shipping_address: fullShippingAddress,
        shipping_courier: courierName,
        payment_method: paymentMethodName,
        payment_status: "UNPAID",
        shipping_cost: Number(
          summary.shippingRate || selectedExpedition.cost || 0,
        ),
        user_id: Number(activeUserId),
        items: orderItems,
      };

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: ORDERS_API_URL,
        headers: headers,
        data: JSON.stringify(payloadData),
      };

      const response = await axios.request(config);
      console.log("Order API response:", response.data);

      const resData = response.data;
      if (
        resData &&
        (resData.success || response.status === 200 || response.status === 201)
      ) {
        const orderData = resData.data || {};

        // Sinkronkan order yang baru dibuat ke riwayat lokal & tampilan nota sukses
        const savedOrderPayload = {
          orderId:
            orderData.invoice_number || `INV-${orderData.id || Date.now()}`,
          backendId: orderData.id,
          invoiceNumber: orderData.invoice_number,
          items: summary.selectedItems,
          totalItemsCount: summary.selectedItemsCount,
          subtotal: summary.subtotal,
          shippingCost: Number(orderData.shipping_cost) || summary.shippingRate,
          discount: Number(orderData.discount_amount) || summary.discount,
          adminFee: summary.adminFee,
          totalPayment: Number(orderData.grand_total) || summary.totalPayment,
          voucherCode: appliedPromo || null,
          shipping: {
            recipientName:
              orderData.recipient_name || shippingData.recipientName.trim(),
            phone: orderData.recipient_phone || shippingData.phone.trim(),
            address: orderData.shipping_address || fullShippingAddress,
            city: shippingData.city,
            postalCode: shippingData.postalCode,
            notes: shippingData.notes.trim() || "-",
            expedition: orderData.shipping_courier || selectedExpedition.name,
          },
          payment: {
            methodId: selectedPaymentMethod,
            methodName: orderData.payment_method || paymentMethodName,
            category: paymentMethodObj.category,
            vaNumber: paymentMethodObj.vaNumber || null,
          },
          customer: user
            ? { name: user.name, email: user.email }
            : { id: activeUserId },
          rawBackendData: orderData,
        };

        saveOrderToHistory(savedOrderPayload);
        clearSelectedCartItems();
        setCompletedOrder(savedOrderPayload);
        setCurrentStep("success");
      } else {
        throw new Error(
          resData?.message || "Gagal memproses pesanan di backend.",
        );
      }
    } catch (err) {
      console.error("Error saat membuat pesanan:", err);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Terjadi kesalahan saat memproses pesanan ke backend.";
      setCheckoutError(serverMessage);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const copyToClipboard = (text, fieldKey) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div className="container py-4 py-md-5" id="keranjang-page-container">
      {/* Step Indicator Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 pb-3 mb-4 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2.5 bg-info text-white rounded-3 d-inline-flex shadow-sm">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className="h3 fw-bold text-dark mb-0">
              {currentStep === "cart" && "Keranjang Belanja"}
              {currentStep === "checkout" && "Checkout Pembayaran"}
              {currentStep === "success" && "Pesanan Berhasil Dibuat!"}
            </h1>
            <p className="text-muted small mb-0">
              {currentStep === "cart" &&
                "Periksa daftar barang yang akan Anda beli sebelum checkout."}
              {currentStep === "checkout" &&
                "Lengkapi alamat pengiriman dan pilih metode pembayaran resmi."}
              {currentStep === "success" &&
                "Terima kasih, pesanan Anda telah tersimpan dan siap diproses."}
            </p>
          </div>
        </div>

        {/* Breadcrumb Steps */}
        <div className="d-flex align-items-center gap-2 small bg-white px-3 py-2 rounded-pill border shadow-xs">
          <span
            className={`d-inline-flex align-items-center gap-1 fw-semibold ${
              currentStep === "cart" ? "text-info" : "text-success"
            }`}
          >
            <span
              className="badge rounded-circle p-1 bg-info text-white"
              style={{ width: "18px", height: "18px", fontSize: "10px" }}
            >
              1
            </span>
            <span>Keranjang</span>
          </span>
          <ArrowRight size={14} className="text-muted" />
          <span
            className={`d-inline-flex align-items-center gap-1 fw-semibold ${
              currentStep === "checkout"
                ? "text-info"
                : currentStep === "success"
                  ? "text-success"
                  : "text-muted"
            }`}
          >
            <span
              className={`badge rounded-circle p-1 ${
                currentStep === "checkout" || currentStep === "success"
                  ? "bg-primary text-white"
                  : "bg-light text-muted border"
              }`}
              style={{ width: "18px", height: "18px", fontSize: "10px" }}
            >
              2
            </span>
            <span>Pengiriman</span>
          </span>
          <ArrowRight size={14} className="text-muted" />
          <span
            className={`d-inline-flex align-items-center gap-1 fw-semibold ${
              currentStep === "success" ? "text-success" : "text-muted"
            }`}
          >
            <span
              className={`badge rounded-circle p-1 ${
                currentStep === "success"
                  ? "bg-success text-white"
                  : "bg-light text-muted border"
              }`}
              style={{ width: "18px", height: "18px", fontSize: "10px" }}
            >
              3
            </span>
            <span>Selesai</span>
          </span>
        </div>
      </div>

      {/* ================= STEP 1: CART ITEMS VIEW ================= */}
      {currentStep === "cart" && (
        <>
          {cartItems.length === 0 ? (
            <div
              className="card border-0 shadow-sm rounded-4 bg-white p-5 text-center my-4"
              id="empty-cart-state"
            >
              <div className="card-body p-4">
                <div className="p-4 bg-light text-muted rounded-circle d-inline-flex mb-3 border">
                  <ShoppingBag size={48} className="text-dark" />
                </div>
                <h4 className="fw-bold text-dark mb-2">
                  Keranjang Belanja Anda Kosong
                </h4>
                <p
                  className="text-muted mb-4 small mx-auto"
                  style={{ maxWidth: "420px" }}
                >
                  Belum ada produk yang dimasukkan ke keranjang. Jelajahi ribuan
                  produk berkualitas dengan harga terbaik sekarang!
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <Link
                    to="/produk"
                    className="btn btn-info px-4 py-2.5 rounded-3 fw-semibold shadow-sm d-inline-flex align-items-center gap-2"
                    id="btn-empty-cart-shop"
                  >
                    <ShoppingBag size={18} />
                    <span>Mulai Belanja Produk</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {/* Left Column: Cart Items List */}
              <div className="col-12 col-lg-8">
                {/* Select All Bar */}
                <div className="card border-0 shadow-sm rounded-3 mb-3 bg-white">
                  <div className="card-body px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <label className="form-check-label d-flex align-items-center gap-2 fw-semibold text-dark cursor-pointer mb-0">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        id="checkbox-select-all"
                      />
                      <span>Pilih Semua ({cartItems.length} Produk)</span>
                    </label>

                    <button
                      type="button"
                      className="btn btn-link text-danger text-decoration-none p-0 small fw-medium d-inline-flex align-items-center gap-1"
                      onClick={handleClearAll}
                      id="btn-clear-cart"
                    >
                      <Trash2 size={15} />
                      <span>Kosongkan Keranjang</span>
                    </button>
                  </div>
                </div>

                {/* List of Cart Items */}
                <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush">
                      {cartItems.map((item) => (
                        <li
                          key={item.id}
                          className="list-group-item p-3 p-md-4"
                        >
                          <div className="d-flex align-items-start gap-3">
                            {/* Checkbox */}
                            <div className="pt-2">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={Boolean(item.selected)}
                                onChange={() => handleToggleSelect(item.id)}
                                id={`cart-item-checkbox-${item.id}`}
                              />
                            </div>

                            {/* Thumbnail */}
                            <div
                              className="rounded-3 overflow-hidden border bg-light flex-shrink-0 position-relative shadow-xs"
                              style={{ width: "80px", height: "80px" }}
                            >
                              <img
                                src={getProductPhotoUrl(item)}
                                alt={item.name}
                                className="w-100 h-100 object-fit-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
                                }}
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-grow-1 overflow-hidden">
                              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-1 mb-1">
                                <div>
                                  <span
                                    className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill small mb-1"
                                    style={{ fontSize: "10px" }}
                                  >
                                    {item.categoryName || "Produk"}
                                  </span>
                                  <h6
                                    className="fw-bold text-dark mb-1 text-truncate"
                                    style={{ maxWidth: "360px" }}
                                  >
                                    {item.name}
                                  </h6>
                                </div>
                                <span className="fw-bold text-success fs-6">
                                  {formatRupiah(item.price)}
                                </span>
                              </div>

                              {/* Quantity Stepper & Delete */}
                              <div className="d-flex align-items-center justify-content-between mt-3 flex-wrap gap-2">
                                <span className="text-muted small">
                                  Stok tersedia:{" "}
                                  <strong className="text-dark">
                                    {item.stock || 99}
                                  </strong>
                                </span>

                                <div className="d-flex align-items-center gap-3">
                                  {/* Qty Stepper */}
                                  <div
                                    className="input-group input-group-sm"
                                    style={{ width: "120px" }}
                                  >
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary"
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.id,
                                          item.quantity - 1,
                                        )
                                      }
                                      disabled={item.quantity <= 1}
                                      aria-label="Kurangi jumlah"
                                    >
                                      <Minus size={13} />
                                    </button>
                                    <input
                                      type="number"
                                      className="form-control text-center px-1 fw-semibold"
                                      value={item.quantity}
                                      min="1"
                                      max={item.stock || 999}
                                      onChange={(e) =>
                                        handleQuantityChange(
                                          item.id,
                                          Number(e.target.value) || 1,
                                        )
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary"
                                      onClick={() =>
                                        handleQuantityChange(
                                          item.id,
                                          item.quantity + 1,
                                        )
                                      }
                                      disabled={
                                        item.quantity >= (item.stock || 999)
                                      }
                                      aria-label="Tambah jumlah"
                                    >
                                      <Plus size={13} />
                                    </button>
                                  </div>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm p-1.5 rounded-2"
                                    onClick={() => handleRemove(item.id)}
                                    title="Hapus dari keranjang"
                                    id={`btn-remove-item-${item.id}`}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Back to Products */}
                <div className="mt-3">
                  <Link
                    to="/produk"
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1.5"
                  >
                    <ArrowLeft size={15} />
                    <span>Lanjut Belanja Produk Lain</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Order Summary & Voucher */}
              <div className="col-12 col-lg-4">
                {/* Voucher Code Box */}
                <div className="card border-0 shadow-sm rounded-3 bg-white mb-3">
                  <div className="card-body p-3">
                    <label className="form-label small fw-semibold text-dark mb-2 d-flex align-items-center gap-1.5">
                      <Tag size={15} className="text-primary" />
                      <span>Voucher Promo Toko</span>
                    </label>

                    {appliedPromo ? (
                      <div className="p-2.5 bg-success-subtle border border-success-subtle rounded-3 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <CheckCircle2
                            size={18}
                            className="text-success flex-shrink-0"
                          />
                          <div>
                            <span className="fw-bold text-success d-block small">
                              {appliedPromo}
                            </span>
                            <span
                              className="text-muted"
                              style={{ fontSize: "11px" }}
                            >
                              Potongan {formatRupiah(summary.discount)} aktif
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-link text-danger p-0 small fw-semibold text-decoration-none"
                          onClick={handleRemovePromo}
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleApplyPromo}
                        className="d-flex gap-2"
                      >
                        <input
                          type="text"
                          className="form-control form-control-sm text-uppercase"
                          placeholder="Kode: DISKON10"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          id="input-voucher-code"
                        />
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm px-3 fw-semibold flex-shrink-0"
                          id="btn-apply-voucher"
                        >
                          Gunakan
                        </button>
                      </form>
                    )}

                    {promoMessage.text && (
                      <div
                        className={`mt-2 small text-${promoMessage.type}`}
                        style={{ fontSize: "11.5px" }}
                      >
                        {promoMessage.text}
                      </div>
                    )}

                    {/* Quick Voucher Chips */}
                    {!appliedPromo && (
                      <div className="mt-2 pt-2 border-top">
                        <span
                          className="text-muted d-block mb-1"
                          style={{ fontSize: "11px" }}
                        >
                          Voucher Tersedia (Klik untuk pakai):
                        </span>
                        <div className="d-flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="btn btn-xs btn-light border rounded-pill py-0.5 px-2 text-primary fw-semibold"
                            style={{ fontSize: "10.5px" }}
                            onClick={() => {
                              setPromoInput("DISKON10");
                              setAppliedPromo("DISKON10");
                              setPromoMessage({
                                type: "success",
                                text: "Voucher DISKON10 berhasil digunakan!",
                              });
                            }}
                          >
                            DISKON10 (Diskon 10%)
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-light border rounded-pill py-0.5 px-2 text-primary fw-semibold"
                            style={{ fontSize: "10.5px" }}
                            onClick={() => {
                              setPromoInput("HEMAT20");
                              setAppliedPromo("HEMAT20");
                              setPromoMessage({
                                type: "success",
                                text: "Voucher HEMAT20 berhasil digunakan!",
                              });
                            }}
                          >
                            HEMAT20 (Rp 20.000)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Card */}
                <div
                  className="card border-0 shadow-sm rounded-3 bg-white sticky-top"
                  style={{ top: "85px" }}
                >
                  <div className="card-body p-4">
                    <h5 className="fw-bold text-dark mb-3">
                      Ringkasan Belanja
                    </h5>

                    <div className="d-flex justify-content-between text-muted small mb-2">
                      <span>Total Produk Dipilih</span>
                      <span className="fw-semibold text-dark">
                        {summary.selectedItemsCount} barang
                      </span>
                    </div>

                    <div className="d-flex justify-content-between text-muted small mb-2">
                      <span>Subtotal Harga</span>
                      <span className="fw-semibold text-dark">
                        {formatRupiah(summary.subtotal)}
                      </span>
                    </div>

                    {summary.discount > 0 && (
                      <div className="d-flex justify-content-between text-success small mb-2">
                        <span>Diskon Voucher ({appliedPromo})</span>
                        <span className="fw-bold">
                          -{formatRupiah(summary.discount)}
                        </span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between text-muted small mb-3">
                      <span>Biaya Proteksi Layanan</span>
                      <span className="fw-semibold text-info">
                        {formatRupiah(summary.adminFee)}
                      </span>
                    </div>

                    <hr className="my-3" />

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <span className="text-muted small d-block">
                          Total Estimasi
                        </span>
                        <span className="h4 fw-bold text-success mb-0">
                          {formatRupiah(summary.totalPayment)}
                        </span>
                      </div>
                    </div>

                    {/* Checkout Action Button */}
                    <button
                      type="button"
                      className="btn btn-info text-light w-100 py-2.5 rounded-3 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
                      disabled={!someSelected}
                      onClick={() => setCurrentStep("checkout")}
                      id="btn-proceed-to-checkout"
                    >
                      <span>Lanjut ke Pengiriman</span>
                      <ArrowRight size={18} />
                    </button>

                    {!someSelected && (
                      <p
                        className="text-danger small text-center mt-2 mb-0"
                        style={{ fontSize: "11.5px" }}
                      >
                        Pilih minimal 1 produk untuk melanjutkan checkout.
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-top text-center text-muted small d-flex align-items-center justify-content-center gap-1.5">
                      <ShieldCheck size={16} className="text-success" />
                      <span style={{ fontSize: "11.5px" }}>
                        Transaksi 100% Aman & Terenkripsi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= STEP 2: CHECKOUT & SHIPPING FORM ================= */}
      {currentStep === "checkout" && (
        <form onSubmit={handleProcessCheckout} id="checkout-form">
          <div className="row g-4">
            {/* Left Column: Delivery Address & Payment */}
            <div className="col-12 col-lg-8">
              {checkoutError && (
                <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mb-4 py-2.5 px-3 rounded-3 shadow-xs">
                  <div className="d-flex align-items-center gap-2">
                    <AlertCircle
                      size={18}
                      className="text-danger flex-shrink-0"
                    />
                    <span className="fw-medium small">{checkoutError}</span>
                  </div>
                  {!getCurrentUserId(user) && (
                    <Link
                      to="/login"
                      className="btn btn-sm btn-danger text-nowrap px-3 py-1 fw-semibold"
                    >
                      Login Sekarang
                    </Link>
                  )}
                </div>
              )}

              {/* 1. Alamat Pengiriman */}
              <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
                <div className="card-header bg-light border-bottom py-3 px-4">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <MapPin size={18} className="text-primary" />
                    <span>1. Alamat Tujuan Pengiriman</span>
                  </h6>
                </div>

                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Nama Lengkap Penerima{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-light text-muted">
                          <User size={15} />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nama Penerima Paket"
                          value={shippingData.recipientName}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              recipientName: e.target.value,
                            })
                          }
                          required
                          id="checkout-recipient-name"
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Nomor Telepon / WhatsApp{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-light text-muted">
                          <Phone size={15} />
                        </span>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Contoh: 081234567890"
                          value={shippingData.phone}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              phone: e.target.value,
                            })
                          }
                          required
                          id="checkout-phone"
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">
                        Alamat Lengkap & Nomor Rumah / Gedung{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                        value={shippingData.address}
                        onChange={(e) =>
                          setShippingData({
                            ...shippingData,
                            address: e.target.value,
                          })
                        }
                        required
                        id="checkout-address"
                      ></textarea>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Kota / Kabupaten
                      </label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-light text-muted">
                          <Building size={15} />
                        </span>
                        <select
                          className="form-select"
                          value={shippingData.city}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              city: e.target.value,
                            })
                          }
                          id="checkout-city"
                        >
                          <option value="Jakarta Selatan">
                            Jakarta Selatan
                          </option>
                          <option value="Jakarta Pusat">Jakarta Pusat</option>
                          <option value="Jakarta Barat">Jakarta Barat</option>
                          <option value="Jakarta Timur">Jakarta Timur</option>
                          <option value="Jakarta Utara">Jakarta Utara</option>
                          <option value="Kota Bandung">Kota Bandung</option>
                          <option value="Kota Surabaya">Kota Surabaya</option>
                          <option value="Kota Semarang">Kota Semarang</option>
                          <option value="Kota Medan">Kota Medan</option>
                          <option value="Kota Makassar">Kota Makassar</option>
                          <option value="Kota Denpasar">Kota Denpasar</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-dark">
                        Kode Pos
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="12190"
                        value={shippingData.postalCode}
                        onChange={(e) =>
                          setShippingData({
                            ...shippingData,
                            postalCode: e.target.value,
                          })
                        }
                        id="checkout-postal-code"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-dark">
                        Catatan Pengiriman (Opsional)
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Contoh: Titipkan di pos satpam jika tidak ada orang"
                        value={shippingData.notes}
                        onChange={(e) =>
                          setShippingData({
                            ...shippingData,
                            notes: e.target.value,
                          })
                        }
                        id="checkout-notes"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Pilihan Jasa Ekspedisi Kurir */}
              <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
                <div className="card-header bg-light border-bottom py-3 px-4">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <Truck size={18} className="text-primary" />
                    <span>2. Opsi Kurir & Pengiriman</span>
                  </h6>
                </div>

                <div className="card-body p-4">
                  <div className="row g-2.5">
                    {EXPEDITIONS.map((exp) => (
                      <div key={exp.id} className="col-12 col-sm-6">
                        <label
                          className={`p-3 border rounded-3 d-flex align-items-center justify-content-between cursor-pointer w-100 transition-all ${
                            shippingData.expeditionId === exp.id
                              ? "border-primary bg-primary-subtle text-dark shadow-xs"
                              : "border-light-subtle bg-light hover:border-primary"
                          }`}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-center gap-2.5">
                            <input
                              type="radio"
                              name="expedition"
                              className="form-check-input mt-0"
                              checked={shippingData.expeditionId === exp.id}
                              onChange={() =>
                                setShippingData({
                                  ...shippingData,
                                  expeditionId: exp.id,
                                })
                              }
                            />
                            <div>
                              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                <span className="fw-semibold small text-dark">
                                  {exp.logo} {exp.name}
                                </span>
                                {exp.cost === 0 && (
                                  <span
                                    className="badge bg-success text-white py-0.5 px-1.5 fw-semibold"
                                    style={{ fontSize: "10px" }}
                                  >
                                    GRATIS
                                  </span>
                                )}
                              </div>
                              <span
                                className="text-muted d-block"
                                style={{ fontSize: "11px" }}
                              >
                                {exp.desc || "Estimasi pengiriman reguler"}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`fw-bold small ${exp.cost === 0 ? "text-success" : "text-primary"} text-nowrap ms-2`}
                          >
                            {exp.cost === 0
                              ? "Rp 0 (Gratis)"
                              : formatRupiah(exp.cost)}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Pilihan Metode Pembayaran */}
              <div className="card border-0 shadow-sm rounded-3 bg-white mb-4">
                <div className="card-header bg-light border-bottom py-3 px-4">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <CreditCard size={18} className="text-primary" />
                    <span>3. Metode Pembayaran</span>
                  </h6>
                </div>

                <div className="card-body p-4">
                  <div className="d-flex flex-column gap-2.5">
                    {PAYMENT_METHODS.map((pm) => {
                      const IconComponent = pm.icon;
                      const isSelected = selectedPaymentMethod === pm.id;
                      return (
                        <label
                          key={pm.id}
                          className={`p-3 border rounded-3 d-flex align-items-center justify-content-between cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary-subtle shadow-xs"
                              : "border-light-subtle bg-light hover:border-primary"
                          }`}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              className="form-check-input mt-0"
                              checked={isSelected}
                              onChange={() => setSelectedPaymentMethod(pm.id)}
                            />
                            <div className="p-2 bg-white rounded-2 border text-primary flex-shrink-0">
                              <IconComponent size={20} />
                            </div>
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold text-dark small">
                                  {pm.name}
                                </span>
                                <span
                                  className="badge bg-secondary-subtle text-secondary rounded-pill"
                                  style={{ fontSize: "10px" }}
                                >
                                  {pm.category}
                                </span>
                              </div>
                              <span
                                className="text-muted"
                                style={{ fontSize: "11.5px" }}
                              >
                                {pm.desc}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <Check
                              size={18}
                              className="text-primary flex-shrink-0"
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Checkout Item Review & Pay Button */}
            <div className="col-12 col-lg-4">
              <div
                className="card border-0 shadow-sm rounded-3 bg-white sticky-top"
                style={{ top: "85px" }}
              >
                <div className="card-header bg-light border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold text-dark mb-0">Rincian Tagihan</h6>
                  <span className="badge bg-primary rounded-pill">
                    {summary.selectedItemsCount} Item
                  </span>
                </div>

                <div className="card-body p-4">
                  {/* Selected Items Snapshot */}
                  <div
                    className="mb-3 max-h-48 overflow-auto pe-1"
                    style={{ maxHeight: "180px" }}
                  >
                    {summary.selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="d-flex align-items-center justify-content-between gap-2 py-2 border-bottom text-muted small"
                      >
                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                          <span className="fw-bold text-dark">
                            {item.quantity}x
                          </span>
                          <span
                            className="text-truncate text-dark"
                            style={{ maxWidth: "160px" }}
                          >
                            {item.name}
                          </span>
                        </div>
                        <span className="fw-semibold text-dark flex-shrink-0">
                          {formatRupiah(
                            (item.price || 0) * (item.quantity || 1),
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>Subtotal Produk</span>
                    <span className="fw-semibold text-dark">
                      {formatRupiah(summary.subtotal)}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between text-muted small mb-2">
                    <span>
                      Biaya Pengiriman (
                      {selectedExpedition.id === "free"
                        ? "Free Shipping"
                        : selectedExpedition.name.split(" ")[0]}
                      )
                    </span>
                    <span
                      className={`fw-semibold ${selectedExpedition.cost === 0 ? "text-success fw-bold" : "text-dark"}`}
                    >
                      {selectedExpedition.cost === 0
                        ? "Rp 0 (Gratis)"
                        : formatRupiah(summary.shippingRate)}
                    </span>
                  </div>

                  {summary.discount > 0 && (
                    <div className="d-flex justify-content-between text-success small mb-2">
                      <span>Potongan Promo ({appliedPromo})</span>
                      <span className="fw-bold">
                        -{formatRupiah(summary.discount)}
                      </span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between text-muted small mb-3">
                    <span>Biaya Layanan & Asuransi</span>
                    <span className="fw-semibold text-dark">
                      {formatRupiah(summary.adminFee)}
                    </span>
                  </div>

                  <hr className="my-3" />

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <span className="text-muted small d-block">
                        Total Tagihan Final
                      </span>
                      <span className="h4 fw-bold text-primary mb-0">
                        {formatRupiah(summary.totalPayment)}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-success w-100 py-2.5 rounded-3 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm text-white"
                    disabled={isProcessingCheckout}
                    id="btn-submit-order"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></div>
                        <span>Membuat Pesanan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>
                          Bayar Sekarang ({formatRupiah(summary.totalPayment)})
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 mt-2 py-2 rounded-3 small fw-medium"
                    onClick={() => setCurrentStep("cart")}
                    disabled={isProcessingCheckout}
                  >
                    Kembali ke Keranjang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= STEP 3: ORDER SUCCESS / INVOICE ================= */}
      {currentStep === "success" && completedOrder && (
        <div className="row justify-content-center" id="order-success-section">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white">
              {/* Header Banner */}
              <div className="bg-success text-white p-4 p-md-5 text-center">
                <div className="p-3 bg-white text-success rounded-circle d-inline-flex mb-3 shadow-sm">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="fw-bold mb-1">Pesanan Berhasil Dibuat!</h3>
                <p className="opacity-90 small mb-0">
                  Nomor Pesanan:{" "}
                  <strong className="text-white bg-success-subtle bg-opacity-25 px-2 py-0.5 rounded font-monospace">
                    {completedOrder.orderId}
                  </strong>
                </p>
              </div>

              {/* Body Details */}
              <div className="card-body p-4 p-md-5">
                {/* Payment Instructions Card */}
                {completedOrder.payment.methodId === "midtrans" ? (
                  <div className="p-4 bg-light rounded-3 border mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary px-2.5 py-1 d-inline-flex align-items-center gap-1">
                        <ShieldCheck size={14} />
                        <span>Midtrans Payment Gateway</span>
                      </span>
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                        Menunggu Pembayaran
                      </span>
                    </div>
                    <h6 className="fw-bold text-dark mb-2">
                      Instruksi Pembayaran Midtrans Snap
                    </h6>
                    <p className="text-muted small mb-3">
                      Pesanan Anda telah tercatat. Anda dapat menyelesaikan
                      transaksi melalui berbagai channel resmi Midtrans seperti
                      Kartu Kredit, GoPay, ShopeePay, Virtual Account Bank (BCA,
                      Mandiri, BNI, BRI, Permata), atau Gerai Minimarket
                      (Alfamart / Indomaret).
                    </p>
                    <div className="p-3 bg-white rounded-3 border d-flex flex-column gap-2 mb-3">
                      <div className="d-flex justify-content-between small text-muted">
                        <span>Nomor Invoice:</span>
                        <strong className="text-dark font-monospace">
                          {completedOrder.orderId}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between small text-muted">
                        <span>Gateway:</span>
                        <span className="fw-semibold text-dark">
                          Midtrans Payment Gateway
                        </span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted border-top pt-2">
                        <span>Total Tagihan:</span>
                        <strong className="text-primary fs-6">
                          {formatRupiah(completedOrder.totalPayment)}
                        </strong>
                      </div>
                    </div>
                    <div className="d-flex flex-column flex-sm-row gap-2">
                      <Link
                        to="/transaksi"
                        className="btn btn-primary btn-sm flex-fill d-inline-flex align-items-center justify-content-center gap-1.5 py-2 shadow-xs"
                      >
                        <Receipt size={16} />
                        <span>Lihat Status di Riwayat Transaksi</span>
                      </Link>
                    </div>
                  </div>
                ) : completedOrder.payment.methodId === "qris" ? (
                  <div className="p-4 bg-light rounded-3 border text-center mb-4">
                    <span className="badge bg-primary mb-2">
                      Scan QRIS untuk Pembayaran
                    </span>
                    <h6 className="fw-bold text-dark mb-3">
                      Scan QR Code di Bawah dengan Aplikasi E-Wallet / Mobile
                      Banking
                    </h6>
                    <div className="p-3 bg-white rounded-3 border d-inline-block shadow-xs mb-3">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TOKO_ONLINE_PAYMENT_TRX"
                        alt="QRIS Code"
                        className="img-fluid"
                        style={{ width: "180px", height: "180px" }}
                      />
                    </div>
                    <div className="small text-muted">
                      Total Nominal Pembayaran:{" "}
                      <strong className="text-primary fs-6">
                        {formatRupiah(completedOrder.totalPayment)}
                      </strong>
                    </div>
                  </div>
                ) : completedOrder.payment.vaNumber ? (
                  <div className="p-4 bg-light rounded-3 border mb-4">
                    <span className="badge bg-primary mb-2">
                      Nomor Virtual Account
                    </span>
                    <h6 className="fw-bold text-dark mb-3">
                      {completedOrder.payment.methodName}
                    </h6>
                    <div className="p-3 bg-white rounded-3 border d-flex align-items-center justify-content-between mb-2">
                      <span className="h5 fw-bold font-monospace text-dark mb-0">
                        {completedOrder.payment.vaNumber}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                        onClick={() =>
                          copyToClipboard(completedOrder.payment.vaNumber, "va")
                        }
                      >
                        {copiedField === "va" ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        <span>
                          {copiedField === "va" ? "Tersalin" : "Salin Nomor"}
                        </span>
                      </button>
                    </div>
                    <div className="small text-muted d-flex justify-content-between">
                      <span>Total Tagihan:</span>
                      <strong className="text-primary">
                        {formatRupiah(completedOrder.totalPayment)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-light rounded-3 border mb-4 text-center">
                    <Truck size={36} className="text-primary mb-2" />
                    <h6 className="fw-bold text-dark mb-1">
                      Metode COD (Bayar di Tempat)
                    </h6>
                    <p className="text-muted small mb-0">
                      Siapkan uang tunai sejumlah{" "}
                      <strong className="text-dark">
                        {formatRupiah(completedOrder.totalPayment)}
                      </strong>{" "}
                      saat kurir mengantarkan barang ke alamat Anda.
                    </p>
                  </div>
                )}

                {/* Ordered Items Summary */}
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <Receipt size={18} className="text-primary" />
                  <span>Rincian Barang yang Dipesan</span>
                </h6>

                <div className="table-responsive mb-4">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr className="small text-muted">
                        <th>Produk</th>
                        <th className="text-center">Jumlah</th>
                        <th className="text-end">Harga Satuan</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {completedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-semibold text-dark">{item.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">
                            {formatRupiah(item.price)}
                          </td>
                          <td className="text-end fw-semibold">
                            {formatRupiah(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="small table-light">
                      <tr>
                        <td colSpan="3" className="text-end">
                          Biaya Pengiriman ({completedOrder.shipping.expedition}
                          )
                        </td>
                        <td
                          className={`text-end fw-semibold ${completedOrder.shippingCost === 0 ? "text-success" : ""}`}
                        >
                          {completedOrder.shippingCost === 0
                            ? "Rp 0 (Gratis)"
                            : formatRupiah(completedOrder.shippingCost)}
                        </td>
                      </tr>
                      {completedOrder.discount > 0 && (
                        <tr className="text-success">
                          <td colSpan="3" className="text-end">
                            Diskon Voucher ({completedOrder.voucherCode})
                          </td>
                          <td className="text-end fw-bold">
                            -{formatRupiah(completedOrder.discount)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" className="text-end">
                          Biaya Layanan & Asuransi
                        </td>
                        <td className="text-end fw-semibold">
                          {formatRupiah(completedOrder.adminFee)}
                        </td>
                      </tr>
                      <tr className="table-primary fw-bold fs-6">
                        <td colSpan="3" className="text-end">
                          Total Pembayaran
                        </td>
                        <td className="text-end text-primary">
                          {formatRupiah(completedOrder.totalPayment)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Shipping Destination */}
                <div className="p-3 bg-light rounded-3 border small mb-4">
                  <span className="fw-bold text-dark d-block mb-1">
                    Alamat Pengiriman:
                  </span>
                  <span className="text-dark fw-semibold d-block">
                    {completedOrder.shipping.recipientName} (
                    {completedOrder.shipping.phone})
                  </span>
                  <span className="text-muted d-block">
                    {completedOrder.shipping.address},{" "}
                    {completedOrder.shipping.city}{" "}
                    {completedOrder.shipping.postalCode}
                  </span>
                  {completedOrder.shipping.notes && (
                    <span className="text-muted d-block mt-1 font-italic">
                      Catatan: {completedOrder.shipping.notes}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
                  <Link
                    to="/transaksi"
                    className="btn btn-primary px-4 py-2 d-inline-flex align-items-center justify-content-center gap-1.5 fw-semibold"
                  >
                    <Receipt size={16} />
                    <span>Lihat Daftar Transaksi</span>
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2 d-inline-flex align-items-center justify-content-center gap-1.5"
                    onClick={() => window.print()}
                  >
                    <FileText size={16} />
                    <span>Cetak Bukti</span>
                  </button>
                  <Link
                    to="/produk"
                    className="btn btn-outline-primary px-4 py-2 d-inline-flex align-items-center justify-content-center gap-1.5 fw-semibold"
                  >
                    <ShoppingBag size={16} />
                    <span>Belanja Lagi</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
