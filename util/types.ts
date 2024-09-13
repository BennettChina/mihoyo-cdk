export interface CodeType {
	title: string;
	codes: string[];
	total: number;
}

export type Cdk = {
	code: string;
	img: string;
	title: string;
	to_get_time: string;
}

export type RefreshCode = {
	code_list: Cdk[];
}

export type DeviceFpBody = {
	seed_id: string;
	device_id: string;
	seed_time: string;
	ext_fields: string;
	bbs_device_id: string;
	device_fp: string;
	app_name: string;
	platform: string;
}

export type Navigator = {
	id: number;
	name: string;
	icon: string;
	app_path: string;
	reddot_online_time: number;
}

export type miHoYoHome = {
	navigator: Navigator[]
}