import { fetchDonorById } from "../api/donorApi";

export const getInfoDonor = async (id) => fetchDonorById(id);
