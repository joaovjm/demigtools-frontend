import { getOperators } from "../helper/getOperators";
import { deleteRequestPackage } from "../helper/deleteRequestPackage";

export const distributePackageService = async (
  createPackage,
  setPerOperator,
  setUnassigned,
  setOperatorName,
  
) => {
  const response = await getOperators({
    active: true,
    item: "operator_name, operator_code_id, operator_type"
  }
  );
  const opFilter = response
    .filter((op) => op.operator_type !== "Admin")
    .map((op) => op.operator_code_id);

  const opName = response.reduce((acc, op) => {
    if (op.operator_type !== "Admin") {
      acc[op.operator_code_id] = op.operator_name;
    }
    return acc;
  }, {});

  const newPerOperator = {};
  const unassigned = [];

  createPackage?.forEach((donation) => {
    if (opFilter.includes(donation.operator_code_id)) {
      if (!newPerOperator[donation.operator_code_id]) {
        newPerOperator[donation.operator_code_id] = [];
      }
      newPerOperator[donation.operator_code_id].push(donation);
    } else {
      unassigned.push(donation);
    }
  });
  setPerOperator(newPerOperator);
  setUnassigned(unassigned);
  setOperatorName(opName);
};

export async function fetchOperatorID (setOperatorID, setOperatorIDState) {
  const response = await getOperators({
    active: true,
    item: "operator_name, operator_code_id, operator_type"}
  );
 
  const opFilter = response
    .filter((op) => op.operator_type !== "Admin")
    .map((op) => op.operator_code_id);

    console.log(opFilter);
  setOperatorID(opFilter);
  
}

export function assignPackage(
  selected,
  operatorID,
  createPackage,
  setCreatePackage
) {
  console.log(operatorID)
  console.log(selected)
  console.log(createPackage)
  const update = createPackage?.map((pkg) => {
    if (pkg.receipt_donation_id === selected) {
      return {
        ...pkg,
        operator_code_id: Number(operatorID),
      };
    }
    return pkg;
  });
  setCreatePackage(update);
}

export function removePackage(createPackage, setCreatePackage, operatorID) {
  let updated = false;
  const update = createPackage.map((pkg) => {
    if (pkg.operator_code_id === operatorID) {
      if (updated === false) {
        updated = true;
        return { ...pkg, operator_code_id: "" };
      }
    }
    return pkg;
  });
  setCreatePackage(update);
}

export function assignAllPackage(
  createPackage,
  unassigned,
  operatorID,
  setCreatePackage,
  maxValue,
  countValue
) {
  let count = countValue;
  const update = createPackage?.map((pkg) => {
    if (
      unassigned.some(
        (item) => item.receipt_donation_id === pkg.receipt_donation_id
      )
    ) {
      if (count < maxValue) {
        if (count + pkg.donation_value > maxValue) {
          return pkg;
        }
        count = count + pkg.donation_value;
        return {
          ...pkg,
          operator_code_id: Number(operatorID),
        };
      }
    }
    return pkg;
  });
  setCreatePackage(update);
}

export function removeAllPackage(createPackage, operatorID, setCreatePackage) {
  const update = createPackage?.map((pkg) => {
    if (pkg.operator_code_id === operatorID) {
      return {
        ...pkg,
        operator_code_id: null,
      };
    }
    return pkg;
  });
  setCreatePackage(update);
}

export function distribute(unassigned, createPackage, selection) {
  const update = createPackage.map((pkg) => ({...pkg}));
  
  // Calcular o que cada operador já possui (valor e quantidade)
  const operatorStats = {};
  selection.forEach(opId => {
    operatorStats[opId] = {
      totalValue: 0,
      count: 0
    };
  });
  
  // Contabilizar fichas já atribuídas
  update.forEach(pkg => {
    if (selection.includes(pkg.operator_code_id)) {
      operatorStats[pkg.operator_code_id].totalValue += pkg.donation_value || 0;
      operatorStats[pkg.operator_code_id].count += 1;
    }
  });
  
  // Ordenar fichas não atribuídas do maior para o menor valor
  const sortedUnassigned = [...unassigned].sort((a, b) => 
    (b.donation_value || 0) - (a.donation_value || 0)
  );
  
  // Distribuir cada ficha para o operador com menor carga
  sortedUnassigned.forEach(unassignedItem => {
    const find = update.findIndex(pkg => 
      pkg.receipt_donation_id === unassignedItem.receipt_donation_id
    );
    
    if (find !== -1) {
      // Encontrar operador com menor carga (prioriza valor, depois quantidade)
      let selectedOperator = selection[0];
      let minScore = Infinity;
      
      selection.forEach(opId => {
        const stats = operatorStats[opId];
        // Score considera valor com peso maior que quantidade
        // Normaliza quantidade multiplicando por valor médio das fichas
        const avgValue = unassignedItem.donation_value || 100;
        const score = stats.totalValue + (stats.count * avgValue * 0.3);
        
        if (score < minScore) {
          minScore = score;
          selectedOperator = opId;
        }
      });
      
      // Atribuir a ficha ao operador selecionado
      update[find].operator_code_id = selectedOperator;
      
      // Atualizar estatísticas do operador
      operatorStats[selectedOperator].totalValue += unassignedItem.donation_value || 0;
      operatorStats[selectedOperator].count += 1;
    }
  });
  
  return update;
}

export function deleteOperatorInList (allOperator, setAllOperator, operatorID, createPackage, setCreatePackage) {
  const updatePackage = createPackage.map((pkg) => {
    if (pkg.operator_code_id === operatorID){
      return {
        ...pkg,
        operator_code_id: null
      }
    }
    return pkg;
  })
  const updateOperator = allOperator.filter(f => f !== operatorID)
  setCreatePackage(updatePackage)
  setAllOperator(updateOperator)
}

export async function addEndDataInCreatePackage(createPackage, setCreatePackage, endDateRequest) {
  const update = createPackage?.map((pkg) => ({
    ...pkg, request_end_date: endDateRequest
  }))

  await setCreatePackage(update)
  return update;
}

export async function deletePackage(requestNameId) {
    const response = await deleteRequestPackage(requestNameId)
    if (response && response.success) {
      return { success: true, message: "Requisição deletada com sucesso" }
    } else {
      return { success: false, message: response?.message || "Erro ao deletar requisição" }
    }
}
