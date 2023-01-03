import { run } from "hardhat";

export const verify = async (address: string, constructorArguments: any[]) => {
  try {
    console.log(`******************** Verifying ${address} *****************`);
    await run("verify:verify", {
      address,
      constructorArguments,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already verified")) {
      console.log(`Contract Already Verified`);
    } else console.log(error);
  }
};
