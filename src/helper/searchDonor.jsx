import supabase from "./superBaseClient";

const searchDonor = async (params, donor_type) => {
  try {
    let query;
    let searchType = "name"; // Para rastreamento do tipo de busca
    
    // Determina se deve buscar na tabela leads ou donor
    const isLeadSearch = donor_type === "Lead" || donor_type === "Leads";

    if (params) {
      const trimmedParams = params.trim();
      
      // Remove tudo que não for número para análise
      const cleanParam = trimmedParams.replace(/\D/g, "");

      // 1. BUSCA POR RECIBO: Começa com R/r seguido de números
      if (/^r\d+$/i.test(trimmedParams)) {
        searchType = "receipt";
        
        if (!isLeadSearch) {
          const receiptNumber = Number(cleanParam);
          query = supabase
            .from("donation")
            .select(
              `
              donor: donation_donor_id_fkey(
                donor_id,
                donor_name,
                donor_address,
                donor_tel_1,
                donor_neighborhood,
                donor_type
              )
            `
            )
            .eq("receipt_donation_id", receiptNumber);
        }
      }
      // 2. BUSCA POR CPF/CNPJ: Começa com XX/xx seguido de números
      else if (/^xx/i.test(trimmedParams)) {
        searchType = "cpf";
        
        // Remove o prefixo "xx" e pega apenas os números
        const cpfSearch = trimmedParams.substring(2).replace(/\D/g, "");
        
        if (isLeadSearch) {
          query = supabase
            .from("leads")
            .select(
              `leads_id, leads_name, leads_address, leads_tel_1, leads_neighborhood, leads_icpf, leads_value, operator: operator_code_id(operator_code_id, operator_name)`
            )
            .ilike("leads_icpf", `%${cpfSearch}%`);
        } else {
          query = supabase
            .from("donor")
            .select(
              `donor_id, donor_name, donor_address, donor_tel_1, donor_neighborhood, donor_type, donor_cpf!inner(donor_cpf)`
            )
            .ilike("donor_cpf.donor_cpf", `%${cpfSearch}%`);
        }
      }
      // 4. BUSCA POR TELEFONE: Somente números sem formatação especial de CPF/CNPJ
      else if (
        /^\d+$/.test(cleanParam) &&
        cleanParam.length >= 8 &&
        cleanParam.length <= 11 &&
        !trimmedParams.includes(".") &&
        !trimmedParams.includes("-") &&
        !trimmedParams.includes("/")
      ) {
        searchType = "phone";
        
        if (isLeadSearch) {
          query = supabase
            .from("leads")
            .select(
              `leads_id, leads_name, leads_address, leads_tel_1, leads_neighborhood, leads_icpf, leads_value, operator: operator_code_id(operator_code_id, operator_name)`
            )
            .or(`leads_tel_1.ilike.%${cleanParam}%,leads_tel_2.ilike.%${cleanParam}%`);
        } else {
          query = supabase.rpc("search_donor_by_phone", {
            phone_search: cleanParam,
            donor_type_filter: donor_type.trim() || "Todos",
          });
        }
      }
      // 5. BUSCA POR TELEFONE PARCIAL: Números curtos que podem ser parte de telefone
      else if (/^\d+$/.test(cleanParam) && cleanParam.length < 8) {
        searchType = "phone";
        
        if (isLeadSearch) {
          query = supabase
            .from("leads")
            .select(
              `leads_id, leads_name, leads_address, leads_tel_1, leads_neighborhood, leads_icpf, leads_value, operator: operator_code_id(operator_code_id, operator_name)`
            )
            .or(`leads_tel_1.ilike.%${cleanParam}%,leads_tel_2.ilike.%${cleanParam}%`);
        } else {
          query = supabase.rpc("search_donor_by_phone", {
            phone_search: cleanParam,
            donor_type_filter: donor_type.trim() || "Todos",
          });
        }
      }
      // 6. BUSCA POR NOME: Tudo que não se encaixa nos padrões acima
      else {
        searchType = "name";
        
        if (isLeadSearch) {
          query = supabase
            .from("leads")
            .select(
              `leads_id, leads_name, leads_address, leads_tel_1, leads_neighborhood, leads_icpf, leads_value, operator: operator_code_id(operator_code_id, operator_name)`
            )
            .ilike("leads_name", `%${trimmedParams}%`);
        } else {
          query = supabase
            .from("donor")
            .select(
              `donor_id, donor_name, donor_address, donor_tel_1, donor_neighborhood, donor_type`
            )
            .ilike("donor_name", `%${trimmedParams}%`);
        }
      }
    }

    // Aplica filtros de tipo de doador (apenas para donors, não para leads)
    if (query && !isLeadSearch && donor_type !== "" && searchType !== "phone") {
      const trimmedDonorType = donor_type.trim();
      
      if (searchType === "receipt") {
        // Para busca por recibo
        if (trimmedDonorType === "Todos") {
          query = query.in("donor.donor_type", ["Avulso", "Mensal", "Lista"]);
        } else if (["Avulso", "Mensal", "Lista", "Excluso"].includes(trimmedDonorType)) {
          query = query.eq("donor.donor_type", trimmedDonorType);
        }
      } else {
        // Para outras buscas (nome, cpf, cnpj)
        if (trimmedDonorType === "Todos") {
          query = query.in("donor_type", ["Avulso", "Mensal", "Lista"]);
        } else if (["Avulso", "Mensal", "Lista", "Excluso"].includes(trimmedDonorType)) {
          query = query.eq("donor_type", trimmedDonorType);
        }
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Normaliza os dados para manter consistência na interface
    if (data) {
      if (searchType === "receipt" && !isLeadSearch) {
        const dataDonor = data[0]?.donor;
        return dataDonor ? [dataDonor] : [];
      } else if (isLeadSearch && data.length > 0) {
        // Mapeia os campos de leads para o formato esperado pelo componente
        const normalizedData = data.map((lead) => ({
          donor_id: lead.leads_id,
          donor_name: lead.leads_name,
          donor_address: lead.leads_address,
          donor_tel_1: lead.leads_tel_1,
          donor_neighborhood: lead.leads_neighborhood,
          donor_type: "Lead",
          donor_cpf: lead.leads_icpf,
          leads_value: lead.leads_value,
          operator_code_id: lead.operator?.operator_code_id,
          operator_name: lead.operator?.operator_name,
          isLead: true, // Flag para identificar que é um lead
        }));

        return normalizedData;
      } else {
        return data;
      }
    }

    return [];
  } catch (error) {
    console.error("Erro ao buscar doador: ", error);
    return null;
  }
};

export default searchDonor;
