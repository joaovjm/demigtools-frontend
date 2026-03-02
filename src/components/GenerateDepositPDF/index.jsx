/**
 * Gera o PDF de depósito chamando a API do backend
 * A geração do PDF agora é feita no servidor Node.js, usando arquivos PNG
 * ao invés de base64, removendo a responsabilidade do frontend
 */
const GenerateDepositPDF = async ({ data, config, cpf_visible }) => {
  try {
    const response = await fetch("/api/generate-deposit-pdf", {
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

    // Obter o blob do PDF
    const blob = await response.blob();
    
    // Criar URL temporária e fazer download
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
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
};

export default GenerateDepositPDF;
