import { ConfigType, OrderConfig } from "@modules/command";
import { MessageScope } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";

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

export default <ConfigType[]>[ cdk ];