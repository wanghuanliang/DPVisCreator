import axios from "axios";
// const currentURL = "http://localhost:8000/api"; // 本地后端
const currentURL = "http://101.43.188.187:30010/api"; // 服务器后端

axios.defaults.baseURL = currentURL;
export { currentURL };

// 每个请求带一个session，帮助后端处理并发
const session = String(new Date().getTime());
export { session };

export const getFilteredData = (params) =>
  axios.post("/getFilteredData", { ...params, session_id: session });
export const getBaseData = (params) =>
  axios.get("/getBaseData", { params: { ...params, session_id: session } });
export const setPattern = (params) =>
  axios.post("/setPattern", { ...params, session_id: session });
export const setWeights = (params) =>
  axios.post("/setWeights", { ...params, session_id: session });
export const getModelData = (params) =>
  axios.post("/getModelData", { ...params, session_id: session });
export const getNetwork = (params) =>
  axios.get("/getNetwork", { params: { ...params, session_id: session } });
export const getMetrics = (params) =>
  axios.get("/getMetrics", { params: { ...params, session_id: session } });

// init destroy
export const servicesInit = () => axios.post("/init", { session_id: session });
export const servicesDestroy = () =>
  axios.post("/destroy", { session_id: session });
