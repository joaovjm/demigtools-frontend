import supabase from "./superBaseClient";

export async function setActivityHistoric({ dbID, dataBase, operatorID  }) {
  try {
    let dataBaseRef;
    switch (dataBase){
        case "donation":
            dataBaseRef = "donation_code_id";
        case "donor":
            dataBaseRef = "donor_id";
    }
  
    const newDate = new Date();
    const { error } = await supabase
      .from(dataBase)
      .update({ activity_operator: operatorID, activity_date: newDate })
      .eq(dataBaseRef, Number(dbID))
    if (error) throw error;
  } catch (error) {
    console.log(error.message);
  }
}
