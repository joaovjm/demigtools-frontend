import { deleteOperatorAccount } from "../api/operatorsManagementApi.js";

const deleteOperator = async (operator_code_id) => {
  try {
    await deleteOperatorAccount(operator_code_id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || "Erro inesperado" };
  }
};

export default deleteOperator;
