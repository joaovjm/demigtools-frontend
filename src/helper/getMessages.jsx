import supabase from "./superBaseClient";

export async function getMessages() {

    
    try {
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .order('received_at', { ascending: true });
        
        if (error) {
            console.error("❌ Erro na query de mensagens:", error);
            throw error;
        }
        
        if (data?.length > 0) {
        }
        
        return data || [];
    } catch (error) {
        console.error("❌ Erro ao buscar mensagens:", error);
        return []; // Retorna array vazio em caso de erro
    }
}