import { touchDonorActivityRequest } from "../api/donorApi";

export async function setActivityHistoric({ dbID, dataBase, operatorID }) {
  try {
    if (dataBase !== "donor") return;
    await touchDonorActivityRequest(Number(dbID), operatorID);
  } catch (error) {
    console.log(error.message);
  }
}
