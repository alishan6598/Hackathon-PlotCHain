"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useMintPlot } from "@/hooks/usePlotNFT";
import { useToast } from "./Toaster";
import { ADMIN_ADDRESS } from "@/constants/contracts";
import { Loader2 } from "lucide-react";

// Pre-pinned standard plot image on Pinata IPFS.
const STANDARD_IMAGE_CID = "bafybeiangwsqd2eit3mn57zye7e564fs36p2aif22w6q4qncscioxlyp4m";

const FACINGS = ["North", "South", "East", "West"];

export default function MintModal({ open, onClose, plot, onMinted }) {
  const { toast } = useToast();
  const { mint, isPending, isSuccess, isError, error, hash, reset } =
    useMintPlot();

  const [facing, setFacing] = useState(plot?.facing ?? "North");
  const [size, setSize] = useState(plot?.size ?? "50x90 ft");
  const [stage, setStage] = useState("idle"); // idle | uploading-meta | minting | done

  useEffect(() => {
    if (plot) {
      setFacing(plot.facing ?? "North");
      setSize(plot.size ?? "50x90 ft");
    }
  }, [plot]);

  useEffect(() => {
    if (!open) {
      setStage("idle");
      reset?.();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!isSuccess) return;
    setStage("done");
    toast(`Plot ${plot?.plotNumber} minted ✓`, { variant: "success" });
    onMinted?.(hash);
  }, [isSuccess, hash, plot?.plotNumber, onMinted, toast]);

  useEffect(() => {
    if (!isError) return;
    toast(error?.shortMessage ?? error?.message ?? "Mint failed", {
      variant: "error",
    });
    setStage("idle");
  }, [isError, error, toast]);

  if (!plot) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStage("uploading-meta");
      const metadata = {
        name: `Plot ${plot.id} — Paradise Valley`,
        description: `Paradise Valley. Plot #${plot.plotNumber}, ${size}, facing ${facing}.`,
        plotNumber: plot.plotNumber,
        block: plot.block,
        street: plot.street,
        size,
        facing,
        area: plot.area,
        image: `ipfs://${STANDARD_IMAGE_CID}`,
      };
      const metaRes = await fetch("/api/pinata/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const metaJson = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaJson.error || "Metadata upload failed");
      const metaCid = metaJson.cid;

      setStage("minting");
      mint({
        to: ADMIN_ADDRESS,
        tokenURI: `ipfs://${metaCid}`,
        plotId: plot.id,
      });
    } catch (err) {
      toast(err.message ?? "Upload failed", { variant: "error" });
      setStage("idle");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Mint Plot ${plot.plotNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Plot #">
            <input className="input-dark" value={plot.plotNumber} disabled />
          </Field>
          <Field label="Block">
            <input className="input-dark" value={plot.block} disabled />
          </Field>
          <Field label="Street">
            <input className="input-dark" value={plot.street} disabled />
          </Field>
          <Field label="Facing">
            <select
              className="input-dark"
              value={facing}
              onChange={(e) => setFacing(e.target.value)}
            >
              {FACINGS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size" className="col-span-2">
            <input
              className="input-dark"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </Field>
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-container p-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/pinata/metadata?cid=${STANDARD_IMAGE_CID}&raw=1`}
            alt="Plot image"
            className="w-16 h-16 rounded-md object-cover border border-outline-variant"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div>
            <p className="text-xs font-semibold text-on-surface mb-0.5">Standard Plot Image</p>
            <p className="text-[10px] text-outline font-mono break-all">{STANDARD_IMAGE_CID}</p>
          </div>
        </div>

        <ProgressLine stage={stage} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-amber inline-flex items-center gap-2"
            disabled={isPending || (stage !== "idle" && stage !== "done")}
          >
            {isPending || (stage !== "idle" && stage !== "done") ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            {stage === "done" ? "Done" : "Mint Plot"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-wider text-muted block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function ProgressLine({ stage }) {
  if (stage === "idle") return null;
  const labels = {
    "uploading-meta": "Pinning metadata to IPFS…",
    minting: "Minting on chain…",
    done: "Mint confirmed ✓",
  };
  return (
    <div className="card p-3 text-sm flex items-center gap-2">
      {stage !== "done" && <Loader2 size={14} className="animate-spin text-amber" />}
      <span className={stage === "done" ? "text-success" : "text-text"}>
        {labels[stage]}
      </span>
    </div>
  );
}
