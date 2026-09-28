const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const ADMIN_ACCESS_KEY = "wazoo:admin_access_token";
const ADMIN_REFRESH_KEY = "wazoo:admin_refresh_token";
const CUSTOMER_ACCESS_KEY = "wazoo:customer_access_token";
const CUSTOMER_REFRESH_KEY = "wazoo:customer_refresh_token";

export const apiEnabled = Boolean(API_BASE_URL);

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type AuthMode = "admin" | "customer" | "customer-optional";

interface RequestOptions extends RequestInit {
  auth?: AuthMode;
}

function readStorage(storage: Storage, key: string) {
  try { return storage.getItem(key); }
  catch { return null; }
}

function adminAccessToken() {
  return typeof sessionStorage === "undefined" ? null : readStorage(sessionStorage, ADMIN_ACCESS_KEY);
}

function customerAccessToken() {
  return typeof localStorage === "undefined" ? null : readStorage(localStorage, CUSTOMER_ACCESS_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!apiEnabled) throw new ApiError("API da Wazoo não configurada", 503, "API_DISABLED");

  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (options.auth === "admin") {
    const token = adminAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } else if (options.auth === "customer" || options.auth === "customer-optional") {
    const token = customerAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  let data: any = null;
  if (raw) {
    try { data = JSON.parse(raw); }
    catch { data = raw; }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error)) ||
      `Erro ${response.status} ao acessar a API`;
    const code = data && typeof data === "object" ? data.code : undefined;
    throw new ApiError(String(message), response.status, code);
  }

  return data as T;
}

/* ── Sessão administrativa ─────────────────────────────────── */
export interface AdminSession {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "SUPER_ADMIN";
  };
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const session = await request<AdminSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    throw new ApiError("Esta conta não possui acesso administrativo.", 403, "ADMIN_REQUIRED");
  }

  sessionStorage.setItem(ADMIN_ACCESS_KEY, session.token);
  sessionStorage.setItem(ADMIN_REFRESH_KEY, session.refreshToken);
  return session;
}

export function hasAdminSession() {
  return Boolean(adminAccessToken());
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(ADMIN_ACCESS_KEY);
    sessionStorage.removeItem(ADMIN_REFRESH_KEY);
  } catch { /* ambiente sem sessionStorage */ }
}

export function getAdminMe() {
  return request<{ id: string; name: string; email: string; role: string; createdAt: string }>(
    "/auth/me",
    { auth: "admin" },
  );
}

/* ── Conta do cliente ──────────────────────────────────────── */
export interface ApiCustomerAddress {
  id: string;
  label: string;
  recipientName?: string | null;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export interface ApiCustomerPet {
  id: string;
  name: string;
  type: "cachorro" | "gato";
  breed: string;
  size: "pequeno" | "medio" | "grande" | "todos";
  age: string;
  weight: string;
  restrictions?: string | null;
  notes?: string | null;
}

export interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  preference: "DELIVERY" | "PICKUP";
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  createdAt: string;
  addresses: ApiCustomerAddress[];
  pets: ApiCustomerPet[];
}

export interface CustomerSession {
  token: string;
  refreshToken: string;
  user: ApiCustomer;
}

function persistCustomerSession(session: CustomerSession) {
  localStorage.setItem(CUSTOMER_ACCESS_KEY, session.token);
  localStorage.setItem(CUSTOMER_REFRESH_KEY, session.refreshToken);
}

export async function registerCustomer(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
  preference?: "DELIVERY" | "PICKUP";
  address?: {
    label?: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
}) {
  const session = await request<CustomerSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  persistCustomerSession(session);
  return session;
}

export async function loginCustomer(email: string, password: string) {
  const session = await request<CustomerSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (session.user.role !== "CUSTOMER") {
    throw new ApiError("Use o acesso administrativo para esta conta.", 403, "CUSTOMER_REQUIRED");
  }
  persistCustomerSession(session);
  return session;
}

export function hasCustomerSession() {
  return Boolean(customerAccessToken());
}

export function clearCustomerSession() {
  try {
    localStorage.removeItem(CUSTOMER_ACCESS_KEY);
    localStorage.removeItem(CUSTOMER_REFRESH_KEY);
  } catch { /* ambiente sem localStorage */ }
}

export function getCustomerMe() {
  return request<ApiCustomer>("/auth/me", { auth: "customer" });
}

