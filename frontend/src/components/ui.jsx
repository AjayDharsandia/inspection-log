export function Badge({ children }) {
  return <span className={`badge ${children.toLowerCase()}`}>{children}</span>;
}
export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function ErrorBox({ message }) {
  return (
    message && (
      <div className="error" role="alert">
        {message}
      </div>
    )
  );
}
