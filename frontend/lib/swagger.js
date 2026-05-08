// OpenAPI 3.0 specification for PlotChain API routes.
// Consumed by app/api-docs/page.jsx via swagger-ui-react.

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "PlotChain API",
    version: "1.0.0",
    description:
      "Server-side API routes for PlotChain — on-chain real estate marketplace for Paradise Valley. " +
      "All contract reads target the Sepolia testnet. All prices are in wei unless noted.",
    contact: { name: "PlotChain", email: "ali.shan@chaingpt.tech" },
  },
  servers: [
    { url: "/", description: "This server" },
  ],
  tags: [
    { name: "Pinata",    description: "IPFS metadata operations via Pinata gateway" },
    { name: "Plots",     description: "On-chain plot data — reads from Sepolia via viem" },
    { name: "Roles",     description: "Role lookups against RoleManager contract" },
  ],
  paths: {

    // ── Pinata ────────────────────────────────────────────────────────────

    "/api/pinata/upload": {
      post: {
        tags: ["Pinata"],
        summary: "Upload plot metadata to Pinata IPFS",
        description:
          "Accepts a multipart form with a plot image and metadata fields. " +
          "Pins the image first, then pins the metadata JSON that references the image CID. " +
          "Returns the metadata CID to be used as the NFT tokenURI. " +
          "**Server-side only** — requires `PINATA_JWT` environment variable.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image", "plotNumber", "street"],
                properties: {
                  image:       { type: "string", format: "binary",  description: "Plot image file (JPEG/PNG/WebP)" },
                  plotNumber:  { type: "integer", example: 12,       description: "Human-readable plot number (1–24)" },
                  block:       { type: "integer", example: 1,        description: "Block number (always 1 for Paradise Valley)" },
                  size:        { type: "string",  example: "50x90 ft", description: "Plot dimensions" },
                  street:      { type: "string",  example: "Street 7", description: "Street name/number" },
                  facing:      { type: "string",  example: "North",  description: "Plot facing direction" },
                  isCorner:    { type: "string",  example: "false",  description: "\"true\" if this is a corner plot" },
                  area:        { type: "string",  example: "1 Kanal", description: "Area description" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Metadata pinned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    cid:      { type: "string", example: "QmXyZ123...", description: "IPFS CID of the pinned metadata JSON" },
                    imageCID: { type: "string", example: "QmAbC456...", description: "IPFS CID of the pinned image" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/pinata/metadata/{cid}": {
      get: {
        tags: ["Pinata"],
        summary: "Fetch plot metadata from IPFS",
        description:
          "Retrieves and normalises plot metadata JSON from the configured Pinata gateway. " +
          "Response is cached for 24 hours (Next.js `revalidate: 86400`).",
        parameters: [
          {
            name: "cid",
            in: "path",
            required: true,
            description: "IPFS Content Identifier (CID) of the metadata JSON",
            schema: { type: "string", example: "QmXyZ123abc..." },
          },
        ],
        responses: {
          200: {
            description: "Metadata object",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PlotMetadata" },
              },
            },
          },
          502: {
            description: "Pinata gateway returned a non-OK status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // ── Plots ─────────────────────────────────────────────────────────────

    "/api/plots": {
      get: {
        tags: ["Plots"],
        summary: "All 24 plots with on-chain status",
        description:
          "Scans `Transfer`, `PlotListed`, `PlotDelisted`, and `PlotSold` events from the Sepolia deployment " +
          "to determine the current owner and listing status of every plot. Static layout data (street, facing, etc.) " +
          "is merged from `lib/sectorLayout.js`. Slow on cold cache — results are computed at request time.",
        responses: {
          200: {
            description: "Array of all plots",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/PlotStatus" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    "/api/plots/{tokenId}": {
      get: {
        tags: ["Plots"],
        summary: "Single plot — full detail with ownership history",
        description:
          "Returns the current owner, tokenURI, active listing (if any), and full on-chain ownership history " +
          "reconstructed from `Transfer` and `PlotSold` events. TokenId equals the Paradise Valley plot number.",
        parameters: [
          {
            name: "tokenId",
            in: "path",
            required: true,
            description: "Plot token ID / plot number (integer 1–24)",
            schema: { type: "integer", example: 42 },
          },
        ],
        responses: {
          200: {
            description: "Plot detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PlotDetail" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // ── Roles ─────────────────────────────────────────────────────────────

    "/api/roles/{address}": {
      get: {
        tags: ["Roles"],
        summary: "Check roles for a wallet address",
        description:
          "Calls `isAdmin` and `isDealer` on the deployed `RoleManager` contract on Sepolia " +
          "for the given wallet address. Returns both flags in one response.",
        parameters: [
          {
            name: "address",
            in: "path",
            required: true,
            description: "Ethereum wallet address (checksummed or lowercase)",
            schema: { type: "string", example: "0xAbCd1234AbCd1234AbCd1234AbCd1234AbCd1234" },
          },
        ],
        responses: {
          200: {
            description: "Role flags for the address",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RoleInfo" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
  },

  components: {
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Something went wrong" },
        },
      },

      PlotMetadata: {
        type: "object",
        properties: {
          name:       { type: "string",  example: "Plot PV-12" },
          plotNumber: { type: "integer", example: 12 },
          size:       { type: "string",  example: "50x90 ft" },
          street:     { type: "string",  example: "Street A" },
          facing:     { type: "string",  example: "North" },
          imageUrl:   { type: "string",  example: "ipfs://QmAbC456..." },
        },
      },

      PlotStatus: {
        type: "object",
        properties: {
          plotNumber: { type: "integer", example: 12 },
          id:         { type: "string",  example: "PV-12" },
          block:      { type: "integer", example: 1 },
          size:       { type: "string",  example: "50x90 ft" },
          street:     { type: "string",  example: "Street 7" },
          facing:     { type: "string",  example: "North" },
          isCorner:   { type: "boolean", example: false },
          tradeable:  { type: "boolean", example: true },
          status:     { type: "string",  enum: ["available", "listed", "sold"], example: "listed" },
          owner:      { type: "string",  nullable: true, example: "0xAbCd1234..." },
          priceWei:   { type: "string",  nullable: true, example: "1000000000000000000", description: "Listing price in wei (null if not listed)" },
        },
      },

      PlotDetail: {
        type: "object",
        properties: {
          tokenId:  { type: "integer", example: 42 },
          owner:    { type: "string",  nullable: true, example: "0xAbCd1234..." },
          tokenURI: { type: "string",  nullable: true, example: "ipfs://QmXyZ123..." },
          listing: {
            nullable: true,
            type: "object",
            properties: {
              seller:   { type: "string",  example: "0xAbCd1234..." },
              priceWei: { type: "string",  example: "1000000000000000000" },
              isActive: { type: "boolean", example: true },
              listedAt: { type: "string",  example: "1715000000", description: "Unix timestamp of listing" },
            },
          },
          history: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from:        { type: "string", example: "0x000...0000" },
                to:          { type: "string", example: "0xAbCd1234..." },
                txHash:      { type: "string", example: "0xdeadbeef..." },
                blockNumber: { type: "string", example: "6800000" },
                price:       { type: "string", nullable: true, example: "1000000000000000000" },
                commission:  { type: "string", nullable: true, example: "20000000000000000" },
              },
            },
          },
        },
      },

      RoleInfo: {
        type: "object",
        properties: {
          address:  { type: "string",  example: "0xAbCd1234..." },
          isAdmin:  { type: "boolean", example: false },
          isDealer: { type: "boolean", example: true },
        },
      },
    },

    responses: {
      BadRequest: {
        description: "Invalid request parameters",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ServerError: {
        description: "Internal server error or RPC failure",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
};
