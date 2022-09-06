import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { POLYGON_MULTISIG_ADDRESS } from "../../utils/accounts"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metaPool = await getOrNull("MuneDAIMetaPool")
  if (metaPool) {
    log(`reusing "MuneDAIMetaPool" at ${metaPool.address}`)
  } else {
    // Constructor arguments
    const TOKEN_ADDRESSES = [
      (await get("DAI")).address,
      (await get("MuneUSDPoolLPToken")).address,
    ]
    const TOKEN_DECIMALS = [18, 18]
    const LP_TOKEN_NAME = "Mune DAI/muneUSD"
    const LP_TOKEN_SYMBOL = "muneDAIUSD"
    const INITIAL_A = 100
    const SWAP_FEE = 4e6 // 4bps
    const ADMIN_FEE = 50e8

    // This is the first time deploying MetaSwap contract.
    // Next time, we can just deploy a proxy that targets this.
    await deploy("MuneDAIMetaPool", {
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
      "MuneDAIMetaPool",
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
        await get("MuneUSDPool")
      ).address,
    )

    await execute(
      "MuneDAIMetaPool",
      { from: deployer, log: true },
      "transferOwnership",
      POLYGON_MULTISIG_ADDRESS,
    )
  }

  const lpTokenAddress = (await read("MuneDAIMetaPool", "swapStorage")).lpToken
  log(`Mune DAI MetaSwap LP Token at ${lpTokenAddress}`)

  await save("MuneDAIMetaPoolLPToken", {
    abi: (await get("LPToken")).abi, // LPToken ABI
    address: lpTokenAddress,
  })
}
export default func
func.tags = ["MuneDAIMetaPool"]
func.dependencies = [
  "MuneDAIMetaPoolTokens",
  "MuneUSDPool",
  "MetaSwapUtils",
  "AmplificationUtils",
]
