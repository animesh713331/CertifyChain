const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const certRegistry = await hre.ethers.deployContract("CertificateRegistry");

    await certRegistry.waitForDeployment();

    console.log(
        `CertificateRegistry deployed to ${certRegistry.target}`
    );

    // Auto-export for frontend
    const addressPath = path.join(__dirname, "../src/contract-address.json");
    fs.writeFileSync(
        addressPath,
        JSON.stringify({ address: certRegistry.target }, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
