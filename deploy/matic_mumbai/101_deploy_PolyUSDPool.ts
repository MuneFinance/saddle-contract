import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { POLYGON_MULTISIG_ADDRESS } from "../../utils/accounts"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const muneUSDPool = await getOrNull("MuneUSDPool")
  if (muneUSDPool) {
    log(`reusing "MuneUSDPool" at ${muneUSDPool.address}`)
  } else {
    // Constructor arguments
    const TOKEN_ADDRESSES = [
      (await get("DAI")).address,
      (await get("USDC")).address,
      (await get("USDT")).address,
    ]
    const TOKEN_DECIMALS = [18, 6, 6]
    const LP_TOKEN_NAME = "Mune DAI/USDC/USDT"
    const LP_TOKEN_SYMBOL = "muneUSD"
    const INITIAL_A = 200
    const SWAP_FEE = 4e6 // 4bps
    const ADMIN_FEE = 50e8

    // Since this will be the first pool on Polygon, we initialize the target contract.
    await execute(
      "SwapFlashLoan",
      { from: deployer, log: true },
      "initialize",
      TOKEN_ADDRESSES,
      TOKEN_DECIMALS,
      LP_TOKEN_NAME,
      LP_TOKEN_SYMBOL,
      INITIAL_A,
      SWAP_FEE,
      ADMIN_FEE,
      (
        await get("LPToken")
      ).address,
    )

    await save("MuneUSDPool", {
      abi: (await get("SwapFlashLoan")).abi,
      address: (await get("SwapFlashLoan")).address,
    })

    const lpTokenAddress = (await read("MuneUSDPool", "swapStorage")).lpToken
    log(`Mune USD Pool LP Token at ${lpTokenAddress}`)

    await save("MuneUSDPoolLPToken", {
      abi: (await get("LPToken")).abi, // LPToken ABI
      address: lpTokenAddress,
    })

    // Transfer ownership to the multisig
    await execute(
      "MuneUSDPool",
      { from: deployer, log: true },
      "transferOwnership",
      POLYGON_MULTISIG_ADDRESS,
    )
  }
}
export default func
func.tags = ["MuneUSDPool"]
func.dependencies = ["SwapUtils", "SwapFlashLoan", "USDPoolTokens"]
