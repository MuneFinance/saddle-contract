import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metaPoolDeposit = await getOrNull("MuneFRAXMetaPoolDeposit")
  if (metaPoolDeposit) {
    log(`reusing "MuneFRAXMetaPoolDeposit" at ${metaPoolDeposit.address}`)
  } else {
    // This is the first time deploying MetaSwapDeposit contract.
    // Next time, we can just deploy a proxy that targets this.
    await deploy("MuneFRAXMetaPoolDeposit", {
      from: deployer,
      log: true,
      contract: "MetaSwapDeposit",
      skipIfAlreadyDeployed: true,
    })

    await execute(
      "MuneFRAXMetaPoolDeposit",
      { from: deployer, log: true },
      "initialize",
      (
        await get("MuneUSDPool")
      ).address,
      (
        await get("MuneFRAXMetaPool")
      ).address,
      (
        await get("MuneFRAXMetaPoolLPToken")
      ).address,
    )
  }
}
export default func
func.tags = ["MuneFRAXMetaPoolDeposit"]
func.dependencies = ["MuneFRAXMetaPoolTokens", "MuneFRAXMetaPool"]
