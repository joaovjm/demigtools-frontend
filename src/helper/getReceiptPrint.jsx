import supabase from "./superBaseClient";

export async function getReceiptPrint() {
  const { data, error } = await supabase.storage
    .from("receiptPdfToPrint")
    .list("Print Checked", {
        limit: 100,
        offset: 0,
        sortBy: {
            column: "name",
            order: "asc",
        },
    })
  if (error) throw error;

  const dataFiltered = data.filter(item => item.name !== ".emptyFolderPlaceholder")

  return dataFiltered;
}
