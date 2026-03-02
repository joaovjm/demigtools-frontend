import { CARD_IDS } from "../constants";
import ModalConfirmations from "../../../components/ModalConfirmations";
import ModalScheduled from "../../../components/ModalScheduled";
import ModalDonationInOpen from "../../../components/ModalDonationInOpen";

/**
 * Componente que gerencia os modais do dashboard
 */
const DashboardModals = ({
  modalOpen,
  active,
  donationConfirmationOpen,
  scheduledOpen,
  donationOpen,
  nowScheduled,
  setStatus,
  onClose,
}) => {
  if (!modalOpen) return null;

  switch (active) {
    case CARD_IDS.IN_CONFIRMATION:
      return (
        <ModalConfirmations
          donationConfirmationOpen={donationConfirmationOpen}
          onClose={onClose}
          setStatus={setStatus}
        />
      );
    case CARD_IDS.IN_SCHEDULED:
      return (
        <ModalScheduled
          scheduledOpen={scheduledOpen}
          onClose={onClose}
          setStatus={setStatus}
          nowScheduled={nowScheduled}
        />
      );
    case CARD_IDS.IN_OPEN:
      return (
        <ModalDonationInOpen
          donationOpen={donationOpen}
          onClose={onClose}
        />
      );
    default:
      return null;
  }
};

export default DashboardModals;

