export const Loading = ({ text = 'Loading' }) => (
  <div className="loading" role="status">
    <span className="spinner" aria-hidden="true" />
    {text}
  </div>
);

export const ErrorMessage = ({ children }) =>
  children ? (
    <div className="alert alert-error" role="alert">
      {children}
    </div>
  ) : null;

export const Empty = ({ title, children }) => (
  <div className="empty">
    <h3>{title}</h3>
    {children && <p>{children}</p>}
  </div>
);
