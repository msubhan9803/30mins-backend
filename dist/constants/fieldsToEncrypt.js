const fieldsToEncrypt = {
    User: [
        'personalDetails.phone',
        'billingDetails.address',
        'billingDetails.buildingNumber',
        'billingDetails.fname',
        'billingDetails.lname',
        'billingDetails.city',
        'billingDetails.zipCode',
        'billingDetails.country',
    ],
    GoogleCredential: ['credentials.access_token', 'credentials.refresh_token'],
    OfficeCredential: ['credentials.access_token', 'credentials.refresh_token'],
    ZoomCredential: ['credentials.access_token', 'credentials.refresh_token'],
};
export default fieldsToEncrypt;
//# sourceMappingURL=fieldsToEncrypt.js.map