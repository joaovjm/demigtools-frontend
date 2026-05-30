import { useState } from "react";
import { postReceiveDonation } from "../api/receiverDonationsApi.js";

export const useDonation = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: null,
  });

  const receiveDonation = async (date, collector, search, setTableReceipt) => {
    try {
      const first = await postReceiveDonation({
        date,
        collector,
        receiptDonationId: search,
        ignoreCollectorMismatch: false,
      });

      if (first.status === "received") {
        return "received";
      }
      if (first.status === "not_located") {
        return "not located";
      }

      if (first.status === "wrong_collector" && first.payload) {
        const payload = first.payload;
        return new Promise((resolve) => {
          setModalConfig({
            title: "Confirmação necessária",
            message: "Ficha de outro coletador. Deseja continuar? ",
            onConfirm: async () => {
              try {
                const second = await postReceiveDonation({
                  date,
                  collector,
                  receiptDonationId: search,
                  ignoreCollectorMismatch: true,
                });
                if (second.status === "success" && second.payload) {
                  setTableReceipt((prev) => [...prev, second.payload]);
                  resolve("success");
                } else {
                  resolve(undefined);
                }
              } catch (e) {
                console.error(e);
                resolve(undefined);
              } finally {
                setModalOpen(false);
              }
            },
          });
          setModalOpen(true);
        });
      }

      if (first.status === "success" && first.payload) {
        setTableReceipt((prev) => [...prev, first.payload]);
        return "success";
      }
    } catch (error) {
      console.error("Error: ", error?.message || error);
    }
  };

  return { receiveDonation, modalOpen, setModalOpen, modalConfig };
};
