import axios from "axios";

export const BACKEND_BASE_URL =
  "https://backend-v1nshop-production-1215.up.railway.app";
// export const BACKEND_BASE_URL = "http://localhost:3000";
export const AUTH_API_URL = `${BACKEND_BASE_URL}/auth/login`;
export const REGISTER_API_URL = `${BACKEND_BASE_URL}/auth/register`;
export const CATEGORIES_API_URL = `${BACKEND_BASE_URL}/api/categories`;
export const PRODUCTS_API_URL = `${BACKEND_BASE_URL}/api/products`;
export const ORDERS_API_URL = `${BACKEND_BASE_URL}/api/orders`;

export const LOCAL_STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
};

/**
 * Decode payload from JWT token safely
 * @param {string} token
 * @returns {object|null}
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn("Failed to parse JWT token payload:", error);
    return null;
  }
}

/**
 * Check if a token exists, is well-formed, and not expired
 * @param {string} token
 * @returns {boolean}
 */
export function isTokenValid(token) {
  if (!token || typeof token !== "string" || token.trim() === "") return false;

  const payload = decodeJwtPayload(token);
  // Check expiration only if 'exp' is present (in seconds)
  if (payload && payload.exp) {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTimeInSeconds) {
      console.warn("Token has expired at timestamp:", payload.exp);
      return false;
    }
  }

  // Token is valid if it's a non-expired JWT or a valid token string
  return true;
}

/**
 * Helper to safely extract token from various backend response formats
 * @param {any} data
 * @param {object} [headers]
 * @returns {string|null}
 */
function extractTokenFromResponse(data, headers = {}) {
  if (!data) return null;

  // Direct string token response
  if (typeof data === "string" && data.length > 10) {
    return data.replace(/^Bearer\s+/i, "").trim();
  }

  // Common JSON payload fields
  const possibleTokens = [
    data.token,
    data.accessToken,
    data.access_token,
    data.jwt,
    data.authToken,
    data.auth_token,
    data.data?.token,
    data.data?.accessToken,
    data.data?.access_token,
    data.data?.jwt,
    data.data?.authToken,
    data.result?.token,
    data.result?.accessToken,
    data.payload?.token,
    typeof data.data === "string" && data.data.length > 10 ? data.data : null,
  ];

  for (const t of possibleTokens) {
    if (t && typeof t === "string" && t.trim() !== "") {
      return t.replace(/^Bearer\s+/i, "").trim();
    }
  }

  // Check header token fallback
  const headerAuth =
    headers["authorization"] || headers["x-auth-token"] || headers["token"];
  if (headerAuth && typeof headerAuth === "string") {
    return headerAuth.replace(/^Bearer\s+/i, "").trim();
  }

  return null;
}

/**
 * Helper to safely extract user information from response or JWT payload
 * @param {any} data
 * @param {string} token
 * @param {string} fallbackEmail
 * @returns {object}
 */
function extractUserFromResponse(data, token, fallbackEmail) {
  let userObj =
    data?.user ||
    data?.data?.user ||
    data?.data?.userData ||
    data?.userData ||
    data?.profile ||
    data?.data?.profile ||
    null;

  // Try decoding from JWT if no explicit user object returned
  const jwtPayload = decodeJwtPayload(token);
  if (!userObj && jwtPayload) {
    userObj = {
      id: jwtPayload.id || jwtPayload.userId || jwtPayload.sub || null,
      name:
        jwtPayload.name ||
        jwtPayload.username ||
        (jwtPayload.email
          ? jwtPayload.email.split("@")[0]
          : fallbackEmail
            ? fallbackEmail.split("@")[0]
            : "User"),
      email: jwtPayload.email || fallbackEmail || "",
      role: jwtPayload.role || jwtPayload.roleIds || jwtPayload.roles || "user",
    };
  }

  if (!userObj) {
    userObj = {
      email: fallbackEmail || "user@example.com",
      name: fallbackEmail ? fallbackEmail.split("@")[0] : "Pengguna",
    };
  }

  // Ensure mandatory fields
  if (!userObj.email && fallbackEmail) userObj.email = fallbackEmail;
  if (!userObj.name && userObj.email)
    userObj.name = userObj.email.split("@")[0];
  if (
    !userObj.id &&
    jwtPayload &&
    (jwtPayload.id || jwtPayload.userId || jwtPayload.sub)
  ) {
    userObj.id = jwtPayload.id || jwtPayload.userId || jwtPayload.sub;
  }

  return userObj;
}

