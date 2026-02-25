// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateRegistry is ERC721URIStorage, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    // Mapping from explicit certificate ID (string) to tokenId (uint256)
    mapping(string => uint256) public certificateIdToTokenId;
    mapping(uint256 => string) public tokenIdToCertificateId;
    
    // Struct to hold extra data not in URI
    struct CertificateDetails {
        string studentName;
        string course;
        string issueDate;
        string issuerName;
        bool isValid;
    }
    
    mapping(uint256 => CertificateDetails) public certificateDetails;

    uint256 private _nextTokenId;

    event CertificateIssued(string indexed certificateId, uint256 indexed tokenId, string studentName, address indexed recipient, address issuer);
    event CertificateRevoked(string indexed certificateId, uint256 indexed tokenId, address indexed revoker);

    constructor() ERC721("CertifyChain", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }
    
    function issueCertificate(
        address to,
        string memory certificateId,
        string memory studentName,
        string memory course,
        string memory issueDate,
        string memory issuerName,
        string memory uri
    ) public onlyRole(ISSUER_ROLE) {
        require(certificateIdToTokenId[certificateId] == 0, "Certificate ID already exists");
        
        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        certificateIdToTokenId[certificateId] = tokenId;
        tokenIdToCertificateId[tokenId] = certificateId;
        
        certificateDetails[tokenId] = CertificateDetails({
            studentName: studentName,
            course: course,
            issueDate: issueDate,
            issuerName: issuerName,
            isValid: true
        });
        
        emit CertificateIssued(certificateId, tokenId, studentName, to, msg.sender);
    }

    function batchIssueCertificate(
        address[] memory tos,
        string[] memory certificateIds,
        string[] memory studentNames,
        string[] memory courses,
        string[] memory issueDates,
        string[] memory issuerNames,
        string[] memory uris
    ) public onlyRole(ISSUER_ROLE) {
        require(tos.length == certificateIds.length, "Length mismatch");
        
        for (uint256 i = 0; i < tos.length; i++) {
            issueCertificate(tos[i], certificateIds[i], studentNames[i], courses[i], issueDates[i], issuerNames[i], uris[i]);
        }
    }

    function revokeCertificate(string memory certificateId) public onlyRole(ISSUER_ROLE) {
        uint256 tokenId = certificateIdToTokenId[certificateId];
        require(tokenId != 0, "Certificate not found");
        require(certificateDetails[tokenId].isValid, "Already revoked");
        
        certificateDetails[tokenId].isValid = false;
        
        emit CertificateRevoked(certificateId, tokenId, msg.sender);
    }

    // SBT Implementation: Block transfers
    function transferFrom(address from, address to, uint256 tokenId) public pure override(ERC721, IERC721) {
        revert("Certificates are Soulbound and cannot be transferred");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public pure override(ERC721, IERC721) {
        revert("Certificates are Soulbound and cannot be transferred");
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Helper to get full details matching old signature (+ owner/tokenUri)
    function getCertificate(string memory certificateId) public view returns (
        string memory studentName,
        string memory course,
        string memory issueDate,
        string memory issuerName,
        string memory metadataUri,
        bool isValid,
        address owner
    ) {
        uint256 tokenId = certificateIdToTokenId[certificateId];
        require(tokenId != 0, "Certificate not found");
        
        CertificateDetails memory details = certificateDetails[tokenId];
        
        return (
            details.studentName,
            details.course,
            details.issueDate,
            details.issuerName,
            tokenURI(tokenId),
            details.isValid,
            ownerOf(tokenId)
        );
    }
}
