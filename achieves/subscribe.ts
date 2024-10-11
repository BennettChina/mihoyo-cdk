import { defineDirective, InputParameter } from "@/modules/command";
import { db_key } from "#/mihoyo-cdk/module/db";
import { isGroupMessage } from "@/modules/message";

export default defineDirective( "switch", async ( input: InputParameter ) => {
	const { sendMessage, redis, messageData, matchResult: { isOn } } = input;
	const userId = isGroupMessage( messageData ) ? messageData.group_id.toString() : messageData.user_id.toString();
	const exist = await redis.getHashField( db_key.subscribe, userId );
	if ( isOn && exist ) {
		await sendMessage( "你已订阅CDK" );
		return;
	}
	
	if ( !isOn ) {
		await redis.delHash( db_key.subscribe, userId );
		await sendMessage( "已为你取消订阅CDK" );
		return;
	}
	
	await redis.setHashField( db_key.subscribe, userId, messageData.message_type );
	await sendMessage( "已为你订阅CDK" );
} )