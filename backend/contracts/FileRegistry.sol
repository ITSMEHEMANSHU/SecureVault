// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ✅ Explicitly importing the exact types from the CoFHE library
import {FHE, euint32, InEuint32, ebool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract FileRegistry {
    struct FileRecord {
        string cid;
        address uploader;
        uint256 timestamp;
        euint32[] encryptedKeywords; // Fhenix Encrypted Data Type
    }

    mapping(string => FileRecord) private records;
    string[] private allCids;

    event FileRecorded(address indexed user, string cid);

    // ✅ Using the capitalized InEuint32
    function addRecord(string memory cid, InEuint32[] memory keywords) public returns (uint256) {
        require(bytes(records[cid].cid).length == 0, "CID already exists");

        FileRecord storage newRecord = records[cid];
        newRecord.cid = cid;
        newRecord.uploader = msg.sender;
        newRecord.timestamp = block.timestamp;
        
        // Store each encrypted keyword securely on-chain
        for(uint i = 0; i < keywords.length; i++) {
            newRecord.encryptedKeywords.push(FHE.asEuint32(keywords[i]));
        }
        
        allCids.push(cid);
        emit FileRecorded(msg.sender, cid);
        return block.timestamp;
    }

    // ✅ REMOVED 'view' from this line
    function searchEncryptedKeywords(string memory cid, InEuint32 memory search_query) public returns (ebool) {
        FileRecord storage record = records[cid];
        euint32 query = FHE.asEuint32(search_query);
        
        ebool isMatch = FHE.asEbool(false);

        // Loop through the file's encrypted tags to see if the search query matches
        for(uint i = 0; i < record.encryptedKeywords.length; i++) {
            // FHE.eq() securely compares two encrypted values
            ebool currentMatch = FHE.eq(record.encryptedKeywords[i], query);
            isMatch = FHE.or(isMatch, currentMatch);
        }

        return isMatch;
    }

    function verifyRecord(string memory cid) public view returns (bool) {
        return bytes(records[cid].cid).length > 0;
    }
}