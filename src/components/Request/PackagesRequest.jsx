import React, { useEffect, useState } from "react";
import supabase from "../../helper/superBaseClient";
import { DataSelect } from "../DataTime";

const PackagesRequest = () => {
  const [packages, setPackages] = useState([]);
  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase.from("request_name").select();
      if (error) throw error;
      if (data) setPackages(data);
    } catch (error) {
      console.error(error.message);
    }
  };
  useEffect(() => {
    fetchPackages();
  }, []);
  return (
    <div className="package-request">
      {packages.length > 0 ? (
        <table className="package-request-table">
          <thead className="package-request-table-head">
            <tr className="package-request-table-head-tr">
              <th className="package-request-table-head-tr-th">Nome Pacote</th>
              <th className="package-request-table-head-tr-th">Inserido</th>
              <th className="package-request-table-head-tr-th">Validade Pacote</th>
              <th className="package-request-table-head-tr-th">Ativo</th>
            </tr>
          </thead>
          <tbody className="package-request-table-body">
            {packages.map((pkgs) => (
              <tr key={pkgs.id} className="package-request-table-body-tr" >
                <td className="package-request-table-body-tr-td">{pkgs.name}</td>
                <td className="package-request-table-body-tr-td">{DataSelect(pkgs.date_created)}</td>
                <td className="package-request-table-body-tr-td">{DataSelect(pkgs.date_validate)}</td>
                <td className="package-request-table-body-tr-td">{pkgs.active === true ? "Ativo" : "Desativado"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <label>Nenhum pacote localizado...</label>
        </div>
      )}
    </div>
  );
};

export default PackagesRequest;
