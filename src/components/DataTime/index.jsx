const dataTime = (props) => {
  if (props) {
    const Data = new Date(props);
    return Data;
  } else {
    const Data = new Date();
    return Data;
  }
};

export const DataNow = (x) => {
  const dataNow = dataTime();
  const day = String(dataNow.getUTCDate()).padStart(2, "0");
  const month = String(dataNow.getUTCMonth() + 1).padStart(2, "0");
  const year = dataNow.getFullYear();

  if (x === "day") {
    return day;
  }
  if (x === "month") {
    return month;
  }
  if (x === "year") {
    return year;
  }
  if (x === "mesref") {
    return `${month}/${year}`;
  }
  if (x === "mesrefnf"){
    return `${year}-${month}-01`
  }
  if (x === undefined) {
    return `${day}/${month}/${year}`;
  }
  if (x === "noformated"){
    return `${year}-${month}-${day}`
  }
  if(x === "underday"){
    return `${year}-${month}-${day-1}`
  }
};

export const DataSelect = (e, props) => {
  const dataSelect = dataTime(e);
  const day = String(dataSelect.getUTCDate()).padStart(2, "0");
  const month = String(dataSelect.getUTCMonth() + 1).padStart(2, "0");
  const year = dataSelect.getFullYear();

  if (props === "day") {
    return day;
  }
  if (props === "month") {
    return month;
  }
  if (props === "year") {
    return year;
  }
  if (props === "mesref") {
    return `${month}/${year}`;
  }
  if (props === undefined) {
    return `${day}/${month}/${year}`;
  }
  if (props === "noformated"){
    return `${year}-${month}-${day}`
  }
};
