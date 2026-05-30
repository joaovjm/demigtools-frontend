import React, { useEffect, useState } from "react";
import "./index.css";

const TableOperatorAndCollectorWork = ({
  relatory,
  setClick,
  setTableDonationOpen,
  filter,
}) => {
  const {
    names,
    countReceived,
    addValueNotReceived,
    countNotReceived,
    addValueReceived,
    addValueExtraReceived,
  } = relatory;

  const [oc, setOc] = useState();

  useEffect(() => {
    setOc(filter);
  }, [relatory]);

  const handleClick = (name) => {
    setTableDonationOpen(true);
    setClick(name);
  };

  // Calculate totals for stats
  const totalOpen =
    names?.reduce((sum, name) => sum + (countNotReceived[name.name] || 0), 0) ||
    0;
  const totalOpenValue =
    names?.reduce(
      (sum, name) => sum + (addValueNotReceived[name.name] || 0),
      0
    ) || 0;
  const totalReceived =
    names?.reduce((sum, name) => sum + (countReceived[name.name] || 0), 0) || 0;
  const totalReceivedValue =
    names?.reduce((sum, name) => sum + (addValueReceived[name.name] || 0), 0) ||
    0;

  return (
    <div className="table-operatorWork-container">
      <div className="table-operatorWork-content">
        <h3 className="table-operatorWork-title">
          {oc === "Operadores"
            ? "Relatório de Operadores"
            : "Relatório de Coletores"}
        </h3>

        {relatory && names && names.length > 0 && (
          <>
            {/* Header with Stats */}
            <div className="table-operatorWork-header">
              <div className="table-operatorWork-stats">
                <div className="stats-item">
                  <strong>
                    Total {oc === "Operadores" ? "Operadores" : "Coletores"}:
                  </strong>{" "}
                  {names.length}
                </div>
                <div className="stats-item">
                  <strong>Total Aberto:</strong> {totalOpen} (R${" "}
                  {totalOpenValue.toFixed(2).replace(".", ",")})
                </div>
                <div className="stats-item">
                  <strong>Total Recebido:</strong> {totalReceived} (R${" "}
                  {totalReceivedValue.toFixed(2).replace(".", ",")})
                </div>
              </div>
            </div>

            {/* Table Wrapper */}
            <div className="table-operatorWork-wrapper">
              <div className="table-operatorWork-scroll">
                <table className="table-operatorWork">
                  <thead>
                    <tr className="table-operatorWork-head-row">
                      <th className="table-operatorWork-head">
                        {oc === "Operadores" ? "Operador" : "Coletador"}
                      </th>
                      <th className="table-operatorWork-head">Qtd. Aberto</th>
                      <th className="table-operatorWork-head">Valor Aberto</th>
                      <th className="table-operatorWork-head">Qtd. Recebido</th>
                      {/*<th className="table-operatorWork-head">Valor</th>*/}
                      {oc === "Operadores" && <th className="table-operatorWork-head">Valor Extra</th>} 
                      <th className="table-operatorWork-head">
                        Total Recebido
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {names.map((name) => (
                      <tr
                        key={name.name}
                        className="table-operatorWork-row"
                        onClick={() => handleClick(name)}
                      >
                        <td className="table-operatorWork-cell operator-name">
                          {name.name}
                        </td>
                        <td className="table-operatorWork-cell">
                          {countNotReceived[name.name] || 0}
                        </td>
                        <td className="table-operatorWork-cell value-amount">
                          R${" "}
                          {(addValueNotReceived[name.name] || 0)
                            .toFixed(2)
                            .replace(".", ",")}
                        </td>
                        <td className="table-operatorWork-cell">
                          {countReceived[name.name] || 0}
                        </td>
                        {oc === "Operadores" && (
                          <>
                            <td className="table-operatorWork-cell value-amount">
                              
                              {(addValueExtraReceived[name.name] || 0).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            {/*<td className="table-operatorWork-cell value-amount">
                              R${" "}
                              {(
                                addValueReceived[name.name] -
                                  addValueExtraReceived[name.name] || 0
                              )
                                .toFixed(2)
                                .replace(".", ",")}
                            </td>*/}
                          </>
                        )}
                        <td className="table-operatorWork-cell value-amount">
                          R${" "}
                          {(addValueReceived[name.name] || 0)
                            .toFixed(2)
                            .replace(".", ",")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {(!relatory || !names || names.length === 0) && (
          <div className="table-operatorWork-empty">
            <div className="empty-icon">📊</div>
            <h4>Nenhum dado disponível</h4>
            <p>
              Não há {oc === "Operadores" ? "operadores" : "coletores"} para
              exibir no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableOperatorAndCollectorWork;
