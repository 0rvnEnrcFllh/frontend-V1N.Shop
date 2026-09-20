import { getProductPhotoUrl } from "./auth";

const CART_STORAGE_KEY = "toko_online_cart";
const ORDERS_STORAGE_KEY = "toko_online_orders";
const CART_EVENT_NAME = "toko_cart_updated";

/**
 * Mendapatkan daftar item keranjang dari localStorage
 * @returns {Array}
 */
export function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Gagal membaca data keranjang:", err);
    return [];
  }
}

/**
 * Menyimpan daftar item keranjang ke localStorage dan memancarkan custom event
 * @param {Array} items
 */
export function saveCartItems(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: items }));
  } catch (err) {
    console.error("Gagal menyimpan data keranjang:", err);
  }
}

/**
 * Menambahkan item ke keranjang belanja
 * @param {object} product
 * @param {number} quantity
 * @returns {Array} Updated cart items
 */
export function addToCart(product, quantity = 1) {
  if (!product || !product.id) return getCartItems();

  const currentCart = getCartItems();
  const productId = String(product.id);
  const existingIndex = currentCart.findIndex(
    (item) => String(item.id) === productId,
  );

  const photoUrl = getProductPhotoUrl(product);
  const price = Number(product.price) || 0;
  const stock = Number(product.stock) || 999;
  const categoryName =
    product.categoryName ||
    product.categoryRef?.name ||
    product.category ||
    "Umum";

  let updatedCart;

  if (existingIndex > -1) {
    updatedCart = [...currentCart];
    const newQty = Math.min(
      stock,
      updatedCart[existingIndex].quantity + quantity,
    );
    updatedCart[existingIndex] = {
      ...updatedCart[existingIndex],
      quantity: newQty,
      price, // update latest price
      name: product.name || updatedCart[existingIndex].name,
      photoUrl: photoUrl || updatedCart[existingIndex].photoUrl,
      stock,
    };
  } else {
    const newItem = {
      id: product.id,
      name: product.name || "Produk Tanpa Nama",
      price,
      stock,
      categoryName,
      photoUrl,
      quantity: Math.min(stock, Math.max(1, quantity)),
      selected: true,
      addedAt: new Date().toISOString(),
    };
    updatedCart = [newItem, ...currentCart];
  }

  saveCartItems(updatedCart);
  return updatedCart;
}

/**
 * Mengubah jumlah (quantity) suatu item di keranjang
 * @param {string|number} productId
 * @param {number} quantity
 */
export function updateCartQuantity(productId, quantity) {
  const currentCart = getCartItems();
  const targetId = String(productId);
  const numQty = Number(quantity);

  if (numQty <= 0) {
    return removeFromCart(productId);
  }

  const updatedCart = currentCart.map((item) => {
    if (String(item.id) === targetId) {
      const maxStock = item.stock || 999;
      return {
        ...item,
        quantity: Math.min(maxStock, numQty),
      };
    }
    return item;
  });

  saveCartItems(updatedCart);
  return updatedCart;
}

/**
 * Mengubah status centang (selected) produk untuk checkout
 * @param {string|number} productId
 */
export function toggleCartItemSelection(productId) {
  const currentCart = getCartItems();
  const targetId = String(productId);

  const updatedCart = currentCart.map((item) => {
    if (String(item.id) === targetId) {
      return {
        ...item,
        selected: !item.selected,
      };
    }
    return item;
  });

  saveCartItems(updatedCart);
  return updatedCart;
}

/**
 * Memilih semua atau membatalkan pilihan semua produk
 * @param {boolean} selectAll
 */
export function toggleSelectAllCart(selectAll = true) {
  const currentCart = getCartItems();
  const updatedCart = currentCart.map((item) => ({
    ...item,
    selected: Boolean(selectAll),
  }));

  saveCartItems(updatedCart);
  return updatedCart;
}

/**
 * Menghapus satu item dari keranjang
 * @param {string|number} productId
 */
export function removeFromCart(productId) {
  const currentCart = getCartItems();
  const targetId = String(productId);
  const updatedCart = currentCart.filter(
    (item) => String(item.id) !== targetId,
  );
  saveCartItems(updatedCart);
  return updatedCart;
}

/**
 * Mengosongkan keranjang belanja
 */
export function clearCart() {
  saveCartItems([]);
  return [];
}

/**
 * Menghapus item-item yang terpilih setelah checkout berhasil
 */
export function clearSelectedCartItems() {
  const currentCart = getCartItems();
  const updatedCart = currentCart.filter((item) => !item.selected);
  saveCartItems(updatedCart);
  return updatedCart;
}

/**
 * Menghitung ringkasan kalkulasi keranjang
 * @param {Array} items
 * @param {string} [promoCode]
 * @param {number} [shippingRate]
 * @returns {object}
 */
export function calculateCartSummary(
  items = [],
  promoCode = "",
  shippingRate = 0,
) {
  const totalItemsCount = items.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0,
  );
  const selectedItems = items.filter((item) => item.selected);
  const selectedCount = selectedItems.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0,
  );

  const subtotal = selectedItems.reduce((acc, item) => {
    return acc + (Number(item.price) || 0) * (Number(item.quantity) || 1);
  }, 0);

  let discount = 0;
  const normalizedPromo = (promoCode || "").trim().toUpperCase();
  if (normalizedPromo === "DISKON10") {
    discount = Math.round(subtotal * 0.1); // Diskon 10%
  } else if (normalizedPromo === "HEMAT20") {
    discount = Math.min(subtotal, 20000); // Diskon Rp 20.000
  } else if (normalizedPromo === "GRATISONGKIR") {
    discount = Math.min(shippingRate, 15000); // Potongan ongkir
  }

  const adminFee = subtotal > 0 ? 1000 : 0; // Biaya layanan / proteksi transaksi
  const totalPayment = Math.max(
    0,
    subtotal + shippingRate + adminFee - discount,
  );

  return {
    totalItemsCount,
    selectedItemsCount: selectedCount,
    selectedItems,
    subtotal,
    shippingRate,
    discount,
    adminFee,
    totalPayment,
  };
}

/**
 * Menyimpan pesanan checkout ke riwayat transaksi lokal
 * @param {object} orderData
 * @returns {object}
 */
export function saveOrderToHistory(orderData) {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const orders = raw ? JSON.parse(raw) : [];
    const newOrder = {
      orderId: `TRX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: "Menunggu Pembayaran",
      ...orderData,
    };
    orders.unshift(newOrder);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return newOrder;
  } catch (err) {
    console.error("Gagal menyimpan pesanan:", err);
    return null;
  }
}
