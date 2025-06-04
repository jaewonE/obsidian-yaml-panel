import { App, Plugin, PluginSettingTab, Setting, View } from "obsidian";

interface CustomPropertiesViewSettings {
	nameHidingThreshold: number;
	customIcons: { propertyName: string; svg: string }[];
}

const DEFAULT_SETTINGS: CustomPropertiesViewSettings = {
	nameHidingThreshold: 256,
	customIcons: [],
};

export default class CustomPropertiesViewPlugin extends Plugin {
	settings: CustomPropertiesViewSettings;
	styleElement: HTMLStyleElement | null = null;
	propertiesList: HTMLElement | null = null;
	resizeObserver: ResizeObserver | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CustomPropertiesSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("layout-change", () =>
				this.setupPropertiesViewTracking()
			)
		);
		this.registerEvent(
			this.app.workspace.on("file-open", () => {
				setTimeout(() => this.setupPropertiesViewTracking(), 100);
			})
		);

		this.setupPropertiesViewTracking();
	}

	onunload() {
		this.cleanupPropertiesViewTracking();
		this.removeStyles();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applyAllStyles();
		this.applyCustomIcons(); // 아이콘 설정 저장 시 아이콘도 바로 적용
	}

	removeStyles() {
		this.styleElement?.remove();
		this.styleElement = null;
	}

	getPropertiesCoreView(): View | null {
		let foundView: View | null = null;
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (foundView) return;

			if (
				leaf.view &&
				// @ts-ignore
				leaf.view.plugin &&
				// @ts-ignore
				leaf.view.plugin.id === "properties"
			) {
				foundView = leaf.view;
			}
		});
		return foundView;
	}

	setupPropertiesViewTracking() {
		const propertiesCoreView = this.getPropertiesCoreView();

		if (propertiesCoreView && propertiesCoreView.containerEl) {
			const currentPropertiesList =
				propertiesCoreView.containerEl.querySelector<HTMLElement>(
					".metadata-properties"
				);

			if (currentPropertiesList) {
				if (this.propertiesList !== currentPropertiesList) {
					if (this.resizeObserver && this.propertiesList) {
						this.resizeObserver.disconnect();
						// 이전 propertiesList에서 클래스 및 속성 제거
						this.propertiesList.classList.remove(
							"yaml-panel-plus-props-container"
						);
						this.propertiesList.classList.remove(
							"yaml-panel-plus-names-hidden"
						);
						this.propertiesList.removeAttribute(
							"data-yaml-panel-plus-show-all"
						);
						this.removeCustomIconsFromElements(this.propertiesList);
					}

					this.propertiesList = currentPropertiesList;
					this.propertiesList.classList.add(
						"yaml-panel-plus-props-container"
					);

					this.observePropertiesList(this.propertiesList);
				}
				this.applyAllStyles();
				this.applyCustomIcons(); // 새로운 propertiesList에 아이콘 적용
			} else {
				this.cleanupPropertiesViewTracking();
			}
		} else {
			this.cleanupPropertiesViewTracking();
		}
	}

	cleanupPropertiesViewTracking() {
		if (this.resizeObserver && this.propertiesList) {
			this.resizeObserver.disconnect();
			this.propertiesList.classList.remove(
				"yaml-panel-plus-props-container"
			);
			this.propertiesList.classList.remove(
				"yaml-panel-plus-names-hidden"
			);
			this.propertiesList.removeAttribute(
				"data-yaml-panel-plus-show-all"
			);
			this.removeCustomIconsFromElements(this.propertiesList);
		}
		this.propertiesList = null;
	}

	observePropertiesList(container: HTMLElement) {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		} else {
			this.resizeObserver = new ResizeObserver((entries) => {
				this.applyAllStyles();
				this.applyCustomIcons(); // 크기 변경 시 아이콘도 재적용
			});
		}
		this.resizeObserver.observe(container);
		this.applyAllStyles();
		this.applyCustomIcons(); // 초기 적용
	}

	applyAllStyles() {
		if (!this.propertiesList) return;

		const targetContainer = this.propertiesList;

		targetContainer.classList.remove("yaml-panel-plus-names-hidden");
		targetContainer.removeAttribute("data-yaml-panel-plus-show-all");

		const panelWidth = targetContainer.offsetWidth;

		if (panelWidth < this.settings.nameHidingThreshold) {
			targetContainer.classList.add("yaml-panel-plus-names-hidden");
		}
	}

	applyCustomIcons() {
		if (!this.propertiesList) return;

		const propertyElements =
			this.propertiesList.querySelectorAll<HTMLElement>(
				".metadata-property"
			);

		// 기존 커스텀 아이콘을 모두 제거
		this.removeCustomIconsFromElements(this.propertiesList);

		propertyElements.forEach((propEl) => {
			const keyInput = propEl.querySelector<HTMLInputElement>(
				".metadata-property-key-input"
			);
			if (keyInput) {
				const propertyName = keyInput.ariaLabel; // 속성 이름 가져오기
				const customIconSetting = this.settings.customIcons.find(
					(icon) => icon.propertyName === propertyName
				);

				if (customIconSetting) {
					const iconSpan = propEl.querySelector<HTMLElement>(
						".metadata-property-icon"
					);
					if (iconSpan) {
						// 기존 SVG 숨기기 및 커스텀 SVG 추가
						iconSpan.classList.add("yaml-panel-plus-custom-icon");
						const customSvgWrapper = document.createElement("div");
						customSvgWrapper.classList.add(
							"yaml-panel-plus-custom-svg-wrapper"
						);
						customSvgWrapper.innerHTML = customIconSetting.svg;
						iconSpan.appendChild(customSvgWrapper);
					}
				}
			}
		});
	}

	removeCustomIconsFromElements(container: HTMLElement) {
		const propertyIcons = container.querySelectorAll<HTMLElement>(
			".yaml-panel-plus-custom-icon"
		);
		propertyIcons.forEach((iconSpan) => {
			iconSpan.classList.remove("yaml-panel-plus-custom-icon");
			const customSvgWrapper = iconSpan.querySelector(
				".yaml-panel-plus-custom-svg-wrapper"
			);
			if (customSvgWrapper) {
				customSvgWrapper.remove();
			}
		});
	}
}

