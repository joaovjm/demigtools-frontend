import {
  fetchCheckPrintPending,
  fetchCheckPrintPrinted,
  patchCheckPrintCollectors,
  patchCheckPrintMarkPrinted,
} from "../api/receiverDonationsApi";

export async function getDonationsPrint(startDate, endDate, donationType = "Todos") {
  try {
    const response = await fetchCheckPrintPending({ startDate, endDate, donationType });
    return response?.data ?? [];
  } catch (error) {
    throw error;
  }
}

export async function getDonationsPrinted() {
  try {
    const response = await fetchCheckPrintPrinted(300);
    return response?.data ?? [];
  } catch (error) {
    throw error;
  }
}

export async function updateDonationCollectorsPrint(updates) {
  const response = await patchCheckPrintCollectors(updates);
  return response?.data ?? { updated: 0 };
}

export async function markPrintedDonations(receiptIds) {
  const response = await patchCheckPrintMarkPrinted(receiptIds);
  return response?.data ?? { updated: 0 };
}
