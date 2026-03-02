import supabase from "./superBaseClient";

const insertOperators = async (id, operator, password, type, uuid) => {
    console.log(id, operator, password, type, uuid)

    const {data, error } = await supabase.from("operator").insert([{
        operator_code_id: id,
        operator_name: operator,
        operator_password: password,
        operator_type: type,
        operator_uuid: uuid
    }])

    if (error) throw error

    if (!error) {
        return data;
    }
}

export default insertOperators;