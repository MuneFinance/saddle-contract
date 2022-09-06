import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metaPool = await getOrNull("MuneUSDTMetaPool")
  if (metaPool) {
    log(`reusing "MuneUSDTMetaPool" at ${metaPool.address}`)
  } else {
    // Constructor arguments
    const TOKEN_ADDRESSES = [
      (await get("USDT")).address,
      (await get("MuneUSDPoolV2LPToken")).address,
    ]
    const TOKEN_DECIMALS = [6, 18]
    const LP_TOKEN_NAME = "Mune USDT/muneUSD"
    const LP_TOKEN_SYMBOL = "muneUSDTUSD"
    const INITIAL_A = 100
    const SWAP_FEE = 4e6 // 4bps
    const ADMIN_FEE = 50e8

    // This is the first time deploying MetaSwap contract.
    // Next time, we can just deploy a proxy that targets this.
    await deploy("MuneUSDTMetaPool", {
      from: deployer,
      log: true,
      contract: "MetaSwap",
      skipIfAlreadyDeployed: true,
      libraries: {
        SwapUtils: (await get("SwapUtils")).address,
        MetaSwapUtils: (await get("MetaSwapUtils")).address,
        AmplificationUtils: (await get("AmplificationUtils")).address,
      },
    })

    await execute(
      "MuneUSDTMetaPool",
      {
        from: deployer,
        log: true,
      },
      "initializeMetaSwap",
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
      (
        await get("MuneUSDPoolV2")
      ).address,
    )
  }

  const lpTokenAddress = (await read("MuneUSDTMetaPool", "swapStorage")).lpToken
  log(`Mune USDT MetaSwap LP Token at ${lpTokenAddress}`)

  await save("MuneUSDTMetaPoolLPToken", {
    abi: (await get("LPToken")).abi, // LPToken ABI
    address: lpTokenAddress,
  })
}
export default func
func.tags = ["MuneUSDTMetaPool"]
func.dependencies = [
  "MuneUSDTMetaPoolTokens",
  "MuneUSDPoolV2",
  "MetaSwapUtils",
  "AmplificationUtils",
]
