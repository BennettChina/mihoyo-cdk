<div align="center">
    <img src="public/images/miyouji.png" alt="avatar/logo" width="200" height="200">
</div>
<div align="center">
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/BennettChina/mihoyo-cdk">
    <a target="_blank" href="https://raw.githubusercontent.com/BennettChina/mihoyo-cdk/master/LICENSE">
		<img alt="Repo License" src="https://img.shields.io/github/license/BennettChina/mihoyo-cdk">
	</a>
    <a target="_blank" href='https://github.com/BennettChina/mihoyo-cdk/stargazers'>
		<img src="https://img.shields.io/github/stars/BennettChina/mihoyo-cdk.svg?logo=github" alt="github star"/>
	</a>
</div>

<h2 align="center">米哈游兑换码插件</h2>

## 🧑‍💻简介

**米哈游兑换码插件** 为 [Adachi-BOT](https://github.com/SilveryStar/Adachi-BOT)
衍生插件，用于获取 miHoYo 游戏的直播码。

## 🛠️ 安装方式

在 `Adachi-BOT/src/plugins` 目录执行下面的命令。

```shell
git clone https://ghproxy.com/https://github.com/BennettChina/mihoyo-cdk.git
```

## 🎁 更新方式

### 💻 命令行更新

在插件目录执行下面的命令即可。

```shell
git pull
```

### 📱 指令更新

可使用 `#upgrade_plugins cdk` 指令来更新本插件。

## 🧰 指令列表

| 指令名    | 参数 | 描述               |
|--------|----|------------------|
| `#cdk` | 无  | 获取 miHoYo 游戏的直播码 |