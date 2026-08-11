"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import QRCode from "qrcode";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function copyValue(value: string) {
  await navigator.clipboard.writeText(value);
}

export function TextDiffWorkspace() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");

  const comparison = useMemo(() => {
    const left = leftText ? leftText.split(/\r?\n/u) : [];
    const right = rightText ? rightText.split(/\r?\n/u) : [];
    const count = Math.max(left.length, right.length);
    const rows = Array.from({ length: count }, (_, index) => ({
      number: index + 1,
      left: left[index] ?? "",
      right: right[index] ?? "",
      status: left[index] === undefined ? "added" : right[index] === undefined ? "removed" : left[index] === right[index] ? "same" : "changed",
    }));
    return {
      rows: rows.slice(0, 500),
      same: rows.filter((row) => row.status === "same").length,
      changed: rows.filter((row) => row.status === "changed").length,
      added: rows.filter((row) => row.status === "added").length,
      removed: rows.filter((row) => row.status === "removed").length,
      truncated: rows.length > 500,
    };
  }, [leftText, rightText]);

  const hasContent = Boolean(leftText || rightText);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#b4552d]">Line-by-line तुलना</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">दोनों text नीचे paste करें</h2>
          </div>
          <button type="button" onClick={() => { setLeftText(""); setRightText(""); }} disabled={!hasContent} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40">दोनों साफ़ करें</button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700">पहला text</span>
            <textarea value={leftText} onChange={(event) => setLeftText(event.target.value)} placeholder="पुराना या पहला text…" className="min-h-64 w-full resize-y rounded-3xl border border-slate-300 bg-[#f8faf9] p-5 leading-7 text-slate-900 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-slate-700">दूसरा text</span>
            <textarea value={rightText} onChange={(event) => setRightText(event.target.value)} placeholder="नया या दूसरा text…" className="min-h-64 w-full resize-y rounded-3xl border border-slate-300 bg-[#f8faf9] p-5 leading-7 text-slate-900 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" />
          </label>
        </div>
      </section>

      {hasContent && (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-8" aria-live="polite">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[
              ["समान", comparison.same, "bg-emerald-50 text-emerald-700"],
              ["बदली", comparison.changed, "bg-amber-50 text-amber-700"],
              ["जोड़ी", comparison.added, "bg-sky-50 text-sky-700"],
              ["हटाई", comparison.removed, "bg-rose-50 text-rose-700"],
            ].map(([label, value, tone]) => (
              <div key={String(label)} className={`rounded-2xl p-4 ${tone}`}><p className="text-xs font-extrabold uppercase tracking-wider">{label} पंक्तियाँ</p><p className="mt-1 text-2xl font-black">{value}</p></div>
            ))}
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-2 bg-slate-100 text-sm font-black text-slate-700"><span className="border-r border-slate-200 px-4 py-3">पहला text</span><span className="px-4 py-3">दूसरा text</span></div>
            <div className="max-h-[36rem] overflow-auto">
              {comparison.rows.map((row) => {
                const tone = row.status === "same" ? "bg-white" : row.status === "added" ? "bg-sky-50" : row.status === "removed" ? "bg-rose-50" : "bg-amber-50";
                return (
                  <div key={row.number} className={`grid min-w-[640px] grid-cols-2 border-t border-slate-100 ${tone}`}>
                    <div className="flex border-r border-slate-200"><span className="w-12 shrink-0 bg-black/5 px-2 py-3 text-right text-xs text-slate-400">{row.number}</span><span className="whitespace-pre-wrap break-words px-3 py-3 text-sm text-slate-800">{row.left || " "}</span></div>
                    <div className="flex"><span className="w-12 shrink-0 bg-black/5 px-2 py-3 text-right text-xs text-slate-400">{row.number}</span><span className="whitespace-pre-wrap break-words px-3 py-3 text-sm text-slate-800">{row.right || " "}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
          {comparison.truncated && <p className="mt-4 text-sm font-bold text-amber-700">तेज़ परिणाम के लिए पहली 500 पंक्तियाँ दिखाई गई हैं।</p>}
        </section>
      )}
    </div>
  );
}

type ImageMode = "compress" | "resize" | "convert";
type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

interface LoadedImage {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
}

const formatLabels: Record<OutputFormat, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

function extensionFor(format: OutputFormat) {
  return format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";
}

function loadImageFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("फोटो पढ़ी नहीं जा सकी।"));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new window.Image();
      image.onerror = () => reject(new Error("यह image format browser में नहीं खुला।"));
      image.onload = () => resolve({ file, dataUrl, width: image.naturalWidth, height: image.naturalHeight });
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function canvasBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("नई image तैयार नहीं हो सकी।")), format, quality);
  });
}

function ImageProcessorWorkspace({ mode }: { mode: ImageMode }) {
  const [source, setSource] = useState<LoadedImage | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(mode === "convert" ? "image/png" : "image/jpeg");
  const [quality, setQuality] = useState(75);
  const [maxWidth, setMaxWidth] = useState("1920");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockRatio, setLockRatio] = useState(true);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function chooseFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/") || !/\.(jpe?g|png|webp)$/iu.test(file.name)) {
      setError("केवल JPG, PNG या WebP image चुनें।");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("Image का आकार 25 MB से कम रखें।");
      return;
    }
    try {
      const loaded = await loadImageFile(file);
      setSource(loaded);
      setWidth(String(loaded.width));
      setHeight(String(loaded.height));
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(null);
      setOutputSize(0);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Image खुल नहीं सकी।");
    }
  }

  function updateWidth(value: string) {
    setWidth(value);
    if (lockRatio && source && Number(value) > 0) setHeight(String(Math.max(1, Math.round(Number(value) * source.height / source.width))));
  }

  function updateHeight(value: string) {
    setHeight(value);
    if (lockRatio && source && Number(value) > 0) setWidth(String(Math.max(1, Math.round(Number(value) * source.width / source.height))));
  }

  async function processImage() {
    if (!source) return;
    setIsWorking(true);
    setError(null);
    try {
      let targetWidth = source.width;
      let targetHeight = source.height;
      if (mode === "compress") {
        const limit = Math.max(1, Math.min(12000, Number(maxWidth) || source.width));
        if (source.width > limit) {
          targetWidth = Math.round(limit);
          targetHeight = Math.max(1, Math.round(source.height * targetWidth / source.width));
        }
      }
      if (mode === "resize") {
        targetWidth = Math.round(Number(width));
        targetHeight = Math.round(Number(height));
        if (!targetWidth || !targetHeight || targetWidth > 12000 || targetHeight > 12000) throw new Error("चौड़ाई और ऊँचाई 1 से 12000 pixels के बीच रखें।");
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser image तैयार नहीं कर पाया।");
      if (outputFormat === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, targetWidth, targetHeight);
      }
      const image = new window.Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image दोबारा नहीं खुल सकी।"));
        image.src = source.dataUrl;
      });
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, targetWidth, targetHeight);
      const blob = await canvasBlob(canvas, outputFormat, quality / 100);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(URL.createObjectURL(blob));
      setOutputSize(blob.size);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Image तैयार नहीं हो सकी।");
    } finally {
      setIsWorking(false);
    }
  }

  function downloadImage() {
    if (!outputUrl || !source) return;
    const link = document.createElement("a");
    link.href = outputUrl;
    link.download = `${source.file.name.replace(/\.[^.]+$/u, "")}-${mode}.${extensionFor(outputFormat)}`;
    link.click();
  }

  const title = mode === "compress" ? "Image का size छोटा करें" : mode === "resize" ? "Image की dimensions बदलें" : "Image का format बदलें";

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <h2 className="text-2xl font-black text-slate-950">{title}</h2>
        <label className="mt-6 block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6 py-10 text-center transition hover:border-[#7aa596]">
          <span className="text-4xl" aria-hidden="true">🖼️</span>
          <strong className="mt-3 block text-lg text-slate-900">JPG, PNG या WebP चुनें</strong>
          <span className="mt-1 block text-sm text-slate-500">अधिकतम 25 MB</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void chooseFile(file); event.target.value = ""; }} />
        </label>

        {source && (
          <div className="mt-7 grid gap-6 md:grid-cols-[220px_1fr]">
            <div>
              <Image src={source.dataUrl} alt="चुनी हुई image का preview" width={source.width} height={source.height} unoptimized className="aspect-square w-full rounded-2xl bg-slate-100 object-contain" />
              <p className="mt-2 break-all text-xs font-semibold text-slate-500">{source.file.name}</p>
              <p className="mt-1 text-xs text-slate-400">{source.width} × {source.height}px • {formatBytes(source.file.size)}</p>
            </div>
            <div className="space-y-5">
              {mode === "compress" && (
                <label className="block"><span className="mb-2 block text-sm font-extrabold text-slate-700">अधिकतम चौड़ाई (px)</span><input type="number" min="1" max="12000" value={maxWidth} onChange={(event) => setMaxWidth(event.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-[#2f6a59]" /></label>
              )}
              {mode === "resize" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label><span className="mb-2 block text-sm font-extrabold text-slate-700">चौड़ाई (px)</span><input type="number" min="1" max="12000" value={width} onChange={(event) => updateWidth(event.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-[#2f6a59]" /></label>
                    <label><span className="mb-2 block text-sm font-extrabold text-slate-700">ऊँचाई (px)</span><input type="number" min="1" max="12000" value={height} onChange={(event) => updateHeight(event.target.value)} className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-[#2f6a59]" /></label>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} className="size-4 accent-[#173f35]" /> अनुपात (aspect ratio) बनाए रखें</label>
                </>
              )}
              <label className="block"><span className="mb-2 block text-sm font-extrabold text-slate-700">Output format</span><select value={outputFormat} onChange={(event) => setOutputFormat(event.target.value as OutputFormat)} className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold outline-none focus:border-[#2f6a59]">{Object.entries(formatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              {outputFormat !== "image/png" && (
                <label className="block"><span className="mb-2 flex justify-between text-sm font-extrabold text-slate-700"><span>Quality</span><span>{quality}%</span></span><input type="range" min="20" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="w-full accent-[#173f35]" /></label>
              )}
              <button type="button" onClick={() => void processImage()} disabled={isWorking} className="min-h-12 w-full rounded-full bg-[#173f35] px-6 py-3 font-black text-white hover:bg-[#0f3028] disabled:opacity-50">{isWorking ? "तैयार हो रही है…" : "Image तैयार करें"}</button>
            </div>
          </div>
        )}

        {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {outputUrl && source && (
          <div className="mt-7 rounded-3xl bg-[#eaf4ef] p-5 sm:flex sm:items-center sm:justify-between" aria-live="polite">
            <div><p className="text-sm font-extrabold text-[#2f6a59]">नई image तैयार है</p><p className="mt-1 font-black text-slate-950">{formatLabels[outputFormat]} • {formatBytes(outputSize)} {mode === "compress" && outputSize < source.file.size ? `• ${Math.round((1 - outputSize / source.file.size) * 100)}% छोटा` : ""}</p></div>
            <button type="button" onClick={downloadImage} className="mt-4 rounded-full bg-[#173f35] px-6 py-3 font-black text-white sm:mt-0">Download करें</button>
          </div>
        )}
      </section>
      <aside className="space-y-4">
        <div className="rounded-3xl bg-[#173f35] p-6 text-white"><span className="text-3xl" aria-hidden="true">🔒</span><h2 className="mt-4 text-xl font-black">फोटो upload नहीं होती</h2><p className="mt-2 text-sm leading-6 text-white/70">सारी processing आपके browser में होती है। चुनी हुई image किसी server पर नहीं भेजी जाती।</p></div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">JPG में transparency सफेद background में बदल जाएगी। PNG transparency को सुरक्षित रखता है।</div>
      </aside>
    </div>
  );
}

export function ImageCompressWorkspace() { return <ImageProcessorWorkspace mode="compress" />; }
export function ImageResizeWorkspace() { return <ImageProcessorWorkspace mode="resize" />; }
export function ImageFormatWorkspace() { return <ImageProcessorWorkspace mode="convert" />; }

export function QrCodeWorkspace() {
  const [value, setValue] = useState("");
  const [size, setSize] = useState(320);
  const [dark, setDark] = useState("#173f35");
  const [light, setLight] = useState("#ffffff");
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState("");

  async function generateQr() {
    if (!value.trim()) { setError("QR बनाने के लिए text या URL लिखें।"); return; }
    try {
      setError("");
      setQrUrl(await QRCode.toDataURL(value.trim(), { width: size, margin: 2, errorCorrectionLevel: "M", color: { dark, light } }));
    } catch {
      setError("QR Code नहीं बन सका। Text छोटा करके दोबारा प्रयास करें।");
    }
  }

  function downloadQr() {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = "office-sahayak-qr-code.png";
    link.click();
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block"><span className="mb-2 block text-sm font-extrabold text-slate-700">Text या URL</span><textarea value={value} onChange={(event) => { setValue(event.target.value); setQrUrl(""); }} maxLength={2000} placeholder="https://example.com या कोई संदेश…" className="min-h-40 w-full rounded-3xl border border-slate-300 bg-[#f8faf9] p-5 text-lg leading-7 outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" /></label>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label><span className="mb-2 block text-sm font-extrabold text-slate-700">आकार</span><select value={size} onChange={(event) => setSize(Number(event.target.value))} className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 font-bold"><option value="240">240 px</option><option value="320">320 px</option><option value="512">512 px</option><option value="800">800 px</option></select></label>
          <label><span className="mb-2 block text-sm font-extrabold text-slate-700">QR रंग</span><input type="color" value={dark} onChange={(event) => setDark(event.target.value)} className="h-12 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white p-1" /></label>
          <label><span className="mb-2 block text-sm font-extrabold text-slate-700">Background</span><input type="color" value={light} onChange={(event) => setLight(event.target.value)} className="h-12 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white p-1" /></label>
        </div>
        <button type="button" onClick={() => void generateQr()} className="mt-6 rounded-full bg-[#173f35] px-7 py-3 font-black text-white hover:bg-[#0f3028]">QR Code बनाएँ</button>
        {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
      </section>
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200/50">
        {qrUrl ? <><div className="mx-auto grid aspect-square max-w-80 place-items-center rounded-3xl bg-slate-50 p-4"><Image src={qrUrl} width={size} height={size} unoptimized alt="बनाया गया QR Code" className="h-auto w-full" /></div><button type="button" onClick={downloadQr} className="mt-5 w-full rounded-full bg-[#173f35] px-6 py-3 font-black text-white">PNG Download करें</button><p className="mt-3 text-xs font-semibold text-slate-500">इस्तेमाल से पहले अपने mobile camera से scan करके जाँच लें।</p></> : <div className="grid min-h-80 place-items-center rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6"><div><span className="text-5xl" aria-hidden="true">▦</span><p className="mt-3 font-bold text-slate-500">आपका QR Code यहाँ दिखाई देगा</p></div></div>}
      </aside>
    </div>
  );
}

export function PasswordGeneratorWorkspace() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function generatePassword() {
    const groups = [options.upper ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "", options.lower ? "abcdefghijkmnopqrstuvwxyz" : "", options.numbers ? "23456789" : "", options.symbols ? "!@#$%^&*()-_=+" : ""].filter(Boolean);
    if (!groups.length) { setMessage("कम से कम एक प्रकार चुनें।"); return; }
    const charset = groups.join("");
    const randomIndex = (max: number) => {
      const limit = Math.floor(256 / max) * max;
      const bytes = new Uint8Array(1);
      do crypto.getRandomValues(bytes); while (bytes[0] >= limit);
      return bytes[0] % max;
    };
    const chars = groups.map((group) => group[randomIndex(group.length)]);
    while (chars.length < length) chars.push(charset[randomIndex(charset.length)]);
    for (let index = chars.length - 1; index > 0; index -= 1) {
      const swap = randomIndex(index + 1);
      [chars[index], chars[swap]] = [chars[swap], chars[index]];
    }
    setPassword(chars.join(""));
    setMessage("");
  }

  async function copyPassword() {
    if (!password) return;
    await copyValue(password);
    setMessage("Password copy हो गया।");
    window.setTimeout(() => setMessage(""), 1600);
  }

  const strength = length >= 16 && Object.values(options).filter(Boolean).length >= 3 ? "बहुत मजबूत" : length >= 12 ? "मजबूत" : "सामान्य";

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block"><span className="mb-2 flex justify-between text-sm font-extrabold text-slate-700"><span>Password लंबाई</span><span>{length} अक्षर</span></span><input type="range" min="8" max="64" value={length} onChange={(event) => setLength(Number(event.target.value))} className="w-full accent-[#173f35]" /></label>
        <fieldset className="mt-7"><legend className="text-sm font-extrabold text-slate-700">Password में क्या शामिल हो?</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{[
          ["upper", "बड़े अक्षर (A–Z)"], ["lower", "छोटे अक्षर (a–z)"], ["numbers", "अंक (2–9)"], ["symbols", "विशेष चिन्ह (!@#)"],
        ].map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 font-bold text-slate-700"><input type="checkbox" checked={options[key as keyof typeof options]} onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))} className="size-4 accent-[#173f35]" />{label}</label>)}</div></fieldset>
        <button type="button" onClick={generatePassword} className="mt-6 rounded-full bg-[#173f35] px-7 py-3 font-black text-white hover:bg-[#0f3028]">नया Password बनाएँ</button>
        {password && <div className="mt-7 rounded-3xl bg-[#eaf4ef] p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-[#2f6a59]">{strength}</p><div className="mt-2 flex items-center gap-3"><code className="min-w-0 flex-1 break-all text-xl font-black text-slate-950">{password}</code><button type="button" onClick={() => void copyPassword()} className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black text-[#173f35] shadow-sm">Copy</button></div></div>}
        {message && <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${message.includes("कम से") ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</p>}
      </section>
      <aside className="space-y-4"><div className="rounded-3xl bg-[#173f35] p-6 text-white"><span className="text-3xl" aria-hidden="true">🛡️</span><h2 className="mt-4 text-xl font-black">सुरक्षित random password</h2><p className="mt-2 text-sm leading-6 text-white/70">Password आपके device की cryptographic random सुविधा से बनता है और कहीं save नहीं होता।</p></div><div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">हर account के लिए अलग password रखें और उसे भरोसेमंद password manager में save करें।</div></aside>
    </div>
  );
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/iu.test(normalized)) return null;
  return { r: parseInt(normalized.slice(0, 2), 16), g: parseInt(normalized.slice(2, 4), 16), b: parseInt(normalized.slice(4, 6), 16) };
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255; const green = g / 255; const blue = b / 255;
  const max = Math.max(red, green, blue); const min = Math.min(red, green, blue);
  let hue = 0; let saturation = 0; const lightness = (max + min) / 2;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue /= 6;
  }
  return { h: Math.round(hue * 360), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}

export function ColorPickerWorkspace() {
  const [color, setColor] = useState("#173f35");
  const [hexInput, setHexInput] = useState("#173F35");
  const [message, setMessage] = useState("");
  const rgb = hexToRgb(color) ?? { r: 23, g: 63, b: 53 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const values = [{ label: "HEX", value: color.toUpperCase() }, { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }, { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }];

  async function copyColor(value: string) {
    await copyValue(value);
    setMessage(`${value} copy हो गया`);
    window.setTimeout(() => setMessage(""), 1500);
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <div className="grid gap-7 md:grid-cols-[220px_1fr] md:items-center">
          <label className="block"><span className="sr-only">रंग चुनें</span><input type="color" value={color} onChange={(event) => { setColor(event.target.value); setHexInput(event.target.value.toUpperCase()); }} className="aspect-square w-full cursor-pointer rounded-3xl border-0 bg-transparent p-0" /></label>
          <div>
            <h2 className="text-2xl font-black text-slate-950">रंग चुनें और code copy करें</h2>
            <label className="mt-5 block"><span className="mb-2 block text-sm font-extrabold text-slate-700">HEX Code</span><input value={hexInput} maxLength={7} onChange={(event) => { const value = event.target.value.toUpperCase(); if (/^#[0-9A-F]{0,6}$/u.test(value)) { setHexInput(value); if (hexToRgb(value)) setColor(value.toLowerCase()); } }} onBlur={() => { if (!hexToRgb(hexInput)) setHexInput(color.toUpperCase()); }} className="min-h-12 w-full rounded-2xl border border-slate-300 px-4 font-mono text-lg font-bold uppercase outline-none focus:border-[#2f6a59]" /></label>
            <div className="mt-5 space-y-3">{values.map((item) => <button key={item.label} type="button" onClick={() => void copyColor(item.value)} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"><span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{item.label}</span><code className="break-all font-bold text-slate-900">{item.value}</code><span aria-hidden="true">⧉</span></button>)}</div>
            {message && <p className="mt-4 text-sm font-bold text-emerald-700">{message}</p>}
          </div>
        </div>
      </section>
      <aside className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50"><div className="grid min-h-64 place-items-center p-6" style={{ backgroundColor: color }}><span className="rounded-full bg-white/90 px-5 py-2 font-mono font-black text-slate-900 shadow-lg">{color.toUpperCase()}</span></div><div className="p-6"><h2 className="text-lg font-black text-slate-950">Live Preview</h2><p className="mt-2 text-sm leading-6 text-slate-500">चुना हुआ रंग ऊपर तुरंत दिखाई देता है। HEX, RGB या HSL code पर click करके उसे copy करें।</p></div></aside>
    </div>
  );
}