/**
 * Helper to get currently logged in user ID
 * @param {object} [userProp]
 * @returns {number|null}
 */
export function getCurrentUserId(userProp = null) {
  if (userProp && (userProp.id || userProp.userId)) {
    return Number(userProp.id || userProp.userId);
  }

  try {
    const userJson = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    if (userJson) {
      const parsed = JSON.parse(userJson);
      if (parsed && (parsed.id || parsed.userId)) {
        return Number(parsed.id || parsed.userId);
      }
    }
  } catch (e) {
    console.warn("Error reading stored user for ID:", e);
  }

  try {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    const jwt = decodeJwtPayload(token);
    if (jwt && (jwt.id || jwt.userId || jwt.sub)) {
      return Number(jwt.id || jwt.userId || jwt.sub);
    }
  } catch (e) {
    console.warn("Error decoding token for user ID:", e);
  }

  return null;
}

/**
 * Save token and user object to Local Storage
 * @param {string} token
 * @param {object} user
 */
export function saveAuthData(token, user) {
  try {
    if (token) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
    }
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
      // Backward compatibility key
      localStorage.setItem("app_nav_user", JSON.stringify(user));
    }
  } catch (error) {
    console.error("Failed to save authentication data to localStorage", error);
  }
}

/**
 * Remove token and user data from Local Storage
 */
export function clearAuthData() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    localStorage.removeItem("app_nav_user");
  } catch (error) {
    console.error(
      "Failed to clear authentication data from localStorage",
      error,
    );
  }
}

export const SYSTEM_DATABASE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidG9rZW5WZXJzaW9uIjowLCJpYXQiOjE3ODc5MTE1ODEsImV4cCI6MTc4Nzk5Nzk4MX0.VIt4p78Ats43KJ2I59UnqYiGgTSOAcyV0Os_jowaq58";

/**
 * Helper to get the active authentication token (stored token or system API token)
 * @returns {string}
 */
export function getAuthToken() {
  try {
    const userToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    if (userToken && isTokenValid(userToken)) {
      return userToken;
    }
    return SYSTEM_DATABASE_TOKEN;
  } catch {
    return SYSTEM_DATABASE_TOKEN;
  }
}

/**
 * Retrieve and validate current authentication state from Local Storage
 * @returns {{ token: string|null, user: object|null, isValid: boolean }}
 */
export function getStoredAuth() {
  try {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    const userJson = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    const user = userJson ? JSON.parse(userJson) : null;

    if (!token || !user) {
      clearAuthData();
      return { token: null, user: null, isValid: false };
    }

    if (!isTokenValid(token)) {
      clearAuthData();
      return { token: null, user: null, isValid: false };
    }

    return { token, user, isValid: true };
  } catch (error) {
    console.error("Error reading auth from localStorage:", error);
    clearAuthData();
    return { token: null, user: null, isValid: false };
  }
}

/**
 * Check if the currently stored (logged-in) user has one of the given roles
 * @param {...string} allowedRoles - e.g. hasRole('admin') or hasRole('admin', 'user')
 * @returns {boolean}
 */
export function hasRole(...allowedRoles) {
  const { user, isValid } = getStoredAuth();
  if (!isValid || !user) return false;

  // roles bisa berupa array of object [{ id, name }] (dari backend),
  // atau string tunggal, atau array of string — ditangani semua
  const rawRoles = user.roles || user.role || [];
  const roleList = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

  const normalizedRoles = roleList
    .filter(Boolean)
    .map((r) => (typeof r === "string" ? r : r.name || ""))
    .map((r) => r.toLowerCase());

  return allowedRoles.some((role) =>
    normalizedRoles.includes(role.toLowerCase()),
  );
}

