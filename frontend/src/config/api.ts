import axios from 'axios';

export const API_BASE = 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error.response ? `HTTP ${error.response.status}` : error.message;
    return Promise.reject(new Error(msg));
  }
);

export const analyzeSymbol = (symbol: string) =>
  apiClient.get(`/api/v1/analyze/${symbol}?es_symbol=ES%3DF`).then((r) => r.data.data);

export const getCalendarEvents = () =>
  apiClient.get('/api/v1/calendar').then((r) => r.data.data);

export const getNews = (symbol: string) =>
  apiClient.get(`/api/v1/news/${symbol}`).then((r) => r.data.data);
