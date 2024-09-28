import { definePlugin } from "@/modules/plugin";
import cfgList from "./commands";
import { db_key } from "#/mihoyo-cdk/module/db";
import { Task } from "#/mihoyo-cdk/module/task";

type SubUser = {
	person: number[];
	group: number[];
}

let task: Task;

export default definePlugin( {
	name: "miHoYo兑换码",
	cfgList,
	repo: {
		owner: "BennettChina",
		repoName: "mihoyo-cdk",
		ref: "v3"
	},
	subscribe: [ {
		name: "自动签到",
		async getUser( { redis } ) {
			const subscribe = await redis.getHash( db_key.subscribe );
			const init: SubUser = {
				person: [],
				group: []
			}
			return Object.entries( subscribe ).reduce( ( prev, [ k, v ] ) => {
				if ( v === 'group' ) {
					prev.group.push( parseInt( k ) );
				} else {
					prev.person.push( parseInt( k ) );
				}
				return prev;
			}, init );
		},
		async reSub( userId, _type, { redis } ) {
			await redis.delHash( db_key.subscribe, `${ userId }` );
		}
	} ],
	async mounted( params ) {
		params.setAlias( [ "兑换码", "cdk" ] );
		task = new Task()
	},
	async unmounted( _params ) {
		task.cancel();
	}
} );