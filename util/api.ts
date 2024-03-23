import axios from "axios";
import bot from "ROOT";
import moment from "moment";
import { CodeType } from "#/mihoyo-cdk/util/types";

enum Api {
	mihoyo_act_id = "https://bbs-api.mihoyo.com/painter/api/user_instant/list?offset=0&size=20&uid=",
	mihoyo_live = "https://api-takumi.mihoyo.com/event/miyolive/index",
	mihoyo_live_code = "https://api-takumi-static.mihoyo.com/event/miyolive/refreshCode"
}

type Official = {
	name: string;
	user_id: string;
	keywords: string[];
	total_cdk: number;
};

const officials: Official[] = [
	{
		name: "原神",
		user_id: "75276550",
		keywords: [ "版本前瞻特别节目" ],
		total_cdk: 3
	}, {
		name: "崩坏·星穹铁道",
		user_id: "80823548",
		keywords: [ "版本前瞻特别节目", "版本前瞻" ],
		total_cdk: 3
	},
	{
		name: "崩坏3",
		user_id: "73565430",
		keywords: [ "特别节目预告", "版本特别节目" ],
		total_cdk: 1
	},
	{
		name: "绝区零",
		user_id: "152039072",
		keywords: [],
		total_cdk: 3
	}
];

const EXPIRE_TIME = 24 * 60 * 60;

async function getActId( official: Official ) {
	const key = `miHoYo.actId.${ official.user_id }`
	const value = await bot.redis.getString( key );
	if ( value ) return value;
	
	const response = await axios.get( Api.mihoyo_act_id + official.user_id );
	const data = response.data;
	if ( data.error || data.retcode !== 0 ) return Promise.reject( data.message );
	
	const list: any[] = data.data.list;
	const find = list.find( item => {
		const post = item.post?.post;
		if ( !post ) return false;
		const keywords = official.keywords;
		return keywords.some( keyword => post.subject.includes( keyword ) );
	} );
	
	if ( !find ) return Promise.reject( '未找到直播预告帖' );
	const content = find.post.post["structured_content"];
	const json: any[] = JSON.parse( content );
	for ( let item of json ) {
		const link: string | undefined = item.attributes?.link;
		if ( !link ) continue;
		const url = new URL( link );
		if ( url.hostname === 'webstatic.mihoyo.com' && url.pathname === '/bbs/event/live/index.html' ) {
			const actId = url.searchParams.get( "act_id" );
			await bot.redis.setString( key, actId || "", EXPIRE_TIME );
			return actId;
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
	const key = `miHoYo.codes.${ actId }:${ code_ver }`
	const value = await bot.redis.getString( key );
	if ( value ) return JSON.parse( value );
	
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
	const codes = code_list.map( item => item.code ).filter( code => !!code );
	if ( codes.length < 3 ) {
		return codes;
	}
	await bot.redis.setString( key, JSON.stringify( codes ), EXPIRE_TIME );
	return codes;
}

export async function get_cdk(): Promise<CodeType[]> {
	const result: CodeType[] = [];
	for ( let official of officials ) {
		try {
			// 获取请求头
			const actId = await getActId( official );
			if ( !actId ) continue;
			
			// 获取版本信息
			const { title, code_ver } = await getLiveInfo( actId );
			if ( !code_ver ) continue;
			
			// 获取cdk
			const codes = await getCode( actId, code_ver );
			if ( codes.length > 0 ) {
				bot.logger.info( `[cdk] 成功获取 ${ official.name } 的直播码。` )
				const item: CodeType = { title, codes, total: official.total_cdk };
				result.push( item );
			}
		} catch ( err ) {
			bot.logger.info( `[cdk] 获取 ${ official.name } 直播码失败:`, err );
		}
	}
	
	return result;
}