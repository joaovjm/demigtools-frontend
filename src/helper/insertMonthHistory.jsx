import supabase from "./superBaseClient"

export const insertMonthHistory = async (dataSelected) => {

  try{
    const { data, error } = await supabase.from("month_history").insert([{
      date_ref: dataSelected
    }]).select()
  
    if (error) throw error
  
    if (!error){
      console.log("Histórico de geração do mensal salvo com sucesso!")
    }
    
    return data[0]
  } catch (error) {
    console.log("Error: ", error.message)
  }
  
}

