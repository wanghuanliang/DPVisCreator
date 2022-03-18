import axios from "axios";
axios.defaults.baseURL = "http://localhost:8000/api";

export const setPattern = (params) => axios.post("/setPattern", params);
export const setWeights = (params) => axios.post("/setWeights", params);
export const getModelData = (params) => axios.post("/getModelData", params);
