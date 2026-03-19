"use client";

// /projects/[id] → client-side redirect to /canvas (static export compatible).
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ProjectIndexPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) router.replace(`/projects/${id}/canvas`);
  }, [id, router]);

  return null;
}
