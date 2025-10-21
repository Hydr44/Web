"use client";

type Props = {
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
  formAction: string | ((formData: FormData) => void | Promise<void>);
  hiddenFields?: Record<string, string>;
};

export default function ConfirmSubmit({ confirmMessage, className, children, formAction, hiddenFields }: Props) {
  return (
    <form action={formAction} onSubmit={(e) => { if (!confirm(confirmMessage)) { e.preventDefault(); } }}>
      {hiddenFields && Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={className}>{children}</button>
    </form>
  );
}



