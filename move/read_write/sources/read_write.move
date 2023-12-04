module your_address::read_write {
    use std::string::{Self, String};
    use std::signer;
    use std::error;

    /// Error codes
    const ESTORE_NOT_FOUND: u64 = 1;

    /// module for store string
    struct Store has key {
        content: String
    }

    // Define the initialize function. This function is called when the module is first deployed to the blockchain.
    fun init_module(account: &signer) {
        move_to(account, Store {content: string::utf8(b"initial content")})
    }

    // MsgExecute only can execute entry function
    public entry fun write(account: &signer, content: String) acquires Store {
        write_internal(signer::address_of(account), content);
    }

    // public function can be executed by other modules
    public fun write_internal(addr: address, content: String) acquires Store {
        assert!(exists<Store>(addr), error::not_found(ESTORE_NOT_FOUND));
        let store = borrow_global_mut<Store>(addr);
        store.content = content;
    }

    // Function that has view tag can be queried by initia/minitia's lcd/rpc
    #[view]
    public fun read(): String acquires Store {
        borrow_global<Store>(@your_address).content
    }
}