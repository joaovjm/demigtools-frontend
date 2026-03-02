import supabase from "./superBaseClient";
import { DataNow } from "../components/DataTime";

const insertRequest = async (createPackage) => {
  const validColumn = [
    "donor_id",
    "operator_code_id",
    "receipt_donation_id",
    "request_end_date",
    "request_name",
  ];

  const filterPackage = createPackage.map((pkg) =>
    Object.fromEntries(
      Object.entries(pkg).filter(([key]) => validColumn.includes(key))
    )
  );

  const { data: requestName, error: requestError } = await supabase
    .from("request_name")
    .insert([
      {
        name: createPackage[0].request_name,
        date_created: DataNow("noformated"),
        date_validate: createPackage[0].request_end_date,
      },
    ])
    .select();

  if (requestError) console.error(requestError.message);

  if (requestName) {
    const update = filterPackage.map((pkg) => ({
      ...pkg,
      request_start_date: DataNow("noformated"),
      request_name_id: requestName[0].id
    }));
    const { data, error } = await supabase
      .from("request")
      .insert(update)
      .select();
    if (error) console.error("Erro: ", error.message);
    if (data) return data;
  }
};

export default insertRequest;
