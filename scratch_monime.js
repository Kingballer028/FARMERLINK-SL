const fetch = require('node-fetch');

async function testMonime() {
  const monimePayload = {
    name: "Order from test@example.com",
    successUrl: "https://monime.io/success",
    cancelUrl: "https://monime.io/cancel",
    lineItems: [{
      type: "custom",
      name: "Item",
      price: { currency: "SLE", value: 100 },
      quantity: 1
    }]
  };

  const response = await fetch('https://api.monime.io/v1/checkout-sessions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer mon_cgUAjp4ntlFiwYHgRdKMG5jEJ8hz8WYEKFETkPhVelIM90Acx1ScN8CDJrJmCchI',
      'Monime-Space-Id': 'spc-k6Rq9TLiGHD9TQ5uwtqDes4pwrE',
      'Idempotency-Key': Date.now().toString(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(monimePayload)
  });

  const data = await response.json();
  const id = data.result?.id || data.id;
  
  if (id) {
    const getRes = await fetch(`https://api.monime.io/v1/checkout-sessions/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mon_cgUAjp4ntlFiwYHgRdKMG5jEJ8hz8WYEKFETkPhVelIM90Acx1ScN8CDJrJmCchI',
        'Monime-Space-Id': 'spc-k6Rq9TLiGHD9TQ5uwtqDes4pwrE',
      }
    });
    const getData = await getRes.json();
    console.log("Get Session Response:", JSON.stringify(getData, null, 2));
  } else {
    console.log("No ID found", data);
  }
}

testMonime();
