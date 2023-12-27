import { Config } from "../config";

export default function isValidToken(address: string, chainId: number) : boolean {
  return Config.tokenList[chainId.toString()].includes(address);
}