/**
 * Perform login request directly to backend endpoint
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginToBackend(email, password) {
  const cleanEmail = email.trim();
  const payload = {
    email: cleanEmail,
    password: password,
  };

  try {
    const response = await axios.post(AUTH_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    const { data, headers } = response;
    const token = extractTokenFromResponse(data, headers);

    if (token) {
      if (!isTokenValid(token)) {
        throw new Error("Token yang diterima dari server sudah kedaluwarsa.");
      }

      const user = extractUserFromResponse(data, token, cleanEmail);

      return {
        token,
        user,
      };
    }

    console.warn("Backend login response structure:", data);
    throw new Error(
      "Format respon login tidak sesuai (token tidak ditemukan).",
    );
  } catch (err) {
    if (err.response) {
      const errorMsg =
        err.response.data?.message ||
        err.response.data?.error ||
        (typeof err.response.data === "string" ? err.response.data : null) ||
        `Server merespon dengan status ${err.response.status}`;
      throw new Error(
        typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
      );
    }

    if (err.message && err.message.includes("Network Error")) {
      throw new Error(
        "Gagal terhubung ke backend Railway. Terjadi kendala CORS atau koneksi jaringan. Pastikan backend mengaktifkan CORS (Access-Control-Allow-Origin).",
      );
    }

    throw new Error(err.message || "Gagal terhubung ke server backend.");
  }
}

/**
 * Perform registration request directly to backend endpoint
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {string|number} [roleIds="1"]
 * @returns {Promise<{ id: number, name: string, email: string, message: string, activationToken?: string }>}
 */
