const FormDonorInput = (
 { label,
  type,
  value,
  onChange,
  readOnly,
  disabled,
}
) => (

  
  <div className="input-field">
    <label>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      disabled={disabled}      
    />
  </div>
);

export default FormDonorInput;
