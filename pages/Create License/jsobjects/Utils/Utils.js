export default {
	licenseOrigin: ["AIR_GAP", "ENTERPRISE"],
	getLicenseOrigin: () => {
		return this.allowedLicenseOrigins
			.map(origin => {
			return {
				"label": origin,
				"value": origin
			}
		})
	},
	getEncodedUri: (uri) => {
		return encodeURIComponent(uri);	
	},
	licensePlans: ['BUSINESS', 'ENTERPRISE'],
	getLicensePlans: () => {
		return this.licensePlans.map (plan => {
			return {
				"label": plan,
				"value": plan
			}
		})
	},
	getProductEditions: (licensePlan) => {
		if(licensePlan == 'BUSINESS') {
			return [{
				'label': 'COMMERCIAL',
				'value': 'COMMERCIAL'
			}];
		}
		return this.productEditions.map(product => {
			return {
				"label": product,
				"value": product
			}
		});
	},
	allowedLicenseOrigins: ['SALES', 'PARTNERSHIP'],
	productEditions: ['COMMERCIAL', 'AIR_GAP']
}