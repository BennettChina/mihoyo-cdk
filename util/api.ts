import axios from "axios";
import bot from "ROOT";
import moment from "moment";
import { CodeType } from "#/mihoyo-cdk/util/types";

enum Api {
	mihoyo_act_id = "https://bbs-api.mihoyo.com/painter/api/user_instant/list?offset=0&size=20&uid=",
	mihoyo_live = "https://api-takumi.mihoyo.com/event/miyolive/index",
	mihoyo_live_code = "https://api-takumi-static.mihoyo.com/event/miyolive/refreshCode"
}

const keywords_map: Record<string, string[]> = {
	"genshin": [ "版本前瞻特别节目" ],
	"hk_star_rail": [ "版本前瞻特别节目", "版本前瞻" ],
	"hk_three": [ "特别节目预告", "版本特别节目" ],
	"zzz": []
}

const user_map = {
	"75276550": "genshin",
	"80823548": "hk_star_rail",
	"73565430": "hk_three",
	"152039072": "zzz"
}

async function getActId( uid: string = "75276550" ) {
	const response = await axios.get( Api.mihoyo_act_id + uid );
	const data = response.data;
	if ( data.error || data.retcode !== 0 ) return Promise.reject( data.message );
	
	const list: any[] = data.data.list;
	const find = list.find( item => {
		const post = item.post?.post;
		if ( !post ) return false;
		const keywords = keywords_map[user_map[uid]];
		return !!keywords.some( keyword => post.subject.includes( keyword ) );
	} );
	
	if ( !find ) return Promise.reject( '未找到直播预告帖' );
	const content = find.post.post["structured_content"];
	const json: any[] = JSON.parse( content );
	for ( let item of json ) {
		const link: string | undefined = item.attributes?.link;
		if ( !link ) continue;
		const url = new URL( link );
		if ( url.hostname === 'webstatic.mihoyo.com' && url.pathname === '/bbs/event/live/index.html' ) {
			return url.searchParams.get( "act_id" );
		}
	}
}

async function getLiveInfo( actId: string ) {
	const response = await axios.get( Api.mihoyo_live, {
		headers: {
			'x-rpc-act_id': actId
		}
	} )
	
	const data = response.data;
	if ( data.retcode !== 0 ) {
		return Promise.reject( data.message );
	}
	
	const { title, code_ver, remain, start } = data.data.live;
	if ( remain > 0 ) {
		return Promise.reject( `${ title }，暂无直播兑换码` );
	}
	
	const now = moment();
	// 直播码当天和第二天有效（第二天24点前都可返回）
	if ( now.isSame( start, 'day' ) || now.subtract( 1, 'day' ).isSame( start, 'day' ) ) {
		return { title, code_ver };
	}
	
	return Promise.reject( `${ title }，暂无直播兑换码` );
}

async function getCode( actId: string, code_ver: string ) {
	const time: number = Date.now() / 1000 | 0;
	const response = await axios.get( Api.mihoyo_live_code, {
		params: {
			version: code_ver,
			time
		},
		headers: {
			'x-rpc-act_id': actId
		}
	} )
	
	const data = response.data;
	if ( data.retcode !== 0 ) {
		return Promise.reject( data.message );
	}
	
	const code_list = data.data.code_list;
	return code_list.map( item => item.code ).filter( code => !!code );
}

export async function get_cdk(): Promise<CodeType[]> {
	const result: CodeType[] = [];
	for ( let key in user_map ) {
		try {
			// 获取请求头
			const actId = await getActId( key );
			if ( !actId ) continue;
			
			// 获取版本信息
			const { title, code_ver } = await getLiveInfo( actId );
			if ( !code_ver ) continue;
			
			// 获取cdk
			const codes = await getCode( actId, code_ver );
			if ( codes.length > 0 ) {
				const item = { title, codes };
				result.push( item );
			}
		} catch ( err ) {
			bot.logger.info( `[cdk] 获取${ user_map[key] }直播码失败:`, err );
		}
	}
	
	return result;
}