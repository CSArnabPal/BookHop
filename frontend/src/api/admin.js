import axios from "axios";

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminLogin = (data) => adminClient.post("/admin/login", data);
export const getAdminDashboard = () => adminClient.get("/admin/dashboard");
export const updateWithdrawalStatus = (id, data) =>
  adminClient.patch(`/admin/withdrawals/${id}`, data);
