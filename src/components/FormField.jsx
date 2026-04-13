export default function FormField({ label, name, value, onChange, type = 'text', options = null, placeholder = '' }) {
  if (options) {
    return (
      <div className="form-field">
        <label htmlFor={name}>{label}</label>
        <select id={name} name={name} value={value || ''} onChange={onChange}>
          <option value="">— Select —</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="form-field">
        <label htmlFor={name}>{label}</label>
        <textarea id={name} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} rows={3} />
      </div>
    );
  }

  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
