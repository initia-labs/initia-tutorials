module your_address::nft_controller {
    use std::nft;
    use std::string::{Self, String};
    use std::signer;

    struct Metadata has drop, copy, store {
        numeric_value: u64, 
        string_value: String,
    }

    struct Capabilities has key {
        mint_cap: nft::Capability<Metadata>,
    }

    public entry fun initialize(account: &signer) {
        let mint_cap
            = nft::make_collection<Metadata>(account, string::utf8(b"my nft"), string::utf8(b"MNFT"), string::utf8(b"https://initia.co"), false);

        let caps = Capabilities { mint_cap };
        move_to(account, caps);    
    }

    public entry fun mint_to(
        account: &signer,
        to: address,
        token_id: String,
        token_uri: String,
        numeric_value: u64,
        string_value: String,
    ) acquires Capabilities {
        let addr = signer::address_of(account);
        let caps = borrow_global<Capabilities>(addr);
        let meta = Metadata { numeric_value, string_value };
        let nft = nft::mint<Metadata>(token_id, token_uri, meta, &caps.mint_cap);
        // make sure that `to` is registered
        nft::deposit<Metadata>(to, nft);
    }
}