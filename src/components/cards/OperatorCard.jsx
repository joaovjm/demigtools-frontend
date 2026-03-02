import React, { useEffect, useState } from "react";
import styles from "../../pages/DashboardAdmin/dashboardadmin.module.css";

const OperatorCard = ({ operatorCount, setDonationFilterPerId }) => {
  const [operators, setOperators] = useState([]);
  const [count, setCount] = useState();
  const [add, setAdd] = useState(0);
  const [active, setActive] = useState(""); // Todos

  const operatorInfo = [
    ...new Map(
      operatorCount?.map((operators) => [
        operators.operator_code_id,
        { id: operators.operator_code_id, name: operators.operator_name },
      ])
    ).values(),
  ];

  const counting = operatorCount?.reduce((acc, item) => {
    acc[item.operator_code_id] = (acc[item.operator_code_id] || 0) + 1;
    return acc;
  }, {});

  const countingValue = operatorCount?.reduce((add, item) => {
    add[item.operator_code_id] =
      (add[item.operator_code_id] || 0) + item.donation_value;
    return add;
  }, {});

  useEffect(() => {
    setOperators(operatorInfo);
    setCount(counting);
    setAdd(countingValue);
  }, []);

  const handleClick = (id) => {
    console.log(id)
    setDonationFilterPerId(id);
    setActive(id);
  };

  return operators?.length > 0 ? (
    <>
      <div className={`${styles.sectionOperatorsCard} ${active === "" ? styles.active : ""}`} onClick={() => handleClick("")}>
        <div>Todos</div>
        <div className={styles.sectionOperatorsCardValue}>
          <label>{Object.values(count).reduce((acc, curr) => acc + curr, 0)}</label>
          <label>
            R${" "}
            {Object.values(add)
              .reduce((acc, curr) => acc + curr, 0)
              ?.toFixed(2)
              .replace(".", ",") || "0,00"}
          </label>
        </div>
      </div>
      {operators.map((operator) => (
        <div
          onClick={() => handleClick(operator.id)}
          className={`${styles.sectionOperatorsCard} ${
            active === operator.id ? styles.active : ""
          }`}
          key={operator.id}
        >
          <div>{operator.name}</div>
          <div className={styles.sectionOperatorsCardValue}>
            <label>{count[operator.id]}</label>
            <label>
              R$ {add[operator.id]?.toFixed(2).replace(".", ",") || "0,00"}
            </label>
          </div>
        </div>
      ))}
    </>
  ) : (
    <></>
  );
};

export default OperatorCard;
