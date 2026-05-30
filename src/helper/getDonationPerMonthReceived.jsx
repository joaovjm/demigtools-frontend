import supabase from "./superBaseClient";

const getDonationPerMonthReceived = (
  monthref,
  setMonthReceived,
  setValueMonthReceived,
  setReceivedPercent
) => {
//   let totalValue = 0;
//   let cont = 0;
//   const getValueDonation = async () => {
//     const { data: operatorValue } = await supabase
//       .from("donation")
//       .select("donation_value, donation_received, donation_monthref")
//       .eq("donation_monthref", monthref);

//     setMonthReceived(operatorValue.length);

//     for (let i = 0; i < operatorValue.length; i++) {
//       if (operatorValue[i].donation_received === "Sim" && operatorValue[i].donation_monthref === monthref) {
//         cont = i;
//         let value = operatorValue[i].donation_value;
//         totalValue = totalValue + value;
//       }
//     }

//     // setReceivedPercent(((cont/operatorValue.length)*100).toFixed(2))

//     setValueMonthReceived(totalValue);
//   };
//   getValueDonation();
};

export default getDonationPerMonthReceived;
