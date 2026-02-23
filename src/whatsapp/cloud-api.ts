const BASE_URL = 'https://graph.facebook.com/v21.0';

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
  }

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${res.status} ${err}`);
  }
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title?: string;
  rows: ListRow[];
}

export interface ListMessageParams {
  to: string;
  body: string;
  buttonText: string;
  sections: ListSection[];
  header?: string;
  footer?: string;
}

export async function sendWhatsAppListMessage(params: ListMessageParams): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
  }

  const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(params.header ? { header: { type: 'text', text: params.header } } : {}),
        body: { text: params.body },
        ...(params.footer ? { footer: { text: params.footer } } : {}),
        action: {
          button: params.buttonText,
          sections: params.sections,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp list send failed: ${res.status} ${err}`);
  }
}
