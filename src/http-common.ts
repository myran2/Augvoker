import axios, { type AxiosInstance } from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: "https://www.warcraftlogs.com/v1",
  headers: {
    "Content-type": "application/json",
  },
  params: {
    "api_key": import.meta.env.VITE_WCL_API_KEY
  }
});

export default apiClient;
