// managed_coin.move 
// 
// This module defines an example of managed coin implementation that expose mint interface.
//
module your_address::managed_coin {
    use std::coin;
    use std::string;
    use std::signer;
    use std::option;

    // Define the Capabilities struct. This struct will hold the capabilities for minting, freezing, and burning coins.
    struct Capabilities has key {
        burn_cap: coin::BurnCapability,
        freeze_cap: coin::FreezeCapability,
        mint_cap: coin::MintCapability,
    }

    // Define the initialize function. This function is called when the module is first deployed to the blockchain.
    // It initializes the mint, freeze, and burn capabilities, and stores them in the Capabilities struct.
    fun init_module(account: &signer) {
        // Initialize the mint, freeze, and burn capabilities using the coin::initialize function.
        // The account parameter is the account that deploys the module.
        let (mint_cap, burn_cap, freeze_cap)
            = coin::initialize(
                account, 
                option::none(),
                string::utf8(b"basic coin"),
                string::utf8(b"BASIC"), 
                6,
                string::utf8(b""),
                string::utf8(b""),
            );

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
        let coin = coin::mint(&caps.mint_cap, amount);
        // Deposit the newly minted Coin to the specified address.
        coin::deposit(to, coin);
    }

    #[test_only]
    use std::primary_fungible_store;

    #[test(chain = @0x1, creator = @0x2, receiver = @0x9999)]
    fun test_create_and_mint(chain: &signer, creator: &signer, receiver: address) acquires Capabilities {
        primary_fungible_store::init_module_for_test(chain);
        init_module(creator);

        mint_to(creator, 100, receiver);
        assert!(
            coin::balance(
                receiver, 
                coin::metadata(signer::address_of(creator), string::utf8(b"BASIC"))) == 100, 
            1,
        );
    }
}