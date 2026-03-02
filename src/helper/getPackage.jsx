import supabase from "./superBaseClient";

const getPackage = async ({ type, startDate, endDate, filterPackage, ignoreWorkList }) => {
  
  let createPackage = [];
  try {

    const { data, error } = await supabase
      .from("donation")
      .select(
        "donor_id, donor: donor_id!inner(donor_name, donor_type, donor_tel_1), donation_value, donation_day_received, receipt_donation_id, operator_code_id, operator: operator_code_id!inner(operator_name)"
      )
      .eq("donor.donor_type", type)
      .eq("donation_received", "Sim")
      .gte("donation_day_received", startDate)
      .lte("donation_day_received", endDate)
      .order("donation_value", { ascending: false });

    if (data?.length > 0) {
      const newPackage = data.map((item) => {
        return {
          donor_id: item?.donor_id,
          donor_name: item?.donor?.donor_name,
          operator_name: item?.operator?.operator_name,
          donor_tel_1: item?.donor?.donor_tel_1,
          donation_value: item.donation_value,
          donation_day_received: item?.donation_day_received,
          receipt_donation_id: item?.receipt_donation_id,
          operator_code_id: item?.operator_code_id,
          donor_type: item?.donor?.donor_type,
        };
      });

      const count = newPackage.reduce((acc, curr) => {
        acc[curr.donor_id] = (acc[curr.donor_id] || 0) + 1;
        return acc;
      }, {});

      const duplicate = Object.keys(count).filter((f) => count[f] > 1);

      const filteredDp = duplicate.map((dp) => {
        const group = newPackage.filter((item) => item.donor_id === Number(dp));
        const selected = group.reduce((bigger, now) => {
          if (filterPackage === "max") {
            return now.donation_value > bigger.donation_value ? now : bigger;
          } else {
            return now.donation_value < bigger.donation_value ? now : bigger;
          }
        });

        return selected;
      });

      const unit = newPackage.filter(
        (dt) => !duplicate.includes(String(dt.donor_id))
      );

      const filteredPackage = [...unit, ...filteredDp];

      if (type !== "Mensal") {
        const { data: compareData, error: errorData } = await supabase
          .from("donation")
          .select()
          .gt("donation_day_received", endDate);

        if (compareData?.length > 0) {
          filteredPackage.forEach((id) => {
            if (!compareData.some((cp) => cp.donor_id === id.donor_id)) {
              createPackage.push(id);
            }
          });
        } else {
          createPackage.push(...filteredPackage);
        }
      } else {
        createPackage.push(...filteredPackage);
      }

      if(ignoreWorkList){
        console.log("ignoreWorkList", ignoreWorkList);
        // Buscar os donor_ids que estão em createPackage
        const donorIds = createPackage.map(item => item.donor_id);
        console.log("donorIds", donorIds);
        if (donorIds.length > 0) {
          // Buscar na tabela request quais desses donor_ids têm request_active = true
          const { data: activeRequests, error: requestError } = await supabase
            .from("request")
            .select("donor_id")
            .in("donor_id", donorIds)
            .eq("request_active", "True");
            console.log("activeRequests", activeRequests);
          if (activeRequests?.length > 0) {
            // Extrair os donor_ids que devem ser removidos
            const activeDonorIds = activeRequests.map(req => req.donor_id);
            
            // Filtrar createPackage, removendo os que têm request_active = true
            createPackage = createPackage.filter(item => !activeDonorIds.includes(item.donor_id));
          }
        }
      }
    }
  } catch (error) {
    console.error(error.message);
  }

  return createPackage;
};

export default getPackage;
