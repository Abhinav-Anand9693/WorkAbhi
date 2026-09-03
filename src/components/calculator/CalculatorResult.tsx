interface CalculatorResultProps {
  label: string;
  value: string;
  description?: string;
}

export default function CalculatorResult({
  label,
  value,
  description,
}: CalculatorResultProps) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}