export async function registerToBackend(name, email, password, roleIds = "1") {
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const payload = {
    name: cleanName,
    email: cleanEmail,
    password: password,
    roleIds: String(roleIds ?? "1"),
  };

  try {
    const response = await axios.post(REGISTER_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    const { data } = response;
    if (!data) {
      throw new Error("Respon dari server kosong.");
    }

    const resData = data.data || data;

    return {
      id: resData.id || data.id,
      name: resData.name || data.name || cleanName,
      email: resData.email || data.email || cleanEmail,
      message:
        resData.message ||
        data.message ||
        "Pendaftaran berhasil. Silakan periksa email Anda atau silakan login.",
      activationToken: resData.activationToken || data.activationToken || null,
    };
  } catch (err) {
    if (err.response) {
      const errorMsg =
        err.response.data?.message ||
        err.response.data?.error ||
        (typeof err.response.data === "string" ? err.response.data : null) ||
        `Pendaftaran gagal dengan status ${err.response.status}`;
      throw new Error(
        typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
      );
    }

    if (err.message && err.message.includes("Network Error")) {
      throw new Error(
        "Gagal terhubung ke backend Railway. Terjadi kendala CORS atau koneksi jaringan.",
      );
    }

    throw new Error(err.message || "Gagal melakukan pendaftaran akun.");
  }
}

export const DEFAULT_CATEGORIES = [
  {
    id: 1,
    name: "Elektronik",
    slug: "elektronik",
    description: "Gadget, laptop, audio, dan aksesoris teknologi",
  },
  {
    id: 2,
    name: "Kamera & Fotografi",
    slug: "kamera",
    description: "Kamera mirrorless, lensa, dan perlengkapan studio",
  },
  {
    id: 3,
    name: "Pakaian & Fashion",
    slug: "fashion",
    description: "Busana kasual, jaket, sepatu, dan aksesoris gaya",
  },
  {
    id: 4,
    name: "Makanan & Minuman",
    slug: "kuliner",
    description: "Kopi Nusantara, camilan, dan minuman premium",
  },
  {
    id: 5,
    name: "Buku & Alat Tulis",
    slug: "buku",
    description: "Buku pemrograman, referensi belajar, dan perlengkapan tulis",
  },
];

export const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Smartphone Flagship 5G (8GB/256GB)",
    categoryId: 1,
    categoryName: "Elektronik",
    category: "elektronik",
    price: 8499000,
    stock: 25,
    rating: 4.9,
    reviews: 142,
    tag: "Trending",
    photoUrl:
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80",
    description:
      "Smartphone generasi terbaru dengan layar AMOLED 120Hz, chipset super cepat Snapdragon, dan kamera utama 108MP berteknologi OIS.",
  },
  {
    id: 2,
    name: 'Laptop Ultra Slim Pro 14"',
    categoryId: 1,
    categoryName: "Elektronik",
    category: "elektronik",
    price: 14250000,
    stock: 12,
    rating: 4.8,
    reviews: 89,
    tag: "Terlaris",
    photoUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&auto=format&fit=crop&q=80",
    description:
      "Laptop ringan bertenaga Intel Core i7 generasi terbaru, RAM 16GB, SSD 512GB NVMe, baterai tahan hingga 14 jam.",
  },
  {
    id: 3,
    name: "Headphone Wireless Noise Cancelling",
    categoryId: 1,
    categoryName: "Elektronik",
    category: "elektronik",
    price: 1850000,
    stock: 30,
    rating: 4.7,
    reviews: 210,
    tag: "Populer",
    photoUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
    description:
      "Suara bass jernih dengan fitur Active Noise Cancelling (ANC), daya tahan baterai 40 jam, dan bantalan telinga busa memori yang empuk.",
  },
  {
    id: 4,
    name: "Keyboard Mechanical RGB Gaming",
    categoryId: 1,
    categoryName: "Elektronik",
    category: "elektronik",
    price: 799000,
    stock: 45,
    rating: 4.8,
    reviews: 95,
    tag: "Baru",
    photoUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80",
    description:
      "Keyboard gaming tactile mechanical switch dengan 16.8 juta warna RGB backlight, anti-ghosting full key, dan braided cable.",
  },
  {
    id: 5,
    name: "Kamera Mirrorless 4K Ultra HD",
    categoryId: 2,
    categoryName: "Kamera & Fotografi",
    category: "kamera",
    price: 11200000,
    stock: 8,
    rating: 4.9,
    reviews: 64,
    tag: "Trending",
    photoUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&auto=format&fit=crop&q=80",
    description:
      "Sensor APS-C 24.2 Megapixel, perekaman video 4K 60fps, stabilisasi gambar 5-axis, cocok untuk fotografer dan content creator profesional.",
  },
  {
    id: 6,
    name: "Jaket Casual Denim Vintage",
    categoryId: 3,
    categoryName: "Pakaian & Fashion",
    category: "fashion",
    price: 349000,
    stock: 50,
    rating: 4.6,
    reviews: 180,
    tag: "Promo",
    photoUrl:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&auto=format&fit=crop&q=80",
    description:
      "Bahan denim premium 14oz yang nyaman dan tahan lama, desain klasik modern cocok untuk gaya kasual sehari-hari.",
  },
  {
    id: 7,
    name: "Kopi Arabika Gayo Single Origin 250g",
    categoryId: 4,
    categoryName: "Makanan & Minuman",
    category: "kuliner",
    price: 85000,
    stock: 100,
    rating: 4.9,
    reviews: 320,
    tag: "Favorit",
    photoUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&auto=format&fit=crop&q=80",
    description:
      "Biji kopi sangrai pilihan dari dataran tinggi Aceh Gayo, aroma floral kaya rasa dengan tingkat keasaman yang lembut dan seimbang.",
  },
  {
    id: 8,
    name: "Buku Master Modern Web Development",
    categoryId: 5,
    categoryName: "Buku & Alat Tulis",
    category: "buku",
    price: 175000,
    stock: 35,
    rating: 4.8,
    reviews: 78,
    tag: "Edukasi",
    photoUrl:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&auto=format&fit=crop&q=80",
    description:
      "Panduan komprehensif belajar React, Node.js, Express, dan REST API dari tingkat dasar hingga penerapan full-stack produksi.",
  },
];

