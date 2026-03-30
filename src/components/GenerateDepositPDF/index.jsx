const apiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "/api";

/**
 * Gera o PDF de depósito pelo backend e baixa localmente.
 * Com containers separados, defina VITE_API_URL (ex.: https://api.seudominio.com/api).
 */
const GenerateDepositPDF = async ({ data, config, cpf_visible, download = true }) => {
  try {
    const response = await fetch(`${apiBase}/generate-deposit-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data, config, cpf_visible }),
    });

    if (!response.ok) {
      let errorMessage = "Erro ao gerar PDF";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || `Erro ${response.status}: ${response.statusText}`;
        }
      } catch (parseError) {
        errorMessage = `Erro ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();

    if (download) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const fileName = `${data.receipt_donation_id} - ${data.donor_name
        .normalize("NFD")
        .toUpperCase()}.pdf`.replace(/[\/\\:*?"<>|]/g, "");

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
    return blob;
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
};

export default GenerateDepositPDF;
