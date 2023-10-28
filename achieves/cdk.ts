import { defineDirective, InputParameter } from "@/modules/command";
import { get_cdk } from "#/mihoyo-cdk/util/api";
import { ForwardElem, ForwardElemCustomNode } from "@/modules/lib";

export default defineDirective( "order", async ( { sendMessage, client }: InputParameter ) => {
	const cdks = await get_cdk();
	if ( cdks.length === 0 ) {
		await sendMessage( "暂无直播兑换码" );
		return;
	}
	
	const info = await client.getLoginInfo();
	
	const nodes: ForwardElemCustomNode[] = [];
	for ( let { title, codes } of cdks ) {
		let tips: string = "";
		if ( codes.length >= 3 ) {
			tips = `${ title }-直播兑换码，兑换码存在有效期，请尽快兑换!`;
		} else {
			tips = `${ title }-直播兑换码，暂时仅获取到${ codes.length }个直播兑换码，请稍后再次获取`;
		}
		const item = codes.map( code => ( {
			uin: client.uin,
			name: info.data.nickname,
			content: code
		} ) )
		nodes.push( {
			uin: client.uin,
			name: info.data.nickname,
			content: tips
		} )
		nodes.push( ...item );
	}
	const forwardMsg: ForwardElem = {
		type: "forward",
		messages: nodes
	};
	await sendMessage( forwardMsg );
} );