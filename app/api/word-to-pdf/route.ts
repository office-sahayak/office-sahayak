import { convertDocxToPdf, LibreOfficeUnavailableError } from "@/lib/server/libreoffice-converter";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_FILE_SIZE = 15 * 1024 * 1024;
let activeConversions = 0;

function downloadName(sourceName: string) {
  return `${sourceName.replace(/\.docx$/iu, "").trim() || "word-document"}.pdf`;
}

function contentDisposition(fileName: string) {
  const asciiName = fileName.normalize("NFKD").replace(/[^\x20-\x7E]+/gu, "").replace(/["\\]/gu, "-") || "word-document.pdf";
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_FILE_SIZE + 1024 * 1024) {
    return Response.json({ error: "Word file का आकार 15 MB से कम रखें।" }, { status: 413 });
  }
  if (activeConversions >= 2) {
    return Response.json({ error: "Server पर दो PDF बन रही हैं। थोड़ी देर बाद फिर प्रयास करें।" }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Word upload सही नहीं है। File दोबारा चुनें।" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".docx")) {
    return Response.json({ error: "केवल .docx Word file चुनें।" }, { status: 400 });
  }
  if (!file.size || file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Word file का आकार 15 MB से कम रखें।" }, { status: 413 });
  }
  const source = Buffer.from(await file.arrayBuffer());
  if (source[0] !== 0x50 || source[1] !== 0x4b) {
    return Response.json({ error: "यह सही .docx file नहीं है।" }, { status: 400 });
  }

  activeConversions += 1;
  try {
    const pdf = await convertDocxToPdf(source);
    const fileName = downloadName(file.name);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": contentDisposition(fileName),
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    const status = error instanceof LibreOfficeUnavailableError ? 503 : 422;
    const message = error instanceof Error ? error.message : "Word की PDF नहीं बन सकी।";
    return Response.json({ error: message }, { status });
  } finally {
    activeConversions -= 1;
  }
}
