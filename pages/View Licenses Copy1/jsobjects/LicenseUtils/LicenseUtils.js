export default {
	updateLicenseById: (license, licenseOrigin, licensePlan, expiry, notes, oppurtunityLink) => {
		let params = {}, body = {}, metadata = {};
		metadata.notes = notes;
		// Not updating this anymore as license is connected to Salesforce Account by Stripe Id
		//metadata.salesforceOpportunityLink = opportunityLink;
		if (license?.licenseType != null && license.licenseType == "TRIAL") {
			body = {metadata, licenseOrigin, licensePlan};
		} else {
			body = {metadata};
		}
		body.expiry = expiry;
		params.licenseId = license?.licenseId;
		params.body = body;
		// console.log("Update Params: ", JSON.stringify(params));
		return updateLicenseById.run(params)
			.catch((e) => {
				showAlert(`Failed to update license! Error: ${JSON.stringify(updateLicenseById.data?.responseMeta?.error?.message)}`, "error");
				throw e;
			})
			.then(() => fetchLicenses.run())
			.then(() => {
				closeModal("UpdateLicenseModal");
				closeModal("CustomerDetailsModal");
			});
	},
	shouldUpdateLicenseExpiry() {
		const license = getLicenseById.data?.data;
		return license.licenseOrigin !== "AIR_GAP" && (new Date(license.expiry * 1000) < Utils.getMaxExpiryDate(license));   
	}
}