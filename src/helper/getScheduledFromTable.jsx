import supabase from "./superBaseClient";

/**
 * Busca agendados da tabela scheduled
 * onde status = "pendente" e filtrados por operator_code_id
 * 
 * @param {number} operator_code_id - ID do operador
 * @param {function} setScheduledFromTable - Função para atualizar o estado dos agendados
 * @returns {Promise<Array>} Array de agendados da tabela scheduled
 */
const getScheduledFromTable = async (
  operator_code_id,
  setScheduledFromTable
) => {
  try {
    if (!operator_code_id) {
      setScheduledFromTable([]);
      return [];
    }

    // Buscar agendados da tabela scheduled
    let query = supabase
      .from("scheduled")
      .select(
        `*,
         operator_name:operator_code_id(operator_name)`
      )
      .eq("status", "pendente")
      .eq("operator_code_id", operator_code_id)
      .order("scheduled_date", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching scheduled from table:", error);
      setScheduledFromTable([]);
      return [];
    }

    // Buscar dados dos doadores separadamente quando entity_type for "doação"
    const donorIds = data
      .filter(item => item.entity_type === "doação" && item.entity_id)
      .map(item => item.entity_id);

    let donorsData = {};
    if (donorIds.length > 0) {
      const { data: donors, error: donorsError } = await supabase
        .from("donor")
        .select("donor_id, donor_name, donor_tel_1, donor_address, donor_city, donor_neighborhood")
        .in("donor_id", donorIds);

      if (!donorsError && donors) {
        donors.forEach(donor => {
          donorsData[donor.donor_id] = donor;
        });
      }
    }

    // Transformar os dados para o formato esperado pela TableScheduled
    const formattedData = data.map((scheduled) => {
      const donor = scheduled.entity_type === "doação" && scheduled.entity_id 
        ? donorsData[scheduled.entity_id] 
        : null;

      return {
        id: scheduled.scheduled_id,
        donor_id: scheduled.entity_type === "doação" ? scheduled.entity_id : null,
        operator_code_id: scheduled.operator_code_id,
        scheduled_date: scheduled.scheduled_date,
        scheduled_observation: scheduled.observation || null,
        scheduled_tel_success: donor?.donor_tel_1 || null,
        donor: donor ? {
          donor_name: donor.donor_name,
          donor_tel_1: donor.donor_tel_1,
          donor_address: donor.donor_address,
          donor_city: donor.donor_city,
          donor_neighborhood: donor.donor_neighborhood,
        } : null,
        operator_name: scheduled.operator_name?.operator_name || null,
        entity_type: scheduled.entity_type,
        entity_id: scheduled.entity_id,
        source: 'scheduled_table',
      };
    });

    setScheduledFromTable(formattedData);
    return formattedData;
  } catch (error) {
    console.error("Error in getScheduledFromTable:", error);
    setScheduledFromTable([]);
    return [];
  }
};

export default getScheduledFromTable;

