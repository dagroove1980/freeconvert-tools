interface FeatureBadgeProps {
  label: string;
}

export default function FeatureBadge({ label }: FeatureBadgeProps) {
  return (
    <span className="inline-block rounded-full text-[11px] px-3 py-1 font-medium bg-background border border-border text-secondary">
      {label}
    </span>
  );
}
