import {
  Account,
  Chain,
  createPublicClient,
  createWalletClient,
  getAddress,
  getContract,
  parseEther,
  webSocket
} from "viem";
import {
  skaleCalypsoTestnet,
  skaleChaosTestnet,
  skaleEuropaTestnet,
  skaleTitanTestnet
} from "viem/chains";
import {
  privateKeyToAccount
} from "viem/accounts";

/** Thank you to Wagmi for this ABI */
const erc20ABI = [
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      {
        indexed: true,
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'spender',
        type: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      {
        name: 'account',
        type: 'address',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
  },
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'recipient',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
  },
  {
    type: 'function',
    name: 'transferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'sender',
        type: 'address',
      },
      {
        name: 'recipient',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
  },
] as const;

const headers = {
  'content-type': 'application/json',
};

export const config = {
  runtime: "edge",
};
 
const createClient = (chain: string, account: `0x${string}` | Account) => {
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
      selectedChain = skaleEuropaTestnet;
      break;
    case "titan":
      selectedChain = skaleTitanTestnet;
      break;
  }

  if (selectedChain === undefined) throw new Error("Invalid Chain");

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

const isValidToken = (address: string, chainId: number) : boolean => {
  
  const tokenList: {[key: string]: string[]}  = {
    "344106930": ["0x7E1B8750C21AebC3bb2a0bDf40be104C609a9852", "0x49c37d0Bb6238933eEe2157e9Df417fd62723fF"],
    "476158412": [
      "0xbA1E9BA7CDd4815Da6a51586bE56e8643d1bEAb6",
      "0xf06De9214B1Db39fFE9db2AebFA74E52f1e46e39",
      "0x3595E2f313780cb2f23e197B8e297066fd410d30",
      "0xe0E2cb3A5d6f94a5bc2D00FAa3e64460A9D241E1",
      "0xa388F9783d8E5B0502548061c3b06bf4300Fc0E1",
      "0x5d42495D417fcd9ECf42F3EA8a55FcEf44eD9B33",
      "0xf5E880E1066DDc90471B9BAE6f183D5344fd289F"
    ],
    "503129905": [
      "0x7F73B66d4e6e67bCdeaF277b9962addcDabBFC4d",
      "0x717d43399ab3a8aada669CDC9560a6BAfdeA9796"
    ],
    "1351057110": [
      "0x08f98Af60eb83C18184231591A8F89577E46A4B9",
      "0x082081c8E607ca6C1c53aC093cAb3847ED59C0b0"
    ],
  };

  return tokenList[chainId.toString()].includes(address);

}

export default async function handler(request: Request) {
  
  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (PRIVATE_KEY === undefined) {
    throw new Error("Missing Environment Variable");
  }

  let body = await request.json();

  const chain = body.chain;
  if (!chain) throw new Response("Missing Chain in Body", { status: 400, headers });

  const token = body.token;
  if (!token) throw new Response("Missing Token in Body", { status: 400, headers });

  const address = body.address;
  if (!address) throw new Response("Missing Address in Body", { status: 400, headers });
  
  if (!["calypso", "chaos", "europa", "nebula", "titan"].includes(chain)) {
    throw new Response(
      "Invalid Chain Name",
      {
        status: 400,
        headers 
      }
    );
  }
  
  const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY as `0x${string}` : `0x${PRIVATE_KEY}`);
  const { publicClient, walletClient } = createClient(chain, account);
  const chainId = await publicClient.getChainId();

  if (!isValidToken(token, chainId)) throw new Response("Token not supported", { status: 400, headers });

  const contract = getContract({
    address: getAddress(token, chainId),
    abi: erc20ABI,
    publicClient
  });

  const userBalance = await contract.read.balanceOf(address);
  const THRESHOLD = parseEther("1");

  if (userBalance > THRESHOLD) {
    return new Response("Token Balance Already Sufficient", { status: 200, headers });
  }

  let requestAmount = THRESHOLD - userBalance;
  const activeSignerBalance = await contract.read.balanceOf(account.address as any);

  if (activeSignerBalance < requestAmount) requestAmount = activeSignerBalance;

  const simulationResult  = await publicClient.simulateContract({
    address: contract.address,
    abi: contract.abi,
    functionName: "transfer",
    args: [address, requestAmount],
    account
  });
  const SFUEL_THRESHOLD = parseEther("0.0005");

  const tokenTransactionHash= await walletClient.writeContract(simulationResult.request);
  const userSFuelBalance = await publicClient.getBalance(address);
  
  let sfuelTxHash;
  if (userSFuelBalance < SFUEL_THRESHOLD) {
    let sfuelRequestAmount = SFUEL_THRESHOLD - userSFuelBalance;

    const signerSFuelBalance = await publicClient.getBalance(account.address as any);
    if (signerSFuelBalance < SFUEL_THRESHOLD) throw new Response("Signer Out of sFUEL on " + publicClient.chain.name, { status: 500, headers });

    await walletClient.sendTransaction({
      to: address,
      value: sfuelRequestAmount
    });
  }

 
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
