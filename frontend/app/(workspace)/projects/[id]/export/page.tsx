// Server wrapper: generateStaticParams for Next.js output:export
// Client content in _client.tsx uses useParams() for project ID.
import Client from "./_client";
export function generateStaticParams() { return [{ id: "_" }]; }
export default function Page() { return <Client />; }
