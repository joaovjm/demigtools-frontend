import { DataNow, DataSelect } from "../components/DataTime";
import { getDonation } from "./getDonation";
import { insertDonation } from "./insertDonation";
import { insertMonthHistory } from "./insertMonthHistory";
import supabase from "./superBaseClient";

export const monthlyfeeGenerator = async ({ mesRefGenerator, campain }) => {
  let count = 0;

  try {
    const { data, error } = await supabase
      .from("donor_mensal")
      .select("*")
      .eq("active", true)
      .eq("donor_mensal_day", Number(DataSelect(mesRefGenerator, "day")));

    const status = await insertMonthHistory(mesRefGenerator);

    if (error) throw error;
    if (data?.length) {

      // Extrai ano-mês da data de referência para comparação (formato YYYY-MM)
      const mesRefYearMonth = mesRefGenerator.substring(0, 7); // Ex: "2025-11-02" -> "2025-11"

      //Verifica se esse doador já tem ficha naquele mês
      await Promise.all(data.map(async (item) => {
        const donation = await getDonation(item.donor_id);
        
        // Verifica se já existe uma doação para o mês de referência (comparando apenas ano-mês)
        const donationExistsForMonth = donation?.some((d) => {
          if (!d.donation_monthref) return false;
          const donationYearMonth = d.donation_monthref.substring(0, 7); // Ex: "2025-11-03" -> "2025-11"
          return donationYearMonth === mesRefYearMonth;
        });

        // Só cria a doação se NÃO existir uma para aquele mês
        if (!donationExistsForMonth) {
          console.log(`Criando doação para o doador ${item.donor_id} - mês ${mesRefGenerator}`);
          
          // Constrói a data de recebimento usando o dia do doador mensal + ano-mês de referência
          const year = DataSelect(mesRefGenerator, "year");
          const month = DataSelect(mesRefGenerator, "month");
          const dayToReceive = String(item.donor_mensal_day).padStart(2, "0");
          const dateToReceive = `${year}-${month}-${dayToReceive}`;
          
          const response = await insertDonation(
            item.donor_id,
            521,
            item.donor_mensal_monthly_fee,
            null,
            DataNow("noformated"),
            dateToReceive, // Usa a data construída com o dia correto
            false,
            false,
            `Criado Automaticamente ${DataNow()}`,
            mesRefGenerator,
            campain,
            22,
            status.monthly_fee_history_id
          );
          if(response.length > 0) {
            count += 1;
          }
          
        } else {
          console.log(`Doação já existe para o doador ${item.donor_id} no mês ${mesRefYearMonth} - pulando`);
        }
      }));
    }

    if (status) {
      return count;
    }

    console.log("Tudo completado com sucesso! ");
  } catch (err) {
    console.log(err);
  }
};