export function updateCustomerProfile(input: {
  name?: string;
  phone?: string;
  avatar?: string | null;
  preference?: "DELIVERY" | "PICKUP";
}) {
  return request<Partial<ApiCustomer> & Pick<ApiCustomer, "id" | "name" | "email">>("/customer/me", {
    method: "PATCH",
    auth: "customer",
    body: JSON.stringify(input),
  });
}

export function createCustomerAddress(input: Omit<ApiCustomerAddress, "id" | "isDefault"> & { isDefault?: boolean }) {
  return request<ApiCustomerAddress>("/customer/addresses", {
    method: "POST",
    auth: "customer",
    body: JSON.stringify(input),
  });
}

export function updateCustomerAddress(id: string, input: Partial<Omit<ApiCustomerAddress, "id">>) {
  return request<ApiCustomerAddress>(`/customer/addresses/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: "customer",
    body: JSON.stringify(input),
  });
}

export function deleteCustomerAddress(id: string) {
  return request<{ message: string }>(`/customer/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: "customer",
  });
}

export function createCustomerPet(input: Omit<ApiCustomerPet, "id">) {
  return request<ApiCustomerPet>("/customer/pets", {
    method: "POST",
    auth: "customer",
    body: JSON.stringify(input),
  });
}

export function updateCustomerPet(id: string, input: Partial<Omit<ApiCustomerPet, "id">>) {
  return request<ApiCustomerPet>(`/customer/pets/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: "customer",
    body: JSON.stringify(input),
  });
}

export function deleteCustomerPet(id: string) {
  return request<{ message: string }>(`/customer/pets/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: "customer",
  });
}

/* ── Pedidos / checkout ────────────────────────────────────── */
export interface ApiOrderItemInput {
  productId?: string;
  kitId?: string;
  quantity: number;
  variantKey?: string;
  variantLabel?: string;
}

export interface CreateApiOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDoc?: string;
  deliveryMethod: "DELIVERY" | "PICKUP";
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  items: ApiOrderItemInput[];
  couponCode?: string;
  paymentMethod?: "pix" | "credit_card" | "boleto";
  customerNote?: string;
}

export interface ApiOrderItem {
  id: string;
  productId?: string | null;
  kitId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image: string;
  variantKey?: string | null;
  variantLabel?: string | null;
}

export interface ApiOrder {
  id: string;
  number: string;
  publicToken: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDoc?: string | null;
  deliveryMethod: "DELIVERY" | "PICKUP";
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  couponCode?: string | null;
  customerNote?: string | null;
  adminNote?: string | null;
  items: ApiOrderItem[];
  statusEvents?: Array<{ status: string; createdAt: string }>;
  createdAt: string;
  updatedAt?: string;
}

export function createApiOrder(input: CreateApiOrderInput) {
  return request<ApiOrder>("/orders", {
    method: "POST",
    auth: "customer-optional",
    body: JSON.stringify(input),
  });
}

export function validateApiCoupon(code: string, subtotal: number) {
  return request<{
    valid: true;
    code: string;
    type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
    value: number;
    discount: number;
  }>("/orders/validate-coupon", {
    method: "POST",
    body: JSON.stringify({ code, subtotal }),
  });
}

export function createApiPayment(input: {
  orderId: string;
  publicToken: string;
  method: "pix" | "credit_card" | "boleto";
  email: string;
  cpf: string;
  firstName: string;
  lastName: string;
  token?: string;
  installments?: number;
  paymentMethodId?: string;
  issuerId?: string;
}) {
  return request<{
    paymentId: string | number;
    status: string;
    method: string;
    pixCode?: string;
    pixQrBase64?: string;
    boletoUrl?: string;
    total: number;
    orderNumber: string;
  }>("/payments/process", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getApiPaymentStatus(orderId: string, publicToken: string) {
  return request<{
    paymentStatus: string;
    status: string;
    number: string;
    paidAt?: string | null;
  }>(`/payments/status/${encodeURIComponent(orderId)}?token=${encodeURIComponent(publicToken)}`);
}

export type ApiOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface ApiTrackingOrder {
  number: string;
  status: ApiOrderStatus;
  paymentStatus: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "IN_PROCESS";
  deliveryMethod: "DELIVERY" | "PICKUP";
  customerDoc?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  customerNote?: string | null;
  adminNote?: string | null;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image: string;
    variantLabel?: string | null;
  }>;
  statusEvents?: Array<{ status: ApiOrderStatus; createdAt: string }>;
}

export function getApiOrderTracking(number: string) {
  return request<ApiTrackingOrder>(`/orders/track/${encodeURIComponent(number)}`);
}

export function listCustomerOrders() {
  return request<ApiOrder[]>("/customer/orders", { auth: "customer" });
}

export function listApiOrdersAdmin(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.size ? `?${query.toString()}` : "";
  return request<{ data: ApiOrder[]; total: number; page: number; pages: number }>(
    `/orders${suffix}`,
    { auth: "admin" },
  );
}

export function updateApiOrderAdmin(
  id: string,
  input: { status?: ApiOrderStatus; adminNote?: string },
) {
  return request<ApiOrder>(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PUT",
    auth: "admin",
    body: JSON.stringify(input),
  });
}

