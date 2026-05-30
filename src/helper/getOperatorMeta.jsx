import apiClient from "../services/apiClient";

const getOperatorMeta = async (operator) => {
  try {
    const params = { limit: 1 };
    if (operator !== undefined && operator !== null && operator !== "") {
      params.operatorCodeId = operator;
    }

    const { data } = await apiClient.get("/admin-manager/operator-meta/history", {
      params,
    });

    if (data && typeof data === "object" && data.success === true && Array.isArray(data.data)) {
      return data.data;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.log("Error: ", error.message);
    return [];
  }
};

export default getOperatorMeta;
