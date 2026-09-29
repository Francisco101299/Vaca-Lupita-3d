const { SKIN_PRICES, paypalApiBase, getAccessToken } = require('./_paypal');

module.exports = async (req, res) => {
  try {
    const key = String(req.query.skin || '');
    const price = SKIN_PRICES[key];
    if (!price) {
      res.status(400).send('Personaje desconocido.');
      return;
    }

    const site = 'https://' + req.headers.host; // dominio de este mismo proyecto de Vercel
    const accessToken = await getAccessToken();

    const orderRes = await fetch(paypalApiBase() + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: 'Vaca Lupita - Personaje: ' + key,
          amount: { currency_code: 'USD', value: price },
        }],
        application_context: {
          return_url: site + '/api/capture-order?skin=' + encodeURIComponent(key),
          cancel_url: site + '/',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    });

    const order = await orderRes.json();
    if (!orderRes.ok) {
      res.status(500).send('Error creando la orden: ' + JSON.stringify(order));
      return;
    }

    const approveLink = (order.links || []).find(l => l.rel === 'approve' || l.rel === 'payer-action');
    if (!approveLink) {
      res.status(500).send('PayPal no devolvio un link de pago.');
      return;
    }

    res.writeHead(302, { Location: approveLink.href });
    res.end();
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};
