export default {
	onConfirmFromUpdateLicenseModal: () => {		
		let salesforceAccountId = !!Salesforce_Opportunity_Select.selectedOptionLabel && Salesforce_Opportunity_Select.selectedOptionValue;
		if ( !!salesforceAccountId ) {
			getSalesforceAccountById.run({ salesforceAccountId }).then((response) => {
				let { Id, Stripe_id__c } = response.records[0];
				if (salesforceAccountId !== getLicenseById.data.data.stripeCustomerId || !Stripe_id__c) {
					SetSalesforceStripeID.run({ accountId: Id, stripeID: getLicenseById.data.data.stripeCustomerId })
				}
			});
		}
		
		const expiry = new Date(UpdateExpiryDatePicker.selectedDate).getTime()/1000;
		console.log("expiry: ", expiry);
		return LicenseUtils.updateLicenseById(LicenseTable.triggeredRow, UpdateLicenseOriginSelect.selectedOptionValue, UpdateLicensePlanSelect.selectedOptionValue, expiry, UpdateInputNotes.inputText, Salesforce_Opportunity_Select.selectedOptionValue || "");
	},
	openModalFromLicenseStatus: async (license) => {
		showModal("Loader");
		if (license?.licenseType === "TRIAL" || license?.licenseOrigin === "SELF_SERVE") {
			SubscriptionUtils.getPriceDuration();
			await showModal("CreateSubscriptionModal");
		} else {
			await getSubscriptionByLicenseId.run(license.licenseId)
			await showModal("EditSubscriptionModal");
		}
		closeModal("Loader");
		return;
	},
	revokeLicenseAccess: () => {
		return revokeLicenseById.run({"licenseId": LicenseTable.triggeredRow.licenseId})
			.catch((e) => {
			showAlert(`Failed to deactivate license! Error: ${JSON.stringify(revokeLicenseById.data?.responseMeta?.error?.message)}`, "error");
			throw (e);
		})
			.then(() => showAlert('License will be deactivated shortly!', 'success'))
			.then(() => fetchLicenses.run())
			.then(() => closeModal("RevokeAccessModal"))
			.catch((e) => {
			if (!JSON.stringify(e).contains("revokeLicenseById")) {
				showAlert(`Error: ${JSON.stringify(e)}`, 'error')
			}
		});
	},
	closePriceModal: async () => {
		if(!appsmith.store.hasOwnProperty('priceModalCallback')) {
			return closeModal('PriceModal');
		}

		let callback = appsmith.store.priceModalCallback;
		removeValue('priceModalCallback');

		if (callback == "") {
			return closeModal('PriceModal');
		}
		return closeModal('PriceModal')
			.then(() => showModal(callback));
	},
	createPriceItem: () => {
		let params = {}, metadata = {};
		let productName = ProductSelector.selectedOptionLabel;
		if(productName.toLowerCase().includes("user")) {
			metadata.type = "license";
			metadata.priceType = "user";
		} else if(productName.toLowerCase().includes("usage")) {
			metadata.priceType = "usage";
		} else if(productName.toLowerCase().includes("platform")) {
			metadata.priceType = "platform_fee";
		} 

		params.metadata = metadata;
		return addNewPriceForExistingProduct.run(params)
			.then(() => SubscriptionUtils.getPrices())
			.then(() => this.closePriceModal())
			.catch(() => showAlert(`Unable to create price item please try again! \nError: ${JSON.stringify(addNewPriceForExistingProduct.data?.responseMeta?.error?.message)}`, 'error'));
	},
	openRenewSubscriptionModal: async () => {
		showModal("Loader");
		await SubscriptionUtils.getPriceDuration();
		await getSubscriptionByLicenseId.run();
		await showModal("RenewSubscriptionModal");
		return;
	},
	showPriceModal: async (source) => {
		// source can be create/update subscription or renew subscription modal
		showModal('PriceModal');
		let callback = '';
		if(source == 'create') {
			callback = 'CreateSubscriptionModal';
		} else if(source == 'renew') {
			callback = 'RenewSubscriptionModal';
		}
		storeValue('priceModalCallback', callback, false);
	},
	getActiveUsers: (license) => {
		const response = {};
		response.activeUsers = 0;
		license = LicenseTable.triggeredRow;
		if (license.licenseType == "TRIAL") {
			return response;
		}
		return fetchCurrentSubscriptionMetric.run()
			.then(data => {
			if (data == null) {
				return 0;
			}
			response.activeUsers = data.results[0]?.data?.length;
			return response;
		})
			.catch(() => {
			// showAlert(`Unable to fetch active customers, ${fetchCurrentSubscriptionMetric.data?.message}`, "error");
			return response;
		})
	},
	getCustomerDetails: () => {
		return getSubscriptionByLicenseId.run()
			.then(() => {
			if(getSubscriptionByLicenseId.data?.data?.subscriptionId != null) {
				// subscription details
				getSubscriptionById.run();
			}
			getLicenseById.run();
			this.getActiveUsers(LicenseTable.triggeredRow);
			Utils.getBilledUsage();
		})
		//.then(() => getLicenseById.run())
		//.then(() => Utils.getBilledUsage())
		//.then(() => this.getActiveUsers(LicenseTable.triggeredRow))
			.then(() => showModal('CustomerDetailsModal'));
	} 
}