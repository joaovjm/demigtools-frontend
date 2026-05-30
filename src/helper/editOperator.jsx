import { patchOperator } from "../api/operatorsManagementApi.js";

const editOperator = async ({ id, name, type, active, password }) => {
  await patchOperator(id, {
    operator_name: name,
    operator_type: type,
    operator_active: active,
    operator_password: password,
  });
  return "success";
};

export default editOperator;
