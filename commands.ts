import { ConfigType, OrderConfig, SwitchConfig } from "@/modules/command";
import { MessageScope } from "@/modules/message";
import { AuthLevel } from "@/modules/management/auth";

const cdk: OrderConfig = {
	type: "order",
	headers: [ "cdk" ],
	cmdKey: "miHoYo-cdk.cdk",
	desc: [ "获取CDK", "" ],
	regexps: [ "" ],
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/cdk",
	detail: "获取 miHoYo 的直播码"
};

const subscribe: SwitchConfig = {
	type: "switch",
	mode: "divided",
	cmdKey: "miHoYo-cdk.subscribe-cdk",
	desc: [ "订阅或取消CDK", "" ],
	header: "",
	regexps: [ "" ],
	onKey: "订阅兑换码",
	offKey: "取消订阅兑换码",
	scope: MessageScope.Both,
	auth: AuthLevel.User,
	main: "achieves/subscribe",
	detail: "订阅 miHoYo 的直播码",
};

export default <ConfigType[]>[ cdk, subscribe ];