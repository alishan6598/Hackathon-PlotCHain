"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { track, PH_EVENTS } from "@/hooks/usePostHog";
import { txEtherscan } from "./AddressPill";

export default function CertificateGenerator({ plot, owner, txHash }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    try {
      setBusy(true);
      const qrTarget = txHash
        ? txEtherscan(txHash)
        : `https://sepolia.etherscan.io/address/${owner ?? ""}`;
      const qrDataUrl = await QRCode.toDataURL(qrTarget, {
        margin: 1,
        width: 240,
        color: { dark: "#0a0f1e", light: "#ffffff" },
      });

      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      // Background panel
      doc.setFillColor(10, 15, 30);
      doc.rect(0, 0, W, H, "F");

      // Inner border
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(2);
      doc.rect(30, 30, W - 60, H - 60);

      // Title
      doc.setTextColor(245, 158, 11);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("PLOTCHAIN", W / 2, 100, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text("Certificate of On-Chain Ownership", W / 2, 130, {
        align: "center",
      });

      // Plot block
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text(`Plot #${plot.plotNumber}`, W / 2, 200, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 210);
      doc.text(
        `Paradise Valley — ${plot.street}`,
        W / 2,
        225,
        { align: "center" }
      );

      // Details grid
      const startY = 280;
      const rows = [
        ["Size", plot.size],
        ["Area", plot.area],
        ["Facing", plot.facing],
        ["Owner", owner ?? "—"],
        ["Token ID", `#${plot.plotNumber}`],
      ];
      doc.setFontSize(11);
      rows.forEach((r, i) => {
        doc.setTextColor(160, 160, 175);
        doc.text(r[0].toUpperCase(), 80, startY + i * 24);
        doc.setTextColor(255, 255, 255);
        doc.text(String(r[1]), 200, startY + i * 24);
      });

      // QR
      doc.addImage(qrDataUrl, "PNG", W - 200, startY - 10, 120, 120);
      doc.setFontSize(9);
      doc.setTextColor(160, 160, 175);
      doc.text("Scan to verify on Etherscan", W - 200, startY + 130, {
        maxWidth: 120,
      });
      doc.setTextColor(100, 160, 255);
      doc.textWithLink(qrTarget, W - 200, startY + 145, {
        url: qrTarget,
        maxWidth: 120,
      });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(160, 160, 175);
      doc.text(
        `Issued ${new Date().toISOString().slice(0, 10)} · plotchain.demo`,
        W / 2,
        H - 50,
        { align: "center" }
      );

      doc.save(`PlotChain_Plot-${plot.plotNumber}_Certificate.pdf`);
      track(PH_EVENTS.CERTIFICATE_DOWNLOADED, {
        plotNumber: plot.plotNumber,
        owner,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="btn-ghost w-full inline-flex items-center justify-center gap-2"
      disabled={busy}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
      Download Certificate
    </button>
  );
}
