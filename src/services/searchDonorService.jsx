import searchDonor from "../helper/searchDonor"

const fetchDonors = async (searchTerm, selectedValue, setLoading, setDonor) => {
  try {
    setLoading(true);
    const data = await searchDonor(searchTerm, selectedValue);
    setDonor(data);
  } catch (error) {
    console.log("Falha ao encontrar doador: ", error.message);
  } finally {
    setLoading(false);
  }
};

export default fetchDonors;