/**
 * Fetch categories directly from backend database API
 * Endpoint: GET https://toko-online-backend-production-437f.up.railway.app/api/categories
 *
 * @param {string} [token] - Optional token (uses active database token if not provided)
 * @returns {Promise<{ success: boolean, message: string, data: Array<object> }>}
 */
export async function fetchCategories(token = null) {
  const authToken = token || getAuthToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await axios.get(CATEGORIES_API_URL, {
      headers,
      timeout: 10000,
    });

    const { data } = response;
    let categoriesList = [];

    if (data && Array.isArray(data.data)) {
      categoriesList = data.data;
    } else if (Array.isArray(data)) {
      categoriesList = data;
    }

    if (categoriesList.length === 0) {
      categoriesList = DEFAULT_CATEGORIES;
    }

    return {
      success: true,
      message:
        data?.message || "Berhasil mengambil daftar kategori dari database",
      data: categoriesList,
    };
  } catch (err) {
    console.warn(
      "Gagal memuat kategori dari API, menggunakan fallback default kategori:",
      err.message,
    );
    return {
      success: true,
      message: "Menampilkan data kategori katalog default.",
      data: DEFAULT_CATEGORIES,
    };
  }
}

/**
 * Fetch a single category by ID (GET /api/categories/:id)
 * @param {string|number} id
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function fetchCategoryById(id, token = null) {
  const authToken = token || getAuthToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await axios.get(`${CATEGORIES_API_URL}/${id}`, {
      headers,
      timeout: 10000,
    });

    const data = response.data;
    return {
      success: true,
      message: data?.message || `Berhasil mengambil detail kategori #${id}`,
      data: data?.data || data,
    };
  } catch (err) {
    // If API fails, check default categories fallback
    const fallback = DEFAULT_CATEGORIES.find(
      (c) => String(c.id) === String(id) || c.slug === String(id),
    );
    if (fallback) {
      return {
        success: true,
        message: "Menampilkan data kategori default.",
        data: fallback,
      };
    }
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Gagal memuat detail kategori.";
    throw new Error(errMsg);
  }
}

/**
 * Create a new category in backend database (POST /api/categories)
 * Protected route: router.use(authenticate)
 * @param {object} categoryData - { name, slug, description }
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function createCategory(categoryData, token = null) {
  const authToken = token || getAuthToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const payload = {
    name: String(categoryData.name || "").trim(),
    slug: String(categoryData.slug || categoryData.name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    description: String(categoryData.description || "").trim(),
  };

  try {
    const response = await axios.post(CATEGORIES_API_URL, payload, {
      headers,
      timeout: 12000,
    });

    const data = response.data;
    return {
      success: true,
      message:
        data?.message || "Kategori baru berhasil ditambahkan ke database!",
      data: data?.data || data,
    };
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Gagal menambahkan kategori ke database.";
    throw new Error(errMsg);
  }
}

/**
 * Update an existing category in backend database (PUT /api/categories/:id)
 * Protected route: router.use(authenticate)
 * @param {string|number} id
 * @param {object} categoryData - { name, slug, description }
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function updateCategory(id, categoryData, token = null) {
  const authToken = token || getAuthToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const payload = {
    name: String(categoryData.name || "").trim(),
    slug: String(categoryData.slug || categoryData.name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    description: String(categoryData.description || "").trim(),
  };

  try {
    const response = await axios.put(`${CATEGORIES_API_URL}/${id}`, payload, {
      headers,
      timeout: 12000,
    });

    const data = response.data;
    return {
      success: true,
      message:
        data?.message || `Kategori #${id} berhasil diperbarui di database!`,
      data: data?.data || data,
    };
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Gagal memperbarui kategori di database.";
    throw new Error(errMsg);
  }
}

/**
 * Delete a category from backend database (DELETE /api/categories/:id)
 * Protected route: router.use(authenticate)
 * @param {string|number} id
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function deleteCategory(id, token = null) {
  const authToken = token || getAuthToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await axios.delete(`${CATEGORIES_API_URL}/${id}`, {
      headers,
      timeout: 10000,
    });

    return {
      success: true,
      message:
        response.data?.message ||
        `Kategori #${id} berhasil dihapus dari database.`,
    };
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Gagal menghapus kategori dari database.";
    throw new Error(errMsg);
  }
}

/**
 * Fetch products directly from backend database API
 * Endpoint: GET https://toko-online-backend-production-437f.up.railway.app/api/products
 *
 * @param {object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=100]
 * @param {string|number} [options.categoryId]
 * @param {string} [options.category]
 * @param {string} [options.search]
 * @param {string} [options.token]
 * @returns {Promise<{ success: boolean, message: string, data: Array<object>, pagination: { totalItems: number, totalPages: number, currentPage: number, limit: number } }>}
 */
