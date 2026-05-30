import styles from "../../pages/Donor/donor.module.css";
const FormListSelect = ({ 
    label,
    value,
    name,
    id,
    onChange,
    disabled,
    options,
    defaultValue,
}) => (

  <div className={styles.inputField}>
    <label htmlFor={id}>
      {label}
    </label>
    <select
      onChange={onChange}
      value={value}
      name={name}
      disabled={disabled}
      id={id}
      defaultValue={defaultValue}
      className={styles.selectInput}
    >
      <option value="" disabled>selecione...</option>
    {options && options.map((item) => (
        <option key={item} value={item}>
            {item}
        </option>
    ))}
    </select>
  </div>
)   
export default FormListSelect;
