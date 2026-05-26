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
