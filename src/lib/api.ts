const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const ADMIN_ACCESS_KEY = "wazoo:admin_access_token";
const ADMIN_REFRESH_KEY = "wazoo:admin_refresh_token";

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

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

function getAccessToken() {
  try { return sessionStorage.getItem(ADMIN_ACCESS_KEY); }
  catch { return null; }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!apiEnabled) throw new ApiError("API da Wazoo não configurada", 503, "API_DISABLED");

  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (options.auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch { data = text; }
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

  sessionStorage.setItem(ADMIN_ACCESS_KEY, session.token);
  sessionStorage.setItem(ADMIN_REFRESH_KEY, session.refreshToken);
  return session;
}

export function hasAdminSession(): boolean {
  return Boolean(getAccessToken());
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(ADMIN_ACCESS_KEY);
    sessionStorage.removeItem(ADMIN_REFRESH_KEY);
  } catch { /* ambiente sem sessionStorage */ }
}

export async function getAdminMe() {
  return request<{ id: string; name: string; email: string; role: string; createdAt: string }>(
    "/auth/me",
    { auth: true },
  );
}

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
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: "DELIVERY" | "PICKUP";
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  items: ApiOrderItem[];
  createdAt: string;
}

export function createApiOrder(input: CreateApiOrderInput) {
  return request<ApiOrder>("/orders", {
    method: "POST",
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

export function getApiPaymentStatus(orderId: string) {
  return request<{
    paymentStatus: string;
    status: string;
    number: string;
    paidAt?: string | null;
  }>(`/payments/status/${encodeURIComponent(orderId)}`);
}

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

export async function listApiProducts(params: Record<string, string | number | boolean | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  const suffix = query.size ? `?${query.toString()}` : "";
  return request<{ data: ApiProduct[]; total: number; page: number; pages: number }>(`/products${suffix}`);
}

export function apiRequestAdmin<T>(path: string, options: RequestInit = {}) {
  return request<T>(path, { ...options, auth: true });
}
