import { defineDirective, InputParameter } from "@/modules/command";
import { get_cdk } from "#/mihoyo-cdk/util/api";
import { ForwardElem } from "@/modules/lib";

export default defineDirective( "order", async ( { sendMessage, client }: InputParameter ) => {
	const codes = await get_cdk();
	if ( codes.length === 0 ) {
		await sendMessage( "暂无直播兑换码" );
		return;
	}
	
	const info = await client.getLoginInfo();
	const nodes = codes.map( code => ( {
		uin: client.uin,
		name: info.data.nickname,
		content: code
	} ) );
	const forwardMsg: ForwardElem = {
		type: "forward",
		messages: nodes
	};
	await sendMessage( forwardMsg );
} );