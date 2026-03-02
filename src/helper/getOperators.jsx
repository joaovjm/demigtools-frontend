import supabase from "./superBaseClient";

export const getOperators = async ({ active, item, from, to }) => {
  let query = supabase.from("operator");
  if (item) {
    query = query.select(item);
  } else {
    query = query.select();
  }
  if (from !== undefined && from !== null) {
    query = query.range(from, to)
    
  }
  if (active) query = query.eq("operator_active", active);
  
  const { data, error } = await query
  if (data) {

    return data;
  }
  if (error) {
    return error;
  }
};
