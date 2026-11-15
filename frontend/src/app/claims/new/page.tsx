import { redirect } from "next/navigation";

// Preserve old bookmarks without asking customers to enter an ID.
export default function LegacyClaimLookup() { redirect("/claims"); }
