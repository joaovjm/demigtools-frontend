const FormInput = ({ label, icon, type, name, value, autoComplete, onChange, style, readOnly }) => (
  <div className="input-field">
    <label>
      {icon} {label}
    </label>
    <input
      type={type}
      name={name}
      style={style}
      value={value}
      autoComplete={autoComplete}
      onChange={onChange}
      readOnly={readOnly}
      min="0"
    />
  </div>
);

export default FormInput;
