import EditClaimPage from "@/components/EditClaimPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditClaimPage key={id} id={id} />;
}
