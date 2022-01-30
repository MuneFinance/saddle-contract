import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre
  const { deploy, get, execute } = deployments
  const { deployer } = await getNamedAccounts()

  await deploy("MUNE", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    args: [
      deployer,
      60, // 60 seconds
      (await get("Vesting")).address,
    ],
  })
}
export default func
func.tags = ["MUNE"]