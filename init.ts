import { BOT } from "@modules/bot";
import { PluginSetting } from "@modules/plugin";
import cfgList from "./commands";

export async function init( _bot: BOT ): Promise<PluginSetting> {
	return {
		pluginName: "mihoyo-cdk",
		cfgList,
		aliases: [ "兑换码", "cdk" ],
		repo: {
			owner: "BennettChina",
			repoName: "mihoyo-cdk",
			ref: "master"
		}
	}
}