export default {
	createLicenseAndSendEmail: () => {
		return createLicense.run()
			.catch(async (e) => {
				console.log("Error from license generation", e);
				await showAlert(`Unable to create license! Error: ${createLicense.data?.responseMeta?.error?.message}`, 'error');
				throw e;
			})
			.then(() => {
					let stripeID = createLicense.data.data.stripeSubscription.customerId;
					let accountId = SelectAccount.selectedOptionValue;
					if ( !!stripeID && !!accountId ) {
						SetSalesforceStripeID.run({ accountId, stripeID });
					}
					
					if (sendEmailSwitch.isSwitchedOn) {
						return sendInviteEmail.run()
							.then(() => showAlert('License is created and email has been sent to the customer!', 'success'));
					}
					showAlert('License is created succefully!', 'success');
			})
			.catch(async (e) => {
				console.log("Error ", e);
				if (!e.message?.includes("createLicense")) {
					await showAlert('License got created but failed to send the email!', 'error');
				}
				throw e;
			});
	}
}