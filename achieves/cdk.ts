import { defineDirective, InputParameter } from "@/modules/command";
import { get_cdk } from "#/mihoyo-cdk/util/api";
import { ForwardElem, ForwardElemCustomNode } from "@/modules/lib";

export default defineDirective( "order", async ( { sendMessage, client, logger }: InputParameter ) => {
	const cdks = await get_cdk();
	if ( cdks.length === 0 ) {
		await sendMessage( "暂无直播兑换码" );
		return;
	}
	
	const info = await client.getLoginInfo();
	
	const nodes: ForwardElemCustomNode[] = [];
	for ( let { title, codes, total } of cdks ) {
		let tips: string = "";
		if ( codes.length >= total ) {
			tips = `${ title }-直播兑换码，兑换码存在有效期，请尽快兑换!`;
		} else {
			tips = `${ title }-直播兑换码，暂时仅获取到${ codes.length }个直播兑换码，请稍后再次获取`;
		}
		const item = codes.map( code => ( {
			user_id: client.uin,
			nickname: info.data.nickname || undefined,
			content: code
		} ) )
		nodes.push( {
			user_id: client.uin,
			nickname: info.data.nickname || undefined,
			content: tips
		} )
		nodes.push( ...item );
	}
	const forwardMsg: ForwardElem = {
		type: "forward",
		messages: nodes
	};
	try {
		await sendMessage( forwardMsg );
	} catch ( err ) {
		logger.warn( err );
		// 发送失败，尝试逐条发送
		for ( let node of nodes ) {
			await sendMessage( node.content );
		}
	}
} );