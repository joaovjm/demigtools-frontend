import { updateDonorRequest } from "../api/donorApi";

export const editDonor = async (
  id,
  nome,
  tipo,
  cpf,
  email,
  endereco,
  cidade,
  bairro,
  telefone1,
  telefone2,
  telefone3,
  dia,
  mensalidade,
  observacao,
  referencia
) => {
  try {
    const res = await updateDonorRequest(id, {
      nome,
      tipo,
      cpf,
      email,
      endereco,
      cidade,
      bairro,
      telefone1,
      telefone2,
      telefone3,
      dia,
      mensalidade,
      observacao,
      referencia,
    });
    return res?.data;
  } catch (error) {
    window.alert("Erro ao atualizar dados do doador: " + (error.message || ""));
    return null;
  }
};
