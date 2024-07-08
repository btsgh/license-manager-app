export default {
	fetchProducts: async () =>  {
		if(this.products.length == 3) {
			return;
		}
		let productData = await search_products.run();
		this.products = [];
		let products = productData.data; 
		for(const product of products) {
			if(product?.metadata == null || product?.metadata?.price_type == null) {
				continue;
			}
			if(product.metadata.price_type == 'user') {
				this.products.push({
					id: product.id,
					name: "Appsmith User Based Plan"
				});
			} else if(product.metadata.price_type == 'usage') {
				this.products.push({
					id: product.id,
					name: "Appsmith Usage Based Plan - Upfront Credits"
				});
			} else if(product.metadata.price_type == 'platform_fee') {
				this.products.push({
					id: product.id,
					name: "Appsmith Enterprise Edition - Platform Fee"
				});
			}
		}
	},
	products: [],
	getSubscriptionOption: (license) => {
		console.log(license);
		return license.licenseOrigin === "SELF_SERVE" ? "Migrate" : license.licenseType === "TRIAL" ? "Create" : "Update";
	},
	createSearchQuery: () => {
		const productIds = this.products.map(product => product.id);
		let queryString = "";
		productIds.forEach(productId => {
			queryString = queryString.concat(`product:'${productId}' or `);
		});
		queryString = queryString.substring(0,queryString.lastIndexOf(" or "));
		queryString = appsmith.store.priceQuery?.page?.length > 0 ? queryString.concat(`&page:${appsmith.store.priceQueryPage}`): queryString;
		return queryString;
	},
	getPrices: () => {
		return this.fetchProducts().then(() => {
			return getPricesByProductIds.run().then(async () => {
				let prices = [];
				for (let product of this.products) {
					const filteredPriceItems = await getPricesByProductId.run({ productId : product.id });
					prices.push({
						productId: product.id,
						productName: product.name,
						data: filteredPriceItems?.data
					});
				}
				return prices;
			})
		});
	},
	createOrMigrateSubscription: () => {
		let params = {};
		if (PriceSelectorUserBased.selectedOptionValue?.length > 0) {
			params.userPriceId = PriceSelectorUserBased.selectedOptionValue;
			params.users = parseInt(QtyInputUserBased.inputText);
		}

		if (PriceSelectorUsageBased.selectedOptionValue?.length > 0) {
			params.usagePriceId = PriceSelectorUsageBased.selectedOptionValue;
			params.sessions = parseInt(QtyInputUsageBased.inputText);
		}

		if (PriceSelectorPlatformBased.selectedOptionValue != null && PriceSelectorPlatformBased.selectedOptionValue.length > 0) {
			params.platformFeePriceId = PriceSelectorPlatformBased.selectedOptionValue;
		}
		if (descriptionInput.inputText?.length != 0) {
			params.description = descriptionInput.inputText;
		}
		params.customerEmail = CustomerEmailText.text;
		params.numberOfCappedHours = parseInt(CappedHoursInput.inputText);
		params.billingGracePeriodInDays = parseInt(BillingGracePeriodInput.inputText);
		console.log("Params: ", params);
		console.log("license: ", LicenseTable.triggeredRow);
		if (LicenseTable.triggeredRow?.licenseOrigin === "SELF_SERVE") {
			return migrateSelfServeToEnterprise.run(params)
				.then(() => showAlert("Subscription is successfully migrated!", "success"))
				.then(() => fetchLicenses.run())
				.then(() => closeModal("CreateSubscriptionModal"))
				.catch(() => showAlert(`Migration failed! Error: ${JSON.stringify(migrateSelfServeToEnterprise.data?.responseMeta?.error?.message)}`, "error"));	
		}
		return createSubscription.run(params)
			.then(() => showAlert("Subscription is successfully created!", "success"))
			.then(() => fetchLicenses.run())
			.then(() => closeModal("CreateSubscriptionModal"))
			.catch(() => showAlert(`Unable to create subscription! Error: ${JSON.stringify(createSubscription.data?.responseMeta?.error?.message)}`, "error"));
	},
	renewSubscription: () => {
		let params = {};
		params.body = {};
		params.path = {};
		if (RenewPriceSelectorUserBased.selectedOptionValue?.length > 0) {
			params.body.userPriceId = RenewPriceSelectorUserBased.selectedOptionValue;
			params.body.users = parseInt(RenewQtyInputUserBased.inputText);
		}

		if (RenewPriceSelectorUsageBased.selectedOptionValue?.length > 0) {
			params.body.usagePriceId = RenewPriceSelectorUsageBased.selectedOptionValue;
			params.body.sessions = parseInt(RenewQtyInputUsageBased.inputText);
		}

		if (RenewPriceSelectorPlatformFee.selectedOptionValue != null && RenewPriceSelectorPlatformFee.selectedOptionValue.length > 0) {
			params.body.platformFeePriceId = RenewPriceSelectorPlatformFee.selectedOptionValue;
		}
		if (RenewDescriptionInput.inputText?.length != 0) {
			params.body.description = RenewDescriptionInput.inputText;
		}
		// params.customerEmail = CustomerEmailText.text;
		params.body.numberOfCappedHours = parseInt(RenewCappedHoursInput.inputText);
		params.body.billingGracePeriodInDays = parseInt(RenewBillingGracePeriodInput.inputText);
		params.body.carryForwardSessions = RenewCarryForwardSessionsCheck.isChecked;

		console.log("Params: ", params);
		params.path.renewalType = RenewalTypeSelection.selectedOptionValue;
		params.path.subscriptionId = getSubscriptionByLicenseId.data?.data?.id;

		return renewSubscription.run(params)
			.then(() => showAlert("Renew subscription request was successful !", "success"))
			.then(() => fetchLicenses.run())
			.then(() => closeModal("RenewSubscriptionModal"))
			.catch(() => showAlert(`Unable to renew subscription! Error: ${JSON.stringify(renewSubscription.data?.responseMeta?.error?.message)}`, "error"));
	},
	updateSubscriptionParam: () => {
		let params = {};
		params.path = {};
		params.body = {};
		if (UserBasedQtyInput.inputText?.length != 0) {
			params.body.users = UserBasedQtyInput.inputText;
		}
		if (UsageBasedQtyInput.inputText?.length != 0) {
			params.body.sessions = UsageBasedQtyInput.inputText;
		}
		params.body.numberOfCappedHours = parseInt(CappedHoursUpdateInput.inputText);
		params.path.subscriptionId = getSubscriptionByLicenseId.data?.data?.id;
		params.body.billingGracePeriodInDays = parseInt(BillingGracePeriodUpdateInput.inputText);
		console.log("Params: ", params);
		return updateSubscriptionById.run(params)
			.then(() => showAlert(`Subscription is successfully updated!`, "success"))
			.then(() => fetchLicenses.run())
			.then(() => closeModal("EditSubscriptionModal"))			
			.catch(() => showAlert(`Unable to update subscription! Error: ${JSON.stringify(updateLicenseById.data?.responseMeta?.error?.message)}`, "error"));
	},
	transformPriceDetailsInSelectWidgetFormat: (priceData, productName, recurringDuration) => {
		var transformedData = [];
		if (recurringDuration?.length > 0) {
			recurringDuration = JSON.parse(recurringDuration);
		}
		console.log("Duration: ", recurringDuration);
		priceData
			.filter(price => price.productName === productName)
			.map(filteredPriceData => filteredPriceData?.data)
			.forEach(priceData => {
			priceData
				.filter(price => price?.recurring?.interval === recurringDuration?.interval 
								&& price?.recurring?.interval_count === recurringDuration?.interval_count)
				.map(price => {
				const currency = price?.currency === "usd" ? "$" : price?.currency;
				const unitAmount = price?.unit_amount/100;
				let interval = price?.recurring?.interval_count != 1 ? price?.recurring?.interval_count : "";   
				interval += ` ${price?.recurring?.interval}`
				return {
					label: `${currency}${unitAmount} per ${interval}`,
					value: price?.id
				}
			})
				.map(data => {
				transformedData.push(data)
			});
		});
		return transformedData;
	},
	getPriceDetailsByIdAndProductName : (priceId, productName) => {
		const prices = this.getPrices?.data;
		const product = prices.filter(product => productName == product.productName);
		if (product?.length != 0) {
			const prices = product[0].data.filter(price => price.id == priceId);
			if (prices?.length != 0) {
				const price = prices[0];
				const currency = price?.currency === "usd" ? "$" : price?.currency;
				const unitAmount = price?.unit_amount/100;
				let interval = price?.recurring?.interval_count != 1 ? price?.recurring?.interval_count : "";   
				interval += ` ${price?.recurring?.interval}`
				return `${currency}${unitAmount} per ${interval}`;
			}
		}
		return "-";
	},
	getPriceDuration: () => {
		const priceDurations = [];
		this.getPrices?.data.map(product => {
			console.log("Product: ", product);
			product.data.forEach(price => {
				if (price?.recurring == null) {
					return;
				}
				price.recurring.id = `${price?.recurring?.interval_count} ${price?.recurring?.interval}`;
				console.log("Recurring: ", price?.recurring);
				priceDurations.push(price?.recurring);
			});
		});
		return [...new Map(priceDurations.map(item => [item["id"], item])).values()];
	},
	getPriceAmount: (priceId) => {
		let prices = this.getPrices?.data;
		if(priceId == null || priceId == '') {
			return 0;
		}
		for(let price of prices) {
			if(price.data == null) {
				continue;
			}
			for (let eachPrice of price.data) {
				if(eachPrice?.id != null && eachPrice.id == priceId) {
					return eachPrice.unit_amount / 100; // convert in dollors from cents
				}
			}
		} 
		return 0;
	}
}