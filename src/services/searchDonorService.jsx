import { searchDonorsRequest } from "../api/donorApi";

const fetchDonors = async (searchTerm, selectedValue, setLoading, setDonor) => {
  try {
    setLoading(true);
    const data = await searchDonorsRequest({ q: searchTerm, donorType: selectedValue });
    setDonor(data || []);
  } catch (error) {
    setDonor([]);
    throw error;
  } finally {
    setLoading(false);
  }
};

export default fetchDonors;
