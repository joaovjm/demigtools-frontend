import { fetchAdminReceiptConfig } from "../api/adminManagerApi";

export async function getEditReceipt () {
    try{
        const response = await fetchAdminReceiptConfig();
        return response?.data ? [response.data] : [];
    }catch(error){
        console.error(error)
        return [];
    }
}