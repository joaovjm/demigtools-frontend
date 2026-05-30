export function generatePixPayload({ pixKey, description, merchantName, merchantCity, amount, txid }) {
    
    const formatValue = (id, value) => {
      const size = value.length.toString().padStart(2, "0");
      return id + size + value;
    };
  
    
    const payloadFormatIndicator = formatValue("00", "01");
    const pointOfInitiation = formatValue("01", "11");
  
    // Merchant Account Info (GUI + chave PIX + descrição opcional)
    const gui = formatValue("00", "BR.GOV.BCB.PIX");
    const key = formatValue("01", pixKey);
    //const desc = description ? formatValue("02", description) : "";
    const merchantAccountInfo = formatValue("26", gui + key);
  
    // Categoria, moeda e valor
    const merchantCategoryCode = formatValue("52", "0000");
    const transactionCurrency = formatValue("53", "986"); // BRL
    const transactionAmount = amount ? formatValue("54", Number(amount).toFixed(2)) : "";
    const countryCode = formatValue("58", "BR");
    const name = formatValue("59", merchantName.substring(0, 25)); // máx 25 chars
    const city = formatValue("60", merchantCity.substring(0, 15)); // máx 15 chars
    const additionalDataField = formatValue("62", formatValue("05", txid));
  
    // Sem CRC ainda
    let payload =
      payloadFormatIndicator +
      pointOfInitiation +
      merchantAccountInfo +
      merchantCategoryCode +
      transactionCurrency +
      transactionAmount +
      countryCode +
      name +
      city +
      additionalDataField +
      "6304";
  
    // Calcular CRC16
    payload += crc16(payload);
    return payload;
    
  }
  
  // Algoritmo CRC16 CCITT-FALSE
  function crc16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }
  