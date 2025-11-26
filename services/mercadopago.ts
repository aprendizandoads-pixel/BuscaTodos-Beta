import { Order } from "../types";

export const createPixPayment = async (
  orderData: Omit<Order, 'id' | 'status' | 'date' | 'paymentId'>,
  email: string,
  accessToken: string
) => {
  if (!accessToken) {
    console.error("Access Token not configured");
    return mockResponse();
  }

  try {
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key":  Date.now().toString()
      },
      body: JSON.stringify({
        transaction_amount: orderData.amount,
        description: `Consulta Nacional - Plano ${orderData.plan === 'basic' ? 'Básico' : 'Completo'}`,
        payment_method_id: "pix",
        payer: {
          email: email,
          first_name: orderData.customerName.split(" ")[0],
          last_name: orderData.customerName.split(" ").slice(1).join(" ") || "Cliente",
          identification: {
            type: "CPF",
            number: orderData.customerCpf.replace(/\D/g, "")
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("Mercado Pago API warning:", data);
      throw new Error(data.message || "Erro ao criar pagamento");
    }

    return {
      id: data.id,
      qr_code: data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
      ticket_url: data.point_of_interaction.transaction_data.ticket_url,
      status: data.status
    };

  } catch (error) {
    console.error("Mercado Pago Error (Using Fallback):", error);
    return mockResponse();
  }
};

export const checkPaymentStatus = async (paymentId: string, accessToken: string) => {
  // If it's a mock ID, we simulate approval after random time in the UI, or force approval
  if (paymentId.startsWith("mock_")) {
    return 'pending'; // In a real mock, we might randomise this, but for polling safety we keep pending
  }

  if (!accessToken) return 'pending';

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.status; // 'approved', 'pending', 'rejected'
    }
  } catch (error) {
    console.error("Error checking status:", error);
  }
  return 'pending';
};

const mockResponse = () => ({
  id: "mock_" + Date.now(),
  qr_code: "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913ConsultaNacional6008Brasilia62070503***6304E2CA",
  qr_code_base64: "", 
  ticket_url: "#",
  status: "pending"
});