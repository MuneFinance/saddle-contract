import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { isMainnet } from "../../utils/network"
import { POLYGON_MULTISIG_ADDRESS } from "../../utils/accounts"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre
  const { deploy, execute, read } = deployments
  const { deployer } = await getNamedAccounts()

  await deploy("SwapDeployer", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  })

  const currentOwner = await read("SwapDeployer", "owner")

  if (
    isMainnet(await getChainId()) &&
    currentOwner != POLYGON_MULTISIG_ADDRESS
  ) {
    await execute(
      "SwapDeployer",
      { from: deployer, log: true },
      "transferOwnership",
      POLYGON_MULTISIG_ADDRESS,
    )
  }
}
export default func
func.tags = ["SwapDeployer"]
