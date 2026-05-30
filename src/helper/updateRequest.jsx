import { toast } from "react-toastify";
import { patchRequestPackageRowsRequest } from "../api/requestPackagesApi.js";

const updateRequest = async (_requestId, createPackage, endDate) => {
  try {
    const validColumn = ["id", "operator_code_id", "request_end_date"];

    const filterPackage = createPackage.map((pkg) =>
      Object.fromEntries(
        Object.entries(pkg).filter(([key]) => validColumn.includes(key))
      )
    );

    if (filterPackage.some((pkg) => pkg.operator_code_id === "")) {
      toast.warning("Há itens da requisição não atribuidos.");
      return;
    }

    await patchRequestPackageRowsRequest({ endDate, rows: filterPackage });
    return filterPackage;
  } catch (error) {
    console.error("Erro na função updateRequest:", error);
    const msg = error?.message;
    if (msg) toast.error(msg);
    throw error;
  }
};

export default updateRequest;
