import { InputParameter } from "@modules/command";
import { get_cdk } from "#mihoyo-cdk/util/api";
import { segment } from "icqq";
import { isPrivateMessage } from "@modules/message";

export async function main( { sendMessage, client, messageData }: InputParameter ): Promise<void> {
	const codes = await get_cdk();
	if ( codes.length === 0 ) {
		await sendMessage( "暂无直播兑换码" );
		return;
	}
	
	const nodes = codes.map( code => segment.fake( client.uin, code, client.nickname ) );
	const forwardMsg = await client.makeForwardMsg( nodes, isPrivateMessage( messageData ) );
	await sendMessage( forwardMsg );
}