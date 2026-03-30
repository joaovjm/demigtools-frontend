import { postOperator } from "../api/operatorsManagementApi.js";

const insertOperators = async (id, operator, password, type, uuid) => {
  await postOperator({
    operator_code_id: id,
    operator_name: operator,
    operator_password: password,
    operator_type: type,
    operator_uuid: uuid,
    operator_active: true,
  });
};

export default insertOperators;
