// Funciones compartidas por create-order.js y capture-order.js.
// No es una ruta propia (empieza con _), Vercel no la expone como endpoint.

// Precios de cada personaje. Deben coincidir con PREMIUM_SKINS en el juego (index.html),
// pero esta es la lista que realmente se cobra: si alguien manipula el precio en el
// navegador, no afecta esto.
const SKIN_PRICES = {
  pig: '0.99',
  goat: '0.99',
  horse: '1.99',
  bull: '1.99',
};

function paypalApiBase() {
  // PAYPAL_ENV = 'live' o 'sandbox' (variable de entorno en Vercel)
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const auth = Buffer.from(clientId + ':' + secret).toString('base64');
  const res = await fetch(paypalApiBase() + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('No se pudo autenticar con PayPal (revisa PAYPAL_CLIENT_ID / PAYPAL_SECRET / PAYPAL_ENV)');
  const data = await res.json();
  return data.access_token;
}

module.exports = { SKIN_PRICES, paypalApiBase, getAccessToken };
