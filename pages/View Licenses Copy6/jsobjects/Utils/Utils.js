export default {
	extractOpportunityLink: (notes) => {
		if (!notes) return null;
		let salesforceOpportunityID = notes?.split("/Opportunity")?.[1]?.split("/")?.[1];
		return salesforceOpportunityID;
	},
	extractDate: (date) => {
		return moment.unix(date).format("DD/MM/YYYY");
	},
	getExpiryTextColour: (endDate) => {
		const today = moment().startOf('day');
		const givenDate = moment.unix(endDate);

		const diff = givenDate.diff(today, 'days');
		if (diff <= 0) {
			return "red";
		} else if (diff <= 3) {
			return "#FF8C00";
		} 
	},
	isCreateSubscriptionFormValid: () => {
		let isAnyPricePlanSelected = PriceSelectorUserBased.selectedOptionValue?.length != 0 || PriceSelectorUsageBased.selectedOptionValue?.length != 0 || PriceSelectorPlatformBased.selectedOptionValue?.length != 0
		
		return isAnyPricePlanSelected 
		&& (PriceSelectorUserBased.selectedOptionValue?.length == 0 || (PriceSelectorUserBased.selectedOptionValue?.length != 0 && QtyInputUserBased.inputText?.length > 0))
		&& (PriceSelectorUsageBased.selectedOptionValue?.length == 0 || (PriceSelectorUsageBased.selectedOptionValue?.length != 0 && QtyInputUsageBased.inputText?.length > 0))
		&& (BillingGracePeriodInput.isValid && CappedHoursInput.isValid);
	},
	isRenewSubscriptionFormValid: () => {
		let isAnyPricePlanSelected = RenewPriceSelectorUserBased.selectedOptionValue?.length != 0 || RenewPriceSelectorUsageBased.selectedOptionValue?.length != 0
		return isAnyPricePlanSelected 
		&& (RenewPriceSelectorUserBased.selectedOptionValue?.length == 0 || (RenewPriceSelectorUserBased.selectedOptionValue?.length != 0 && RenewQtyInputUserBased.inputText?.length > 0))
		&& (RenewPriceSelectorUsageBased.selectedOptionValue?.length == 0 || (RenewPriceSelectorUsageBased.selectedOptionValue?.length != 0 && RenewQtyInputUsageBased.inputText?.length > 0))
		&& (RenewBillingGracePeriodInput.isValid && RenewCappedHoursInput.isValid)
		&& RenewalTypeSelection.selectedOptionValue?.length != 0;
	},
	getUsage(subscription) {
		const purchasedSessions = subscription?.purchasedUsage?.sessions == null ? 0 :subscription?.purchasedUsage?.sessions;
		const purchasedSeats = subscription?.purchasedUsage?.users == null ? 0 :subscription?.purchasedUsage?.users;
		const usedSessions = subscription?.usedUsage?.sessions == null ? 0 :subscription?.usedUsage?.sessions;
		const usedSeats = subscription?.usedUsage?.users == null ? 0 :subscription?.usedUsage?.users;
		const freeSessions = subscription?.freeSessions == null ? 0 : subscription?.freeSessions;
		return {
			purchasedSessions: purchasedSessions | 0,
			purchasedSeats: purchasedSeats | 0,
			usedSessions: usedSessions | 0,
			usedSeats: usedSeats | 0,
			freeSessions: freeSessions | 0
		}
	},
	getUsageFormatted(subscription) {
		const purchasedSessions = subscription?.purchasedUsage?.sessions == null ? 0 :subscription?.purchasedUsage?.sessions;
		const purchasedSeats = subscription?.purchasedUsage?.users == null ? 0 :subscription?.purchasedUsage?.users;
		const usedSessions = subscription?.usedUsage?.sessions == null ? 0 :subscription?.usedUsage?.sessions;
		const usedSeats = subscription?.usedUsage?.users == null ? 0 :subscription?.usedUsage?.users;
		const freeSessions = subscription?.freeSessions == null ? 0 : subscription?.freeSessions;
		// return {
		// purchasedSessions: purchasedSessions | 0,
		// purchasedSeats: purchasedSeats | 0,
		// usedSessions: usedSessions | 0,
		// usedSeats: usedSeats | 0,
		// freeSessions: freeSessions | 0
		// }
		let freeSessionsMessage = freeSessions > 0 ? ", Free Sessions: " + freeSessions : "";
		let message = "Used: " + usedSessions + ", Purchased: " + purchasedSessions + freeSessionsMessage;
		return message;
	},
	getBilledUsage(){
		if(getSubscriptionByLicenseId.data?.data?.subscriptionId == null || !getSubscriptionById?.data?.hasOwnProperty('items')) {
			return 0;
		}
		let subscription = getSubscriptionById.data;
		for(const item of subscription.items.data) {
			let recurring = item.price.recurring;
			if(recurring.usage_type === 'metered') {
				// this is a metered usage tracking price plan
				let params = {};
				params.itemId = item.id;
				return getUsageBySubscriptionItemId.run(params);
			}
		}
		return 0;
	},
	getBilledUsageCount() {
		let usage = 0;
		// accessing this method for no subscription customer row
		if(getSubscriptionByLicenseId.data?.data?.subscriptionId == null || !getSubscriptionById?.data?.hasOwnProperty('items')) {
			return 0;
		}

		if(getUsageBySubscriptionItemId?.data?.data == null) {
			return 0;
		}
		let subscriptionData = getSubscriptionById.data;
		let currentStartDate = subscriptionData.current_period_start;

		for(const entry of getUsageBySubscriptionItemId.data.data) {
			// exclude data from previous periods, means previous subscription cycles
			if(entry?.period == null || (entry?.period != null && (entry.period?.start != null && entry.period.start < currentStartDate))) {
				continue;
			}
			usage += entry.total_usage;
		}
		return usage;
	},
	getStartOfDate: (date) => {
		const startOfDay = date;
		startOfDay.setUTCHours(0, 0, 0, 0);
		console.log(startOfDay);
		return startOfDay;
	},
	getEncodedUri: (uri) => {
		return encodeURIComponent(uri);	
	},
	getMaxExpiryDate(license) {
    // Calculate the maximum expiry date based on the license plan
    let maxExpiryDate = new Date(), currentExpiry = new Date(license?.expiry * 1000);
		let month, licensePlan = license?.licensePlan;
    if (licensePlan === Constants.LICENSE_PLAN["enterprise"]) {
			// Months possible values => 0-11
			month = maxExpiryDate.getMonth() + 6;
    } else if (licensePlan === Constants.LICENSE_PLAN["business"]) {
			month = maxExpiryDate.getMonth() + 3;
    } else {
			throw new Error("Invalid license plan");
    }
		maxExpiryDate.setFullYear(maxExpiryDate.getFullYear(), month, maxExpiryDate.getDate());	
		return maxExpiryDate > currentExpiry ? maxExpiryDate : currentExpiry;
	}
}