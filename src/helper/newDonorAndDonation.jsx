import { toast } from "react-toastify";
import { DataNow } from "../components/DataTime";
import { insertDonation } from "./insertDonation";
import { createDonorRequest } from "../api/donorApi";
import supabase from "./superBaseClient";
import { registerOperatorActivity, ACTIVITY_TYPES } from "../services/operatorActivityService";

const newDonorAndDonation = async ({
  id,
  name,
  address,
  neighborhood,
  city,
  telSuccess,
  tel2,
  tel3,
  icpf,
  valueDonation,
  date,
  campain,
  observation,
  operatorID,
  operatorName,
  nowScheduled,
}) => {
  const handleDonorCreation = async () => {
    const payload = {
      nome: name,
      tipo: "Lista",
      endereco: address,
      cidade: city,
      bairro: neighborhood,
      telefone1: telSuccess,
    };
    if (tel2) payload.telefone2 = tel2;
    if (tel3) payload.telefone3 = tel3;
    if (icpf) payload.cpf = icpf;

    const response = await createDonorRequest(payload);
    const donor_id = response?.[0]?.donor_id;
    if (!donor_id) throw new Error("Erro ao criar o doador: resposta sem donor_id");
    return donor_id;
  };

  const handleDonationCreation = async (donor_id) => {
    const donationResponse = await insertDonation(
      donor_id,
      operatorID,
      valueDonation,
      null,
      DataNow("noformated"),
      date,
      false,
      false,
      observation,
      DataNow("mesrefnf"),
      campain
    );
    if (donationResponse.length === 0)
      throw new Error(
        "Doador foi criado, mas houve um erro ao criar a doação: " +
          donationResponse.error?.message
      );

    return donationResponse;
  };

  const handleUpdateStatusLead = async () => {
    try {
      const { data: updateLead, error: errorUpdate } = await supabase
        .from("leads")
        .update({ leads_status: "Sucesso" })
        .eq("leads_id", id);

      if (errorUpdate) throw errorUpdate;
      if (!errorUpdate) return updateLead;
    } catch (error) {
      console.log("Erro: ", error);
    }
  };

  const donorExist = async () => {
    const { data, error } = await supabase
      .from("donor")
      .select()
      .eq("donor_id", id);
    if (error) throw error;
    if (data.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  const result = await toast.promise(
    new Promise(async (resolve, reject) => {
      try {
        if (donorExist === true) {
          console.log("existe");
          return;
        } else {
          const donor_id = await handleDonorCreation();
          const donation = await handleDonationCreation(donor_id);
          const leadStatus = await handleUpdateStatusLead();

          // Registra atividade de doação criada a partir de lead agendado
          await registerOperatorActivity({
            operatorId: operatorID,
            operatorName: operatorName,
            activityType: ACTIVITY_TYPES.LEAD_DONATION_FROM_SCHEDULED,
            donorId: donor_id,
            donorName: name,
            metadata: { 
              leadId: id, 
              source: "leads_from_scheduled",
              donationValue: valueDonation,
            },
          });

          resolve("Operação completada com sucesso!");
        }
      } catch (err) {
        reject(err);
      }
    }),
    {
      pending: "Criando doador e sua doação...",
      success: {
        render({ data }) {
          return data;
        },
      },
      error: {
        render({ data }) {
          return `Erro: ${data.message}`;
        },
      },
    }
  );
  return result;
};

export default newDonorAndDonation;
