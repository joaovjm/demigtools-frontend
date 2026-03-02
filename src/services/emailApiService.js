const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const emailApiService = {
  // Enviar email
  async sendEmail(emailData) {
    const formData = new FormData();
    
    formData.append('emailTo', emailData.emailTo);
    formData.append('subject', emailData.subject);
    formData.append('text', emailData.text);
    
    if (emailData.image) {
      formData.append('image', emailData.image);
    }
    if (emailData.video) {
      formData.append('video', emailData.video);
    }
    if (emailData.pdf) {
      formData.append('pdf', emailData.pdf);
    }

    const response = await fetch(`${API_URL}/email`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar email');
    }

    return await response.json();
  },
};

export default emailApiService;
