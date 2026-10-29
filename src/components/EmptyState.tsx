type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span aria-hidden="true" className="empty-mark">＋</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && <button className="button button-outline" onClick={onAction} type="button">{actionLabel}</button>}
    </div>
  );
}
