import {
  NavLink,
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import headerImg from "../assets/header-vin.shop.jpg";
import { Button, Card } from "react-bootstrap";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Grid,
  Package,
  ShoppingCart,
  Star,
  Tag,
  Check,
  Truck,
  BadgeCheck,
  PackageX,
} from "lucide-react";
import {
  fetchProducts,
  getAuthToken,
  getProductPhotoUrl,
  DEFAULT_PRODUCTS,
} from "../utils/auth";
import { addToCart, getCartItems } from "../utils/cart";
import RotatingWord from "../components/RotatingWord";

export default function HomePage() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS.slice(0, 3));
  const [loading, setLoading] = useState(false);
  const [addedItem, setAddedItem] = useState(null);

  const loadFeatured = useCallback(async () => {
    setLoading(true);
    const token = getAuthToken();
    try {
      const res = await fetchProducts({ page: 1, limit: 3, token });
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        setProducts(res.data.slice(0, 3));
      } else {
        setProducts(DEFAULT_PRODUCTS.slice(0, 3));
      }
    } catch (err) {
      console.warn("Gagal memuat produk unggulan:", err.message);
      setProducts(DEFAULT_PRODUCTS.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedItem(product.name);
    setTimeout(() => setAddedItem(null), 3500);
  };

  const formatIDR = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);

  return (
    <div className="container py-5" id="home-page-container">
      {/* Hero / Banner Card */}
      <header className="bg-light py-5">
        <Card bg="dark">
          <div className="container px-5">
            <div className="row gx-5 align-items-center justify-content-center">
              <div className="col-lg-8 col-xl-7 col-xxl-6">
                <div className="my-5 text-center text-xl-start">
                  <Card.Title className="display-5 fw-bolder text-white mb-2">
                    V1N.Shop <RotatingWord /> untuk Semua Kebutuhan Anda
                  </Card.Title>
                  <Card.Text className="lead fw-normal text-white-50 mb-4">
                    Ribuan produk berkualitas, harga terjangkau, dan pengiriman
                    cepat ke seluruh Indonesia. Belanja jadi lebih mudah!
                  </Card.Text>
                  <div className="d-grid gap-3 d-sm-flex justify-content-sm-center justify-content-xl-start">
                    <Button
                      className="btn btn-info btn-lg px-4 me-sm-3 text-light"
                      href="#produk-unggulan"
                    >
                      Belanja Sekarang
                    </Button>
                    <Link
                      to="/produk"
                      className="btn btn-outline-light px-4 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-2"
                    >
                      <span>Lihat Semua Produk</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-xl-5 col-xxl-6 d-none d-xl-block text-center">
                <img
                  className="img-fluid rounded-3 my-5"
                  src={headerImg}
                  alt="header-vin.shop"
                />
              </div>
            </div>
          </div>
        </Card>
      </header>

      {/* Feature section */}
      <section className="py-5" id="features">
        <div className="container px-5 my-5">
          <div className="row gx-5">
            <div className="col-lg-4 mb-5 mb-lg-0">
              <h2 className="fw-bolder mb-0">
                Semua kebutuhanmu, cukup dari satu tempat.
              </h2>
            </div>
            <div className="col-lg-8">
              <div className="row gx-5 row-cols-1 row-cols-md-2">
                <div className="col mb-5 h-100">
                  <div
                    className="feature bg-info bg-gradient text-white rounded-3 mb-3 d-inline-flex align-items-center justify-content-center"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <Truck size={24} />
                  </div>
                  <h2 className="h5">Gratis Ongkir</h2>
                  <p className="mb-0">
                    Nikmati gratis ongkos kirim untuk pembelian minimal
                    tertentu, ke seluruh wilayah Indonesia.
                  </p>
                </div>
                <div className="col mb-5 h-100">
                  <div
                    className="feature bg-info bg-gradient text-white rounded-3 mb-3 d-inline-flex align-items-center justify-content-center"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <BadgeCheck size={24} />
                  </div>
                  <h2 className="h5">Produk Original</h2>
                  <p className="mb-0">
                    Semua produk kami 100% asli dan terjamin kualitasnya,
                    langsung dari supplier terpercaya.
                  </p>
                </div>
                <div className="col mb-5 mb-md-0 h-100">
                  <div
                    className="feature bg-info bg-gradient text-white rounded-3 mb-3 d-inline-flex align-items-center justify-content-center"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <ShieldCheck size={24} />
                  </div>
                  <h2 className="h5">Pembayaran Aman</h2>
                  <p className="mb-0">
                    Transaksi dilindungi sistem keamanan terbaik, mendukung
                    berbagai metode pembayaran favoritmu.
                  </p>
                </div>
                <div className="col h-100">
                  <div
                    className="feature bg-info bg-gradient text-white rounded-3 mb-3 d-inline-flex align-items-center justify-content-center"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <PackageX size={24} />
                  </div>
                  <h2 className="h5">Retur & Garansi</h2>
                  <p className="mb-0">
                    Tidak sesuai ekspektasi? Kami menyediakan kebijakan retur
                    mudah dan garansi produk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop preview section */}
      <section className="py-5">
        <div className="container px-5 my-5">
          <div className="row gx-5">
            <div className="container py-5">
              {addedItem && (
                <div
                  className="position-fixed bottom-0 end-0 p-3"
                  style={{ zIndex: 1050 }}
                >
                  <div className="toast show align-items-center bg-dark text-white border-0 shadow-lg rounded-3">
                    <div className="d-flex align-items-center justify-content-between p-3 gap-3">
                      <div className="d-flex align-items-center gap-2">
                        <Check
                          size={20}
                          className="text-success flex-shrink-0"
                        />
                        <span className="small">
                          <strong>{addedItem}</strong> masuk keranjang!
                        </span>
                      </div>
                      <Link
                        to="/keranjang"
                        className="btn btn-primary btn-sm px-2.5 py-1 d-inline-flex align-items-center gap-1 small fw-semibold"
                      >
                        <span>Lihat Keranjang</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center mb-5" id="produk-unggulan">
                <h2 className="h3 fw-bold text-dark">Produk Unggulan</h2>
                <p className="text-muted">
                  Beberapa produk pilihan terbaik kami.
                </p>
              </div>

              <div className="row g-4">
                {products.map((prod) => {
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
                    <div key={prod.id} className="col-12 col-md-4">
                      <div className="card h-100 border-0 shadow-sm rounded-3 bg-white d-flex flex-column overflow-hidden">
                        <div
                          className="position-relative bg-light overflow-hidden"
                          style={{ height: "220px" }}
                        >
                          <img
                            src={photoUrl}
                            alt={prod.name || "Foto Produk"}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-100 h-100 object-fit-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
                            }}
                          />

                          <div className="position-absolute top-0 start-0 m-3">
                            <span className="badge bg-white text-dark shadow-sm border border-light-subtle text-capitalize fw-semibold px-2.5 py-1.5 rounded-pill small d-inline-flex align-items-center gap-1">
                              <span
                                className="p-1 rounded-circle bg-info d-inline-block"
                                style={{ width: "6px", height: "6px" }}
                              ></span>
                              <span>{categoryLabel}</span>
                            </span>
                          </div>

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
                          <h5 className="card-title fw-bold text-dark mb-2">
                            {prod.name}
                          </h5>

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

                          <p className="card-text text-muted small mb-3 flex-grow-1">
                            {prod.description ||
                              "Deskripsi produk kualitas premium dengan performa dan daya tahan terbaik."}
                          </p>

                          <div className="mt-auto pt-2">
                            <div className="text-muted small">
                              Harga Terbaik
                            </div>
                            <div className="h4 fw-bold text-dark mb-0">
                              {formatIDR(prod.price)}
                            </div>
                          </div>
                        </div>

                        <div className="card-footer bg-transparent border-top-0 p-4 pt-0">
                          <button
                            type="button"
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
                })}
              </div>
              {/* Tombol Lihat Semua Produk */}
              <div className="text-center mt-5">
                <Link
                  to="/produk"
                  className="btn btn-outline-dark px-4 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-2"
                >
                  <span>Lihat Semua Produk</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
