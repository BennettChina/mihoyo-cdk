import { getRandomNumber } from "@/utils/random";
import { Job, scheduleJob } from "node-schedule";
import { sleep } from "@/utils/async";
import { get_cdk } from "#/mihoyo-cdk/util/api";
import Bot from "ROOT";
import { db_key } from "#/mihoyo-cdk/module/db";
import { ForwardElem, ForwardElemCustomNode } from "@/modules/lib";
import { MessageType } from "@/modules/message";

export class Task {
	private readonly task_name: string;
	private readonly job: Job;
	private readonly notifications = new Map<number, number>();
	// 15天的有效期
	private readonly EXPIRE_TIME: number = 60 * 60 * 24 * 1000 * 15;
	
	constructor() {
		this.task_name = "miHoYo-cdk-task";
		
		// 初始化通知过的数据
		Bot.redis.getHash( db_key.notificationStatus ).then( obj => {
			Object.entries( obj ).forEach( ( [ key, value ] ) => {
				this.notifications.set( parseInt( key ), parseInt( value ) );
			} )
		} ).catch( err => {
			Bot.logger.error( err );
		} );
		
		this.job = scheduleJob( this.task_name, "0 0/15 20-21 * * ?", async () => {
			const subscribe = await Bot.redis.getHash( db_key.subscribe );
			const entries = Object.entries( subscribe );
			if ( entries.length === 0 ) {
				return;
			}
			
			const time = getRandomNumber( 0, 60 * 1000 );
			await sleep( time );
			const cdks = await get_cdk();
			if ( cdks.length === 0 ) {
				return;
			}
			
			const info = await Bot.client.getLoginInfo();
			
			const nodes: ForwardElemCustomNode[] = [];
			for ( let { title, codes, total, gids } of cdks ) {
				// 15天内推送过的都不需要再推送，可以避免多次推送同一版本的 cdk
				const time = this.notifications.get( gids ) || 0;
				if ( Date.now() - time < this.EXPIRE_TIME ) continue;
				
				let tips: string = "";
				if ( codes.length >= total ) {
					tips = `${ title }-直播兑换码，兑换码存在有效期，请尽快兑换!`;
					this.notifications.set( gids, Date.now() );
				} else {
					tips = `${ title }-直播兑换码，暂时仅获取到${ codes.length }个直播兑换码，请稍后再次获取`;
				}
				const item = codes.map( code => ( {
					user_id: Bot.client.uin,
					nickname: info.data.nickname || "Bot",
					content: code
				} ) )
				nodes.push( {
					user_id: Bot.client.uin,
					nickname: info.data.nickname || "Bot",
					content: tips
				} )
				nodes.push( ...item );
			}
			
			const forwardMsg: ForwardElem = {
				type: "forward",
				messages: nodes
			};
			
			for ( let [ userId, type ] of entries ) {
				let messageType: number;
				if ( type === 'private' ) {
					messageType = MessageType.Private;
				} else if ( type === 'group' ) {
					messageType = MessageType.Group;
				} else {
					Bot.logger.warn( `[miHoYo-cdk-task] 订阅者 ${ userId } 的类型错误: ${ type }(unknown type)` );
					continue;
				}
				const sendMessage = Bot.message.createMessageSender( messageType, userId );
				try {
					await sendMessage( forwardMsg );
				} catch ( err ) {
					Bot.logger.warn( err );
					// 发送失败，尝试逐条发送
					for ( let node of nodes ) {
						await sendMessage( node.content );
					}
				}
			}
			
			// 把通知缓存入库
			await Bot.redis.setHash( db_key.notificationStatus, this.notifications );
		} )
	}
	
	public cancel( restart?: boolean ): boolean {
		return this.job.cancel( restart );
	}
}