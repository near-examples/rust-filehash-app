use borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::Map;
use near_sdk::{
    env, near_bindgen, AccountId,
};
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct FileHashContract {
    /// Persistent map from file hash to account ID
    pub files: Map<Vec<u8>, AccountId>,
}

impl Default for FileHashContract {
    fn default() -> Self {
        let this = Self {
            files: Map::new(b"u".to_vec()), // init map
        };
        this
    }
}

#[near_bindgen]
impl FileHashContract {

    // public functions

    pub fn add_file(&mut self, hash: &Vec<u8>) -> bool {
        // there is no account_id for this hash
        if self.get_account(hash) == "".to_string() {
            self.files.insert(hash, &env::signer_account_id());
            return true;
        }
        return false;
    }

    pub fn get_account(&self, hash: &Vec<u8>) -> AccountId {
        self.files.get(hash).unwrap_or_default()
    }

    pub fn remove_file(&mut self, hash: &Vec<u8>) -> bool {
        if self.get_account(hash) == env::signer_account_id() {
            self.files.remove(hash);
            return true;
        }
        return false;
    }
}

/********************************
Tests
********************************/
#[cfg(test)]
mod test_utils;
#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env};
    // mark individual unit tests with #[test] for them to be registered and fired
    #[test]
    fn check_owner() {
        // VMContextBuilder is defined in `test_utils.rs`
        // part of writing unit tests is setting up a mock context
        testing_env!(VMContextBuilder::new()
            .signer_account_id(alice())
            .finish());
        let account = env::signer_account_id();

        let file:Vec<u8> = vec![1, 2, 3];
        let mut contract = FileHashContract::default();
        contract.add_file(&file);
        let returned_account = contract.get_account(&file);
        
        assert_eq!(account, returned_account);
    }

    #[test]
    fn check_remove() {
        // VMContextBuilder is defined in `test_utils.rs`
        // part of writing unit tests is setting up a mock context
        testing_env!(VMContextBuilder::new()
            .signer_account_id(alice())
            .finish());

        let file:Vec<u8> = vec![1, 2, 3];
        let mut contract = FileHashContract::default();
        contract.add_file(&file);
        contract.remove_file(&file);
        let returned_account = contract.get_account(&file);
        println!("check_remove: file account == {}", returned_account);

        assert_eq!(returned_account, "");
    }

    #[test]
    fn cannot_remove() {
        // VMContextBuilder is defined in `test_utils.rs`
        // part of writing unit tests is setting up a mock context
        testing_env!(VMContextBuilder::new()
            .signer_account_id(alice())
            .finish());
        let account = env::signer_account_id(); // alice

        let file:Vec<u8> = vec![1, 2, 3];
        let mut contract = FileHashContract::default();
        contract.add_file(&file);
        // switch env context
        testing_env!(VMContextBuilder::new()
            .signer_account_id(bob()) // switched signer_account_id [msg.sender] to bob
            .finish());

        contract.remove_file(&file);
        let returned_account = contract.get_account(&file);
        println!("cannot_remove: file account == {}", returned_account);

        assert_eq!(returned_account, account);
    }

    #[test]
    fn cannot_add_same_hash() {
        // VMContextBuilder is defined in `test_utils.rs`
        // part of writing unit tests is setting up a mock context
        testing_env!(VMContextBuilder::new()
            .signer_account_id(alice())
            .finish());
        let account = env::signer_account_id(); // alice

        let file:Vec<u8> = vec![1, 2, 3];
        let mut contract = FileHashContract::default();
        contract.add_file(&file);
        println!("RESULT: {}", result);
        // switch env context
        testing_env!(VMContextBuilder::new()
            .signer_account_id(bob()) // switched signer_account_id [msg.sender] to bob
            .finish());

        contract.add_file(&file);
        let returned_account = contract.get_account(&file);
        println!("cannot_add_same_hash: account == {}", returned_account);

        assert_eq!(returned_account, account);
    }

}