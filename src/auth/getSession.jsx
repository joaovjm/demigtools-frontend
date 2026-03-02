import supabase from "../helper/superBaseClient";

const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session
};

export default getSession;