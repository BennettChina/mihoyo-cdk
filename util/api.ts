import axios from "axios";
import bot from "ROOT";
import moment from "moment";
import { CodeType, DeviceFpBody, miHoYoHome, RefreshCode } from "#/mihoyo-cdk/util/types";
import { getDevice } from "#/mihoyo-cdk/util/device-fp";
import { bbs_version, ds2 } from "#/mihoyo-cdk/util/ds";

enum Api {
	mihoyo_act_id = "https://bbs-api.mihoyo.com/painter/api/user_instant/list?offset=0&size=20&uid=",
	mihoyo_live = "https://api-takumi.mihoyo.com/event/miyolive/index",
	mihoyo_live_code = "https://api-takumi-static.mihoyo.com/event/miyolive/refreshCode",
	mihoyo_home = "https://bbs-api.miyoushe.com/apihub/api/home/new",
	getFp = "https://public-data-api.mihoyo.com/device-fp/api/getFp",
}

type Official = {
	name: string;
	user_id: string;
	keywords: string[];
	total_cdk: number;
	gids: number;
};

const officials: Official[] = [
	{
		name: "原神",
		user_id: "75276550",
		keywords: [ "版本前瞻特别节目" ],
		total_cdk: 3,
		gids: 2,
	}, {
		name: "崩坏·星穹铁道",
		user_id: "80823548",
		keywords: [ "版本前瞻特别节目", "版本前瞻" ],
		total_cdk: 3,
		gids: 6
	},
	{
		name: "崩坏3",
		user_id: "73565430",
		keywords: [ "特别节目预告", "版本特别节目" ],
		total_cdk: 1,
		gids: 1
	},
	{
		name: "绝区零",
		user_id: "152039148",
		keywords: [ "前瞻讨论活动", "版本前瞻" ],
		total_cdk: 1,
		gids: 8
	}
];

const EXPIRE_TIME = 24 * 60 * 60;

async function getActId( official: Official ) {
	const key = `miHoYo.actId.${ official.user_id }`
	const value = await bot.redis.getString( key );
	if ( value ) return value;
	
	const { navigator } = await getHome( official.gids );
	const live = navigator.find( item => {
		return item.name === "前瞻直播" || item.name.includes( "直播" );
	} );
	if ( live ) {
		let actId = new URL( live.app_path ).searchParams.get( "act_id" );
		if ( actId ) {
			await bot.redis.setString( key, actId, EXPIRE_TIME );
			return actId;
		}
	}
	
	const response = await axios.get( Api.mihoyo_act_id + official.user_id );
	const data = response.data;
	if ( data.error || data.retcode !== 0 ) return Promise.reject( data.message );
	
	const list: any[] = data.data.list;
	const filter = list.filter( item => {
		const post = item.post?.post;
		if ( !post ) return false;
		const keywords = official.keywords;
		return keywords.some( keyword => post.subject.includes( keyword ) );
	} );
	
	if ( !filter || filter.length === 0 ) return Promise.reject( '未找到直播预告帖' );
	
	for ( let post of filter ) {
		const content = post.post.post["structured_content"];
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

async function getCode( actId: string, code_ver: string, total_cdk: number ) {
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
	
	if ( response.data.retcode !== 0 ) {
		return Promise.reject( response.data.message );
	}
	
	const data = response.data.data as RefreshCode;
	const code_list = data.code_list;
	const codes = code_list.map( item => item.code ).filter( code => !!code );
	if ( codes.length < total_cdk ) {
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
			const codes = await getCode( actId, code_ver, official.total_cdk );
			if ( codes.length === 0 ) {
				bot.logger.info( `[cdk] 暂未获取到 ${ official.name } 的直播码。` )
				continue;
			}
			bot.logger.info( `[cdk] 成功获取 ${ official.name } 的直播码。` )
			const item: CodeType = { gids: official.gids, title, codes, total: official.total_cdk };
			result.push( item );
		} catch ( err ) {
			bot.logger.info( `[cdk] 获取 ${ official.name } 直播码失败:`, err );
		}
	}
	
	return result;
}

async function getHome( gids: string | number ): Promise<miHoYoHome> {
	const device = getDevice();
	const { model, osVersion } = JSON.parse( device.ext_fields )
	const deviceFp = await getDeviceFp( device );
	const params = {
		device: model,
		gids,
		parts: "1,3,4",
		version: 3
	}
	const response = await axios.get( Api.mihoyo_home, {
		params,
		headers: {
			"x-rpc-verify_key": "bll8iq97cem8",
			"x-rpc-device_fp": deviceFp,
			"x-rpc-client_type": "1",
			"x-rpc-device_id": device.device_id,
			"x-rpc-channel": "appstore",
			"x-rpc-device_model": model,
			Referer: "https://app.mihoyo.com",
			"x-rpc-device_name": "iPhone",
			"x-rpc-h265_supported": "1",
			"x-rpc-app_version": bbs_version,
			"User-Agent": "Hyperion/461 CFNetwork/1410.1 Darwin/22.6.0",
			"x-rpc-sys_version": osVersion,
			DS: ds2( 'lk2', undefined, params )
		}
	} );
	if ( response.data.retcode !== 0 ) {
		throw new Error( response.data.message );
	}
	return response.data.data;
}

export async function getDeviceFp( body: DeviceFpBody ): Promise<string> {
	const response = await axios.post( Api.getFp, body );
	
	const data = response.data;
	if ( data.retcode !== 0 ) {
		return Promise.reject( data.message );
	}
	
	if ( data.data.code !== 200 ) {
		return Promise.reject( data.data.msg );
	}
	
	return data.data.device_fp;
}