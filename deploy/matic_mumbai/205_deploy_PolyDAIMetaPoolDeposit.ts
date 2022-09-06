import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metaPoolDeposit = await getOrNull("MuneDAIMetaPoolDeposit")
  if (metaPoolDeposit) {
    log(`reusing "MuneDAIMetaPoolDeposit" at ${metaPoolDeposit.address}`)
  } else {
    // This is the first time deploying MetaSwapDeposit contract.
    // Next time, we can just deploy a proxy that targets this.
    await deploy("MuneDAIMetaPoolDeposit", {
      from: deployer,
      log: true,
      contract: "MetaSwapDeposit",
      skipIfAlreadyDeployed: true,
    })

    await execute(
      "MuneDAIMetaPoolDeposit",
      { from: deployer, log: true },
      "initialize",
      (
        await get("MuneUSDPoolV2")
      ).address,
      (
        await get("MuneDAIMetaPool")
      ).address,
      (
        await get("MuneDAIMetaPoolLPToken")
      ).address,
    )
  }
}
export default func
func.tags = ["MuneDAIMetaPoolDeposit"]
func.dependencies = ["MuneDAIMetaPoolTokens", "MuneDAIMetaPool"]
