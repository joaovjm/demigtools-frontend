import supabase from "../helper/superBaseClient";

const SignUp = async ({ email, password }) => {
  const { data, error } = await supabase.auth
    .signUp({
      email:  email ,
      password:  password ,
    })

  if (error) throw error;

  if (!error) {
    return data
  }
};

export default SignUp;