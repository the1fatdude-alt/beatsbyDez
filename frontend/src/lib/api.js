import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const fetchProducts = async (params = {}) => {
  const { data } = await api.get("/products", { params });
  return data;
};

export const fetchProduct = async (slug) => {
  const { data } = await api.get(`/products/${slug}`);
  return data;
};

export const fetchArtists = async () => {
  const { data } = await api.get("/artists");
  return data;
};

export const fetchArtist = async (slug) => {
  const { data } = await api.get(`/artists/${slug}`);
  return data;
};

export const createOrder = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data;
};

export const subscribeNewsletter = async (email) => {
  const { data } = await api.post("/newsletter", { email });
  return data;
};

const withCreds = { withCredentials: true };

export const adminLogin = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password }, withCreds);
  return data;
};

export const adminLogout = () => api.post("/auth/logout", {}, withCreds);

export const adminMe = async () => {
  const { data } = await api.get("/auth/me", withCreds);
  return data;
};

export const fetchSubscribers = async () => {
  const { data } = await api.get("/admin/subscribers", withCreds);
  return data;
};

export const downloadSubscribersCsv = async () => {
  const { data } = await api.get("/admin/subscribers.csv", { ...withCreds, responseType: "blob" });
  return data;
};

export const formatApiError = (err) => {
  const detail = err?.response?.data?.detail;
  if (!detail) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || "").filter(Boolean).join(" ");
  return String(detail);
};