export async function fetchProducts({
  page = 1,
  limit = 100,
  categoryId = "",
  category = "",
  search = "",
  token = null,
} = {}) {
  const authToken = token || getAuthToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const params = {
    page,
    limit,
  };

  if (categoryId) params.categoryId = categoryId;
  if (category) params.category = category;
  if (search) params.search = search;

  try {
    const response = await axios.get(PRODUCTS_API_URL, {
      headers,
      params,
      timeout: 10000,
    });

    const { data } = response;
    let productList = [];

    if (data && Array.isArray(data.data)) {
      productList = data.data;
    } else if (Array.isArray(data)) {
      productList = data;
    } else if (data && Array.isArray(data.products)) {
      productList = data.products;
    }

    // If database returned an empty table or no products yet, provide rich default catalog
    if (productList.length === 0) {
      productList = DEFAULT_PRODUCTS;
    }

    return {
      success: true,
      message:
        data?.message || "Berhasil mengambil daftar produk dari database",
      data: productList,
      pagination: data?.pagination || {
        totalItems: productList.length,
        totalPages: Math.max(1, Math.ceil(productList.length / limit)),
        currentPage: page,
        limit,
      },
    };
  } catch (err) {
    console.warn(
      "Gagal memuat produk dari database API, menggunakan fallback katalog produk:",
      err.message,
    );
    return {
      success: true,
      message: "Menampilkan katalog produk default.",
      data: DEFAULT_PRODUCTS,
      pagination: {
        totalItems: DEFAULT_PRODUCTS.length,
        totalPages: 1,
        currentPage: 1,
        limit,
      },
    };
  }
}

/**
 * Returns a valid photo URL for a product
 * @param {object} product
 * @returns {string}
 */
