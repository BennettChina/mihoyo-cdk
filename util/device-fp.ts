import { getRandomNumber, getRandomStringBySeed } from "@/utils/random";
import { DeviceFpBody } from "#/mihoyo-cdk/util/types";

export function accelerometer(): number[] {
	const x = ( Math.random() - 0.5 ) * 2;
	const y = ( Math.random() - 0.5 ) * 2;
	const z = ( Math.random() - 0.5 ) * 2;
	return [ x, y, z ];
}

export function magnetometer() {
	// -90 到 90 的随机值
	const range = 180;
	const length = 3;
	return Array.from( { length }, () => {
		return Math.random() * range - range / 2;
	} );
}

export function batteryStatus(): number {
	const max = 100, min = 1;
	return getRandomNumber( min, max );
}

export function deviceFp(): string {
	const seed = '0123456789';
	return getRandomStringBySeed( 10, seed );
}

function getMiHoYoRandomStr( length: number ): string {
	const seed = '0123456789abcdef';
	return getRandomStringBySeed( length, seed );
}

function guid(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
		.replace( /[xy]/g, el => {
			const r: number = Math.random() * 16 | 0;
			const v: number = el == "x" ? r : ( r & 0x3 | 0x8 );
			return v.toString( 16 );
		} );
}

export function getDevice(): DeviceFpBody {
	const deviceId = guid();
	const status = batteryStatus();
	const IDFV = guid().toUpperCase();
	const ext_fields = {
		IDFV: IDFV,
		model: "iPhone16,1",
		osVersion: '17.0.3',
		screenSize: '393×852',
		vendor: '--',
		cpuType: 'CPU_TYPE_ARM64',
		cpuCores: '16',
		isJailBreak: '0',
		networkType: 'WIFI',
		proxyStatus: '0',
		batteryStatus: status.toString( 10 ),
		chargeStatus: status > 30 ? '0' : '1',
		romCapacity: `${ getRandomNumber( 100000, 500000 ) }`,
		romRemain: `${ getRandomNumber( 120000, 130000 ) }`,
		ramCapacity: `${ getRandomNumber( 1000, 10000 ) }`,
		ramRemain: `${ getRandomNumber( 8000, 9000 ) }`,
		appMemory: `${ getRandomNumber( 50, 110 ) }`,
		accelerometer: accelerometer().join( 'x' ),
		gyroscope: accelerometer().join( 'x' ),
		magnetometer: magnetometer().join( 'x' )
	}
	
	return {
		seed_id: getMiHoYoRandomStr( 13 ),
		device_id: deviceId,
		platform: "1",
		seed_time: Date.now().toString(),
		ext_fields: JSON.stringify( ext_fields ),
		app_name: 'bbs_cn',
		bbs_device_id: deviceId,
		device_fp: deviceFp()
	}
}