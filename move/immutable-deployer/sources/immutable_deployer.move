module your_address::immutable_deployer {
    use initia_std::string::{Self, String};
    use initia_std::object;
    use initia_std::code;
    use initia_std::vector;
    use initia_std::address;

    public fun deployer_module(
        deployer: address,
        module_names: vector<String>,
        code: vector<vector<u8>>,
    ) {
        // this constructor reference can be created at object creation time
        // and can be used to create transfer reference. If we do not store
        // these references, we will not be able to transfer the object
        // without ungated transfer and we lose to get the signer of the object.
        let constructor_ref = object::create_object(deployer, false);
        let transfer_ref = object::generate_transfer_ref(&constructor_ref);

        // Disable ungated transfer
        // object can't be transferred without this transfer reference
        //
        // This is unnecessary because there is no way to get obj_signer without refs.
        object::disable_ungated_transfer(&transfer_ref);

        let obj_addr = object::address_from_constructor_ref(&constructor_ref);
        let obj_signer = object::generate_signer(&constructor_ref);

        let module_ids = vector::map(
            module_names,
            |name| {
                let module_id = address::to_string(obj_addr);
                string::append_utf8(&mut module_id, b"::");
                string::append(&mut module_id, name);

                module_id
            },
        );

        // publish the module in compatible mode.
        code::publish(&obj_signer, module_ids, code, 1 /* compatible */);
    }
}
