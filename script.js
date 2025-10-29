let jsonText = `
[
  { "name": "  Apfel. ", "qty": "3", "unit": " G." },
  { "name": " Banane.. ", "qty": "a", "unit": "x" },
  { "name": " Milch  ", "qty": "250"}
]
`;

let obj;


try{

  obj = JSON.parse(jsonText);

}

catch (error) {

  console.log("Error");
  obj = [];
  
}

let cleaned = [];
let missing = [];
for (let i  = 0; i < obj.length; i++){

    if ("name" in obj[i] && "qty" in obj[i] && "unit" in obj[i] && !isNaN(Number(obj[i].qty))) {


      obj[i].name = obj[i].name.trim().toLowerCase().replaceAll('.','');
      obj[i].qty = Number(obj[i].qty);
      obj[i].unit = obj[i].unit.trim().toLowerCase().replaceAll('.','');

      cleaned.push(obj[i]);

    }

  else {
    missing.push(obj[i]);
  } 
}

console.log("Sauber", cleaned);
console.log("Fehlerhaft", missing);

//Für n8n lesbar machen
 
return [ { json: {items : cleaned, errors : missing} } ];