class CustomPropertiesSettingTab extends PluginSettingTab {
	plugin: CustomPropertiesViewPlugin;

	constructor(app: App, plugin: CustomPropertiesViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: "Custom Properties View Settings" });

		new Setting(containerEl)
			.setName("속성 이름 숨김 임계값 (px)")
			.setDesc(
				"이 값보다 속성 창 가로폭이 작아지면 속성 이름(Key)을 숨깁니다 (아이콘만 표시)."
			)
			.addText((text) =>
				text
					.setPlaceholder(
						String(DEFAULT_SETTINGS.nameHidingThreshold)
					)
					.setValue(String(this.plugin.settings.nameHidingThreshold))
					.onChange(async (value) => {
						const numValue = parseInt(value, 10);
						if (!isNaN(numValue) && numValue >= 0) {
							this.plugin.settings.nameHidingThreshold = numValue;
							await this.plugin.saveSettings();
						}
					})
			);

		containerEl.createEl("h2", { text: "Custom Property Icons" });
		containerEl.createEl("p", {
			text: "속성 이름에 따라 표시될 사용자 지정 SVG 아이콘을 설정합니다.",
		});

		this.plugin.settings.customIcons.forEach((iconSetting, index) => {
			const settingDiv = new Setting(containerEl)
				.setClass("custom-icon-setting-item")
				.addText((text) =>
					text
						.setPlaceholder("Property Name (e.g., tags, created)")
						.setValue(iconSetting.propertyName)
						.onChange(async (value) => {
							iconSetting.propertyName = value;
							await this.plugin.saveSettings();
						})
				)
				.addTextArea((text) =>
					text
						.setPlaceholder("SVG Code (e.g., <svg>...</svg>)")
						.setValue(iconSetting.svg)
						.onChange(async (value) => {
							iconSetting.svg = value;
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton((button) =>
					button
						.setIcon("trash")
						.setTooltip("Remove this custom icon")
						.onClick(async () => {
							this.plugin.settings.customIcons.splice(index, 1);
							await this.plugin.saveSettings();
							this.display(); // 설정 페이지 새로고침
						})
				);

			// CSS로 textarea 크기 조절
			settingDiv.controlEl
				.querySelector("textarea")
				?.setAttr("style", "width: 100%; height: 80px;");
		});

		new Setting(containerEl).addButton((button) => {
			button
				.setButtonText("Add Custom Icon")
				.setCta()
				.onClick(async () => {
					this.plugin.settings.customIcons.push({
						propertyName: "",
						svg: "",
					});
					await this.plugin.saveSettings();
					this.display(); // 설정 페이지 새로고침
				});
		});
	}
}
