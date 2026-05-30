import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelDonationRequest,
  recreateDonationFromConfirmationRequest,
  markDonationNotAttendedRequest,
  scheduleDonationConfirmationRequest,
} from "../api/donationsApi.js";
import { queryKeys } from "./queryKeys.js";

function invalidateDashboard(qc) {
  return qc.invalidateQueries({ queryKey: queryKeys.dashboard.root });
}

/** Cancelar / excluir doação (fluxo confirmação) */
export function useDeleteDonationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelDonationRequest,
    onSuccess: () => invalidateDashboard(qc),
  });
}

/** Recriar doação após confirmação (equivalente a insert no fluxo do modal) */
export function useCreateDonationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recreateDonationFromConfirmationRequest,
    onSuccess: () => invalidateDashboard(qc),
  });
}

/** Atualizações de confirmação: não atendeu ou agendamento */
export function useUpdateDonationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, ...body }) => {
      if (action === "not_attended") {
        return markDonationNotAttendedRequest(body);
      }
      if (action === "schedule") {
        return scheduleDonationConfirmationRequest(body);
      }
      throw new Error("Ação de atualização inválida");
    },
    onSuccess: () => invalidateDashboard(qc),
  });
}

/** Aliases na convenção de nomes dos hooks */
export { useDeleteDonationMutation as useDeleteDonation };
export { useCreateDonationMutation as useCreateDonation };
export { useUpdateDonationMutation as useUpdateDonation };
