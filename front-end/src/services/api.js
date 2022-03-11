import axios from "axios";
axios.defaults.baseURL = "http://localhost:8000";

export const setWeights = (params) => axios.post("/setWeight", params);
