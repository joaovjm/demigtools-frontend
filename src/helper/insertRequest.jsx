import { DataNow } from "../components/DataTime";
import { createRequestPackageRequest } from "../api/requestPackagesApi.js";

const insertRequest = async (createPackage) => {
  return createRequestPackageRequest({
    rows: createPackage,
    dateCreated: DataNow("noformated"),
  });
};

export default insertRequest;
