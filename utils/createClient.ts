import { Account, Chain, createPublicClient, createWalletClient, webSocket } from "viem";
import {
  skaleCalypsoTestnet,
  skaleChaosTestnet,
  skaleEuropaTestnet,
  skaleNebulaTestnet,
  skaleTitanTestnet
} from "viem/chains";

export default function createClient(chain: string, account: `0x${string}` | Account) {
  let selectedChain: Chain | undefined = undefined;

  switch (chain) {
    case "calypso":
      selectedChain = skaleCalypsoTestnet;
      break;
    case "chaos":
      selectedChain = skaleChaosTestnet;
      break;
    case "europa":
      selectedChain = skaleEuropaTestnet;
      break;
    case "nebula":
      selectedChain = skaleNebulaTestnet;
      break;
    case "titan":
      selectedChain = skaleTitanTestnet;
      break;
  }

  if (selectedChain === undefined) return new Error("Invalid Chain");

  const publicClient = createPublicClient({
    chain: selectedChain,
    transport: webSocket(selectedChain.rpcUrls.public.webSocket![0]),
  });

  const walletClient = createWalletClient({
    chain: selectedChain,
    transport: webSocket(selectedChain.rpcUrls.public.webSocket![0]),
    account
  });

  return { publicClient, walletClient };
}
