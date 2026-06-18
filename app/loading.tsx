import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      <Spinner className="h-8 w-8 text-sage-600" />
      <p className="text-sm font-medium text-ink-500 animate-pulse">Cargando...</p>
    </div>
  );
}
