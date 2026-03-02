const FormTextArea = ({
  label,
  value,
  onChange,
  readOnly,
}) => (
  <div className="input-field" >
    <label>
      {label}
    </label>
    <textarea
      value={value}
      onChange={onChange}
      readOnly={readOnly}
    
    />
  </div>
);

export default FormTextArea;
