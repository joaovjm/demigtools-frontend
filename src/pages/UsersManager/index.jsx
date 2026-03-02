import React, { useState } from "react";
import "./index.css";

import { BsFillPersonVcardFill } from "react-icons/bs";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
const UserManager = () => {
  const [isVisible, setIsVisible] = useState(false);

  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    setIsVisible(!isVisible);
  };

  return (
    <main className="container">
      <h1 className="h1">
        <BsFillPersonVcardFill />
        Gerenciador de Usuários
      </h1>
      <form className="form-user">
        <table className="table-user">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Email</th>
              <th>Senha</th>
              <th style={{ width: "20px" }}>Visivel</th>
              <th>Editar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>João Oliveira</td>
              <td>Administrador</td>
              <td style={{ minWidth: "300px" }}>
                joao.oliveira18.jm@gmail.com
              </td>
              <td>
                {isVisible ? "123456" : "*****"}
              </td>
              <td style={{ width: "20px" }}>
                <button onClick={togglePasswordVisibility} className="btn-visibility">
                  {isVisible ? (
                    <FaEye style={{ }} />
                  ) : (
                    <FaEyeSlash style={{ }} />
                  )}
                </button>
              </td>
              <td className="td-editing">
                <td className="td-edit" style={{ backgroundColor: "#0e0ba8"}}><FaEdit /></td>
                <td className="td-delete" style={{ backgroundColor: "#a80b0b"}}><FaTrashAlt /></td>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </main>
  );
};

export default UserManager;
