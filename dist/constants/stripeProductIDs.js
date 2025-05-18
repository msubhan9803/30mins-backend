// PRODUCTION VALUES
const ProductionProductIDs = {
    EXTENSIONS: {
        ORGANIZATIONS: 'price_1Kgw4MJWaHOq7u7dJH2sv6UH',
        ORGANIZATIONS_ANNUAL: 'price_1LgVabJWaHOq7u7dI2cX8OYX',
        ZOOM: 'price_1KnqmZJWaHOq7u7d0HR5kU3M',
        ADVERTISEMENT: 'price_1KnqSXJWaHOq7u7dEZ2etaGo',
        BLACK_WHITE_LIST: 'price_1L1W1JJWaHOq7u7d7wNZxVf2',
        COLLECTIVE_AVAILABILITY: 'price_1KnqqiJWaHOq7u7dpha3vlD7',
        SMS_REMINDER: 'price_1KnqXdJWaHOq7u7dP2bBgRXs',
        CHATBOT: 'price_1LVj0mJWaHOq7u7dDGoQrrC5',
        RESELLER: 'price_1MPwbtJWaHOq7u7dA9coePii',
        PAID_MEETINGS: 'price_1MPwSgJWaHOq7u7ddtWkLrSw',
    },
};
// LOCAL TESTING VALUES
const StagingProductIDs = {
    EXTENSIONS: {
        ORGANIZATIONS: 'price_1KgxPeJWaHOq7u7dbTZie46t',
        ORGANIZATIONS_ANNUAL: 'price_1MOVMqJWaHOq7u7dPDLwzXG9',
        ZOOM: 'price_1KnqIXJWaHOq7u7dd2L7KoJu',
        ADVERTISEMENT: 'price_1KnP7jJWaHOq7u7dz2vasYaX',
        BLACK_WHITE_LIST: 'price_1L0AgSJWaHOq7u7dcwjWfpb5',
        COLLECTIVE_AVAILABILITY: 'price_1KmLWZJWaHOq7u7dqcC4SYUd',
        SMS_REMINDER: 'price_1KnPB9JWaHOq7u7dcR2YS7R7',
        CHATBOT: 'price_1MOVbSJWaHOq7u7do8QWjQYv',
        RESELLER: 'price_1MPz8IJWaHOq7u7dbfudyQXP',
        PAID_MEETINGS: 'price_1MPz7ZJWaHOq7u7d8F0wkrmk',
    },
};
export default process.env.NODE_ENV === 'production' ? ProductionProductIDs : StagingProductIDs;
//# sourceMappingURL=stripeProductIDs.js.map