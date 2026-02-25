const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
    let CertificateRegistry;
    let registry;
    let owner;
    let otherAccount;
    let issuerAccount;

    beforeEach(async function () {
        [owner, otherAccount, issuerAccount] = await ethers.getSigners();
        CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
        registry = await CertificateRegistry.deploy();
    });

    it("Should set the right roles", async function () {
        const DEFAULT_ADMIN_ROLE = await registry.DEFAULT_ADMIN_ROLE();
        const ISSUER_ROLE = await registry.ISSUER_ROLE();

        expect(await registry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
        expect(await registry.hasRole(ISSUER_ROLE, owner.address)).to.equal(true);
    });

    it("Should allow issuer to issue certificate", async function () {
        const certId = "CERT-001";
        await registry.issueCertificate(
            otherAccount.address,
            certId,
            "John Doe",
            "Blockchain 101",
            "2024-01-01",
            "University",
            "ipfs://metadata"
        );

        const tokenId = await registry.certificateIdToTokenId(certId);
        expect(await registry.ownerOf(tokenId)).to.equal(otherAccount.address);

        // Check details
        const cert = await registry.getCertificate(certId);
        expect(cert.studentName).to.equal("John Doe");
        expect(cert.isValid).to.equal(true);
    });

    it("Should NOT fail when transferring (SBT Check)", async function () {
        const certId = "CERT-002";
        await registry.issueCertificate(
            owner.address, // Owner issues to themselves for testing transfer
            certId,
            "Alice",
            "Course",
            "Date",
            "Issuer",
            "uri"
        );

        const tokenId = await registry.certificateIdToTokenId(certId);

        // Attempt transfer
        await expect(
            registry.transferFrom(owner.address, otherAccount.address, tokenId)
        ).to.be.revertedWith("Certificates are Soulbound and cannot be transferred");
    });

    it("Should batch issue certificates", async function () {
        const certIds = ["CERT-B1", "CERT-B2"];
        const tos = [otherAccount.address, issuerAccount.address];

        await registry.batchIssueCertificate(
            tos,
            certIds,
            ["S1", "S2"],
            ["C1", "C2"],
            ["D1", "D2"],
            ["I1", "I2"],
            ["U1", "U2"]
        );

        const token1 = await registry.certificateIdToTokenId("CERT-B1");
        expect(await registry.ownerOf(token1)).to.equal(otherAccount.address);
    });

    it("Should revoke certificate", async function () {
        const certId = "CERT-REVOKE";
        await registry.issueCertificate(otherAccount.address, certId, "Name", "C", "D", "I", "U");

        await registry.revokeCertificate(certId);

        const cert = await registry.getCertificate(certId);
        expect(cert.isValid).to.equal(false);
    });
});
