import { deleteRequestPackageRequest } from "../api/requestPackagesApi.js";

export async function deleteRequestPackage(requestId) {
  try {
    const envelope = await deleteRequestPackageRequest(requestId);
    return {
      success: true,
      message: envelope?.message || "Requisição deletada com sucesso",
      data: envelope?.data,
    };
  } catch (error) {
    console.error("Erro ao deletar pacote:", error);
    return {
      success: false,
      message: error?.message || "Erro ao deletar requisição",
    };
  }
}
