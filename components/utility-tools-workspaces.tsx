"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

interface CropSource { file: File; dataUrl: string; width: number; height: number }

function readCropSource(file: File): Promise<CropSource> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Image पढ़ी नहीं जा सकी।"));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new window.Image();
      image.onerror = () => reject(new Error("Image खुल नहीं सकी।"));
      image.onload = () => resolve({ file, dataUrl, width: image.naturalWidth, height: image.naturalHeight });
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageCropWorkspace() {
  const [source, setSource] = useState<CropSource | null>(null);
  const [crop, setCrop] = useState({ x: "0", y: "0", width: "", height: "" });
  const [outputUrl, setOutputUrl] = useState("");
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
  const [error, setError] = useState("");

  async function chooseImage(file: File) {
    setError("");
    if (!/\.(jpe?g|png|webp)$/iu.test(file.name) || file.size > 25 * 1024 * 1024) { setError("25 MB से छोटी JPG, PNG या WebP image चुनें।"); return; }
    try {
      const loaded = await readCropSource(file);
      setSource(loaded);
      setCrop({ x: "0", y: "0", width: String(loaded.width), height: String(loaded.height) });
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl("");
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Image खुल नहीं सकी।"); }
  }

  async function cropImage() {
    if (!source) return;
    const x = Math.round(Number(crop.x)); const y = Math.round(Number(crop.y)); const width = Math.round(Number(crop.width)); const height = Math.round(Number(crop.height));
    if (x < 0 || y < 0 || width < 1 || height < 1 || x + width > source.width || y + height > source.height) { setError(`Crop area image की सीमा (${source.width} × ${source.height}px) के अंदर रखें।`); return; }
    setError("");
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Image नहीं खुली।")); image.src = source.dataUrl; });
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); if (!context) { setError("Browser crop तैयार नहीं कर पाया।"); return; }
    if (format === "image/jpeg") { context.fillStyle = "#fff"; context.fillRect(0, 0, width, height); }
    context.drawImage(image, x, y, width, height, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, 0.92));
    if (!blob) { setError("Cropped image तैयार नहीं हो सकी।"); return; }
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(URL.createObjectURL(blob));
  }

  function downloadCrop() {
    if (!source || !outputUrl) return;
    const extension = format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";
    const link = document.createElement("a"); link.href = outputUrl; link.download = `${source.file.name.replace(/\.[^.]+$/u, "")}-cropped.${extension}`; link.click();
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-[#f8faf9] px-6 py-9 text-center hover:border-[#7aa596]"><span className="text-4xl" aria-hidden="true">✂️</span><strong className="mt-3 block text-lg">Image चुनें</strong><span className="mt-1 block text-sm text-slate-500">JPG, PNG या WebP • अधिकतम 25 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void chooseImage(file); event.target.value = ""; }} /></label>
        {source && <div className="mt-7 grid gap-6 md:grid-cols-[260px_1fr]"><div><Image src={source.dataUrl} alt="Crop के लिए चुनी image" width={source.width} height={source.height} unoptimized className="max-h-72 w-full rounded-2xl bg-slate-100 object-contain" /><p className="mt-2 text-xs font-semibold text-slate-500">मूल आकार: {source.width} × {source.height}px</p></div><div><div className="grid grid-cols-2 gap-3">{[["x", "बाएँ से X"], ["y", "ऊपर से Y"], ["width", "चौड़ाई"], ["height", "ऊँचाई"]].map(([key, label]) => <label key={key}><span className="mb-1 block text-xs font-extrabold text-slate-600">{label} (px)</span><input type="number" min="0" value={crop[key as keyof typeof crop]} onChange={(event) => setCrop((current) => ({ ...current, [key]: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-300 px-3 font-bold outline-none focus:border-[#2f6a59]" /></label>)}</div><label className="mt-4 block"><span className="mb-1 block text-xs font-extrabold text-slate-600">Output format</span><select value={format} onChange={(event) => setFormat(event.target.value as typeof format)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-bold"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><button type="button" onClick={() => void cropImage()} className="mt-5 w-full rounded-full bg-[#173f35] px-6 py-3 font-black text-white">Crop करें</button></div></div>}
        {error && <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
        {outputUrl && <div className="mt-7 rounded-3xl bg-[#eaf4ef] p-5 sm:flex sm:items-center sm:justify-between"><div><p className="font-black text-slate-950">Cropped image तैयार है</p><p className="mt-1 text-sm text-slate-600">{crop.width} × {crop.height}px</p></div><button type="button" onClick={downloadCrop} className="mt-4 rounded-full bg-[#173f35] px-6 py-3 font-black text-white sm:mt-0">Download करें</button></div>}
      </section>
      <aside className="space-y-4"><div className="rounded-3xl bg-[#173f35] p-6 text-white"><span className="text-3xl" aria-hidden="true">🔒</span><h2 className="mt-4 text-xl font-black">Image निजी रहती है</h2><p className="mt-2 text-sm leading-6 text-white/70">Crop आपके browser में होता है। Image किसी server पर upload नहीं होती।</p></div><div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><strong className="block text-slate-900">Crop position</strong>X बाएँ किनारे से और Y ऊपर के किनारे से दूरी है। Width और height crop का आकार है।</div></aside>
    </div>
  );
}

type BarcodeFormat = "CODE128" | "EAN13" | "UPC" | "CODE39";

export function BarcodeGeneratorWorkspace() {
  const [value, setValue] = useState("OFFICE-SAHAYAK-001");
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [lineWidth, setLineWidth] = useState(2);
  const [height, setHeight] = useState(90);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  function generateBarcode() {
    if (!svgRef.current || !value.trim()) { setError("Barcode value लिखें।"); return; }
    try {
      JsBarcode(svgRef.current, value.trim(), { format, width: lineWidth, height, displayValue: true, margin: 18, background: "#ffffff", lineColor: "#111827", fontSize: 18 });
      setGenerated(true); setError("");
    } catch {
      setGenerated(false); setError(format === "EAN13" ? "EAN-13 के लिए checksum सहित सही 13 digits लिखें।" : format === "UPC" ? "UPC के लिए checksum सहित सही 12 digits लिखें।" : "यह value चुने हुए barcode format में सही नहीं है।");
    }
  }

  function downloadSvg() {
    if (!svgRef.current || !generated) return;
    const content = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([content], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "office-sahayak-barcode.svg"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const help = useMemo(() => format === "CODE128" ? "Letters, numbers और symbols" : format === "CODE39" ? "Capital letters, numbers और कुछ symbols" : format === "EAN13" ? "13 digits" : "12 digits", [format]);

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_420px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
        <label className="block"><span className="mb-2 block text-sm font-extrabold text-slate-700">Barcode value</span><input value={value} maxLength={80} onChange={(event) => { setValue(event.target.value); setGenerated(false); }} className="min-h-14 w-full rounded-2xl border border-slate-300 px-4 text-lg font-bold outline-none focus:border-[#2f6a59] focus:ring-4 focus:ring-[#2f6a59]/10" /><span className="mt-1 block text-xs text-slate-500">{help}</span></label>
        <div className="mt-5 grid gap-4 sm:grid-cols-3"><label><span className="mb-2 block text-sm font-extrabold text-slate-700">Format</span><select value={format} onChange={(event) => { setFormat(event.target.value as BarcodeFormat); setGenerated(false); }} className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-3 font-bold"><option value="CODE128">CODE 128</option><option value="CODE39">CODE 39</option><option value="EAN13">EAN-13</option><option value="UPC">UPC-A</option></select></label><label><span className="mb-2 block text-sm font-extrabold text-slate-700">Line width</span><select value={lineWidth} onChange={(event) => setLineWidth(Number(event.target.value))} className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-3 font-bold"><option value="1">1 px</option><option value="2">2 px</option><option value="3">3 px</option></select></label><label><span className="mb-2 block text-sm font-extrabold text-slate-700">ऊँचाई</span><select value={height} onChange={(event) => setHeight(Number(event.target.value))} className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-3 font-bold"><option value="60">60 px</option><option value="90">90 px</option><option value="120">120 px</option></select></label></div>
        <button type="button" onClick={generateBarcode} className="mt-6 rounded-full bg-[#173f35] px-7 py-3 font-black text-white">Barcode बनाएँ</button>
        {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
      </section>
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50"><div className="grid min-h-64 place-items-center overflow-auto rounded-3xl bg-[#f8faf9] p-4"><svg ref={svgRef} aria-label="बनाया गया barcode" /></div>{generated ? <><button type="button" onClick={downloadSvg} className="mt-5 w-full rounded-full bg-[#173f35] px-6 py-3 font-black text-white">SVG Download करें</button><p className="mt-3 text-center text-xs text-slate-500">Print या उपयोग से पहले barcode scanner से जाँच लें।</p></> : <p className="mt-4 text-center text-sm font-bold text-slate-500">Barcode यहाँ दिखाई देगा।</p>}</aside>
    </div>
  );
}
