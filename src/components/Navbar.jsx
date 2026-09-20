import { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { hasRole } from "../utils/auth";
import {
  Home,
  Grid,
  Package,
  Info,
  LogIn,
  UserPlus,
  UserCheck,
  LogOut,
  Store,
  ChevronDown,
  Boxes,
  ShoppingBag,
  Plus,
  ShoppingCart,
  Layers,
  FolderPlus,
  Receipt,
} from "lucide-react";
import { getCartItems } from "../utils/cart";

export default function Navbar({ user, onLogout }) {
  const isAdmin = hasRole("admin");
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isKategoriDropdownOpen, setIsKategoriDropdownOpen] = useState(false);
  const [isProdukDropdownOpen, setIsProdukDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => {
    const items = getCartItems();
    return items.reduce((acc, item) => acc + (item.quantity || 1), 0);
  });
  const kategoriDropdownRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);
  const closeNav = () => {
    setIsNavCollapsed(true);
    setIsKategoriDropdownOpen(false);
    setIsProdukDropdownOpen(false);
  };

  // Sync cart count
  useEffect(() => {
    const updateCount = () => {
      const items = getCartItems();
      const count = items.reduce((acc, item) => acc + (item.quantity || 1), 0);
      setCartCount(count);
    };

    window.addEventListener("toko_cart_updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("toko_cart_updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProdukDropdownOpen(false);
      }
      if (
        kategoriDropdownRef.current &&
        !kategoriDropdownRef.current.contains(event.target)
      ) {
        setIsKategoriDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isKategoriRouteActive =
    location.pathname.startsWith("/kategori") ||
    location.pathname.startsWith("/categories");
  const isProdukRouteActive =
    location.pathname.startsWith("/produk") ||
    location.pathname.startsWith("/products");

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top"
      id="main-navbar"
    >
      <div className="container">
        {/* Brand */}
        <Link
          to="/"
          id="navbar-brand-logo"
          className="navbar-brand d-flex items-center gap-2 fw-bold text-dark"
          onClick={closeNav}
        >
          <span>V1N.Shop</span>
        </Link>

        {/* Hamburger Toggler */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          id="navbar-toggler-btn"
          onClick={handleNavCollapse}
          aria-controls="navbarNav"
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Menu */}
        <div
          className={`${isNavCollapsed ? "collapse" : ""} navbar-collapse`}
          id="navbarNav"
        >
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-1">
            {/* Home */}
            <li className="nav-item">
              <NavLink
                to="/"
                id="nav-link-home"
                onClick={closeNav}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 px-3 py-2 ${
                    isActive
                      ? "active-nav-link text-dark fw-semibold"
                      : "text-secondary"
                  }`
                }
              >
                <Home size={18} />
                <span>Home</span>
              </NavLink>
            </li>

            {/* Kategori with Sub-Menu Dropdown */}
            <li
              className="nav-item position-relative"
              ref={kategoriDropdownRef}
            >
              <div className="d-flex align-items-center">
                <NavLink
                  to="/kategori"
                  id="nav-link-kategori"
                  onClick={closeNav}
                  className={() =>
                    `nav-link d-flex align-items-center gap-1.5 px-3 py-2 ${
                      isKategoriRouteActive
                        ? "active-nav-link text-dark fw-semibold"
                        : "text-secondary"
                    }`
                  }
                >
                  <Grid size={18} />
                  <span>Kategori</span>
                </NavLink>

                {/* Sub Menu Toggle Arrow */}
                {isAdmin && (
                  <button
                    type="button"
                    className={`btn btn-link nav-link p-1 text-secondary border-0 shadow-none ${
                      isKategoriRouteActive ? "text-dark" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsKategoriDropdownOpen((prev) => !prev);
                      setIsProdukDropdownOpen(false);
                    }}
                    aria-expanded={isKategoriDropdownOpen}
                    title="Buka Sub Menu Kategori"
                    id="nav-kategori-submenu-toggle"
                  >
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${isKategoriDropdownOpen ? "rotate-180 text-dark" : ""}`}
                    />
                  </button>
                )}
              </div>

              {/* Kategori Sub-menu Dropdown Container */}
              {isAdmin && isKategoriDropdownOpen && (
                <div
                  className="dropdown-menu show shadow-lg border-0 rounded-3 p-2 position-absolute bg-white mt-1"
                  style={{ minWidth: "230px", zIndex: 1060 }}
                  id="kategori-dropdown-menu"
                >
                  <div
                    className="px-2 py-1 text-muted small fw-semibold text-uppercase"
                    style={{ fontSize: "11px" }}
                  >
                    Menu Kategori
                  </div>

                  <Link
                    to="/kategori"
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-2.5 rounded-2 small text-dark"
                    onClick={closeNav}
                    id="dropdown-kategori-katalog-link"
                  >
                    <div className="p-1.5 bg-dark-subtle text-dark rounded">
                      <Grid size={15} />
                    </div>
                    <div>
                      <div className="fw-semibold">Katalog Kategori</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        Jelajahi kategori etalase
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/kategori/kelola"
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-2.5 rounded-2 small text-dark mt-1"
                    onClick={closeNav}
                    id="dropdown-kategori-crud-link"
                  >
                    <div className="p-1.5 bg-dark-subtle text-dark-emphasis rounded">
                      <Layers size={15} />
                    </div>
                    <div>
                      <div className="fw-semibold">Kelola Kategori (CRUD)</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        Tambah, edit & hapus kategori
                      </div>
                    </div>
                  </Link>

                  <div className="dropdown-divider my-1"></div>

                  <Link
                    to="/kategori/kelola?action=create"
                    className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small text-info fw-semibold"
                    onClick={closeNav}
                    id="dropdown-tambah-kategori-link"
                  >
                    <FolderPlus size={14} />
                    <span>+ Tambah Kategori Baru</span>
                  </Link>
                </div>
              )}
            </li>

            {/* Produk with Sub-Menu Dropdown */}
            <li className="nav-item position-relative" ref={dropdownRef}>
              <div className="d-flex align-items-center">
                <NavLink
                  to="/produk"
                  id="nav-link-produk"
                  onClick={closeNav}
                  className={() =>
                    `nav-link d-flex align-items-center gap-1.5 px-3 py-2 ${
                      isProdukRouteActive
                        ? "active-nav-link text-dark fw-semibold"
                        : "text-secondary"
                    }`
                  }
                >
                  <Package size={18} />
                  <span>Produk</span>
                </NavLink>

                {/* Sub Menu Toggle Arrow */}
                {isAdmin && (
                  <button
                    type="button"
                    className={`btn btn-link nav-link p-1 text-secondary border-0 shadow-none ${
                      isProdukRouteActive ? "text-dark" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsProdukDropdownOpen((prev) => !prev);
                      setIsKategoriDropdownOpen(false);
                    }}
                    aria-expanded={isProdukDropdownOpen}
                    title="Buka Sub Menu Produk"
                    id="nav-produk-submenu-toggle"
                  >
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${isProdukDropdownOpen ? "rotate-180 text-dark" : ""}`}
                    />
                  </button>
                )}
              </div>

              {/* Sub-menu Dropdown Container */}
              {isAdmin && isProdukDropdownOpen && (
                <div
                  className="dropdown-menu show shadow-lg border-0 rounded-3 p-2 position-absolute bg-white mt-1"
                  style={{ minWidth: "220px", zIndex: 1060 }}
                  id="produk-dropdown-menu"
                >
                  <div
                    className="px-2 py-1 text-muted small fw-semibold text-uppercase"
                    style={{ fontSize: "11px" }}
                  >
                    Menu Produk
                  </div>

                  <Link
                    to="/produk"
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-2.5 rounded-2 small text-dark"
                    onClick={closeNav}
                    id="dropdown-katalog-link"
                  >
                    <div className="p-1.5 bg-dark-subtle text-dark rounded">
                      <ShoppingBag size={15} />
                    </div>
                    <div>
                      <div className="fw-semibold">Katalog Produk</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        Lihat semua produk toko
                      </div>
                    </div>
                  </Link>

                  <Link
                    to="/produk/kelola"
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-2.5 rounded-2 small text-dark mt-1"
                    onClick={closeNav}
                    id="dropdown-crud-link"
                  >
                    <div className="p-1.5 bg-dark-subtle text-dark rounded">
                      <Boxes size={15} />
                    </div>
                    <div>
                      <div className="fw-semibold">Kelola Produk (CRUD)</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        Tambah, edit & hapus inventaris
                      </div>
                    </div>
                  </Link>

                  <div className="dropdown-divider my-1"></div>

                  <Link
                    to="/produk/kelola"
                    className="dropdown-item d-flex align-items-center gap-2 py-1.5 px-2.5 rounded-2 small text-info fw-semibold"
                    onClick={closeNav}
                    id="dropdown-tambah-cepat-link"
                  >
                    <Plus size={14} />
                    <span>+ Tambah Produk Baru</span>
                  </Link>
                </div>
              )}
            </li>

            {/* Transaksi / Orders */}
            <li className="nav-item">
              <NavLink
                to="/transaksi"
                id="nav-link-transaksi"
                onClick={closeNav}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 px-3 py-2 ${
                    isActive
                      ? "active-nav-link text-dark fw-semibold"
                      : "text-secondary"
                  }`
                }
              >
                <Receipt size={18} />
                <span>Transaksi</span>
              </NavLink>
            </li>

            {/* About */}
            <li className="nav-item">
              <NavLink
                to="/about"
                id="nav-link-about"
                onClick={closeNav}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 px-3 py-2 ${
                    isActive
                      ? "active-nav-link text-primary fw-semibold"
                      : "text-secondary"
                  }`
                }
              >
                <Info size={18} />
                <span>About</span>
              </NavLink>
            </li>
          </ul>

          {/* Cart & Auth Actions */}
          <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
            {/* Quick Cart Button on Desktop */}
            <Link
              to="/keranjang"
              onClick={closeNav}
              className="btn btn-light border position-relative d-none d-lg-inline-flex align-items-center gap-1.5 px-3 py-2 text-dark rounded-3 shadow-xs me-1"
              id="navbar-cart-quick-btn"
              title="Lihat Keranjang Belanja"
            >
              <ShoppingCart size={17} className="text-dark" />
              {cartCount > 0 && (
                <span
                  className="badge bg-danger rounded-pill ms-1"
                  style={{ fontSize: "11px" }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-2 w-100 w-lg-auto">
                <span className="badge bg-light text-dark border d-flex align-items-center gap-1 py-2 px-3">
                  <UserCheck size={16} className="text-success" />
                  <span className="fw-semibold">
                    {user.name ? user.name : user.email}
                  </span>
                </span>
                <button
                  type="button"
                  id="nav-logout-btn"
                  onClick={() => {
                    onLogout();
                    closeNav();
                    navigate("/");
                  }}
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 w-100 w-lg-auto"
                >
                  <LogOut size={16} />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column flex-lg-row align-items-center gap-2 w-100 w-lg-auto">
                <NavLink
                  to="/login"
                  id="nav-link-login"
                  onClick={closeNav}
                  className={({ isActive }) =>
                    `btn ${
                      isActive ? "btn-dark" : "btn-outline-dark"
                    } btn-sm d-flex align-items-center justify-content-center gap-1 px-3 py-2 w-100 w-lg-auto`
                  }
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </NavLink>
                <NavLink
                  to="/register"
                  id="nav-link-register"
                  onClick={closeNav}
                  className={({ isActive }) =>
                    `btn ${
                      isActive ? "btn-dark" : "btn-dark"
                    } btn-sm d-flex align-items-center justify-content-center gap-1 px-3 py-2 w-100 w-lg-auto text-white`
                  }
                >
                  <UserPlus size={16} />
                  <span>Daftar</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