export function getProductPhotoUrl(product) {
  if (!product) {
    return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
  }

  // Check possible field names returned by backend or database
  const photoCandidate =
    product.photo ||
    product.photoUrl ||
    product.photo_url ||
    product.image ||
    product.imageUrl ||
    product.image_url ||
    product.picture;

  if (
    photoCandidate &&
    typeof photoCandidate === "string" &&
    photoCandidate.trim() !== ""
  ) {
    const url = photoCandidate.trim();
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    ) {
      return url;
    }
    if (url.startsWith("/")) {
      return `${BACKEND_BASE_URL}${url}`;
    }
    return `${BACKEND_BASE_URL}/${url}`;
  }

  const name = (product.name || "").toLowerCase();
  const category = (
    product.category ||
    product.categoryName ||
    product.categoryRef?.name ||
    product.categoryRef?.slug ||
    ""
  ).toLowerCase();

  if (
    name.includes("phone") ||
    name.includes("smartphone") ||
    name.includes("hp") ||
    name.includes("android") ||
    name.includes("iphone") ||
    name.includes("flagship")
  ) {
    return "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80";
  }

  if (
    name.includes("laptop") ||
    name.includes("notebook") ||
    name.includes("macbook") ||
    name.includes("ultra slim")
  ) {
    return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&auto=format&fit=crop&q=80";
  }

  if (
    name.includes("keyboard") ||
    name.includes("mechanical") ||
    name.includes("rgb")
  ) {
    return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80";
  }

  if (
    name.includes("monitor") ||
    name.includes("display") ||
    name.includes("screen")
  ) {
    return "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&auto=format&fit=crop&q=80";
  }

  if (
    name.includes("mouse") ||
    name.includes("headphone") ||
    name.includes("headset") ||
    name.includes("earphone") ||
    name.includes("tws") ||
    name.includes("speaker")
  ) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80";
  }

  if (
    name.includes("kamera") ||
    name.includes("camera") ||
    name.includes("lens") ||
    name.includes("mirrorless") ||
    category.includes("kamera") ||
    category.includes("fotografi")
  ) {
    return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&auto=format&fit=crop&q=80";
  }

  if (
    category.includes("pakaian") ||
    category.includes("fashion") ||
    name.includes("baju") ||
    name.includes("kaos") ||
    name.includes("kemeja") ||
    name.includes("jaket") ||
    name.includes("sepatu") ||
    name.includes("sneaker") ||
    name.includes("tas")
  ) {
    return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&auto=format&fit=crop&q=80";
  }

  if (
    category.includes("makanan") ||
    category.includes("minuman") ||
    category.includes("kuliner") ||
    name.includes("kopi") ||
    name.includes("snack") ||
    name.includes("teh")
  ) {
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&auto=format&fit=crop&q=80";
  }

  if (
    category.includes("buku") ||
    name.includes("buku") ||
    name.includes("novel") ||
    name.includes("alat tulis")
  ) {
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&auto=format&fit=crop&q=80";
  }

  if (
    category.includes("olahraga") ||
    name.includes("matras") ||
    name.includes("barbel") ||
    name.includes("sepeda") ||
    name.includes("gym")
  ) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80";
  }

  return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=700&auto=format&fit=crop&q=80";
}

/**
 * Builds a FormData instance or json payload tailored for upload.single('photo') endpoints
 * @param {object|FormData} productData
 * @returns {FormData|object}
 */
function prepareProductPayload(productData) {
  if (productData instanceof FormData) {
    return productData;
  }

  const formData = new FormData();

  if (productData.name !== undefined && productData.name !== null) {
    formData.append("name", String(productData.name).trim());
  }
  if (productData.price !== undefined && productData.price !== null) {
    formData.append("price", String(Number(productData.price) || 0));
  }
  if (productData.stock !== undefined && productData.stock !== null) {
    formData.append("stock", String(Number(productData.stock) || 0));
  }
  if (productData.categoryId !== undefined && productData.categoryId !== null) {
    formData.append("categoryId", String(Number(productData.categoryId) || 1));
  }
  if (
    productData.description !== undefined &&
    productData.description !== null
  ) {
    formData.append("description", String(productData.description).trim());
  }
  if (productData.tag !== undefined && productData.tag !== null) {
    formData.append("tag", String(productData.tag).trim());
  }
  if (productData.rating !== undefined && productData.rating !== null) {
    formData.append("rating", String(Number(productData.rating) || 4.8));
  }
  if (productData.reviews !== undefined && productData.reviews !== null) {
    formData.append("reviews", String(Number(productData.reviews) || 0));
  }

  // Handle uploaded file or photo URL
  const photoFile =
    productData.photo || productData.photoFile || productData.file;
  if (photoFile instanceof File || photoFile instanceof Blob) {
    // Multer single('photo') expects 'photo'
    formData.append("photo", photoFile);
  } else if (
    productData.photoUrl &&
    typeof productData.photoUrl === "string" &&
    productData.photoUrl.trim() !== ""
  ) {
    // If user provided a URL or preset instead of a file
    formData.append("photoUrl", productData.photoUrl.trim());
    formData.append("photo", productData.photoUrl.trim());
  }

  return formData;
}

