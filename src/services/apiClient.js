import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api", // URL relativa — deixa assim!
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;