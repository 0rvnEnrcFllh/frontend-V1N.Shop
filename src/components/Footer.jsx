import { CardFooter } from "react-bootstrap";
import {
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <>
      <CardFooter className="bg-dark text-light pt-5 pb-4 mt-5">
        <div className="container">
          <div className="row gy-4">
            {/* Brand */}
            <div className="col-lg-4 col-md-6">
              <h5 className="fw-bold mb-3">V1N.Shop</h5>
              <p className="text-secondary small">
                Belanja mudah, aman, dan nyaman untuk semua kebutuhanmu.
                Kualitas terjamin, harga bersahabat.
              </p>
              <div className="d-flex gap-3 mt-3">
                <a href="#" className="text-light">
                  <FaInstagram size={20} />
                </a>
                <a href="#" className="text-light">
                  <FaFacebook size={20} />
                </a>
                <a href="#" className="text-light">
                  <FaTwitter size={20} />
                </a>
                <a href="#" className="text-light">
                  <FaYoutube size={20} />
                </a>
                <a href="#" className="text-light">
                  <FaWhatsapp size={20} />
                </a>
              </div>
            </div>

            {/* Link Cepat */}
            <div className="col-lg-2 col-md-6">
              <h6 className="fw-bold mb-3">Belanja</h6>
              <ul className="list-unstyled small">
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Kategori
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Produk
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Promo
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Produk Terbaru
                  </a>
                </li>
              </ul>
            </div>

            {/* Bantuan */}
            <div className="col-lg-2 col-md-6">
              <h6 className="fw-bold mb-3">Bantuan</h6>
              <ul className="list-unstyled small">
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Cara Belanja
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Pengiriman
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    Retur & Garansi
                  </a>
                </li>
                <li className="mb-2">
                  <a href="#" className="text-secondary text-decoration-none">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Kontak */}
            <div className="col-lg-4 col-md-6">
              <h6 className="fw-bold mb-3">Hubungi Kami</h6>
              <ul className="list-unstyled small text-secondary">
                <li className="mb-2 d-flex align-items-center gap-2">
                  <Mail size={16} /> support@v1nshop.com
                </li>
                <li className="mb-2 d-flex align-items-center gap-2">
                  <Phone size={16} /> +62 812-3333-3333
                </li>
                <li className="mb-2 d-flex align-items-center gap-2">
                  <MapPin size={16} /> Jakarta, Indonesia
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-secondary my-4" />

          {/* Bottom bar */}
          <div className="d-flex flex-wrap justify-content-between align-items-center small">
            <p className="mb-0 text-secondary">
              Copyright © V1N.Shop 2026. All rights reserved.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-secondary text-decoration-none">
                Privacy
              </a>
              <a href="#" className="text-secondary text-decoration-none">
                Terms
              </a>
              <a href="#" className="text-secondary text-decoration-none">
                Contact
              </a>
            </div>
          </div>
        </div>
      </CardFooter>
    </>
  );
}
