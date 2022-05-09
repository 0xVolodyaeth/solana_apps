use borsh::{BorshDeserialize, BorshSchema, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
};
use std::str::from_utf8;

/// Defines the structure of the state stored in the on-chain account
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone, BorshSchema)]
pub struct GreetingStruct {
    pub counter: u32,
}

entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the counter program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8], // Ignored
) -> ProgramResult {
    msg!("Hello World Rust program entrypoint");

    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let founder = next_account_info(accounts_iter)?;
    let account_to_init = next_account_info(accounts_iter)?;

    if **account_to_init.try_borrow_lamports()? > 0 {
        msg!("This account is already initialised that account, skipping");
        return Ok(());
    }

    let split = _instruction_data.split_first();
    // !!!!!!
    // can be used later fo verify which command was passed
    // !!!!!!
    let (function_flag, rest) = split.ok_or(ProgramError::BorshIoError(
        "Invalid parameters passed".to_string(),
    ))?;

    msg!("[instruction] function_flag is:{:?} ", function_flag);

    let (key_length, rest) = rest.split_first().ok_or(ProgramError::BorshIoError(
        "Invalid parameters passed".to_string(),
    ))?;

    let seed = from_utf8(rest.get(..*key_length as usize).unwrap())
        .unwrap()
        .to_string();

    msg!("[instruction] seed is:{:?} ", seed);

    let bump = *rest.get(*key_length as usize).unwrap();

    msg!("[instruction] extracted bump: {:?}", bump);

    // Get account size in bytes
    let account_size = *rest.last().unwrap();

    msg!("[instruction] extracted account size: {:?}", account_size);

    // The account must be owned by the program in order to modify its data
    // if account.owner != program_id {
    //     msg!("Greeted account does not have the correct program id");
    //     return Err(ProgramError::IncorrectProgramId);
    // }

    // // Increment and store the number of times the account has been greeted

    // msg!("{:?}", account);
    // msg!("{:?}", account.data);

    // let mut greeting_account = GreetingStruct::try_from_slice(&account.data.borrow())?;
    // greeting_account.counter += 1;
    // greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;

    // msg!("Greeted {} time(s)!", greeting_account.counter);

    Ok(())
}
