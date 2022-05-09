import {
	Connection,
	Keypair,
	PublicKey,
	SystemProgram,
	TransactionInstruction,
	sendAndConfirmTransaction,
	Transaction,
} from "@solana/web3.js";
import path from "path";
import * as borsh from "borsh";

import {
	getPayer,
	establishConnection,
	checkAccountDeployed,
	checkBinaryExists,
	getBalance,
	establishEnoughSol,
} from "../utils/utils";
import { writeFile, existsSync, readFileSync } from "fs";
import { Key } from "mz/readline";


const ACCOUNT_SEED = "COUNTER";
const ACCOUNT_KEYPAIR_PATH = path.join(__dirname, "../account.json");
const programId = new PublicKey("3wqrfttWUu7HqF6uep16qPay24g7WWgWAAYkRQ8onJTu");


class GreetingAccount {
	counter = 0;
	constructor(fields: { counter: number } | undefined = undefined) {
		if (fields) {
			this.counter = fields.counter;
		}
	}
}

(async () => {

	let connection = await establishConnection();

	let payer = await getPayer();
	let seed = "test_seed";
	let seedBuffer = Buffer.from(seed);

	const [theAccountToInit, bump] = await PublicKey.findProgramAddress(
		[seedBuffer],
		programId
	);

	var instruction_set = Buffer.concat([
		Buffer.alloc(1, 0), // creating PDA
		Buffer.alloc(1, seed.length), // size of the seed (it varies)
		Buffer.from(seed), // seed buffer
		Buffer.alloc(1, bump), // bump integer
		Buffer.alloc(1, 0), // acount size
	]);
	console.log(instruction_set);


	const instruction = new TransactionInstruction({
		keys: [
			{ pubkey: payer.publicKey, isSigner: true, isWritable: true }, // first key payer
			{ pubkey: theAccountToInit, isSigner: false, isWritable: true },
			{
				pubkey: SystemProgram.programId,
				isSigner: false,
				isWritable: false,
			},
		],
		programId,
		data: instruction_set,
	});

	await sendAndConfirmTransaction(
		connection,
		new Transaction().add(instruction),
		[payer]
	);

	//  pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
	// // split into first element and the rest [element], [element array]
	// let split = input.split_first();

	// msg!("[instruction] Total payload: {:?}", input);

	// // process option  type
	// let (function_flag, rest) = split.ok_or(ProgramError::BorshIoError(
	//     "Invalid parameters passed".to_string(),
	// ))?;

	// msg!("[instruction] Received function flag: {}", function_flag);

	// // length of the string is fixed so it will be X first characters
	// let (key_length, rest) = rest.split_first().ok_or(ProgramError::BorshIoError(
	//     "Invalid parameters passed".to_string(),
	// ))?;

	// // process function type
	// match function_flag {
	//     0 => {
	//         msg!("[instruction] Initialising PDA");

	//         // Get seed from up to the key size as a string
	//         let seed = from_utf8(rest.get(..*key_length as usize).unwrap())
	//             .unwrap()
	//             .to_string();

	//         msg!("[instruction] extracted seed: {:?}", seed);

	//         // Get bump
	//         let bump = *rest.get(*key_length as usize).unwrap();

	//         msg!("[instruction] extracted bump: {:?}", bump);

	//         // Get account size in bytes
	//         let account_size = *rest.last().unwrap();

	//         msg!("[instruction] extracted account size: {:?}", account_size);

	//         Ok(Self::PDA_create {
	//             seed,
	//             bump,
	//             account_size,
	//         }) // needs seed and bump
	//     }



	console.log("write to pda")
	console.log()
	console.log()
	console.log()




	const [theAccountToWriteTo, _] = await PublicKey.findProgramAddress(
		[seedBuffer],
		programId
	);

	const word = "test word";
	var instruction_set = Buffer.concat([
		Buffer.alloc(1, 1), // writing PDA
		Buffer.alloc(1, word.length), // size of the seed (it varies)
		Buffer.from(word)
	]);
	console.log(instruction_set);


	const instructionWrite = new TransactionInstruction({
		programId: programId,
		keys: [
			{ pubkey: theAccountToWriteTo, isSigner: false, isWritable: true },
			{ pubkey: payer.publicKey, isSigner: true, isWritable: true }, // first key payer
		],
		data: instruction_set,
	});

	await sendAndConfirmTransaction(
		connection,
		new Transaction().add(instructionWrite),
		[payer]
	);
})();

async function createAccountIfNotExists(connection: Connection, greetedkeypair: Keypair, payer: Keypair, programId: PublicKey) {
	const GreetingSchema = new Map([
		[GreetingAccount, { kind: "struct", fields: [["counter", "u32"]] }],
	]);

	const GREETING_SIZE = borsh.serialize(
		GreetingSchema,
		new GreetingAccount()
	).length;

	const lamports = await connection.getMinimumBalanceForRentExemption(GREETING_SIZE);

	// const txInstruction = SystemProgram.createAccount({
	// 	fromPubkey: payer.publicKey,
	// 	newAccountPubkey: greetedkeypair.publicKey,
	// 	lamports: lamports,
	// 	space: GREETING_SIZE,
	// 	programId: programId,
	// })

	const txInstruction = SystemProgram.createAccountWithSeed({
		fromPubkey: payer.publicKey,
		basePubkey: payer.publicKey,
		// seeds are only used for PDA
		seed: ACCOUNT_SEED,
		newAccountPubkey: greetedkeypair.publicKey,
		lamports, // Minnimum money to be rent free
		space: GREETING_SIZE, // Size of the account
		programId, // Program owner of the this PDA
	});

	console.log();
	console.log("the following account will pay");
	console.log("payer: ", payer.publicKey.toBase58());
	console.log();

	const transaction = new Transaction().add(txInstruction);
	await sendAndConfirmTransaction(connection, transaction, [payer, greetedkeypair]);
	return;
}

async function sayHello(connection: Connection, greetedkeypair: Keypair, programId: PublicKey, payer: Keypair) {
	console.log('Saying hello to', greetedkeypair.publicKey.toBase58());
	console.log('Program id :', programId.toBase58());

	const instruction = new TransactionInstruction({
		keys: [{ pubkey: greetedkeypair.publicKey, isSigner: false, isWritable: true }],
		programId,
		data: Buffer.alloc(0), // All instructions are hellos
	});
	await sendAndConfirmTransaction(
		connection,
		new Transaction().add(instruction),
		[payer]
	);
}

function writeAccountKeypair(keypair: Keypair) {
	const buf = Uint8Array.from(keypair.secretKey);
	writeFile(ACCOUNT_KEYPAIR_PATH, buf, (err) => {
		if (err) {
			console.log("error writing account keypair", err);
		}
	});
}