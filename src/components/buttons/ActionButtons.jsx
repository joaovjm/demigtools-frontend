import { ICONS } from "../../constants/constants";

export const BtnEdit = ({ onClick, type, label, className }) => (
  <button 
    onClick={onClick} 
    type={type} 
    className={`btn-edit ${label === "Salvar" ? 'saving' : ''} ${className || ''}`}
  >
    {label === "Salvar" ? ICONS.SAVE : ICONS.EDIT} {label}
  </button>
);

export const BtnDelete = ({ onClick, type }) => (
  <button onClick={onClick} type={type} className="btn-delete">
    {ICONS.TRASH} Delete
  </button>
);

export const BtnNewOperator = ({ className, onClick, type, icon}) => (
  <button onClick={onClick} type={type} className={className}>
    {icon} Novo Operador
  </button>
);
