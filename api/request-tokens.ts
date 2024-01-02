import {
  PublicClient,
  WalletClient,
  getAddress,
  getContract,
  isAddress,
  parseEther,
} from "viem";
import {
  privateKeyToAccount
} from "viem/accounts";
import { Config } from "../config";
import { Utils } from "../utils";

/** Stored Vercel Headers Here */
const headers = {
  'content-type': 'application/json',
};

/** Verquired for Vercel */
export const config = {
  runtime: "edge",
};
 
export default async function handler(request: Request) {
  
  /** Private Key from Environment Variables */
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  
  /** Throw Error On Requst if No Key */
  if (PRIVATE_KEY === undefined) {
    return new Error("Missing Environment Variable");
  }
  
  /** Get Body from Json */
  let body = await request.json();
  
  /** Get SKALE Testnet Chain */
  const chain = body.chain;
  if (chain === null || chain === undefined || chain.length < 3) return new Response("Missing Chain in Body", { status: 400, headers });
  
  /** Get Token Address */
  const token = body.token;
  if (token === null || token === undefined || !isAddress(token)) return new Response("Missing Token in Body", { status: 400, headers });
  
  /** Get User Request Address */
  const address = body.address;
  if (address === null || address === undefined || !isAddress(address)) return new Response("Missing Address in Body", { status: 400, headers });
  
  /** Check for Valid Testnet Chain */
  if (!["calypso", "chaos", "europa", "nebula", "titan"].includes(chain)) {
    return new Response(
      "Invalid Chain Name",
      {
        status: 400,
        headers 
      }
    );
  }
  
  /** Convert Private Key to Ethereum Account */
  const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY as `0x${string}` : `0x${PRIVATE_KEY}`);

  /** Generate Public & Wallet Clients for Blockchain Txs */
  const { publicClient, walletClient } = Utils.createClient(chain, account) as { publicClient: PublicClient, walletClient: WalletClient };
  
  /** Get Chain Id from Chain */
  const chainId = await publicClient.getChainId();
  
  /** Check if Valid Token by Chain */
  if (!Utils.isValidToken(token, chainId)) return new Response("Token not supported", { status: 400, headers });
  
  /** Create Contract Instance */
  const contract = getContract({
    address: getAddress(token, chainId),
    abi: Config.erc20ABI,
    publicClient
  });
  
  /** Check User Balance of Token */
  const userBalance = await contract.read.balanceOf([address]);

  /** Default Threshold for ERC-20 Token */
  const THRESHOLD = parseEther("1");
  
  /** Check if User Balance is Greater Than Threshold */
  if (userBalance > THRESHOLD) {
    return new Response("Token Balance Already Sufficient", { status: 200, headers });
  }
  
  /** Calculate Request Amount */
  let requestAmount = THRESHOLD - userBalance;

  /** Get Active Signer Balance of ERC-20 */
  const activeSignerBalance = await contract.read.balanceOf([account.address]);
  
  if (activeSignerBalance === BigInt(0)) {
    return new Response(
      "Request Cannot Be Completed. Out of Token",
      {
        status: 500,
        headers
      }
    );
  }

  /** Check for Active Signer Balance **/
  if (activeSignerBalance < requestAmount) requestAmount = activeSignerBalance;

  let nonce = await publicClient.getTransactionCount({ address: account.address });

  /** Runs Contract for Gas Estimation */
  const simulationResult  = await publicClient.simulateContract({
    address: contract.address,
    abi: contract.abi,
    functionName: "transfer",
    args: [address, requestAmount],
    nonce: nonce++,
    account
  });
  
  /** sFUEL Threshold */
  const SFUEL_THRESHOLD = parseEther("0.0005");
  
  /** ERC-20 Token Transfer Action */
  const tokenTransactionHash= await walletClient.writeContract(simulationResult.request);

  /** Get User sFUEL Balance */
  const userSFuelBalance = await publicClient.getBalance({
    address
  });
  
  /** Default Tx Hash, May be Null */
  let sfuelTxHash;

  /** Check if Balance is Lower Than Threshold */
  if (userSFuelBalance < SFUEL_THRESHOLD) {
    /** Get sFUEL Amount */
    let sfuelRequestAmount = SFUEL_THRESHOLD - userSFuelBalance;
  
    /** Get Signer Balance */
    const signerSFuelBalance = await publicClient.getBalance({
      address: account.address
    });
  
    /** Signer is Out of sFUEL, Return 500 */
    if (signerSFuelBalance < SFUEL_THRESHOLD) return new Response("Signer Out of sFUEL on " + publicClient?.chain?.name, { status: 500, headers });
  
    /** Send Transaction to Distribute sFUEL to User */
    await walletClient.sendTransaction({
      account,
      to: address as any,
      value: sfuelRequestAmount,
      chain: publicClient?.chain,
      nonce
    });
  }

  /** Return Response */
  return new Response(
    JSON.stringify({
      message: "Success",
      transactions: {
        token: tokenTransactionHash,
        sfuel: sfuelTxHash
      } 
    }),
    {
      status: 200,
      headers
    },
  );
}
