import { InputParameter } from "@modules/command";
import { get_cdk } from "#mihoyo-cdk/util/api";
import { segment } from "icqq";
import { isPrivateMessage } from "@modules/message";
import { ForwardNode } from "icqq/lib/message/elements";

export async function main( { sendMessage, client, messageData }: InputParameter ): Promise<void> {
	const cdks = await get_cdk();
	if ( cdks.length === 0 ) {
		await sendMessage( "暂无直播兑换码" );
		return;
	}
	
	const nodes: ForwardNode[] = [];
	for ( let { title, codes } of cdks ) {
		let tips: string = "";
		if ( codes.length >= 3 ) {
			tips = `${ title }-直播兑换码，兑换码存在有效期，请尽快兑换!`;
		} else {
			tips = `${ title }-直播兑换码，暂时仅获取到${ codes.length }个直播兑换码，请稍后再次获取`;
		}
		const item = codes.map( code => segment.fake( client.uin, code, client.nickname ) )
		nodes.push( segment.fake( client.uin, tips, client.nickname ) )
		nodes.push( ...item );
	}
	
	const forwardMsg = await client.makeForwardMsg( nodes, isPrivateMessage( messageData ) );
	await sendMessage( forwardMsg );
}