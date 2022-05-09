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
	getUserInput,
} from "../utils/utils";
import { writeFile, existsSync, readFileSync } from "fs";
import { Key } from "mz/readline";


const ACCOUNT_KEYPAIR_PATH = path.join(__dirname, "../account.json");
const programId = new PublicKey("9AoPaBe7fF28ew33bWQjvqcPZ1zVDbrrrztRURZn3KKL");


class GreetingAccount {
	counter = 0;
	constructor(fields: { counter: number } | undefined = undefined) {
		if (fields) {
			this.counter = fields.counter;
		}
	}
}

(async () => {
	const connection: Connection = await establishConnection();

	const isProgramDeployed = await connection.getAccountInfo(programId);
	if (!isProgramDeployed) {
		console.error("you should deploye the program");
	}


	console.log(Buffer.alloc(5))

})();

async function createPDA(connection: Connection, payer: Keypair, programId: PublicKey) {

	let seed = await getUserInput();
	let seedBuf = Buffer.from(seed);

	let [programAddress, bump] = await PublicKey.findProgramAddress([seedBuf], programId);

	// let instructionSet = Buffer.concat(
	// 	// Buffer.alloc(1, 0),
	// )

	// console.log(instructionSet)



}