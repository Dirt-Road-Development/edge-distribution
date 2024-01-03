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
  
  console.log(1);
  /** Private Key from Environment Variables */
  try {
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    console.log(2);
    /** Throw Error On Requst if No Key */
    if (PRIVATE_KEY === undefined) {
      return new Error("Missing Environment Variable");
    }
    console.log(3);
    
    /** Get Body from Json */
    let body = await request.json();
    console.log(4);
    
    /** Get SKALE Testnet Chain */
    const chain = body.chain;
    if (chain === null || chain === undefined || chain.length < 3) return new Response("Missing Chain in Body", { status: 400, headers });
    console.log(5);
    /** Get Token Address */
    const token = body.token;
    if (token === null || token === undefined || !isAddress(token)) return new Response("Missing Token in Body", { status: 400, headers });
    console.log(6);
    
    /** Get User Request Address */
    const address = body.address;
    if (address === null || address === undefined || !isAddress(address)) return new Response("Missing Address in Body", { status: 400, headers });
    
    console.log(7);
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
    console.log(8);
    
    /** Convert Private Key to Ethereum Account */
    const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY as `0x${string}` : `0x${PRIVATE_KEY}`);
    console.log(9);

    /** Generate Public & Wallet Clients for Blockchain Txs */
    const { publicClient, walletClient } = Utils.createClient(chain, account) as { publicClient: PublicClient, walletClient: WalletClient };
    console.log(10);
    
    /** Get Chain Id from Chain */
    const chainId = await publicClient.getChainId();
    console.log(11);
    
    /** Check if Valid Token by Chain */
    if (!Utils.isValidToken(token, chainId)) return new Response("Token not supported", { status: 400, headers });
    console.log(12);
    
    /** Create Contract Instance */
    const contract = getContract({
      address: getAddress(token, chainId),
      abi: Config.erc20ABI,
      publicClient
    });
    console.log(13);
    
    /** Check User Balance of Token */
    const userBalance = await contract.read.balanceOf([address]);
    console.log(14);
    /** Default Threshold for ERC-20 Token */
    const THRESHOLD = parseEther("1");
    console.log(15);
    
    /** Check if User Balance is Greater Than Threshold */
    if (userBalance > THRESHOLD) {
      return new Response("Token Balance Already Sufficient", { status: 200, headers });
    }

    console.log(16);
    
    /** Calculate Request Amount */
    let requestAmount = THRESHOLD - userBalance;
    console.log(17);
    /** Get Active Signer Balance of ERC-20 */
    const activeSignerBalance = await contract.read.balanceOf([account.address]);
    console.log(18);
    
    if (activeSignerBalance < requestAmount) {
      return new Response(
        "Request Cannot Be Completed. Out of Token",
        {
          status: 500,
          headers
        }
      );
    }
    console.log(19);
    let nonce = await publicClient.getTransactionCount({ address: account.address });
    console.log(20);
    /** Runs Contract for Gas Estimation */
    const simulationResult  = await publicClient.simulateContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "transfer",
      args: [address, requestAmount],
      nonce: nonce++,
      account
    });
    
    console.log(21);/** sFUEL Threshold */
    const SFUEL_THRESHOLD = parseEther("0.0005");
    console.log(22);
    /** ERC-20 Token Transfer Action */
    const tokenTransactionHash= await walletClient.writeContract(simulationResult.request);
    console.log(23);
    /** Get User sFUEL Balance */
    const userSFuelBalance = await publicClient.getBalance({
      address
    });
    console.log(24);
    
    /** Default Tx Hash, May be Null */
    let sfuelTxHash;
    console.log(25);
    /** Check if Balance is Lower Than Threshold */
    if (userSFuelBalance < SFUEL_THRESHOLD) {
      /** Get sFUEL Amount */
      console.log(26);
      let sfuelRequestAmount = SFUEL_THRESHOLD - userSFuelBalance;
      console.log(27);
      /** Get Signer Balance */
      const signerSFuelBalance = await publicClient.getBalance({
        address: account.address
      });
      console.log(28);
    
      /** Signer is Out of sFUEL, Return 500 */
      if (signerSFuelBalance > SFUEL_THRESHOLD) {
        console.log(29);
        const sfuelTxHash = await walletClient.sendTransaction({
          account,
          to: address as any,
          value: sfuelRequestAmount,
          chain: publicClient?.chain,
          nonce
        });
      }
      console.log(30);
    
      /** Send Transaction to Distribute sFUEL to User */
      
    }
    console.log(31);
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
  } catch (err) {
    console.log(32);
    console.log("Err: ", err);
    return new Response(JSON.stringify(err), { status: 500 });
  }
}
