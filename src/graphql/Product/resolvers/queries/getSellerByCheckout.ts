import ProductQtt from '../../../../MongoModels/ProductQtt';
import User from '../../../../MongoModels/User';

export default async function getSellerByCheckout(_, {checkoutId}) {
  try {
    const product = await ProductQtt.findOne({checkout: checkoutId}).populate('product');
    const user = await User.findById(product.product.seller);
    return {
      response: {
        message: 'Not Authenticated',
        status: 401,
      },
      seller: {
        accountDetails: {
          username: user?.accountDetails?.username,
          email: user?.accountDetails?.email,
          avatar: user?.accountDetails?.avatar,
        },
        personalDetails: {
          name: user?.personalDetails?.name,
          description: user?.personalDetails?.description,
          headline: user?.personalDetails?.headline,
          phone: user?.personalDetails?.phone,
        },
      },
    };
  } catch (err) {
    return {
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
