import insertOperators from "../helper/insertOperators";
import SignUp from "./SignUp";
import { postSupabaseAuthCleanup } from "../api/operatorsManagementApi.js";

const UsersToOperators = async ({ cod, operator, password, type }) => {
  const login = operator
    .normalize("NFD")
    .replace(/[\u0300-\u036f\s]/g, "")
    .toLocaleLowerCase();
  const email = `${login}@therocha.com`;
  const signUp = await SignUp({ email, password });

  if (!signUp?.user) {
    throw new Error("Falha ao criar usuário no Supabase Auth.");
  }

  const uuid = signUp.user.id;
  try {
    await insertOperators(cod, operator, password, type, uuid);
    return "OK";
  } catch (error) {
    console.error("Erro ao gravar operador no Postgres:", error?.message || error);
    try {
      await postSupabaseAuthCleanup(uuid);
    } catch (rollbackErr) {
      console.error("Rollback auth:", rollbackErr?.message || rollbackErr);
    }
    throw error;
  }
};

export default UsersToOperators;
