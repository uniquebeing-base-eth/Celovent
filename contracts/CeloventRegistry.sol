// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Celovent on-chain user registry
/// @notice One-time username registration per wallet. Deploy on Celo mainnet.
contract CeloventRegistry {
    /// @notice wallet => username (empty string if not registered)
    mapping(address => string) public usernames;
    /// @notice lowercase(username) => taken
    mapping(string => bool) public takenUsernames;

    event UserRegistered(address indexed wallet, string username, uint256 timestamp);

    /// @notice Register the calling wallet with `username`. Reverts if either is already taken.
    function registerUser(string calldata username) external {
        require(bytes(usernames[msg.sender]).length == 0, "Wallet already registered");
        require(bytes(username).length >= 3 && bytes(username).length <= 24, "Username 3-24 chars");

        string memory lower = _toLower(username);
        require(!takenUsernames[lower], "Username taken");

        usernames[msg.sender] = username;
        takenUsernames[lower] = true;

        emit UserRegistered(msg.sender, username, block.timestamp);
    }

    function isRegistered(address wallet) external view returns (bool) {
        return bytes(usernames[wallet]).length != 0;
    }

    function _toLower(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] >= 0x41 && b[i] <= 0x5A) {
                b[i] = bytes1(uint8(b[i]) + 32);
            }
        }
        return string(b);
    }
}
