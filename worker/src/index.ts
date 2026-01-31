import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_SERVICE_ACCOUNT: string; // JSON string
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// Helper: Get Firebase Access Token
async function getAccessToken(serviceAccount: any) {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://firestore.googleapis.com/',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore'
  }));

  // In a real environment, you'd sign this with the private key.
  // Cloudflare Workers support subtle crypto.
  // For simplicity in this template, we assume a helper or pre-signed approach
  // OR we use a simpler Auth if possible.
  // Actually, for Firestore REST API with Service Account, we need a JWT.
  
  return "TOKEN_PLACEHOLDER"; // Real implementation would use subtle crypto to sign
}

// Mocking the token validation for now - in production use 'jose' to verify Firebase ID Token
async function verifyIdToken(token: string) {
  // Real implementation: verify signature, exp, aud, etc.
  // For this exercise, we extract the payload
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload; // { uid, email, ... }
  } catch {
    return null;
  }
}

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.post('/api/order/create', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);
  
  const idToken = authHeader.split(' ')[1];
  const user = await verifyIdToken(idToken);
  if (!user) return c.json({ error: 'Invalid token' }, 401);

  const { items, customerInfo, nonce } = await c.req.json();

  // 1. Fetch products from Firestore to get real prices
  // 2. Fetch user profile for VIP status
  // 3. Calculate total
  // 4. Create document in Firestore
  // 5. Send Telegram message

  const message = `
📦 <b>Новый заказ!</b>
👤 <b>Клиент:</b> ${customerInfo.name} (${user.email})
📞 <b>Тел:</b> ${customerInfo.phone}
✈️ <b>Доставка:</b> ${customerInfo.deliveryMethod === 'cdek' ? 'СДЭК' : 'Самовывоз (Воронеж)'}
📍 <b>Адрес:</b> ${customerInfo.address || '—'}
💬 <b>TG:</b> ${customerInfo.telegram || '—'}

🛒 <b>Товары:</b>
${items.map((it: any) => `- ${it.name} x${it.quantity}`).join('\n')}

💰 <b>Итого:</b> ${customerInfo.totalPrice} ₽
  `;

  try {
    await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: c.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error('Telegram error:', e);
  }

  return c.json({ success: true, orderId: 'pending_in_firestore' });
});

export default app;
