import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { POLYGON_MULTISIG_ADDRESS } from "../../utils/accounts"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, get, getOrNull, log, read, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const muneUSDPoolV2 = await getOrNull("MuneUSDPoolV2")
  if (muneUSDPoolV2) {
    log(`reusing "MuneUSDPoolV2" at ${muneUSDPoolV2.address}`)
  } else {
    // Constructor arguments
    const TOKEN_ADDRESSES = [
      (await get("FRAX")).address,
      (await get("USDC")).address,
    ]
    const TOKEN_DECIMALS = [18, 6]
    const LP_TOKEN_NAME = "Mune FRAX/USDC"
    const LP_TOKEN_SYMBOL = "muneUSDv2"
    const INITIAL_A = 200
    const SWAP_FEE = 4e6 // 4bps
    const ADMIN_FEE = 50e8

    const receipt = await execute(
      "SwapDeployer",
      { from: deployer, log: true },
      "deploy",
      (
        await get("SwapFlashLoan")
      ).address,
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

    const newPoolEvent = receipt?.events?.find(
      (e: any) => e["event"] == "NewSwapPool",
    )
    const usdV2SwapAddress = newPoolEvent["args"]["swapAddress"]
    log(
      `deployed USD pool clone (targeting "SwapFlashLoan") at ${usdV2SwapAddress}`,
    )

    await save("MuneUSDPoolV2", {
      abi: (await get("SwapFlashLoan")).abi,
      address: usdV2SwapAddress,
    })

    const lpTokenAddress = (await read("MuneUSDPoolV2", "swapStorage")).lpToken
    log(`Mune USD Pool V2 LP Token at ${lpTokenAddress}`)

    await save("MuneUSDPoolV2LPToken", {
      abi: (await get("LPToken")).abi, // LPToken ABI
      address: lpTokenAddress,
    })

    // Transfer ownership to the multisig
    await execute(
      "MuneUSDPoolV2",
      { from: deployer, log: true },
      "transferOwnership",
      POLYGON_MULTISIG_ADDRESS,
    )
  }
}
export default func
func.tags = ["MuneUSDPoolV2"]
func.dependencies = [
  "SwapUtils",
  "SwapDeployer",
  "SwapFlashLoan",
  "USDPoolTokensV2",
]
