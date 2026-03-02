import supabase from "./superBaseClient";

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
 
  const { data, error } = await supabase
    .from("donor")
    .update([
      {
        donor_name: nome,
        donor_type: tipo,
        donor_address: endereco,
        donor_city: cidade,
        donor_neighborhood: bairro,
        donor_tel_1: telefone1,
      },
    ])
    .eq("donor_id", id)
    .select();

  if (error) {
    window.alert("Erro ao atualizar dados do doador: ", error.message);
  }
  if (cpf !== undefined && cpf !== null){
    const cpfReplaced = cpf.replace(/[.-]/g, '');
    try {
      const { data: cpfData, error: cpfError } = await supabase.from("donor_cpf").upsert(
        [
          {
            donor_id: id,
            donor_cpf: cpfReplaced,
          },
        ],
        { onConflict: ["donor_id"] }
      );
      if (cpfError) throw cpfError;
      } catch (error){
      console.log("CPF não foi salvo: ", error.message);
    }
  }
  if (email !== undefined && email !== null){
    try {
      const { data: emailData, error: emailError } = await supabase.from("donor_email").upsert(
        [
          {
            donor_id: id,
            donor_email: email,
          },
        ],
        { onConflict: ["donor_id"] }
      );
      if (emailError) throw emailError;
      } catch (error){
      console.log("Email não foi salvo: ", error.message);
    }
  }
  if (telefone2 !== undefined && telefone2 !== null){
    try {
      const { data: tel2Data, error: tel2Error } = await supabase.from("donor_tel_2").upsert(
        [
          {
            donor_id: id,
            donor_tel_2: telefone2,
          },
        ],
        { onConflict: ["donor_id"] }
      );
      if (tel2Error) throw tel2Error;
    } catch (error){
      console.log("Telefone 2 não foi salvo: ", error.message);
    }
  }

  if (telefone3 !== undefined && telefone3 !== null){
    try {
      const { data: tel3Data, error: tel3Error } = await supabase.from("donor_tel_3").upsert(
        [
          {
            donor_id: id,
            donor_tel_3: telefone3,
          },
        ],
        { onConflict: ["donor_id"] }
      );
      if (tel3Error) throw tel3Error;
    } catch (error){
      console.log("Telefone 3 não foi salvo: ", error.message);
    }
  }

  if (observacao !== undefined && observacao !== null){
    try {
      const { data: observationData, error: observationError } = await supabase.from("donor_observation").upsert(
        [
          {
            donor_id: id,
            donor_observation: observacao,
          },
        ],
        { onConflict: ["donor_id"] }
      );
      if (observationError) throw observationError;
    } catch (error){
      console.log("Observação não foi salva: ", error.message);
    }
  }

  if (referencia !== undefined && referencia !== null){
    try {
      const { data: referenceData, error: referenceError } = await supabase.from("donor_reference").upsert(
        [
          {
            donor_id: id,
            donor_reference: referencia,
          },
        ],
        { onConflict: ["donor_id"] }
      );
      if (referenceError) throw referenceError;
    } catch (error){
      console.log("Referência não foi salva: ", error.message);
    }
  }

  if (mensalidade !== undefined && mensalidade !== null){
    try {
      const { data: mensalData, error: mensalError } = await supabase.from("donor_mensal").upsert(
        [
          {
            donor_id: id,
            donor_mensal_day: dia !== "" ? dia : null,
            donor_mensal_monthly_fee: mensalidade !== "" ? mensalidade : null,
          },
        ],
        { onConflict: ["donor_id"] }
      );
      if (mensalError) throw mensalError;
    } catch (error){
      console.log("Valores do mensal não foram salvos: ", error.message);
    }
  }
  

  

  

  return data;
};