/* ── Catálogo ──────────────────────────────────────────────── */
export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  promoLabel?: string | null;
  image: string;
  gallery: string[];
  audience: "cachorro" | "gato" | "ambos";
  size: "pequeno" | "medio" | "grande" | "todos";
  leadTime: string;
  availability: string;
  tags: string[];
  active: boolean;
  featured: boolean;
  stock?: number | null;
  variants?: Array<{
    name: string;
    options: Array<{ label: string; priceDelta?: number }>;
  }> | null;
  createdAt: string;
}

export interface ApiProductInput {
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  price: number;
  comparePrice?: number;
  promoLabel?: string;
  image?: string;
  gallery?: string[];
  audience?: "cachorro" | "gato" | "ambos";
  size?: "pequeno" | "medio" | "grande" | "todos";
  leadTime?: string;
  availability?: string;
  tags?: string[];
  active?: boolean;
  featured?: boolean;
  onDemand?: boolean;
  stock?: number;
  variants?: Array<{
    name: string;
    options: Array<{ label: string; priceDelta?: number }>;
  }>;
}

export async function listApiProducts(params: Record<string, string | number | boolean | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  const suffix = query.size ? `?${query.toString()}` : "";
  return request<{ data: ApiProduct[]; total: number; page: number; pages: number }>(`/products${suffix}`);
}

export function createApiProduct(input: ApiProductInput) {
  return request<ApiProduct>("/products", {
    method: "POST",
    auth: "admin",
    body: JSON.stringify(input),
  });
}

export function updateApiProduct(id: string, input: Partial<ApiProductInput>) {
  return request<ApiProduct>(`/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: "admin",
    body: JSON.stringify(input),
  });
}

export function deleteApiProduct(id: string) {
  return request<{ message: string }>(`/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: "admin",
  });
}

/* ── Configurações ─────────────────────────────────────────── */
export function getApiSettings() {
  return request<Record<string, string>>("/settings");
}

export function updateApiSettings(input: Record<string, string>) {
  return request<{ message: string; data: Record<string, string> }>("/settings", {
    method: "PUT",
    auth: "admin",
    body: JSON.stringify(input),
  });
}

export const saveApiSettings = updateApiSettings;

/* ── Avaliações ────────────────────────────────────────────── */
export interface ApiReview {
  id: string;
  name: string;
  email?: string | null;
  petName?: string | null;
  rating: number;
  text: string;
  approved: boolean;
  featured: boolean;
  productId?: string | null;
  createdAt: string;
}

export function listApiReviews(params: { featured?: boolean } = {}) {
  const query = new URLSearchParams();
  if (params.featured !== undefined) query.set("featured", String(params.featured));
  const suffix = query.size ? `?${query.toString()}` : "";
  return request<ApiReview[]>(`/reviews${suffix}`);
}

export function apiRequestAdmin<T>(path: string, options: RequestInit = {}) {
  return request<T>(path, { ...options, auth: "admin" });
}


/* ── Clientes (admin) ─────────────────────────────────────── */
export interface ApiAdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  preference: "DELIVERY" | "PICKUP";
  active: boolean;
  createdAt: string;
  totalSpent: number;
  addresses: ApiCustomerAddress[];
  pets: ApiCustomerPet[];
  orders: Array<{
    id: string;
    number: string;
    status: ApiOrderStatus;
    paymentStatus: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | "IN_PROCESS";
    total: number;
    createdAt: string;
  }>;
  _count: { orders: number; pets: number };
}

export function listApiCustomersAdmin(params: {
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.size ? `?${query.toString()}` : "";
  return request<{ data: ApiAdminCustomer[]; total: number; page: number; pages: number }>(
    `/customers${suffix}`,
    { auth: "admin" },
  );
}

export function setApiCustomerActive(id: string, active: boolean) {
  return request<{ id: string; active: boolean }>(
    `/customers/${encodeURIComponent(id)}/active`,
    {
      method: "PATCH",
      auth: "admin",
      body: JSON.stringify({ active }),
    },
  );
}
