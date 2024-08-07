module your_address::immutable_deployer {
    use initia_std::string::String;
    use initia_std::object;
    use initia_std::code;

    public fun deployer_module(
        deployer: address,
        module_ids: vector<String>,
        code: vector<vector<u8>>,
    ) {
        // this contructor reference can be created at object creation time
        // and can be used to create transfer reference. If we do not store
        // these references, we will not be able to transfer the object
        // without ungated transfer and we lose to get the signer of the object.
        let constructor_ref = object::create_object(deployer, false);
        let transfer_ref = object::generate_transfer_ref(&constructor_ref);

        // Disable ungated transfer
        // object can't be transfered without this transfer reference
        object::disable_ungated_transfer(&transfer_ref);

        let obj_signer = object::generate_signer(&constructor_ref);

        // publish the module in compatible mode.
        code::publish(&obj_signer, module_ids, code, 1 /* compatible */);
    }
}