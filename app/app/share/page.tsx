import { headers } from "next/headers";
import { PageHeader } from "@/components/ui";
import { ShareKit } from "@/components/share-kit";
import { requireSpace } from "@/lib/server/auth";

const DEFAULT_TEMPLATE =
  "Hi {name}, thanks for visiting {business}! Could you share a quick review? It takes 20 seconds: {link}";

async function Content() {
  const { space } = await requireSpace();
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const url = `${protocol}://${host}/r/${space.slug}`;

  return (
    <div>
      <PageHeader
        title="Share"
        description="One link, one QR code. Everything a customer needs is on their phone in two taps."
      />
      <ShareKit
        url={url}
        businessName={space.name}
        template={space.whatsapp_template || DEFAULT_TEMPLATE}
      />
    </div>
  );
}

export default Content;