/**
 * Create a new product directly in database (POST /api/products)
 * Supports multipart/form-data for upload.single('photo')
 * @param {object|FormData} productData
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function createProduct(productData, token = null) {
  const authToken = token || getAuthToken();

  const headers = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const payload = prepareProductPayload(productData);

  try {
    const response = await axios.post(PRODUCTS_API_URL, payload, {
      headers,
      timeout: 15000,
    });

    const data = response.data;
    return {
      success: true,
      message:
        data.message || "Produk dan foto berhasil ditambahkan ke database!",
      data: data.data || data,
    };
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Gagal menambahkan produk ke database.";
    throw new Error(errMsg);
  }
}

/**
 * Update an existing product directly in database (PUT /api/products/:id)
 * Supports multipart/form-data for upload.single('photo')
 * @param {string|number} id
 * @param {object|FormData} productData
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function updateProduct(id, productData, token = null) {
  const authToken = token || getAuthToken();

  const headers = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const payload = prepareProductPayload(productData);

  try {
    const response = await axios.put(`${PRODUCTS_API_URL}/${id}`, payload, {
      headers,
      timeout: 15000,
    });

    const data = response.data;
    return {
      success: true,
      message:
        data.message || "Data produk dan foto berhasil diperbarui di database!",
      data: data.data || data,
    };
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Gagal memperbarui produk di database.";
    throw new Error(errMsg);
  }
}

/**
 * Delete a product directly from database (DELETE /api/products/:id)
 * @param {string|number} id
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function deleteProduct(id, token = null) {
  const authToken = token || getAuthToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await axios.delete(`${PRODUCTS_API_URL}/${id}`, {
      headers,
      timeout: 10000,
    });

    return {
      success: true,
      message:
        response.data?.message || "Produk berhasil dihapus dari database.",
    };
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Gagal menghapus produk dari database.";
    throw new Error(errMsg);
  }
}

/**
 * Formats a number to Indonesian Rupiah currency format
 * @param {number|string} number
 * @returns {string} e.g. "Rp 15.000.000"
 */
export function formatRupiah(number) {
  const value = Number(number) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Fetch orders list from backend API
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.status='']
 * @param {string} [params.payment_status='']
 * @param {string} [params.search='']
 * @param {string} [params.sort_by='created_at']
 * @param {string} [params.sort_order='DESC']
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, totalItems: number, totalPages: number, currentPage: number, data: Array }>}
 */
export async function fetchOrders(
  {
    page = 1,
    limit = 10,
    status = "",
    payment_status = "",
    search = "",
    sort_by = "created_at",
    sort_order = "DESC",
  } = {},
  token = null,
) {
  const authToken = token || getAuthToken();
  const headers = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const params = {
    page,
    limit,
    sort_by,
    sort_order,
  };

  if (status) params.status = status;
  if (payment_status) params.payment_status = payment_status;
  if (search) params.search = search;

  try {
    const response = await axios.get(ORDERS_API_URL, {
      headers,
      params,
      timeout: 12000,
    });

    return response.data;
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Gagal mengambil data pesanan dari server.";
    throw new Error(errMsg);
  }
}

/**
 * Fetch single order by ID
 * @param {number|string} id
 * @param {string} [token]
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function fetchOrderById(id, token = null) {
  const authToken = token || getAuthToken();
  const headers = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await axios.get(`${ORDERS_API_URL}/${id}`, {
      headers,
      timeout: 10000,
    });

    return response.data;
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      `Gagal mengambil data pesanan #${id}.`;
    throw new Error(errMsg);
  }
}

/**
 * Update order status in backend API (e.g. mark as PAID / lunas)
 * Endpoint: PUT https://toko-online-backend-production-b334.up.railway.app/api/orders/:id
 *
 * @param {number|string} id - Order ID
 * @param {object} [payload] - { status: 'PAID', payment_status: 'PAID' }
 * @param {string} [token] - Optional auth token
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
export async function updateOrderStatus(
  id,
  payload = { status: "PAID", payment_status: "PAID" },
  token = null,
) {
  const authToken = token || getAuthToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const data = JSON.stringify(payload);

  const config = {
    method: "put",
    maxBodyLength: Infinity,
    url: `${ORDERS_API_URL}/${id}`,
    headers: headers,
    data: data,
    timeout: 15000,
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      `Gagal memperbarui status pesanan #${id}.`;
    throw new Error(errMsg);
  }
}
