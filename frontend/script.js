const API = "https://script.google.com/macros/s/AKfycbyVk-fitK4Htvt2CysG7Tj98a-Qav23SyXrdWzm9ZkY4wfjbnvmO4ElN6Kf2y2V3iH9mw/exec";

// Navigation
function go(page){ location.href = page }

// SIM total
function calcSimTotal(){
  let v = Number(document.getElementById("package").value);
  document.getElementById("totalSim").innerText = v;
}

// Game
function calcGameTotal(){
  let v = Number(document.getElementById("amountGame").value);
  document.getElementById("totalGame").innerText = v;
}

// SMM
function calcSMMTotal(){
  let qty = Number(document.getElementById("qtySmm").value);
  let price = 10;
  document.getElementById("totalSmm").innerText = qty * price;
}

// P2P
function calcP2P(){
  let a = Number(document.getElementById("amountP2P").value);
  let fee = Math.max(Math.round(a*0.015), 200);
  document.getElementById("feeP2P").innerText = fee;
  document.getElementById("receiveP2P").innerText = a-fee;
}

// Submit SIM
async function submitSim(){
  let data = {
    action:"submit_sim_game",
    type:"SIM",
    service:document.getElementById("provider").value,
    target:document.getElementById("phone").value,
    quantity:1,
    total:Number(document.getElementById("package").value),
    paymentMethod:"KBZPay",
    transactionId:document.getElementById("txid").value,
    userId:document.getElementById("phone").value
  };

  let r = await fetch(API,{method:"POST",body:JSON.stringify(data)});
  let j = await r.json();
  if(j.ok) location.href = j.data.redirect;
}

// Game Submit
async function submitGame(){
  let data = {
    action:"submit_sim_game",
    type:"GAME",
    service:document.getElementById("game").value,
    target:document.getElementById("gameId").value,
    quantity:1,
    total:Number(document.getElementById("amountGame").value),
    paymentMethod:"KBZPay",
    transactionId:document.getElementById("txGame").value,
    userId:document.getElementById("gameId").value
  };
  let r = await fetch(API,{method:"POST",body:JSON.stringify(data)});
  let j = await r.json();
  if(j.ok) location.href = j.data.redirect;
}

// SMM Submit
async function submitSMM(){
  let data = {
    action:"submit_smm",
    platform:document.getElementById("platform").value,
    service:document.getElementById("smmService").value,
    link:document.getElementById("link").value,
    quantity:Number(document.getElementById("qtySmm").value),
    total:Number(document.getElementById("totalSmm").innerText),
    paymentMethod:"KBZPay",
    transactionId:document.getElementById("txSmm").value,
    userId:document.getElementById("link").value
  };
  let r = await fetch(API,{method:"POST",body:JSON.stringify(data)});
  let j = await r.json();
  if(j.ok) location.href = j.data.redirect;
}

// P2P Submit
async function submitP2P(){
  let a = Number(document.getElementById("amountP2P").value);
  let fee = Math.max(Math.round(a*0.015),200);

  let data = {
    action:"submit_p2p",
    fromMethod:document.getElementById("fromMethod").value,
    toMethod:document.getElementById("toMethod").value,
    amount:a,
    account:document.getElementById("accountP2P").value,
    fee:fee,
    transactionId:document.getElementById("txP2P").value,
    userId:document.getElementById("accountP2P").value
  };

  let r = await fetch(API,{method:"POST",body:JSON.stringify(data)});
  let j = await r.json();
  if(j.ok) location.href = j.data.redirect;
}
