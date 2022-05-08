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


class GreetingAccount {
	counter = 0;
	constructor(fields: { counter: number } | undefined = undefined) {
		if (fields) {
			this.counter = fields.counter;
		}
	}
}

(async () => {
	const programId = new PublicKey("C4SjjwjtepuJNM2YnfXngHug6EzM47N3pyBkZWRqtTyG");


	let connection: Connection = await establishConnection();

	let payer: Keypair = await getPayer();
	let greetedkeypair = Keypair.generate();
	console.log("account is created " + greetedkeypair.publicKey);



	const accountInfo = await connection.getAccountInfo(programId);
	console.log("is deployed : ", accountInfo != null)

	const GreetingSchema = new Map([
		[GreetingAccount, { kind: "struct", fields: [["counter", "u32"]] }],
	]);

	const GREETING_SIZE = borsh.serialize(
		GreetingSchema,
		new GreetingAccount()
	).length;

	const lamports = await connection.getMinimumBalanceForRentExemption(GREETING_SIZE);

	console.log(lamports);
	const txInstruction = SystemProgram.createAccount({
		fromPubkey: payer.publicKey,
		newAccountPubkey: greetedkeypair.publicKey,
		lamports: lamports,
		space: GREETING_SIZE,
		programId: programId,
	})

	console.log("payer: ", payer.publicKey.toBase58());

	const transaction = new Transaction().add(txInstruction);
	await sendAndConfirmTransaction(connection, transaction, [payer, greetedkeypair]);

	const accountInfoCreated = await connection.getAccountInfo(greetedkeypair.publicKey);
	console.log("account info that just created: ", accountInfoCreated);

	console.log("account info: ", accountInfoCreated?.data);

	let buf: Buffer;
	if (accountInfoCreated?.data != undefined) {
		buf = accountInfoCreated.data
		const newValue = borsh.deserialize(GreetingSchema, GreetingAccount, buf);
		console.log();
		console.log("new value: ", newValue);
	}
})();