"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther, isAddress, parseAbiItem } from "viem";
import { usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Loader2, Plus, Trash2, Wallet, Layers, ListOrdered, Coins } from "lucide-react";

import RoleGuard from "@/components/RoleGuard";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import AddressPill, { TxLink } from "@/components/AddressPill";
import MintModal from "@/components/MintModal";
import { PlotThumb } from "@/components/PlotCard";
import { useToast } from "@/components/Toaster";

import { PLOTS } from "@/lib/sectorLayout";
import { usePlotOwners, useTotalSupply, usePlotTokenURI, useUpdateTokenURI } from "@/hooks/usePlotNFT";
import {
  useGlobalEvents,
} from "@/hooks/usePlotHistory";
import {
  ROLE_MANAGER_ABI,
  ROLE_MANAGER_ADDRESS,
  DEPLOYMENT_BLOCK,
} from "@/constants/contracts";
import { useCommissionRate } from "@/hooks/useMarketplace";
import { track, PH_EVENTS } from "@/hooks/usePostHog";

const TOKEN_IDS = PLOTS.map((p) => p.plotNumber);

export default function AdminPage() {
  return (
    <RoleGuard role="admin">
      <AdminDashboard />
    </RoleGuard>
  );
}

function AdminDashboard() {
  const { totalSupply } = useTotalSupply();
  const { owners, refetch: refetchOwners } = usePlotOwners(TOKEN_IDS);
  const { sold, listed, delisted, refetch: refetchEvents } = useGlobalEvents();
  const commissionRate = useCommissionRate();

  // Listing count = listed - delisted - sold (per tokenId set arithmetic).
  const activeListingCount = useMemo(() => {
    const set = new Set();
    listed.forEach((l) => set.add(String(l.tokenId)));
    [...sold, ...delisted].forEach((l) => set.delete(String(l.tokenId)));
    return set.size;
  }, [listed, sold, delisted]);

  const totalCommission = useMemo(
    () => sold.reduce((acc, e) => acc + (e.commission ?? 0n), 0n),
    [sold]
  );

  const [mintTarget, setMintTarget] = useState(null);

  return (
    <div className="px-4 sm:px-6 py-8 max-w-7xl mx-auto space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-amber font-medium mb-1">
          Admin
        </p>
        <h1 className="text-3xl font-semibold">Control Center</h1>
        <p className="text-muted text-sm mt-1">
          Mint plots, manage dealers, monitor commission.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Plots Minted"
          value={`${totalSupply} / ${PLOTS.length}`}
          icon={<Layers size={18} />}
        />
        <StatCard
          label="Active Listings"
          value={activeListingCount}
          icon={<ListOrdered size={18} />}
        />
        <StatCard
          label="Total Commission"
          value={`${formatEther(totalCommission)} ETH`}
          sub={
            commissionRate != null ? `${commissionRate / 100}% rate` : undefined
          }
          icon={<Coins size={18} />}
        />
        <StatCard
          label="Total Transactions"
          value={sold.length}
          icon={<Wallet size={18} />}
        />
      </div>

      <section>
        <SectionHeader title="Mint Plots" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {PLOTS.map((plot) => {
            const owner = owners[plot.plotNumber];
            const minted = Boolean(owner);
            return (
              <div
                key={plot.plotNumber}
                className="card p-3 flex flex-col items-center gap-2"
              >
                <PlotThumb tokenId={plot.plotNumber} size={88} rounded="rounded-lg" />
                <p className="text-xs uppercase tracking-wider text-muted">
                  Plot
                </p>
                <p className="text-2xl font-semibold">{plot.plotNumber}</p>
                {minted ? (
                  <>
                    <StatusBadge status="Owned" />
                    <AddressPill address={owner} />
                  </>
                ) : (
                  <>
                    <StatusBadge status="Unminted" />
                    <button
                      className="btn-amber w-full text-xs"
                      onClick={() => setMintTarget(plot)}
                    >
                      Mint
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <UpdateTokenURISection />

      <DealerManager />

      <section>
        <SectionHeader title="Transaction Log" />
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-muted text-xs uppercase tracking-wider">
              <tr>
                <Th>Plot</Th>
                <Th>Seller</Th>
                <Th>Buyer</Th>
                <Th>Price</Th>
                <Th>Commission</Th>
                <Th>Date</Th>
                <Th>Tx</Th>
              </tr>
            </thead>
            <tbody>
              {sold.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {sold.map((s, i) => (
                <tr
                  key={`${s.txHash}-${s.logIndex}-${i}`}
                  className="border-t border-border"
                >
                  <Td>
                    <div className="flex items-center gap-2">
                      <PlotThumb tokenId={Number(s.tokenId)} size={36} />
                      <span>#{Number(s.tokenId)}</span>
                    </div>
                  </Td>
                  <Td>
                    <AddressPill address={s.seller} showEtherscan={false} />
                  </Td>
                  <Td>
                    <AddressPill address={s.buyer} showEtherscan={false} />
                  </Td>
                  <Td>
                    <span className="text-amber">
                      {formatEther(s.price)} ETH
                    </span>
                  </Td>
                  <Td>{formatEther(s.commission)} ETH</Td>
                  <Td>
                    {s.timestamp
                      ? new Date(s.timestamp * 1000).toLocaleDateString()
                      : "—"}
                  </Td>
                  <Td>
                    <TxLink hash={s.txHash} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionHeader title="Commission" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Current Rate"
            value={
              commissionRate != null
                ? `${commissionRate / 100}%`
                : "—"
            }
            sub="Set at deploy time"
          />
          <StatCard
            label="Total Earned"
            value={`${formatEther(totalCommission)} ETH`}
            sub={`Across ${sold.length} sales`}
          />
        </div>
      </section>

      <MintModal
        open={Boolean(mintTarget)}
        onClose={() => setMintTarget(null)}
        plot={mintTarget}
        onMinted={() => {
          setMintTarget(null);
          refetchOwners?.();
          refetchEvents?.();
        }}
      />
    </div>
  );
}

function UpdateTokenURISection() {
  const { toast } = useToast();
  const [tokenId, setTokenId] = useState("");
  const [uriInput, setUriInput] = useState("");
  const { tokenURI: currentURI } = usePlotTokenURI(tokenId ? Number(tokenId) : null);
  const update = useUpdateTokenURI();

  useEffect(() => {
    if (update.isSuccess) {
      toast("Token URI updated ✓", { variant: "success" });
      update.reset?.();
      setUriInput("");
    }
    if (update.isError) {
      toast(update.error?.shortMessage ?? "Update failed", { variant: "error" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update.isSuccess, update.isError]);

  const finalUri = uriInput.startsWith("ipfs://") ? uriInput : uriInput ? `ipfs://${uriInput}` : "";

  return (
    <section>
      <SectionHeader title="Update Token URI" />
      <div className="card p-5 space-y-4">
        <p className="text-sm text-muted">
          Replace the on-chain tokenURI for a minted plot. Pin corrected metadata to Pinata first, then paste the CID or full{" "}
          <span className="font-mono text-xs">ipfs://</span> URI below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted block mb-1">
              Plot #
            </span>
            <select
              className="input-dark"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            >
              <option value="">Select plot…</option>
              {PLOTS.map((p) => (
                <option key={p.plotNumber} value={p.plotNumber}>
                  #{p.plotNumber} — {p.id}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[10px] uppercase tracking-wider text-muted block mb-1">
              New IPFS URI or CID
            </span>
            <input
              className="input-dark font-mono text-xs"
              placeholder="ipfs://bafybei… or just the CID"
              value={uriInput}
              onChange={(e) => setUriInput(e.target.value)}
            />
          </label>
        </div>
        {tokenId && currentURI && (
          <div className="text-xs space-y-0.5">
            <span className="text-muted uppercase tracking-wider">Current URI: </span>
            <span className="font-mono break-all text-outline">{currentURI}</span>
          </div>
        )}
        {finalUri && (
          <div className="text-xs space-y-0.5">
            <span className="text-muted uppercase tracking-wider">New URI preview: </span>
            <span className="font-mono break-all text-amber">{finalUri}</span>
          </div>
        )}
        <button
          className="btn-amber inline-flex items-center gap-2"
          disabled={!tokenId || !finalUri || update.isPending}
          onClick={() => update.run({ tokenId: Number(tokenId), uri: finalUri })}
        >
          {update.isPending && <Loader2 size={14} className="animate-spin" />}
          Update Token URI
        </button>
      </div>
    </section>
  );
}

function SectionHeader({ title }) {
  return (
    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <span className="w-1 h-5 bg-amber rounded-full" />
      {title}
    </h2>
  );
}

function Th({ children }) {
  return <th className="text-left p-3 font-medium">{children}</th>;
}
function Td({ children }) {
  return <td className="p-3 align-middle">{children}</td>;
}

const DEALER_ADDED_EVENT = parseAbiItem(
  "event DealerAdded(address indexed dealer)"
);
const DEALER_REMOVED_EVENT = parseAbiItem(
  "event DealerRemoved(address indexed dealer)"
);

function DealerManager() {
  const client = usePublicClient();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!client) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const [added, removed] = await Promise.all([
          client.getLogs({
            address: ROLE_MANAGER_ADDRESS,
            event: DEALER_ADDED_EVENT,
            fromBlock: DEPLOYMENT_BLOCK,
          }),
          client.getLogs({
            address: ROLE_MANAGER_ADDRESS,
            event: DEALER_REMOVED_EVENT,
            fromBlock: DEPLOYMENT_BLOCK,
          }),
        ]);
        const map = new Map();
        added.forEach((l) =>
          map.set(l.args.dealer.toLowerCase(), {
            address: l.args.dealer,
            blockNumber: l.blockNumber,
          })
        );
        removed.forEach((l) => map.delete(l.args.dealer.toLowerCase()));
        if (alive) setDealers([...map.values()]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [client, reload]);

  const add = useWriteContract();
  const remove = useWriteContract();
  const addReceipt = useWaitForTransactionReceipt({ hash: add.data });
  const remReceipt = useWaitForTransactionReceipt({ hash: remove.data });

  useEffect(() => {
    if (addReceipt.isSuccess) {
      toast("Dealer added ✓", { variant: "success" });
      track(PH_EVENTS.DEALER_ADDED, { hash: add.data });
      setInput("");
      setReload((r) => r + 1);
    }
    if (remReceipt.isSuccess) {
      toast("Dealer removed ✓", { variant: "success" });
      track(PH_EVENTS.DEALER_REMOVED, { hash: remove.data });
      setReload((r) => r + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addReceipt.isSuccess, remReceipt.isSuccess]);

  useEffect(() => {
    if (add.error)
      toast(add.error.shortMessage ?? add.error.message, { variant: "error" });
    if (remove.error)
      toast(remove.error.shortMessage ?? remove.error.message, {
        variant: "error",
      });
  }, [add.error, remove.error, toast]);

  const handleAdd = () => {
    if (!isAddress(input)) {
      toast("Invalid address", { variant: "error" });
      return;
    }
    add.writeContract({
      abi: ROLE_MANAGER_ABI,
      address: ROLE_MANAGER_ADDRESS,
      functionName: "addDealer",
      args: [input],
    });
  };

  const handleRemove = (addr) => {
    remove.writeContract({
      abi: ROLE_MANAGER_ABI,
      address: ROLE_MANAGER_ADDRESS,
      functionName: "removeDealer",
      args: [addr],
    });
  };

  return (
    <section>
      <SectionHeader title="Dealer Management" />
      <div className="card p-4 mb-3 flex gap-2">
        <input
          className="input-dark flex-1"
          placeholder="0x… dealer address"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="btn-amber inline-flex items-center gap-1.5"
          onClick={handleAdd}
          disabled={add.isPending || addReceipt.isLoading}
        >
          {add.isPending || addReceipt.isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Add Dealer
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-muted text-xs uppercase tracking-wider">
            <tr>
              <Th>Address</Th>
              <Th>Added at block</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted">
                  Loading dealers…
                </td>
              </tr>
            )}
            {!loading && dealers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted">
                  No dealers yet.
                </td>
              </tr>
            )}
            {dealers.map((d) => (
              <tr key={d.address} className="border-t border-border">
                <Td>
                  <AddressPill address={d.address} />
                </Td>
                <Td className="font-mono">{Number(d.blockNumber)}</Td>
                <Td>
                  <button
                    className="btn-ghost text-xs inline-flex items-center gap-1 text-danger border-danger/40"
                    onClick={() => handleRemove(d.address)}
                    disabled={remove.isPending || remReceipt.isLoading}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
