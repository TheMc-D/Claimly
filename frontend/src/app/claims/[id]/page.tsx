import ClaimDetails from "@/components/ClaimDetails";

export default async function ClaimDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClaimDetails key={id} id={id} />;
}
