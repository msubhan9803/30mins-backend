import { gql } from 'apollo-server-express';
export const types = gql `
  enum ProductTypeEnum {
    Digital
    Physical
  }

  enum ProductQttRefundTypeEnum {
    REFUNDED
    REFUND_DENIED
    PENDING_ACTION
    NONE
  }

  type ProductFileType {
    name: String
    link: String
  }

  type Product {
    _id: String
    title: String
    seller: User
    price: Float
    discount: Float
    description: String
    image: String
    tags: [String]
    type: ProductTypeEnum
    file: ProductFileType
    resText: String
    service: Service
    serviceMessage: String
  }

  type ProductsDataResponse {
    response: Response
    products: [Product]
  }

  type ProductDataResponse {
    response: Response
    product: Product
  }

  type ProductQtt {
    _id: String
    product: Product
    quantity: String
    checkout: Checkout
    checkoutPrice: Float
    refundRequested: Boolean
    refundStatus: String
    refundReason: String
    shippingAddress: String
    authCode: String
    authCodeUsed: Boolean
  }

  type Cart {
    seller: User
    productQtts: [ProductQtt]
  }

  type Checkout {
    _id: String
    buyer: User
    createdAt: String
    updatedAt: String
  }

  type CartProductsDataResponse {
    response: Response
    cart: [Cart]
  }

  type CartItem {
    productQttId: String
    productId: String
    quantity: Int
    price: Float
  }

  type CheckoutSum {
    checkout: Checkout
    total: Float
    countOfItems: Int
    seller: SellerUser
  }

  type CartItemsDataResponse {
    response: Response
    items: [CartItem]
  }

  type ProductQttDataResponse {
    response: Response
    productQtt: ProductQtt
  }

  type ProductQttsDataResponse {
    response: Response
    productQtt: [ProductQtt]
    maxNavigation: Int
  }

  type GetAllCompletedCheckoutResponse {
    response: Response
    checkouts: [CheckoutSum]
  }

  type GetCompletedCheckoutIdResponse {
    response: Response
    checkout: Checkout
    productQtt: [ProductQtt]
  }

  type personalD {
    name: String
    description: String
    headline: String
    phone: String
  }

  type AccountD {
    username: String
    email: String
    avatar: String
  }

  type SellerUser {
    accountDetails: AccountD
    personalDetails: personalD
  }

  type getSellerByCheckoutResponse {
    response: Response
    seller: SellerUser
  }

  type checkoutResponse {
    response: Response
    checkoutId: String
  }

  type ProductDownloadUrlResponse {
    response: Response
    downloadUrl: String
  }
`;
//# sourceMappingURL=types.js.map