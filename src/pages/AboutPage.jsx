import { Link } from "react-router-dom";
import {
  Store,
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  Target,
  Eye,
  Award,
  Users,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AboutPage() {
  const coreValues = [
    {
      id: "val-original",
      icon: ShieldCheck,
      color: "info",
      title: "100% Produk Original",
      desc: "Semua produk dijamin keasliannya dan melalui proses kurasi serta pengecekan kualitas sebelum dikirim.",
    },
    {
      id: "val-shipping",
      icon: Truck,
      color: "info",
      title: "Pengiriman Cepat & Aman",
      desc: "Bekerja sama dengan ekspedisi terpercaya untuk memastikan pesanan Anda tiba dengan selamat dan tepat waktu.",
    },
    {
      id: "val-payment",
      icon: CreditCard,
      color: "info",
      title: "Transaksi Aman & Fleksibel",
      desc: "Mendukung berbagai metode pembayaran digital yang praktis dengan enkripsi data berstandar tinggi.",
    },
    {
      id: "val-support",
      icon: Headphones,
      color: "info",
      title: "Layanan Responsif 24/7",
      desc: "Tim dukungan pelanggan kami siap membantu pertanyaan dan kendala belanja Anda setiap saat.",
    },
  ];

  const statistics = [
    {
      id: "stat-customers",
      value: "10.000+",
      label: "Pelanggan Puas",
      icon: Users,
    },
    {
      id: "stat-products",
      value: "500+",
      label: "Pilihan Produk",
      icon: Store,
    },
    {
      id: "stat-satisfaction",
      value: "99.8%",
      label: "Kepuasan Layanan",
      icon: Award,
    },
    {
      id: "stat-support",
      value: "24/7",
      label: "Bantuan Pelanggan",
      icon: Clock,
    },
  ];

  return (
    <div className="container py-5" id="about-page-container">
      {/* Header Banner */}
      <div
        className="card shadow-sm border-0 mb-4 bg-white rounded-3 overflow-hidden"
        id="about-hero-card"
      >
        <div className="card-body bg-dark p-4 p-md-5 text-center">
          <div className="d-inline-flex align-items-center gap-2 badge bg-white-subtle text-info border border-white-subtle px-3 py-2 rounded-pill mb-3">
            <Sparkles size={16} />
            <span>Mengenal Lebih Dekat</span>
          </div>
          <h1 className="fw-bold text-info display-6 mb-3">
            Tentang <span className="text-white">V1N.Shop</span>
          </h1>
          <p
            className="text-white lead mx-auto mb-4"
            style={{ maxWidth: "750px", fontSize: "1.1rem" }}
          >
            V1N.Shop adalah platform e-commerce modern yang menghadirkan
            pengalaman belanja praktis, aman, dan menyenangkan dengan pilihan
            produk terlengkap dari berbagai kategori unggulan.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link
              to="/produk"
              id="about-explore-products-btn"
              className="btn btn-info text-white px-4 py-2 d-inline-flex align-items-center gap-2"
            >
              <span>Jelajahi Produk Kami</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/kategori"
              id="about-explore-categories-btn"
              className="btn btn-outline-secondary px-4 py-2"
            >
              Lihat Kategori
            </Link>
          </div>
        </div>
      </div>

      {/* Profil & Cerita Kami */}
      <div className="row g-4 mb-5" id="about-story-section">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-white p-4">
            <div className="card-body p-0">
              <div className="p-3 bg-dark-subtle text-dark rounded-circle d-inline-flex mb-3">
                <Store size={28} />
              </div>
              <h3 className="fw-bold text-dark mb-3">Siapa Kami?</h3>
              <p className="text-secondary mb-3 leading-relaxed">
                Didirikan dengan komitmen untuk mempermudah gaya hidup
                masyarakat digital, <strong>Toko Online</strong> hadir sebagai
                destinasi belanja serba ada yang mengutamakan kualitas,
                keterjangkauan harga, dan kemudahan akses.
              </p>
              <p className="text-secondary mb-0 leading-relaxed">
                Mulai dari produk elektronik, fesyen, kebutuhan rumah tangga,
                perlengkapan olahraga hingga kuliner harian, kami menghubungkan
                Anda dengan barang-barang terbaik langsung dari mitra terpercaya
                di seluruh Indonesia.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-white p-4">
            <div className="card-body p-0">
              <div className="p-3 bg-dark-subtle text-dark rounded-circle d-inline-flex mb-3">
                <Target size={28} />
              </div>
              <h3 className="fw-bold text-dark mb-3">Visi & Misi Kami</h3>

              <div className="mb-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <Eye size={18} className="text-dark" />
                  <h6 className="fw-bold text-dark mb-0">Visi</h6>
                </div>
                <p className="text-secondary small mb-0 ps-4">
                  Menjadi platform belanja online paling dipercaya dan menjadi
                  pilihan utama keluarga Indonesia dengan standar layanan kelas
                  wahid.
                </p>
              </div>

              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <Target size={18} className="text-dark" />
                  <h6 className="fw-bold text-dark mb-0">Misi</h6>
                </div>
                <ul className="text-secondary small mb-0 ps-4">
                  <li className="mb-1">
                    Menyediakan produk berkualitas tinggi dengan harga
                    transparan dan kompetitif.
                  </li>
                  <li className="mb-1">
                    Memberikan perlindungan transaksi dan kemudahan proses
                    belanja dari awal hingga akhir.
                  </li>
                  <li>
                    Membangun ekosistem belanja online yang inovatif, ramah
                    pengguna, dan responsif.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nilai Utama & Keunggulan */}
      <div className="mb-5" id="about-values-section">
        <div className="text-center mb-4">
          <h3 className="fw-bold text-dark mb-2">Mengapa Memilih V1N.Shop?</h3>
          <p className="text-muted small mb-0">
            Komitmen kami untuk memberikan kepuasan maksimal di setiap transaksi
            Anda
          </p>
        </div>

        <div className="row g-3">
          {coreValues.map((val) => {
            const IconComp = val.icon;
            return (
              <div className="col-12 col-md-6 col-lg-3" key={val.id}>
                <div className="card border-0 shadow-sm rounded-3 h-100 bg-white p-3 text-center">
                  <div className="card-body p-2 d-flex flex-column align-items-center">
                    <div
                      className={`p-3 bg-${val.color}-subtle text-${val.color} rounded-circle d-inline-flex mb-3`}
                    >
                      <IconComp size={26} />
                    </div>
                    <h5 className="fw-bold text-dark fs-6 mb-2">{val.title}</h5>
                    <p className="text-muted small mb-0">{val.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistik Ringkas */}
      <div
        className="card border-0 shadow-sm rounded-3 bg-dark text-white mb-5 p-4 p-md-5"
        id="about-stats-card"
      >
        <div className="card-body p-0">
          <div className="row g-4 text-center">
            {statistics.map((stat) => {
              const IconComp = stat.icon;
              return (
                <div className="col-6 col-lg-3" key={stat.id}>
                  <div className="d-inline-flex p-2 bg-white bg-opacity-25 rounded-circle mb-2">
                    <IconComp size={24} className="text-white" />
                  </div>
                  <h2 className="fw-bold display-6 mb-1 text-white">
                    {stat.value}
                  </h2>
                  <p className="text-white text-opacity-75 small mb-0">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kontak & Informasi Operasional */}
      <div
        className="card border-0 shadow-sm rounded-3 bg-white p-4 p-md-5"
        id="about-contact-section"
      >
        <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-6">
            <h4 className="fw-bold text-dark mb-2">
              Hubungi Layanan Pelanggan
            </h4>
            <p className="text-muted small mb-4">
              Ada pertanyaan, masukan, atau kendala seputar pesanan Anda? Tim
              kami siap sedia membantu Anda setiap hari.
            </p>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-start gap-3">
                <div className="p-2 bg-light text-info rounded-circle mt-1">
                  <Mail size={18} />
                </div>
                <div>
                  <h6 className="fw-semibold text-dark mb-0 small">
                    Email Layanan
                  </h6>
                  <span className="text-muted small">
                    support@tokoonline.com
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 bg-light text-info rounded-circle mt-1">
                  <Phone size={18} />
                </div>
                <div>
                  <h6 className="fw-semibold text-dark mb-0 small">
                    Telepon & WhatsApp
                  </h6>
                  <span className="text-muted small">+62 812-3456-7890</span>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 bg-light text-info rounded-circle mt-1">
                  <Clock size={18} />
                </div>
                <div>
                  <h6 className="fw-semibold text-dark mb-0 small">
                    Jam Operasional
                  </h6>
                  <span className="text-muted small">
                    Senin – Minggu: 08.00 – 22.00 WIB
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 bg-light text-info rounded-circle mt-1">
                  <MapPin size={18} />
                </div>
                <div>
                  <h6 className="fw-semibold text-dark mb-0 small">
                    Kantor Operasional
                  </h6>
                  <span className="text-muted small">Jakarta, Indonesia</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="p-4 bg-light rounded-3 border text-center">
              <h5 className="fw-bold text-dark mb-2">Siap Mulai Berbelanja?</h5>
              <p className="text-muted small mb-4">
                Temukan diskon menarik, promo harian, dan ribuan produk terbaik
                yang siap dikirim langsung ke rumah Anda.
              </p>
              <Link
                to="/produk"
                id="about-shop-now-btn"
                className="btn btn-info text-white w-100 py-2 d-inline-flex align-items-center justify-content-center gap-2"
              >
                <span>Belanja Sekarang</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
