import {
  Chain,
  createPublicClient,
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
import {
  erc20ABI
} from "wagmi";

const headers = {
  'content-type': 'application/json',
};

export const config = {
  runtime: "edge",
};
 
const createClient = (chain: string) => {
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

  return createPublicClient({
    chain: selectedChain,
    transport: webSocket(selectedChain.rpcUrls.public.webSocket![0])
  });
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

  let body = await request.json();

  const chain = body.chain;
  const token = body.token;
  const address = body.address;
  
  if (!["calypso", "chaos", "europa", "nebula", "titan"].includes(chain)) {
    throw new Response(
      "Invalid Chain Name",
      {
        status: 400,
        headers 
      }
    );
  }
  
  const client = createClient(chain);
  const chainId = await client.getChainId();

  if (!isValidToken(token, chainId)) throw new Response("Token not supported", { status: 400, headers });

  const contract = getContract({
    address: getAddress(address, chainId),
    abi: erc20ABI,
    publicClient: client
  });

  const userBalance = await contract.read.balanceOf(address);
  const THRESHOLD = parseEther("1");

  if (userBalance > THRESHOLD) {
    await contract.
  }
  

 
  return new Response(
    "Success",
    {
      status: 200,
      headers
    },
  );
}
