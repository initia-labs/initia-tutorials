// basic_coin.move 
// This module defines the basic_coin struct that can be minted, frozen, and burned using the 
// coin::MintCapability, coin::FreezeCapability, and coin::BurnCapability traits respectively.

module your_address::basic_coin {
    // Import the std::coin, std::string, and std::signer modules for use in this module.
    use std::coin;
    use std::string;
    use std::signer;

    // Define the Coin struct. This struct will be used to represent the basic coin in the module.
    struct Coin {}

    // Define the Capabilities struct. This struct will hold the capabilities for minting, freezing, and burning coins.
    struct Capabilities has key {
        burn_cap: coin::BurnCapability<Coin>,
        freeze_cap: coin::FreezeCapability<Coin>,
        mint_cap: coin::MintCapability<Coin>,
    }

    // Define the initialize function. This function is called when the module is first deployed to the blockchain.
    // It initializes the mint, freeze, and burn capabilities, and stores them in the Capabilities struct.
    fun init_module(account: &signer) {
        // Initialize the mint, freeze, and burn capabilities using the coin::initialize function.
        // The account parameter is the account that deploys the module.
        let (burn_cap, freeze_cap, mint_cap)
            = coin::initialize<Coin>(account, string::utf8(b"basic coin"), string::utf8(b"BASIC"), 6);

        // Create a Capabilities struct and store the capabilities in it.
        let caps = Capabilities { burn_cap, freeze_cap, mint_cap };
        // Move the capabilities struct to the address of the account that deploys the module.
        move_to(account, caps);    
    }

    // Define the mint_to function. This function mints a new Coin and deposits it to the specified address.
    public entry fun mint_to(account: &signer, amount: u64, to: address) acquires Capabilities {
        // Get the address of the account that calls the function.
        let addr = signer::address_of(account);
        // Borrow the Capabilities struct from global storage.
        let caps = borrow_global<Capabilities>(addr);
        // Mint a new Coin using the mint capability stored in the Capabilities struct.
        let coin = coin::mint<Coin>(amount, &caps.mint_cap);
        // Deposit the newly minted Coin to the specified address.
        coin::deposit<Coin>(to, coin);
    }
}