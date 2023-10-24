import { definePlugin } from "@/modules/plugin";
import cfgList from "./commands";

export default definePlugin( {
	name: "miHoYo兑换码",
	cfgList,
	repo: {
		owner: "BennettChina",
		repoName: "mihoyo-cdk",
		ref: "v3"
	},
	async mounted( params ) {
		params.setAlias( [ "兑换码", "cdk" ] );
	}
} );