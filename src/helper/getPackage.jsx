import { postDonationCandidates } from "../api/requestPackagesApi.js";

const getPackage = async ({
  type,
  startDate,
  endDate,
  filterPackage,
  ignoreWorkList,
}) => {
  try {
    return await postDonationCandidates({
      type,
      startDate,
      endDate,
      filterPackage,
      ignoreWorkList: Boolean(ignoreWorkList),
    });
  } catch (error) {
    console.error(error?.message || error);
    return [];
  }
};

export default getPackage;
