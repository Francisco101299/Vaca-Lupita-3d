const { paypalApiBase, getAccessToken } = require('./_paypal');

module.exports = async (req, res) => {
  const site = 'https://' + req.headers.host;
  const key = String(req.query.skin || '');
  const orderId = req.query.token; // PayPal manda el order id como "token" en el return_url

  try {
    if (!orderId) {
      res.writeHead(302, { Location: site + '/?paymentfailed=1' });
      res.end();
      return;
    }

    const accessToken = await getAccessToken();
    const captureRes = await fetch(
      paypalApiBase() + '/v2/checkout/orders/' + orderId + '/capture',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
      }
    );
    const result = await captureRes.json();

    const completed =
      captureRes.ok &&
      (result.status === 'COMPLETED' ||
        (result.purchase_units &&
          result.purchase_units[0] &&
          result.purchase_units[0].payments &&
          result.purchase_units[0].payments.captures &&
          result.purchase_units[0].payments.captures[0] &&
          result.purchase_units[0].payments.captures[0].status === 'COMPLETED'));

    if (completed) {
      // Solo llegamos aca si PayPal confirmo el pago. El juego, al ver ?unlock=, desbloquea el personaje.
      res.writeHead(302, { Location: site + '/?unlock=' + encodeURIComponent(key) });
    } else {
      res.writeHead(302, { Location: site + '/?paymentfailed=1' });
    }
    res.end();
  } catch (err) {
    res.writeHead(302, { Location: site + '/?paymentfailed=1' });
    res.end();
  }
};
