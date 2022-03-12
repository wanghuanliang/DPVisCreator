import axios from "axios";
axios.defaults.baseURL = "http://localhost:8000/api";

export const setWeights = (params) => axios.post("/setWeights", params);
