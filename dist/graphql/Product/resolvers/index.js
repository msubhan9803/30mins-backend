import getProductsByUserId from './queries/getProductsByUserId';
import getCurrentCartItems from './queries/getCurrentCartItems';
import getProductById from './queries/getProductById';
import getProductQttById from './queries/getProductQttById';
import getCountItemsAndSubtotal from './queries/getCountItemsAndSubtotal';
import getPublicProductsData from './queries/getPublicProductsData';
import getAllCommandedProduct from './queries/getAllCommandedProduct';
import getAllCompletedCheckout from './queries/getAllCompletedCheckout';
import getCompletedCheckoutId from './queries/getCompletedCheckoutId';
import getSellerByCheckout from './queries/getSellerByCheckout';
import getProductQttWithCompleteDetails from './queries/getProductQttWithCompleteDetails';
import getProductDownloadSuccessData from './queries/getProductDownloadSuccessData';
import getProductDownloadUrl from './queries/getProductDownloadUrl';
import createProduct from './mutations/createProduct';
import deleteProduct from './mutations/deleteProduct';
import editProduct from './mutations/editProduct';
import addCart from './mutations/addCart';
import updateCart from './mutations/updateCart';
import deleteCart from './mutations/deleteCart';
import checkout from './mutations/checkout';
import productQttUpdateStatus from './mutations/productQttUpdateStatus';
const queries = {
    getProductsByUserId,
    getProductById,
    getPublicProductsData,
    getCurrentCartItems,
    getProductQttById,
    getCountItemsAndSubtotal,
    getAllCommandedProduct,
    getAllCompletedCheckout,
    getCompletedCheckoutId,
    getSellerByCheckout,
    getProductQttWithCompleteDetails,
    getProductDownloadSuccessData,
    getProductDownloadUrl,
};
const mutations = {
    createProduct,
    deleteProduct,
    editProduct,
    addCart,
    updateCart,
    deleteCart,
    checkout,
    productQttUpdateStatus,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map