"use client";

import { useEffect, useState } from "react";
import { API_URL, type Claim } from "@/lib/api";
import { File, Package, Video } from "./Icons";

type Evidence = Claim["evidence"][number];
export function evidenceUrl(claimId: string, evidence: Evidence) {
  return `${API_URL}/api/claims/${encodeURIComponent(claimId)}/evidence/${encodeURIComponent(evidence.id)}/content`;
}

export default function EvidencePreview({ claimId, evidence, compact = false }: { claimId: string; evidence?: Evidence; compact?: boolean }) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);
  const url = evidence ? evidenceUrl(claimId, evidence) : "";
  const image = evidence?.content_type.startsWith("image/");
  const video = evidence?.content_type.startsWith("video/");
  useEffect(() => {
    if (!url || (!image && (!video || compact))) return;
    const controller = new AbortController();
    let objectUrl = "";
    fetch(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) }).then(async response => {
      if (!response.ok) throw new Error("Preview unavailable");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setSource(objectUrl);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, image, video, compact]);
  return <div className={`claim-media ${compact ? "claim-media--compact" : ""}`}>
    {source && !failed ? image ?
      // Uploaded evidence uses a browser blob URL rather than Next's remote image optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={source} alt={compact ? "" : evidence?.filename || "Claim evidence"} onError={() => setFailed(true)} /> :
      <video src={source} controls preload="metadata" onError={() => setFailed(true)} aria-label={evidence?.filename} /> :
      <div className="claim-media-placeholder">{video ? <Video /> : evidence ? <File /> : <Package />}{!compact && <span>{failed ? "Preview unavailable — download the original below" : evidence ? "Loading preview…" : "No product image"}</span>}</div>}
  </div>;
}
