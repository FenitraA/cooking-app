export default function LegendBox({
  category,
}: {
  category: { name: string; bg: string; text: string };
}) {
  return (
    <div
      className={`flex h-11 items-center justify-center rounded-sm font-semibold shadow-xs ${category.bg} ${category.text} border border-white/20`}
    >
      {category.name}
    </div>
  );
}
