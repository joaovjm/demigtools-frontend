import { toast } from "react-toastify";
import supabase from "./superBaseClient";

export const insertDonor = async (
    nome,
    tipo,
    endereco,
    cidade,
    bairro,
    telefone1
  ) => {
    const { data, error } = await supabase.from("donor").insert([
      {
        donor_name: nome,
        donor_type: tipo,
        donor_address: endereco,
        donor_city: cidade,
        donor_neighborhood: bairro,
        donor_tel_1: telefone1,
      },
    ]).select(); 

    if(error){
      console.log("Erro ao criar doador: ", error);
    }
  
    return data;
  };

export const insertDonor_cpf = async (donor_id, cpf) => {
  const cpfReplaced = cpf.replace(/[.-]/g, '');
    const {data, error} = await supabase.from("donor_cpf").insert([{
        donor_id: donor_id,
        donor_cpf: cpfReplaced
    }]).select()

    if (error) {
      window.alert ("Não foi possível salvar o CPF")
    }
    if (!error){
      return data;
    }
};

export const insertDonor_email = async (donor_id, email) => {
  const {data, error} = await supabase.from("donor_email").insert([{
    donor_id: donor_id,
    donor_email: email
  }]).select()

  if (error) {
    toast.warning("Não foi possível salvar o email")
  } else {
    return data;
  }
}

export const insertDonor_tel_2 = async (donor_id, telefone2) => {
  const {data, error} = await supabase.from ("donor_tel_2").insert([{
    donor_id: donor_id,
    donor_tel_2: telefone2
  }]).select()

  if (error) {
    window.alert ("Não foi possível salvar o Telefone 2")
  }
  if (!error){
    return data;
  }
}

export const insertDonor_observation = async (donor_id, observacao) => {
  const {data, error} = await supabase.from("donor_observation").insert([{
    donor_id: donor_id,
    donor_observation: observacao
  }]).select()

  if (!error){
    return data;
  }
}

export const insertDonor_tel_3 = async (donor_id, telefone3) => {
  const {data, error} = await supabase.from("donor_tel_3").insert([{
    donor_id: donor_id,
    donor_tel_3: telefone3
  }]).select()

  if (!error){
    return data;
  }
}

export const insertDonor_reference = async (donor_id, referencia) => {
  const {data, error} = await supabase.from("donor_reference").insert([{
    donor_id: donor_id,
    donor_reference: referencia
  }]).select()

  if (!error){
    return data;
  }
}

export const insertDonor_mensal = async (donor_id, dia, mensalidade) => {
  const{data, error} = await supabase.from("donor_mensal").insert ([{
    donor_id: donor_id,
    donor_mensal_day: dia,
    donor_mensal_monthly_fee: mensalidade
  }]).select()

  if (!error){
    return data;
  }
}